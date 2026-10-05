import {resizeWithin} from './imageSizing';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {supabase} from './supabase';
export async function chooseCommunityPhoto(){
 const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
 if(!permission.granted)throw new Error('Allow photo access to add a picture.');
 const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.8});
 if(result.canceled)return null;
 const converted=await ImageManipulator.manipulateAsync(result.assets[0].uri,resizeWithin(result.assets[0].width,result.assets[0].height,1600),{compress:.8,format:ImageManipulator.SaveFormat.JPEG});
 return converted.uri;
}
export async function uploadCommunityPhoto(uri:string,userId:string){
 const response=await fetch(uri);const bytes=await response.arrayBuffer();
 const path=`${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
 const {error}=await supabase.storage.from('community-posts').upload(path,bytes,{contentType:'image/jpeg'});
 if(error)throw error;return path;
}
