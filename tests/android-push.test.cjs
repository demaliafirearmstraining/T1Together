const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function load({status='granted',failure,saveError=null}={}){
 const calls=[];
 const notifications={AndroidImportance:{HIGH:4,MAX:5},setNotificationHandler(){},async setNotificationChannelAsync(id,options){calls.push(['channel',id,options.importance]);if(failure)throw new Error(failure)},async getPermissionsAsync(){return {status}},async requestPermissionsAsync(){calls.push(['permission']);return {status}},async getExpoPushTokenAsync(){calls.push(['token']);return {data:'ExponentPushToken[test]'}}};
 const mocks={'expo-notifications':notifications,'expo-constants':{expoConfig:{extra:{eas:{projectId:'project'}}}},'react-native':{Platform:{OS:'android'}},'./supabase':{supabase:{from(){return {async upsert(row){calls.push(['save',row.platform]);return {error:saveError}}}}}}};
 const m={exports:{}};
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync('lib/notifications.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(name=>mocks[name],m,m.exports);
 return {register:m.exports.registerPush,calls};
}
test('Android registers a high importance channel before obtaining and saving a token',async()=>{const {register,calls}=load();assert.equal((await register('user')).ok,true);assert.deepEqual(calls[0],['channel','t1dreach-alerts',4]);assert.deepEqual(calls.slice(-2),[['token'],['save','android']]);});
test('channel setup failures return a visible registration error',async()=>{const {register}=load({failure:'Firebase unavailable'});assert.deepEqual(await register('user'),{ok:false,reason:'Firebase unavailable'});});
test('resume does not prompt again when permissions are off',async()=>{const {register,calls}=load({status:'denied'});assert.deepEqual(await register('user',false),{ok:false,reason:'permission'});assert.equal(calls.some(x=>x[0]==='permission'||x[0]==='token'),false);});
test('a failed token save is not reported as enabled',async()=>{const {register}=load({saveError:{message:'offline'}});const result=await register('user');assert.equal(result.ok,false);assert.equal(result.reason,'offline');});
