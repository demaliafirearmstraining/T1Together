export function resizeWithin(width:number,height:number,maxEdge:number){
 if(width<=maxEdge&&height<=maxEdge)return [];
 return width>=height?[{resize:{width:maxEdge}}]:[{resize:{height:maxEdge}}];
}
