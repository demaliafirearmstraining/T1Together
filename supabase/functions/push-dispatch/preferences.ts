export function inQuietHours(pref:any,now=new Date()){
 if(!pref?.quiet_enabled)return false;
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:pref.timezone||'UTC',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const hour=Number(parts.find(x=>x.type==='hour')?.value);const minute=Number(parts.find(x=>x.type==='minute')?.value);const current=hour*60+minute;
 const start=Number(pref.quiet_start),end=Number(pref.quiet_end);
 if(start===end)return false;
 return start<end?current>=start&&current<end:current>=start||current<end;
}
export function extraPreference(kind:string){
 if(kind==='community_reply')return 'notify_replies';
 if(kind==='community_follow')return 'notify_followed_posts';
 if(kind==='supply'||kind==='supply_match')return 'notify_supplies';
 return null;
}
