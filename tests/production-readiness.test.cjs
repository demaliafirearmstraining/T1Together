const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
function load(path,mocks={},globals={}){
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};new Function('exports','module','require',...Object.keys(globals),code)(m.exports,m,x=>{if(!(x in mocks))throw Error('Unexpected import '+x);return mocks[x]},...Object.values(globals));return m.exports;
}
const {resizeWithin}=load('lib/imageSizing.ts'),{olderThan,appendUnique}=load('lib/pagination.ts');
test('portrait and landscape photos bound the longest edge without upscaling',()=>{
 assert.deepEqual(resizeWithin(4000,3000,1600),[{resize:{width:1600}}]);assert.deepEqual(resizeWithin(3000,4000,1600),[{resize:{height:1600}}]);assert.deepEqual(resizeWithin(400,300,512),[]);
});
test('chat cursor keeps messages sharing a timestamp and rejects filter injection',()=>{
 const timestamp='2026-10-05T12:00:00.123456+00:00';const ids=[3,2,1].map(n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`);const row={id:ids[1],created_at:timestamp};assert.equal(olderThan(row),`created_at.lt.${timestamp},and(created_at.eq.${timestamp},id.lt.${ids[1]})`);assert.throws(()=>olderThan({...row,id:'bad),id.gt.0'}));assert.throws(()=>olderThan({...row,created_at:'bad),id.gt.0'}));
 assert.deepEqual(appendUnique([{id:ids[0]},{id:ids[1]}],[{id:ids[1]},{id:ids[2]},{id:ids[2]}]).map(x=>x.id),ids);
});
test('Help checks batch only displayed requests and propagate access failures',async()=>{
 const batches=[];let fail=false;
 const builder={
  select(columns){assert.equal(columns,'request_id');return this},
  eq(key,id){assert.equal(key,'responder_id');assert.equal(id,'me');return this},
  async in(key,ids){assert.equal(key,'request_id');batches.push(ids);return fail?{error:Error('denied')}:{data:ids.filter(x=>Number(x)%2===0).map(request_id=>({request_id}))}}
 };
 const mock={from:table=>{assert.equal(table,'beacon_responses');return builder}};
 const {myHelpResponses}=load('lib/helpResponses.ts',{'./supabase':{supabase:mock}});const rows=Array.from({length:251},(_,n)=>({id:String(n)}));const result=await myHelpResponses('me',[...rows,rows[0]]);assert.deepEqual(batches.map(x=>x.length),[100,100,51]);assert.equal(Object.keys(result).length,126);fail=true;await assert.rejects(()=>myHelpResponses('me',rows),/denied/);
});
test('photo URL signing batches duplicate paths and tolerates individual failures',async()=>{
 const calls=[];const mock={storage:{from:bucket=>{assert.equal(bucket,'community-posts');return{createSignedUrls:async(paths,ttl)=>{calls.push(paths);assert.equal(ttl,3600);return{data:paths.map(path=>path==='bad'?{path,error:'denied'}:{path,signedUrl:'url:'+path})}}}}}};
 const {communityPhotoUrls}=load('lib/communityPhotoUrls.ts',{'./supabase':{supabase:mock}});const rows=Array.from({length:201},(_,n)=>({id:String(n),image_path:String(n)}));rows.push({id:'duplicate',image_path:'0'},{id:'bad',image_path:'bad'});const result=await communityPhotoUrls(rows);assert.deepEqual(calls.map(x=>x.length),[100,100,2]);assert.equal(result.duplicate,'url:0');assert.equal(result.bad,undefined);assert.equal(Object.keys(result).length,202);
});
function clock(){let next=0;const tasks=new Map();return{setTimeout:fn=>{tasks.set(++next,fn);return next},clearTimeout:id=>tasks.delete(id),count:()=>tasks.size,tick:async()=>{const batch=[...tasks.values()];tasks.clear();for(const fn of batch)await fn()}}}
test('Realtime bursts run once, serialize follow-up and dispose queued work',async()=>{
 const c=clock();const {coalescedRefresh}=load('lib/coalescedRefresh.ts',{},c);let calls=0,release;const q=coalescedRefresh(async()=>{calls++;await new Promise(resolve=>release=resolve)});q.request();q.request();assert.equal(c.count(),1);const first=c.tick();assert.equal(calls,1);q.request();q.request();assert.equal(c.count(),0);release();await first;assert.equal(c.count(),1);q.dispose();await c.tick();assert.equal(calls,1);q.request();assert.equal(c.count(),0);
});
test('polling pauses in background, resumes once and does not overlap slow requests',async()=>{
 const c=clock();let effect,listener,removed=false,calls=0,release;
 const AppState={currentState:'active',addEventListener:(event,fn)=>{listener=fn;return{remove:()=>removed=true}}};const {useForegroundPolling}=load('lib/useForegroundPolling.ts',{react:{useEffect:fn=>effect=fn},'react-native':{AppState}},c);
 useForegroundPolling(async()=>{calls++;await new Promise(resolve=>release=resolve)},true);const cleanup=effect();assert.equal(calls,1);listener('active');assert.equal(calls,1);AppState.currentState='background';listener('background');release();await new Promise(setImmediate);assert.equal(c.count(),0);AppState.currentState='active';listener('active');assert.equal(calls,2);release();await new Promise(setImmediate);assert.equal(c.count(),1);cleanup();assert.equal(c.count(),0);assert.equal(removed,true);
});
