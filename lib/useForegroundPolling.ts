import {useEffect} from 'react';
import {AppState} from 'react-native';

// Screens retain their focus refresh. This fallback runs only while foregrounded
// and schedules after completion so a slow connection cannot stack requests.
export function useForegroundPolling(refresh:()=>Promise<unknown>,enabled=true,intervalMs=15000){
 useEffect(()=>{
  if(!enabled)return;
  let disposed=false,running=false;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const schedule=()=>{if(!disposed&&AppState.currentState==='active')timer=setTimeout(run,intervalMs)};
  const run=async()=>{
   if(disposed||running||AppState.currentState!=='active')return;
   running=true;
   try{await refresh()}catch{/* Keep the last successful screen state. */}
   finally{running=false;schedule()}
  };
  const subscription=AppState.addEventListener('change',state=>{
   clearTimeout(timer);
   if(state==='active')void run();
  });
  void run();
  return()=>{disposed=true;clearTimeout(timer);subscription.remove()};
 },[refresh,enabled,intervalMs]);
}
