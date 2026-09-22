import * as Linking from 'expo-linking';
import {supabase} from './supabase';

export const authRedirectUrl='t1together://auth/callback';

function paramsFromUrl(url:string){
 const out:Record<string,string>={};
 const q=url.split('?')[1]?.split('#')[0]||'';
 const h=url.split('#')[1]||'';
 for(const part of [q,h]){
  for(const pair of part.split('&')){
   if(!pair)continue;
   const [k,...rest]=pair.split('=');
   if(k)out[decodeURIComponent(k)]=decodeURIComponent(rest.join('=')||'');
  }
 }
 return out;
}

export async function consumeAuthUrl(url:string){
 const p=paramsFromUrl(url);
 if(p.error||p.error_description)throw new Error(p.error_description||p.error);
 if(p.code){
  const{error}=await supabase.auth.exchangeCodeForSession(p.code);
  if(error)throw error;
 }else if(p.access_token&&p.refresh_token){
  const{error}=await supabase.auth.setSession({access_token:p.access_token,refresh_token:p.refresh_token});
  if(error)throw error;
 }
 return {type:p.type||null,recovery:p.type==='recovery'};
}

export function isT1TogetherAuthUrl(url?:string|null){
 return !!url&&url.startsWith('t1together://auth/callback');
}
