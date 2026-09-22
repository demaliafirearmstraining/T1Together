import React,{useCallback,useMemo,useState}from'react';
import{SafeAreaView,ScrollView,View,Text,TextInput,Pressable,StyleSheet,Alert,KeyboardAvoidingView,Platform,Image}from'react-native';
import{useFocusEffect,useLocalSearchParams,router}from'expo-router';
import{Ionicons}from'@expo/vector-icons';
import{supabase}from'../lib/supabase';
import{useAuth}from'../lib/AuthContext';
import{C}from'../lib/theme';

export default function PostDetail(){
 const params=useLocalSearchParams<{id?:string|string[]}>();const id=Array.isArray(params.id)?params.id[0]:params.id;const{session}=useAuth();
 const[post,setPost]=useState<any>(null);const[comments,setComments]=useState<any[]>([]);const[body,setBody]=useState('');const[supported,setSupported]=useState(false);const[count,setCount]=useState(0);const[saved,setSaved]=useState(false);const[photoUrl,setPhotoUrl]=useState<string|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState('');const[commenting,setCommenting]=useState(false);const[replyTo,setReplyTo]=useState<any>(null);const[actionBusy,setActionBusy]=useState(false);

 const load=useCallback(async(silent=false)=>{if(!id)return;if(!silent){setLoading(true);setError('');}
  const[p,c,r]=await Promise.all([
   supabase.from('posts').select('id,author_id,body,category,created_at,image_path,profiles!posts_author_id_fkey(display_name,city,region,avatar_url)').eq('id',id).single(),
   supabase.from('post_comments').select('id,post_id,author_id,parent_comment_id,body,created_at,profiles!post_comments_author_id_fkey(display_name,avatar_url)').eq('post_id',id).order('created_at'),
   supabase.from('post_reactions').select('user_id').eq('post_id',id)
  ]);
  if(p.error){setError(p.error.code==='PGRST116'?'This post is no longer available.':p.error.message);setPost(null);if(!silent)setLoading(false);return}
  setPost(p.data);
  if(p.data?.image_path){const{data}=await supabase.storage.from('community-posts').createSignedUrl(p.data.image_path,3600);setPhotoUrl(data?.signedUrl||null)}else setPhotoUrl(null);
  if(!c.error)setComments((c.data||[]).filter((x:any)=>x.post_id===id));
  if(r.data){setCount(r.data.length);setSupported(r.data.some((x:any)=>x.user_id===session?.user.id))}
  if(session){const{data:b}=await supabase.from('post_bookmarks').select('post_id').eq('user_id',session.user.id).eq('post_id',id).maybeSingle();setSaved(!!b)}
  if(!silent)setLoading(false);
 },[id,session?.user.id]);

 useFocusEffect(useCallback(()=>{load();if(!id)return;
  const commentsChannel=supabase.channel('post-comments-'+id).on('postgres_changes',{event:'*',schema:'public',table:'post_comments',filter:`post_id=eq.${id}`},()=>load(true)).subscribe();
  const reactionsChannel=supabase.channel('post-reactions-'+id).on('postgres_changes',{event:'*',schema:'public',table:'post_reactions',filter:`post_id=eq.${id}`},()=>load(true)).subscribe();
  return()=>{supabase.removeChannel(commentsChannel);supabase.removeChannel(reactionsChannel)}
 },[id,load]));

 async function toggle(){if(!session||!id||actionBusy)return;setActionBusy(true);const next=!supported;setSupported(next);setCount(v=>Math.max(0,v+(next?1:-1)));
  const q=next?await supabase.from('post_reactions').insert({post_id:id,user_id:session.user.id,reaction:'support'}):await supabase.from('post_reactions').delete().eq('post_id',id).eq('user_id',session.user.id);
  if(q.error){setSupported(!next);setCount(v=>Math.max(0,v+(next?-1:1)));Alert.alert('Could not update support',q.error.message)}setActionBusy(false);
 }
 async function bookmark(){if(!session||!id)return;if(saved)await supabase.from('post_bookmarks').delete().eq('user_id',session.user.id).eq('post_id',id);else await supabase.from('post_bookmarks').insert({user_id:session.user.id,post_id:id});setSaved(!saved)}
 async function messageUser(userId:string){if(!session||userId===session.user.id)return;const{data,error}=await supabase.rpc('start_conversation',{other_user:userId});if(error)return Alert.alert('Could not start message',error.message);router.push({pathname:'/chat',params:{id:data}})}
 function openProfile(userId:string){if(!userId)return;router.push({pathname:'/member',params:{id:userId}})}
 async function remove(){Alert.alert('Delete post?','This will permanently remove the post and its comments.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{const path=post.image_path;const{error}=await supabase.from('posts').delete().eq('id',id).eq('author_id',session?.user.id);if(error)return Alert.alert('Could not delete post',error.message);if(path)await supabase.storage.from('community-posts').remove([path]);router.back()}}])}
 async function removeComment(commentId:string){if(!session)return;Alert.alert('Delete comment?','This comment and any replies to it will be permanently removed.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{const{error}=await supabase.from('post_comments').delete().eq('id',commentId);if(error)return Alert.alert('Could not delete comment',error.message);load(true)}}])}
 async function comment(){const clean=body.trim();if(!clean||!session||!id||commenting)return;setCommenting(true);
  const payload:any={post_id:id,author_id:session.user.id,body:clean};if(replyTo?.id)payload.parent_comment_id=replyTo.id;
  const{error}=await supabase.from('post_comments').insert(payload);setCommenting(false);if(error)return Alert.alert('Could not comment',error.message);setBody('');setReplyTo(null);load(true)
 }

 const roots=useMemo(()=>comments.filter(x=>!x.parent_comment_id),[comments]);
 const replies=useCallback((commentId:string)=>comments.filter(x=>x.parent_comment_id===commentId),[comments]);

 const renderComment=(x:any,isReply=false)=><View key={x.id} style={[s.comment,isReply&&s.replyCard]}>
  <View style={s.commentTop}>
   <Pressable onPress={()=>openProfile(x.author_id)} style={s.commentPerson}>
    {x.profiles?.avatar_url?<Image source={{uri:x.profiles.avatar_url}} style={s.commentAvatar}/>:<View style={s.commentFallback}><Text style={s.commentInitial}>{(x.profiles?.display_name||'M').charAt(0)}</Text></View>}
    <View style={{flex:1}}><Text style={s.commentName}>{x.profiles?.display_name||'Member'}</Text><Text style={s.commentTime}>{new Date(x.created_at).toLocaleString()}</Text></View>
   </Pressable>
   {x.author_id!==session?.user.id&&<Pressable hitSlop={8} onPress={()=>messageUser(x.author_id)} style={s.iconAction}><Ionicons name="chatbubble-outline" size={17} color={C.blue}/></Pressable>}
   {(x.author_id===session?.user.id||post.author_id===session?.user.id)&&<Pressable hitSlop={8} onPress={()=>removeComment(x.id)} style={s.iconAction}><Ionicons name="trash-outline" size={16} color={C.red}/></Pressable>}
  </View>
  <Text style={s.commentBody}>{x.body}</Text>
  {!isReply&&<Pressable onPress={()=>{setReplyTo(x);setBody('')}} style={s.replyBtn}><Ionicons name="return-down-forward-outline" size={15} color={C.blue}/><Text style={s.replyText}>Reply</Text></Pressable>}
 </View>;

 if(loading)return <SafeAreaView style={s.safe}><Text style={s.loading}>Loading…</Text></SafeAreaView>;
 if(!post)return <SafeAreaView style={s.safe}><View style={s.page}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹ Community</Text></Pressable><View style={s.comment}><Text style={s.commentName}>Post unavailable</Text><Text style={s.commentBody}>{error||'This post may have been deleted or is no longer visible.'}</Text><Pressable onPress={()=>load()} style={s.send}><Ionicons name="refresh" size={19} color={C.white}/></Pressable></View></View></SafeAreaView>;

 return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
  <Pressable onPress={()=>router.back()}><Text style={s.back}>‹ Community</Text></Pressable>
  <View style={s.post}>
   <View style={s.postHeader}><Pressable onPress={()=>openProfile(post.author_id)} style={s.authorRow}>{post.profiles?.avatar_url?<Image source={{uri:post.profiles.avatar_url}} style={s.avatar}/>:<View style={s.avatarFallback}><Text style={s.initial}>{(post.profiles?.display_name||'M').charAt(0)}</Text></View>}<View><Text style={s.author}>{post.profiles?.display_name||'Member'}</Text><Text style={s.time}>{new Date(post.created_at).toLocaleString()}</Text></View></Pressable><Pressable onPress={()=>router.push({pathname:'/report',params:{type:'post',id:post.id}})}><Ionicons name="ellipsis-horizontal" size={22} color={C.gray}/></Pressable></View>
   <Text style={s.meta}>{post.category} · {[post.profiles?.city,post.profiles?.region].filter(Boolean).join(', ')||'T1Together'}</Text><Text style={s.body}>{post.body}</Text>{photoUrl&&<Image source={{uri:photoUrl}} style={s.postImage}/>}
   <View style={s.actions}><Pressable onPress={toggle} disabled={actionBusy} style={[s.support,supported&&s.supported]}><Ionicons name={supported?'heart':'heart-outline'} size={19} color={supported?C.red:C.blue}/><Text style={s.supportText}>{count} Support</Text></Pressable><Pressable onPress={bookmark} style={s.save}><Ionicons name={saved?'bookmark':'bookmark-outline'} size={19} color={C.blue}/><Text style={s.supportText}>{saved?'Saved':'Save'}</Text></Pressable>{post.author_id!==session?.user.id&&<Pressable onPress={()=>messageUser(post.author_id)} style={s.edit}><Ionicons name="chatbubble-outline" size={18} color={C.blue}/></Pressable>}{post.author_id===session?.user.id&&<><Pressable onPress={()=>router.push({pathname:'/create-post',params:{id:post.id}})} style={s.edit}><Ionicons name="create-outline" size={18} color={C.blue}/></Pressable><Pressable onPress={remove} style={s.delete}><Ionicons name="trash-outline" size={18} color={C.red}/></Pressable></>}</View>
  </View>
  <Text style={s.heading}>Comments</Text>
  {roots.map(x=><View key={x.id}>{renderComment(x)}{replies(x.id).map(r=>renderComment(r,true))}</View>)}
  {comments.length===0&&<Text style={s.empty}>No comments yet. Be the first to join the conversation.</Text>}
  {replyTo&&<View style={s.replying}><View style={{flex:1}}><Text style={s.replyingLabel}>Replying to {replyTo.profiles?.display_name||'Member'}</Text><Text numberOfLines={1} style={s.replyingPreview}>{replyTo.body}</Text></View><Pressable onPress={()=>setReplyTo(null)}><Ionicons name="close-circle" size={22} color={C.gray}/></Pressable></View>}
  <View style={s.compose}><TextInput style={s.input} value={body} onChangeText={setBody} placeholder={replyTo?'Write a reply…':'Add a supportive comment…'} multiline/><Pressable style={[s.send,commenting&&{opacity:.5}]} onPress={comment} disabled={commenting||!body.trim()}><Ionicons name="send" size={19} color={C.white}/></Pressable></View>
 </ScrollView></KeyboardAvoidingView></SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.white},loading:{padding:30,color:C.gray},page:{padding:20,paddingBottom:50},back:{color:C.blue,fontWeight:'800',fontSize:16,marginTop:10,marginBottom:20},
 post:{padding:19,borderWidth:1,borderColor:C.line,borderRadius:20},authorRow:{flexDirection:'row',alignItems:'center',gap:9,flex:1},avatar:{width:40,height:40,borderRadius:20},avatarFallback:{width:40,height:40,borderRadius:20,backgroundColor:C.sky,alignItems:'center',justifyContent:'center'},initial:{fontWeight:'900',color:C.blue},time:{fontSize:10,color:C.gray,marginTop:2},postHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},author:{fontWeight:'900',fontSize:17,color:C.navy},meta:{color:C.gray,fontSize:12,marginTop:3},body:{fontSize:17,lineHeight:25,color:C.navy,marginTop:17},postImage:{width:'100%',height:300,borderRadius:15,marginTop:15,resizeMode:'cover'},
 actions:{flexDirection:'row',marginTop:18},support:{flexDirection:'row',gap:7,alignItems:'center',paddingHorizontal:12,paddingVertical:8,borderRadius:18,backgroundColor:C.pale},supported:{backgroundColor:'#FFF1F1'},save:{flexDirection:'row',gap:6,alignItems:'center',paddingHorizontal:12,paddingVertical:8,borderRadius:18,backgroundColor:C.pale},edit:{marginLeft:'auto',padding:9},delete:{padding:9},supportText:{fontWeight:'800',color:C.navy},
 heading:{fontSize:20,fontWeight:'900',color:C.navy,marginTop:25,marginBottom:10},comment:{padding:14,borderRadius:15,backgroundColor:C.pale,marginBottom:9},replyCard:{marginLeft:34,backgroundColor:'#F7FAFD',borderLeftWidth:2,borderLeftColor:C.sky},commentTop:{flexDirection:'row',alignItems:'center',gap:7},commentPerson:{flex:1,flexDirection:'row',alignItems:'center',gap:9},commentAvatar:{width:32,height:32,borderRadius:16},commentFallback:{width:32,height:32,borderRadius:16,backgroundColor:C.sky,alignItems:'center',justifyContent:'center'},commentInitial:{fontSize:11,fontWeight:'900',color:C.blue},commentTime:{fontSize:9,color:C.gray,marginTop:2},iconAction:{width:34,height:34,alignItems:'center',justifyContent:'center'},commentName:{fontWeight:'900',color:C.navy,fontSize:13},commentBody:{color:C.navy,lineHeight:21,marginTop:5},replyBtn:{flexDirection:'row',alignItems:'center',gap:5,alignSelf:'flex-start',paddingVertical:7,paddingRight:12,marginTop:3},replyText:{fontSize:12,fontWeight:'800',color:C.blue},
 empty:{color:C.gray,paddingVertical:10},replying:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:C.pale,borderRadius:12,padding:10,marginTop:10},replyingLabel:{fontSize:12,fontWeight:'900',color:C.blue},replyingPreview:{fontSize:11,color:C.gray,marginTop:2},compose:{flexDirection:'row',gap:9,alignItems:'flex-end',marginTop:12},input:{flex:1,borderWidth:1,borderColor:C.line,borderRadius:16,padding:12,maxHeight:100,fontSize:15},send:{width:44,height:44,borderRadius:22,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'}
});