export type CursorRow={id:string;created_at:string};
// Both fields come from database rows; reject malformed cursors before embedding
// them in PostgREST's OR syntax. UUID breaks ties at identical timestamps.
export function olderThan(row:CursorRow){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id)||!/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(row.created_at))throw new Error('Invalid message cursor');
 return `created_at.lt.${row.created_at},and(created_at.eq.${row.created_at},id.lt.${row.id})`;
}
export function appendUnique<T extends {id:string}>(current:T[],older:T[]){
 const ids=new Set(current.map(x=>x.id));
 return [...current,...older.filter(x=>{if(ids.has(x.id))return false;ids.add(x.id);return true})];
}
