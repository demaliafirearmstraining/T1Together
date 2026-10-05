import React,{useCallback,useState} from 'react';
import {Text,View,Alert} from 'react-native';
import {router,useFocusEffect} from 'expo-router';
import {Screen,Action,ui} from '../components/Screen';
import {supabase} from '../lib/supabase';
import {useAuth} from '../lib/AuthContext';
export default function Groups(){
 const{session}=useAuth();const[groups,setGroups]=useState<any[]>([]);const[joined,setJoined]=useState<Set<string>>(new Set());const[loading,setLoading]=useState(true);const[busy,setBusy]=useState<string|null>(null);const[error,setError]=useState('');const[mine,setMine]=useState(false);
 const load=useCallback(async()=>{if(!session)return;setError('');const[a,b]=await Promise.all([supabase.from('community_groups').select('*').order('sort_order'),supabase.from('community_group_memberships').select('group_id').eq('user_id',session.user.id)]);if(a.error||b.error)setError(a.error?.message||b.error?.message||'Could not load groups');else{setGroups(a.data||[]);setJoined(new Set((b.data||[]).map(x=>x.group_id)))}setLoading(false)},[session?.user.id]);
 useFocusEffect(useCallback(()=>{load()},[load]));
 async function toggle(id:string){if(!session||busy)return;setBusy(id);const{error}=joined.has(id)?await supabase.from('community_group_memberships').delete().eq('user_id',session.user.id).eq('group_id',id):await supabase.from('community_group_memberships').insert({user_id:session.user.id,group_id:id});if(error)Alert.alert('Could not update membership',error.message);else await load();setBusy(null)}
 const shown=groups.filter(g=>!mine||joined.has(g.id));
 return <Screen title="Community Groups"><Text style={ui.text}>Find people with shared experiences. Joining is optional. Posts in these groups can be read by signed-in T1DReach members.</Text><Action secondary label={mine?'Show all groups':'Show my groups'} onPress={()=>setMine(!mine)}/>{loading&&<Text style={ui.text}>Loading groups…</Text>}{error&&<><Text accessibilityRole="alert" style={ui.error}>{error}</Text><Action label="Try again" onPress={load}/></>}{!loading&&!error&&shown.length===0&&<Text style={ui.text}>You haven’t joined a group yet. Browse all groups to find a place to start.</Text>}{shown.map(g=><View key={g.id} style={ui.card}><Text accessibilityRole="header" style={ui.heading}>{g.name}</Text><Text style={ui.text}>{g.description}</Text>{joined.has(g.id)&&<Text style={ui.tag}>Joined</Text>}<Action secondary label={`Browse ${g.name}`} onPress={()=>router.push({pathname:'/group-detail',params:{id:g.id}})}/><Action label={joined.has(g.id)?`Leave ${g.name}`:`Join ${g.name}`} busy={busy===g.id} disabled={!!busy} onPress={()=>toggle(g.id)}/></View>)}</Screen>;
}
