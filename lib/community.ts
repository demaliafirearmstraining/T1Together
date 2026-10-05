export function threadComments(comments:any[]) {
 const ids=new Set(comments.map(x=>x.id)); const children=new Map<string,any[]>();
 for(const c of comments){const key=c.parent_comment_id&&ids.has(c.parent_comment_id)?c.parent_comment_id:'';children.set(key,[...(children.get(key)||[]),c]);}
 const result:any[]=[]; const seen=new Set<string>();
 function visit(key:string,depth:number){for(const c of children.get(key)||[]){if(seen.has(c.id))continue;seen.add(c.id);result.push({...c,depth});visit(c.id,depth+1);}}
 visit('',0);for(const c of comments)if(!seen.has(c.id)){seen.add(c.id);result.push({...c,depth:0});visit(c.id,1);}return result;
}
export const COMMUNITY_TOPICS=['General','Introductions','Newly Diagnosed','Devices','School','Travel','Parenting','Caregivers','Supplies'];
