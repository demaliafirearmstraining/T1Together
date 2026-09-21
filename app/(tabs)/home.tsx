import React,{useCallback,useState}from'react';
import{SafeAreaView,ScrollView,View,Text,Pressable,StyleSheet,RefreshControl}from'react-native';
import{useFocusEffect,router}from'expo-router';
import{Ionicons}from'@expo/vector-icons';
import{supabase}from'../../lib/supabase';
import{useAuth}from'../../lib/AuthContext';
import{C}from'../../lib/theme';

type Profile={display_name:string;city:string|null;region:string|null;helper_enabled:boolean};
type Post={id:string;body:string;category:string;created_at:string;profiles:any};

export default function Home(){
 const{session}=useAuth();const[profile,setProfile]=useState<Profile|null>(null);const[posts,setPosts]=useState<Post[]>([]);const[refreshing,setRefreshing]=useState(false);
 const load=useCallback(async()=>{if(!session)return;const[p,feed]=await Promise.all([
  supabase.from('profiles').select('display_name,city,region,helper_enabled').eq('id',session.user.id).single(),
  supabase.from('posts').select('id,body,category,created_at,profiles!posts_author_id_fkey(display_name,city,region)').order('created_at',{ascending:false}).limit(3)
 ]);if(p.data)setProfile(p.data);if(feed.data)setPosts(feed.data as Post[]);},[session]);
 useFocusEffect(useCallback(()=>{load()},[load]));
 async function refresh(){setRefreshing(true);await load();setRefreshing(false)}
 const first=profile?.display_name?.split(' ')[0]||'there';
 return <SafeAreaView style={s.safe}><ScrollView style={s.scroll} contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>}>
  <View style={s.top}><View><Text style={s.eyebrow}>T1TOGETHER</Text><Text style={s.h}>Hi, {first} 💙</Text><Text style={s.location}>{profile?.city?[profile.city,profile.region].filter(Boolean).join(', '):'Your T1D community'}</Text></View><Pressable style={s.avatar} onPress={()=>router.push('/settings')}><Ionicons name="person" size={23} color={C.blue}/></Pressable></View>
  <Pressable style={s.composer} onPress={()=>router.push('/create-post')}><View style={s.composerIcon}><Ionicons name="create-outline" size={21} color={C.blue}/></View><Text style={s.composerText}>What's happening?</Text><Ionicons name="chevron-forward" size={20} color={C.gray}/></Pressable>
  <Text style={s.section}>Quick help</Text><View style={s.actions}>
   <Pressable style={[s.action,s.beacon]} onPress={()=>router.push('/(tabs)/help')}><Ionicons name="radio" size={25} color={C.red}/><Text style={s.actionTitle}>T1 Beacon</Text><Text style={s.actionText}>Ask nearby helpers</Text></Pressable>
   <Pressable style={s.action} onPress={()=>router.push('/(tabs)/help')}><Ionicons name="cube-outline" size={25} color={C.blue}/><Text style={s.actionTitle}>Supply Locker</Text><Text style={s.actionText}>Find practical help</Text></Pressable>
  </View>
  <View style={s.sectionRow}><Text style={s.section}>Community</Text><Pressable onPress={()=>router.push('/(tabs)/community')}><Text style={s.see}>See all</Text></Pressable></View>
  {posts.length===0?<View style={s.empty}><Text style={s.emptyTitle}>Start the conversation</Text><Text style={s.emptyText}>Your community feed is ready. Share the first post.</Text></View>:posts.map(p=><View key={p.id} style={s.post}><View style={s.postTop}><View style={s.smallAvatar}><Ionicons name="person" size={16} color={C.blue}/></View><View style={{flex:1}}><Text style={s.author}>{p.profiles?.display_name||'T1Together Member'}</Text><Text style={s.meta}>{p.category} · {new Date(p.created_at).toLocaleDateString()}</Text></View></View><Text style={s.body}>{p.body}</Text></View>)}
  <Text style={s.note}>T1Together is peer support, not medical advice. For emergencies, contact emergency services.</Text>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.white},scroll:{flex:1},page:{padding:20,paddingBottom:38},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:12},eyebrow:{fontSize:11,fontWeight:'900',letterSpacing:1.5,color:C.blue},h:{fontSize:32,fontWeight:'900',color:C.navy,marginTop:3},location:{color:C.gray,fontSize:14,marginTop:3},avatar:{width:46,height:46,borderRadius:23,backgroundColor:C.sky,alignItems:'center',justifyContent:'center'},composer:{marginTop:24,borderWidth:1,borderColor:C.line,borderRadius:18,padding:14,flexDirection:'row',alignItems:'center',backgroundColor:C.white},composerIcon:{width:36,height:36,borderRadius:18,backgroundColor:C.sky,alignItems:'center',justifyContent:'center'},composerText:{flex:1,color:C.gray,fontSize:16,marginLeft:12},section:{fontSize:20,fontWeight:'900',color:C.navy,marginTop:25,marginBottom:12},actions:{flexDirection:'row',gap:12},action:{flex:1,padding:16,borderRadius:18,backgroundColor:C.pale,minHeight:124},beacon:{backgroundColor:'#FFF4F3'},actionTitle:{fontSize:16,fontWeight:'900',color:C.navy,marginTop:10},actionText:{fontSize:13,color:C.gray,marginTop:3},sectionRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},see:{color:C.blue,fontWeight:'800',marginTop:15},empty:{padding:20,borderRadius:18,backgroundColor:C.pale},emptyTitle:{fontWeight:'900',fontSize:17,color:C.navy},emptyText:{color:C.gray,marginTop:5,lineHeight:20},post:{padding:17,borderRadius:18,borderWidth:1,borderColor:C.line,marginBottom:12},postTop:{flexDirection:'row',alignItems:'center'},smallAvatar:{width:34,height:34,borderRadius:17,backgroundColor:C.sky,alignItems:'center',justifyContent:'center',marginRight:10},author:{fontWeight:'900',color:C.navy},meta:{fontSize:12,color:C.gray,marginTop:2},body:{fontSize:16,lineHeight:23,color:C.navy,marginTop:12},note:{fontSize:12,lineHeight:17,color:C.gray,textAlign:'center',marginTop:25,paddingHorizontal:12}});