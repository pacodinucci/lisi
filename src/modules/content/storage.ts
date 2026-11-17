import { cloneContent, defaultContent, validateContent, type ContentDocument } from "./model";
export type LocalAsset = { id: string; name: string; blob: Blob; width: number; height: number; createdAt: number };
const DB_NAME = "lisi-content-v1";
const assetUrls = new Map<string, string>();
/** Session-owned URLs remain alive while any document references its asset. */
export function resolveAssetUrl(asset: LocalAsset) {
 if(!assetUrls.has(asset.id)) assetUrls.set(asset.id,URL.createObjectURL(asset.blob));
 return assetUrls.get(asset.id)!;
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    if (typeof indexedDB === "undefined") { reject(new Error("Este navegador no permite almacenamiento local IndexedDB.")); return; }
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{ request.result.createObjectStore("documents"); request.result.createObjectStore("assets",{keyPath:"id"}); };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error ?? new Error("No se pudo abrir el almacenamiento local."));
    request.onblocked=()=>reject(new Error("Cerrá otras pestañas del editor para habilitar el almacenamiento."));
  });
}
async function read<T>(store:string,key?:string):Promise<T> {
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
   const tx=db.transaction(store,"readonly");const request=key===undefined?tx.objectStore(store).getAll():tx.objectStore(store).get(key);
   let result:T; request.onsuccess=()=>{result=request.result;};
   tx.oncomplete=()=>{db.close();resolve(result);};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error??new Error("No se pudieron leer los datos locales."));};
 });
}
async function write(store:string, entries: [unknown,string?][], assetIds:string[] = []) {
 const db=await openDatabase();
 return new Promise<void>((resolve,reject)=>{
   let tx:IDBTransaction;
   try { tx=db.transaction(assetIds.length ? [store,"assets"] : store,"readwrite"); }
   catch(error) { db.close();reject(error);return; }
   let failure:unknown;
   tx.oncomplete=()=>{db.close();resolve();};
   tx.onabort=tx.onerror=()=>{db.close();reject(failure??tx.error??new Error("No se pudo guardar. Revisá el espacio disponible del navegador."));};
   const abort=(error:unknown)=>{
     failure=error;
     // An injected/browser failure may already have aborted the transaction.
     try { tx.abort(); } catch { /* onabort still reports the original failure. */ }
   };
   const put=()=>{
     try {
       for(const [value,key] of entries) { if(key===undefined)tx.objectStore(store).put(value);else tx.objectStore(store).put(value,key); }
     } catch(error) { abort(error); }
   };
   if(!assetIds.length) { put();return; }
   // Resolve references inside the same transaction as the document writes.
   let remaining=assetIds.length;
   for(const id of assetIds) {
     const request=tx.objectStore("assets").get(id);
     request.onsuccess=()=>{
       try {
         if(!request.result) throw new Error("Falta una imagen del contenido local. No se reemplazaron los datos.");
         validateAsset(request.result);
         if(--remaining===0) put();
       } catch(error) { abort(error); }
     };
   }
 });
}
async function hydrate(doc:ContentDocument) {
 const result=validateContent(doc);
 for (const image of Object.values(result.images)) if(image.assetId) {
   if(!assetUrls.has(image.assetId)) {
     const asset=await read<LocalAsset|undefined>("assets",image.assetId);
     if(!asset?.blob)throw new Error("Falta una imagen del contenido local. No se reemplazaron los datos.");
     resolveAssetUrl(asset);
   }
   image.src=assetUrls.get(image.assetId)!;
 }
 return result;
}
function durable(doc:ContentDocument) {
 const result=validateContent(doc);
 for(const image of Object.values(result.images))if(image.assetId) image.src="";
 return result;
}
async function load(key:string) {
 const value=await read<ContentDocument|undefined>("documents",key);
 return value===undefined?cloneContent(defaultContent):hydrate(value);
}
export const loadDraft=()=>load("draft");
export const loadApplied=()=>load("applied");
const referencedAssets=(doc:ContentDocument)=>[...new Set(Object.values(doc.images).flatMap(image=>image.assetId?[image.assetId]:[]))];
export const saveDraft=(doc:ContentDocument)=>{
 const value=durable(doc);
 return write("documents",[[value,"draft"]],referencedAssets(value));
};
export async function applyContent(doc:ContentDocument) {
 const value=durable(doc);
 // Both states are committed atomically, never a success status before transaction completion.
 await write("documents",[[value,"draft"],[value,"applied"]],referencedAssets(value));
 if(typeof window!=="undefined") {
  window.dispatchEvent(new Event("lisi-content-applied"));
  if("BroadcastChannel" in window){const channel=new BroadcastChannel("lisi-content");channel.postMessage("applied");channel.close();}
 }
}
function validateAsset(asset:LocalAsset) {
 if(!asset || typeof asset.id!=="string" || !/^[\w-]{1,100}$/.test(asset.id) || typeof asset.name!=="string" || !Number.isFinite(asset.createdAt) || !(asset.blob instanceof Blob) || asset.blob.type!=="image/webp" || asset.blob.size===0 || asset.blob.size>10*1024*1024 || !Number.isInteger(asset.width) || !Number.isInteger(asset.height) || asset.width<1 || asset.height<1 || Math.max(asset.width,asset.height)>2400) throw new Error("La imagen optimizada no es válida.");
}
export async function saveAsset(asset:LocalAsset) {
 validateAsset(asset);
 await write("assets",[[asset]]);
}
export const listAssets=()=>read<LocalAsset[]>("assets");
