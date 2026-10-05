const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
function load(path,mocks={},globals={}){
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};new Function('exports','module','require',...Object.keys(globals),code)(m.exports,m,x=>{if(!(x in mocks))throw Error('Unexpected import '+x);return mocks[x]},...Object.values(globals));return m.exports;
}
const uid='00000000-0000-4000-8000-000000000001';
const {removeUserStorage}=load('supabase/functions/delete-account/storage-cleanup.ts');
function storage(files,fail){
 const calls=[];return {calls,storage:{from:bucket=>({
  async list(prefix,opts){calls.push(['list',bucket,prefix,opts]);if(fail==='list')return {error:Error('listing failed')};const children=new Map();for(const p of files[bucket]){if(!p.startsWith(prefix+'/'))continue;const rest=p.slice(prefix.length+1),part=rest.split('/')[0];children.set(part,{name:part,id:rest.includes('/')?null:'file'});}return {data:[...children.values()].sort((a,b)=>a.name.localeCompare(b.name)).slice(0,opts.limit)};},
  async remove(paths){calls.push(['remove',bucket,paths]);if(fail==='remove')return {error:Error('removal failed')};files[bucket]=files[bucket].filter(p=>!paths.includes(p));return {data:[]};}
 })}};
}
test('deletion drains beyond 1000 photos without skipping files or other accounts',async()=>{
 const files={avatars:[uid+'/avatar.jpg','other/avatar.jpg'],'community-posts':Array.from({length:1205},(_,i)=>uid+'/'+i+'.jpg').concat('other/photo.jpg')};const admin=storage(files);
 await removeUserStorage(admin,uid);assert.deepEqual(files,{avatars:['other/avatar.jpg'],'community-posts':['other/photo.jpg']});assert.ok(admin.calls.filter(x=>x[0]==='remove').every(x=>x[2].length<=100));assert.ok(admin.calls.filter(x=>x[0]==='list').every(x=>x[3].offset===0));
});
test('deletion also removes nested photos and placeholder files',async()=>{
 const files={avatars:[uid+'/.emptyFolderPlaceholder'],'community-posts':[uid+'/nested/photo.jpg',uid+'/nested/deeper/old.jpg']};await removeUserStorage(storage(files),uid);assert.deepEqual(files,{avatars:[],'community-posts':[]});
});
for(const fail of ['list','remove'])test('storage '+fail+' failures stop account deletion',async()=>{
 await assert.rejects(()=>removeUserStorage(storage({avatars:[uid+'/avatar.jpg'],'community-posts':[]},fail),uid),/Could not/);
});
test('expired cleanup budget returns a retryable failure',async()=>{
 await assert.rejects(()=>removeUserStorage(storage({avatars:[],'community-posts':[]}),uid,Date.now()-1),/retry account deletion/);
});
test('invalid account prefix never reaches storage',async()=>{
 await assert.rejects(()=>removeUserStorage({storage:{from:()=>{throw Error('must not call')}}},'../another-user'),/Invalid account/);
});
const {postExpo}=load('supabase/functions/push-dispatch/transport.ts');
test('Expo transport preserves payload and supplies an abort deadline',async()=>{
 const messages=[{to:'test',data:{kind:'message',conversation_id:'conversation'}}];let called=false;
 await postExpo(messages,async(url,options)=>{called=true;assert.equal(url,'https://exp.host/--/api/v2/push/send');assert.deepEqual(JSON.parse(options.body),messages);assert.equal(options.method,'POST');assert.ok(options.signal instanceof AbortSignal);return new Response('{}');});assert.ok(called);
});
function dispatcher(failTable){
 let handler,sends=0;const updates=[];
 const job={id:'job',user_id:uid,kind:'message',attempt_count:0};
 const client={from:table=>{const b={select(){return b},is(){return b},order(){return b},limit:async()=>({data:[job]}),eq(){return b},update(value){updates.push(value);return b},maybeSingle:async()=>table===failTable?{error:Error('temporary database failure')}:{data:{}},then(resolve,reject){return Promise.resolve(table===failTable?{error:Error('temporary database failure')}:{data:table==='push_tokens'?[{id:'token',expo_push_token:'test'}]:[]}).then(resolve,reject)}};return b;}};
 load('supabase/functions/push-dispatch/index.ts',{
  'https://esm.sh/@supabase/supabase-js@2.116.0':{createClient:()=>client},
  './preferences.ts':{inQuietHours:()=>false,extraPreference:()=>null},
  './transport.ts':{postExpo:async()=>{sends++;return Response.json({data:[{status:'ok',id:'ticket'}]});}}
 },{Deno:{env:{get:key=>key==='PUSH_DISPATCH_SECRET'?'test-secret':'test'},serve:fn=>handler=fn}});
 return {invoke:()=>handler(new Request('https://test',{headers:{authorization:'Bearer test-secret'}})),updates,get sends(){return sends;},unauthorized:()=>handler(new Request('https://test'))};
}
for(const table of ['profiles','push_tokens'])test(table+' lookup errors retry instead of delivering or silently discarding',async()=>{
 const d=dispatcher(table),r=await d.invoke(),body=await r.json();assert.equal(body.failed,1);assert.equal(body.skipped,0);assert.equal(d.sends,0);assert.equal(d.updates[0].attempt_count,1);assert.equal(d.updates[0].sent_at,null);
});
test('normal push delivery preserves the existing worker result',async()=>{const d=dispatcher(),r=await d.invoke();assert.equal((await r.json()).sent,1);assert.equal(d.sends,1);assert.ok(d.updates[0].sent_at);});
test('dispatcher rejects requests missing its custom secret',async()=>{const d=dispatcher();assert.equal((await d.unauthorized()).status,401);assert.equal(d.sends,0);});
