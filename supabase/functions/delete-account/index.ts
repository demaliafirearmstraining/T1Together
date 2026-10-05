import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.116.0';
import {removeUserStorage} from './storage-cleanup.ts';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});

Deno.serve(async(req)=>{
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL');
  const anon=Deno.env.get('SUPABASE_ANON_KEY');
  const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!anon||!service)return json({error:'Server configuration missing'},500);

  const auth=req.headers.get('Authorization')||'';
  if(!auth.startsWith('Bearer '))return json({error:'Missing authorization'},401);

  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const{data:{user},error:userError}=await userClient.auth.getUser();
  if(userError||!user)return json({error:'Unauthorized',detail:userError?.message},401);

  // Remove Storage objects through the Storage API. Direct SQL deletes from
  // storage.objects are intentionally avoided because Storage owns object lifecycle.
  const admin=createClient(url,service);
  await removeUserStorage(admin,user.id);

  const{error:cleanup}=await userClient.rpc('delete_my_app_data');
  if(cleanup)return json({error:'Could not remove account data',detail:cleanup.message},400);

  const{error:del}=await admin.auth.admin.deleteUser(user.id);
  if(del)return json({error:'Could not delete sign-in account',detail:del.message},500);
  return json({ok:true});
 }catch(e){
  console.error('delete-account unexpected error',e);
  return json({error:'Unexpected account deletion error',detail:e instanceof Error?e.message:String(e)},500);
 }
});
