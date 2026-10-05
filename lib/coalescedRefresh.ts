// Collapse a burst into one refresh and allow at most one follow-up while busy.
export function coalescedRefresh(refresh:()=>Promise<unknown>,delayMs=300){
 let timer:ReturnType<typeof setTimeout>|undefined,running=false,pending=false,disposed=false;
 const run=async()=>{
  timer=undefined;
  if(disposed)return;
  if(running){pending=true;return}
  running=true;
  try{await refresh()}catch{/* The screen retains its existing error UI. */}
  finally{running=false;if(pending&&!disposed){pending=false;request()}}
 };
 const request=()=>{
  if(disposed)return;
  if(running){pending=true;return}
  if(!timer)timer=setTimeout(run,delayMs);
 };
 return {request,dispose:()=>{disposed=true;pending=false;clearTimeout(timer)}};
}
