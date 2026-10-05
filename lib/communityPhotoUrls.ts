import {supabase} from './supabase';

export async function communityPhotoUrls(rows:{id:string;image_path?:string|null}[]){
 const paths=[...new Set(rows.map(x=>x.image_path).filter((x):x is string=>!!x))];
 const byPath:Record<string,string>={};
 for(let offset=0;offset<paths.length;offset+=100){
  const{data,error}=await supabase.storage.from('community-posts').createSignedUrls(paths.slice(offset,offset+100),3600);
  if(error)continue; // A photo failure must not hide the conversation.
  for(const photo of data||[])if(photo.path&&photo.signedUrl&&!photo.error)byPath[photo.path]=photo.signedUrl;
 }
 return Object.fromEntries(rows.filter(x=>x.image_path&&byPath[x.image_path]).map(x=>[x.id,byPath[x.image_path!]]));
}
