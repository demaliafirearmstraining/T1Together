import * as ImageManipulator from 'expo-image-manipulator';
import {resizeWithin} from './imageSizing';

export async function prepareProfilePhoto(asset:{uri:string;width:number;height:number}){
 const converted=await ImageManipulator.manipulateAsync(asset.uri,resizeWithin(asset.width,asset.height,512),{compress:.8,format:ImageManipulator.SaveFormat.JPEG});
 const response=await fetch(converted.uri);
 return {bytes:await response.arrayBuffer(),mime:'image/jpeg',ext:'jpg'};
}
