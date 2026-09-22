import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async(req)=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const url=Deno.env.get('SUPABASE_URL');const anon=Deno.env.get('SUPABASE_ANON_KEY');const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!anon||!service)return new Response(JSON.stringify({error:'Server configuration missing'}),{status:500,headers:{'content-type':'application/json'}});
 const auth=req.headers.get('Authorization')||'';
 const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
 const{data:{user},error:userError}=await userClient.auth.getUser();
 if(userError||!user)return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{'content-type':'application/json'}});
 const{error:cleanup}=await userClient.rpc('delete_my_app_data');
 if(cleanup)return new Response(JSON.stringify({error:cleanup.message}),{status:400,headers:{'content-type':'application/json'}});
 const admin=createClient(url,service);
 const{error:del}=await admin.auth.admin.deleteUser(user.id);
 if(del)return new Response(JSON.stringify({error:del.message}),{status:500,headers:{'content-type':'application/json'}});
 return new Response(JSON.stringify({ok:true}),{status:200,headers:{'content-type':'application/json'}});
});
