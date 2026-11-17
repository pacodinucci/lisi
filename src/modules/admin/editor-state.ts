import type { InsertedText } from "../content/model";
import type { LocalAsset } from "../content/storage";

/** Keep the draft recoverable even when the subsequent apply fails. Queue both as one operation. */
export async function flushAndApply<T>(snapshot:T, save:(value:T)=>Promise<void>, apply:(value:T)=>Promise<void>) {
 await save(snapshot);
 await apply(snapshot);
}

type ImagePosition={id:string;cropX:number;cropY:number};
type DragStart=ImagePosition&{x:number;y:number;width:number;height:number};
/** A gesture is independent of React renders; only commit to the parent on release. */
export function createImageDrag(update:(position:ImagePosition)=>void,commit:(position:ImagePosition)=>void) {
 let start:DragStart|undefined;let position:ImagePosition|undefined;
 return {
  start(value:DragStart){start=value;position=undefined;},
  move(x:number,y:number){
   if(!start)return;
   position={id:start.id,cropX:Math.min(100,Math.max(0,start.cropX-(x-start.x)/Math.max(1,start.width)*100)),cropY:Math.min(100,Math.max(0,start.cropY-(y-start.y)/Math.max(1,start.height)*100))};
   update(position);
  },
  end(){const final=position;start=undefined;position=undefined;if(final)commit(final);},
  cancel(){start=undefined;position=undefined;}
 };
}

export async function prepareImageUpload(file:File, dependencies:{
 optimize:(file:File)=>Promise<File>;
 decode:(file:File)=>Promise<Pick<ImageBitmap,'width'|'height'|'close'>>;
 save:(asset:LocalAsset)=>Promise<void>;
 id:()=>string;now:()=>number;
}):Promise<LocalAsset> {
 const optimized=await dependencies.optimize(file);
 const bitmap=await dependencies.decode(optimized);
 let asset:LocalAsset;
 try {asset={id:dependencies.id(),name:optimized.name,blob:optimized,width:bitmap.width,height:bitmap.height,createdAt:dependencies.now()};}
 finally {bitmap.close();}
 await dependencies.save(asset);
 return asset;
}
/** Every persistence operation, including apply, uses the same ordered chain. */
export function createSaveQueue() {
 let tail=Promise.resolve();
 return function enqueue<T>(operation:()=>Promise<T>):Promise<T>{
  const result=tail.then(operation);tail=result.then(()=>undefined,()=>undefined);return result;
 };
}
export function moveInserted<T extends Pick<InsertedText,"id"|"afterId">>(blocks:T[],id:string,direction:-1|1):T[]{
 const result=[...blocks];const index=result.findIndex(b=>b.id===id);if(index<0)return result;
 const siblings=result.map((b,i)=>b.afterId===result[index].afterId?i:-1).filter(i=>i>=0);
 const target=siblings[siblings.indexOf(index)+direction];
 if(target!==undefined)[result[index],result[target]]=[result[target],result[index]];
 return result;
}
