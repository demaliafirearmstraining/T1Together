import React,{useState}from'react';
import{SafeAreaView,View,Text,TextInput,Pressable,StyleSheet,Alert,KeyboardAvoidingView,Platform}from'react-native';
import{router}from'expo-router';
import{Ionicons}from'@expo/vector-icons';
import{supabase}from'../lib/supabase';
import{useAuth}from'../lib/AuthContext';
import{C}from'../lib/theme';
const cats=['General','Newly Diagnosed','Devices','School','Travel','Parenting'];
export default function CreatePost(){
 const{session}=useAuth();const[body,setBody]=useState('');const[category,setCategory]=useState('General');const[busy,setBusy]=useState(false);
 async function publish(){const clean=body.trim();if(!clean)return Alert.alert('Write something first','Add a question, experience, or update to your post.');if(clean.length>1500)return Alert.alert('Post is too long','Please keep posts under 1,500 characters.');if(!session)return;
 setBusy(true);const{error}=await supabase.from('posts').insert({author_id:session.user.id,body:clean,category});setBusy(false);if(error)return Alert.alert('Could not publish',error.message);router.replace('/(tabs)/community')}
 return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><View style={s.page}>
  <View style={s.header}><Pressable onPress={()=>router.back()} style={s.close}><Ionicons name="close" size={27} color={C.navy}/></Pressable><Text style={s.title}>Create post</Text><Pressable onPress={publish} disabled={busy||!body.trim()} style={[s.publish,(!body.trim()||busy)&&s.disabled]}><Text style={s.publishText}>{busy?'Posting…':'Post'}</Text></Pressable></View>
  <Text style={s.prompt}>What do you want to share?</Text><TextInput autoFocus multiline maxLength={1500} value={body} onChangeText={setBody} placeholder="Ask a question, share an experience, or tell the community what's happening…" placeholderTextColor="#8294A7" style={s.input}/>
  <Text style={s.count}>{body.length}/1500</Text><Text style={s.label}>Topic</Text><View style={s.chips}>{cats.map(c=><Pressable key={c} onPress={()=>setCategory(c)} style={[s.chip,category===c&&s.chipOn]}><Text style={[s.chipText,category===c&&s.chipTextOn]}>{c}</Text></Pressable>)}</View>
  <View style={s.reminder}><Ionicons name="people-outline" size={21} color={C.blue}/><Text style={s.reminderText}>Keep personal medical details private. Community posts are peer support, not medical advice.</Text></View>
 </View></KeyboardAvoidingView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.white},page:{flex:1,padding:20},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:5},close:{width:42,height:42,alignItems:'center',justifyContent:'center'},title:{fontSize:18,fontWeight:'900',color:C.navy},publish:{backgroundColor:C.blue,borderRadius:20,paddingHorizontal:17,paddingVertical:10},disabled:{opacity:.4},publishText:{color:C.white,fontWeight:'900'},prompt:{fontSize:23,fontWeight:'900',color:C.navy,marginTop:28},input:{fontSize:18,lineHeight:27,color:C.navy,minHeight:180,textAlignVertical:'top',marginTop:12},count:{textAlign:'right',fontSize:12,color:C.gray},label:{fontSize:15,fontWeight:'900',color:C.navy,marginTop:18,marginBottom:10},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{paddingHorizontal:13,paddingVertical:9,borderRadius:20,backgroundColor:C.pale,borderWidth:1,borderColor:C.line},chipOn:{backgroundColor:C.sky,borderColor:C.blue},chipText:{fontSize:13,fontWeight:'700',color:C.gray},chipTextOn:{color:C.blue},reminder:{flexDirection:'row',gap:10,backgroundColor:C.pale,padding:15,borderRadius:16,marginTop:25},reminderText:{flex:1,color:C.gray,fontSize:13,lineHeight:19}});