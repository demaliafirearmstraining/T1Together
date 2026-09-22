import React,{useCallback,useState}from'react';
import{SafeAreaView,ScrollView,View,Text,Pressable,StyleSheet,RefreshControl,Image,Alert}from'react-native';
import{useFocusEffect,router}from'expo-router';
import{Ionicons}from'@expo/vector-icons';
import{supabase}from'../lib/supabase';
import{useAuth}from'../lib/AuthContext';
import{C}from'../lib/theme';
import{refreshApproximateLocationIfStale}from'../lib/location';

export default function SupplyLocker(){
 const{session}=useAuth();const[items,setItems]=useState<any[]>([]);const[filter,setFilter]=useState('all');const[refreshing,setRefreshing]=useState(false);
 const load=useCallback(async()=>{if(!session)return;await refreshApproximateLocationIfStale().catch(()=>{});
  const nearby=await supabase.rpc('nearby_supply_posts',{max_miles:25});
  const mine=await supabase.from('supply_posts').select('id,owner_id,post_type,category,item_name,device_family,quantity,details,radius_miles,created_at,profiles!supply_posts_owner_id_fkey(display_name,city,region,avatar_url)').eq('owner_id',session.user.id).eq('status','open').order('created_at',{ascending:false});
  const own=(mine.data||[]).map((x:any)=>({...x,display_name:x.profiles?.display_name,city:x.profiles?.city,region:x.profiles?.region,avatar_url:x.profiles?.avatar_url,distance_band:'Your post'}));
  setItems([...own,...(nearby.data||[])]);
 },[session]);
 useFocusEffect(useCallback(()=>{load()},[load]));
 async function refresh(){setRefreshing(true);await load();setRefreshing(false)}
 async function message(id:string){const{data,error}=await supabase.rpc('start_conversation',{other_user:id});if(error)return Alert.alert('Could not start message',error.message);if(data)router.push({pathname:'/chat',params:{id:data}})}
 async function close(id:string){const{error}=await supabase.from('supply_posts').update({status:'closed'}).eq('id',id);if(error)return Alert.alert('Could not close post',error.message);load()}
 const shown=items.filter(x=>filter==='all'||x.post_type===filter);
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>}>
  <Pressable onPress={()=>router.back()}><Text style={s.back}>‹ Back</Text></Pressable>
  <View style={s.titleRow}><View style={{flex:1}}><Text style={s.h}>Supply Locker</Text><Text style={s.sub}>Connect with nearby T1D families around practical supplies.</Text></View><Ionicons name="cube-outline" size={32} color={C.blue}/></View>
  <View style={s.actions}>
   <Pressable style={s.need} onPress={()=>router.push({pathname:'/create-supply',params:{type:'need'}})}><Ionicons name="search-outline" size={20} color={C.blue}/><Text style={s.needText}>I Need Something</Text></Pressable>
   <Pressable style={s.offer} onPress={()=>router.push({pathname:'/create-supply',params:{type:'offer'}})}><Ionicons name="gift-outline" size={20} color={C.green}/><Text style={s.offerText}>I Can Offer</Text></Pressable>
  </View>
  <View style={s.notice}><Ionicons name="shield-checkmark-outline" size={19} color={C.blue}/><Text style={s.noticeText}>Approximate distance only. No buying or selling. Coordinate details privately after connecting.</Text></View>
  <View style={s.filters}>{[['all','All'],['need','Needed'],['offer','Offered']].map(([v,l])=><Pressable key={v} onPress={()=>setFilter(v)} style={[s.filter,filter===v&&s.filterOn]}><Text style={[s.filterText,filter===v&&s.filterTextOn]}>{l}</Text></Pressable>)}</View>
  {shown.length===0?<View style={s.empty}><Ionicons name="cube-outline" size={31} color={C.blue}/><Text style={s.emptyTitle}>Nothing in the locker yet</Text><Text style={s.emptyText}>Post a request or an offer to help the nearby T1D community.</Text></View>:shown.map(x=><View key={x.id} style={s.card}>
   <View style={s.top}><View style={s.avatar}>{x.avatar_url?<Image source={{uri:x.avatar_url}} style={s.photo}/>:<Text style={s.initial}>{(x.display_name||'M').charAt(0).toUpperCase()}</Text>}</View><View style={{flex:1}}>
    <View style={s.tagRow}><View style={[s.tag,x.post_type==='offer'&&s.offerTag]}><Text style={[s.tagText,x.post_type==='offer'&&s.offerTagText]}>{x.post_type==='need'?'NEEDED':'OFFERED'}</Text></View><Text style={s.category}>{x.category}</Text></View>
    <Text style={s.name}>{x.item_name}{x.quantity?' · Qty '+x.quantity:''}</Text><Text style={s.meta}>{x.display_name||'Member'} · {x.distance_band||[x.city,x.region].filter(Boolean).join(', ')}</Text>
   </View></View>
   {x.device_family&&<Text style={s.device}>{x.device_family}</Text>}{x.details&&<Text style={s.details}>{x.details}</Text>}
   {x.owner_id===session?.user.id?<Pressable style={s.close} onPress={()=>close(x.id)}><Text style={s.closeText}>Mark Closed</Text></Pressable>:<Pressable style={s.message} onPress={()=>message(x.owner_id)}><Ionicons name="chatbubble-outline" size={15} color={C.blue}/><Text style={s.messageText}>Message {x.display_name||'Member'}</Text></Pressable>}
  </View>)}
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.white},page:{padding:20,paddingBottom:45},back:{color:C.blue,fontWeight:'800',fontSize:16,marginTop:10},titleRow:{flexDirection:'row',alignItems:'center',gap:12,marginTop:15},h:{fontSize:30,fontWeight:'900',color:C.navy},sub:{color:C.gray,lineHeight:20,marginTop:4},actions:{flexDirection:'row',gap:9,marginTop:20},need:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,padding:13,borderRadius:14,backgroundColor:C.sky},needText:{color:C.blue,fontWeight:'900',fontSize:12},offer:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,padding:13,borderRadius:14,backgroundColor:'#EAF9F2'},offerText:{color:C.green,fontWeight:'900',fontSize:12},notice:{flexDirection:'row',gap:8,padding:13,borderRadius:14,backgroundColor:C.pale,marginTop:12},noticeText:{flex:1,fontSize:11,color:C.gray,lineHeight:17},filters:{flexDirection:'row',gap:7,marginTop:20,marginBottom:4},filter:{paddingHorizontal:13,paddingVertical:8,borderRadius:15,backgroundColor:C.pale},filterOn:{backgroundColor:C.sky},filterText:{fontSize:12,fontWeight:'800',color:C.gray},filterTextOn:{color:C.blue},empty:{alignItems:'center',backgroundColor:C.pale,padding:25,borderRadius:18,marginTop:14},emptyTitle:{fontSize:17,fontWeight:'900',color:C.navy,marginTop:8},emptyText:{color:C.gray,textAlign:'center',lineHeight:19,marginTop:4},card:{padding:16,borderWidth:1,borderColor:C.line,borderRadius:18,marginTop:11},top:{flexDirection:'row'},avatar:{width:43,height:43,borderRadius:22,backgroundColor:C.sky,alignItems:'center',justifyContent:'center',marginRight:10,overflow:'hidden'},photo:{width:43,height:43},initial:{fontWeight:'900',color:C.blue},tagRow:{flexDirection:'row',alignItems:'center',gap:7},tag:{backgroundColor:C.sky,paddingHorizontal:7,paddingVertical:3,borderRadius:8},tagText:{fontSize:9,fontWeight:'900',color:C.blue},offerTag:{backgroundColor:'#EAF9F2'},offerTagText:{color:C.green},category:{fontSize:10,color:C.gray,fontWeight:'700'},name:{fontSize:17,fontWeight:'900',color:C.navy,marginTop:6},meta:{fontSize:11,color:C.gray,marginTop:4},device:{alignSelf:'flex-start',fontSize:10,fontWeight:'800',color:C.blue,backgroundColor:C.pale,paddingHorizontal:8,paddingVertical:4,borderRadius:8,marginTop:10},details:{color:C.gray,lineHeight:19,marginTop:9},message:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:C.sky,padding:10,borderRadius:11,marginTop:12},messageText:{color:C.blue,fontWeight:'900',fontSize:12},close:{backgroundColor:C.pale,padding:10,borderRadius:11,alignItems:'center',marginTop:12},closeText:{color:C.green,fontWeight:'900',fontSize:12}});
