const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const m={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync('lib/retryJwtFetch.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m.exports,m);
const {createJwtRetryFetch}=m.exports;
const future=()=>new Response(JSON.stringify({code:'PGRST303',message:'JWT issued at future'}),{status:401});
test('retries a rejected write with the same body and credentials',async()=>{
 let calls=0;const waits=[];const init={method:'PATCH',body:'{"bio":"saved"}',headers:{Authorization:'Bearer example'}};
 const request=createJwtRetryFetch(async(url,options)=>{assert.equal(options,init);return ++calls<3?future():new Response('saved')},async ms=>waits.push(ms));
 assert.equal(await(await request('https://example.com/rest/v1/profiles',init)).text(),'saved');assert.equal(calls,3);assert.deepEqual(waits,[1000,2000]);
});
test('persistent skew stops after four attempts and preserves the final error',async()=>{
 let calls=0;const request=createJwtRetryFetch(async()=>{calls++;return future()},async()=>{});
 const result=await request('https://example.com/rest/v1/profiles');assert.equal(calls,4);assert.equal((await result.json()).message,'JWT issued at future');
});
test('never retries other failures or authentication requests',async()=>{
 for(const [url,status,body]of [['rest/v1/profiles',500,{}],['rest/v1/profiles',401,{code:'PGRST303',message:'JWT expired'}],['auth/v1/token',401,{code:'PGRST303',message:'JWT issued at future'}]]){
 let calls=0;const request=createJwtRetryFetch(async()=>{calls++;return new Response(JSON.stringify(body),{status})},async()=>assert.fail('unexpected wait'));
 await request('https://example.com/'+url);assert.equal(calls,1);
 }
});
test('network failures are not replayed',async()=>{
 let calls=0;const request=createJwtRetryFetch(async()=>{calls++;throw new Error('offline')},async()=>{});
 await assert.rejects(()=>request('https://example.com/rest/v1/profiles'),/offline/);assert.equal(calls,1);
});
