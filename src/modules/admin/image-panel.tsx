"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CircleDashed, Images, Move, RotateCcw, RotateCw, SquareDashed, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { defaultContent, type ImageValue } from "../content/model";
import { listAssets, saveAsset, resolveAssetUrl, type LocalAsset } from "../content/storage";
import { optimizeImageForUpload, IMAGE_UPLOAD_ACCEPTED_TYPES } from "../content/optimize-image";
import { prepareImageUpload } from "./editor-state";

const shapes=[['RECTANGLE_HORIZONTAL','Rectángulo horizontal','▭'],['RECTANGLE_VERTICAL','Rectángulo vertical','▯'],['SQUARE','Cuadrado','□'],['OVAL','Ovalado','⬭'],['CIRCLE','Circular','○'],['IRREGULAR','Forma orgánica','◌']] as const;
export function ImagePanel({value,onChange,adjusting,onAdjust}:{value:ImageValue;onChange:(value:ImageValue)=>void;adjusting:boolean;onAdjust:()=>void}) {
 const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [library,setLibrary]=useState(false);
 const [assets,setAssets]=useState<(LocalAsset&{url:string})[]>([]);const [limit,setLimit]=useState(12);
 const assetUrls=useRef<string[]>([]);const active=useRef(false);
 useEffect(()=>{active.current=true;return()=>{active.current=false;assetUrls.current.forEach(url=>URL.revokeObjectURL(url));};},[]);
 useEffect(()=>{
  if(!library)return;let active=true;
  void listAssets().then(items=>{
   if(!active)return;assetUrls.current.forEach(url=>URL.revokeObjectURL(url));
   const resolved=items.sort((a,b)=>b.createdAt-a.createdAt).map(asset=>({...asset,url:URL.createObjectURL(asset.blob)}));
   assetUrls.current=resolved.map(asset=>asset.url);setAssets(resolved);
  }).catch(error=>{if(active)setError(String(error));});return()=>{active=false;};
 },[library]);
 // Selected assets use separately owned URLs; replacing/closing the library never revokes the current image.
 const selectAsset=(asset:LocalAsset)=>{const src=resolveAssetUrl(asset);onChange({...value,src,assetId:asset.id,alt:asset.name,cropX:50,cropY:50,zoom:1,rotation:0});};
 const update=(patch:Partial<ImageValue>)=>onChange({...value,...patch});
 async function upload(file:File) {
  setBusy(true);setError("");
  try {
   const asset=await prepareImageUpload(file,{optimize:optimizeImageForUpload,decode:createImageBitmap,save:saveAsset,id:()=>crypto.randomUUID(),now:Date.now});
   if(active.current){selectAsset(asset);setLibrary(false);}
  }catch(error){if(active.current)setError(error instanceof Error?error.message:"No pudimos cargar la imagen.");}finally{if(active.current)setBusy(false);}
 }
 return <div className="admin-fields"><div className="admin-panel-title">Imagen seleccionada</div>
 <section className="admin-image-thumbnail" aria-label="Miniatura de imagen seleccionada">
  {value.src?<Image src={value.src} alt={value.alt} width={288} height={160} unoptimized/>:<p>Seleccioná una imagen para ver la vista previa.</p>}
 </section>
 <FieldGroup>
  <Field><FieldLabel htmlFor="image-upload"><Upload data-icon="inline-start"/>Subir nueva imagen</FieldLabel><Input id="image-upload" type="file" accept={IMAGE_UPLOAD_ACCEPTED_TYPES.join(',')} disabled={busy} onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file);event.target.value="";}}/><FieldDescription>{busy?"Convirtiendo y guardando imagen…":"Las imágenes se convierten a WebP, hasta 2400 px y 10 MB. Solo se guardan en este navegador."}</FieldDescription></Field>
  <Button variant="outline" disabled={busy} onClick={()=>{setError("");setLibrary(!library);}}><Images data-icon="inline-start"/>{library?"Cerrar biblioteca":"Elegir de Lisi"}</Button>
  {error?<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>:null}
  <Field><FieldLabel htmlFor="image-alt">Texto alternativo</FieldLabel><Input id="image-alt" value={value.alt} onChange={e=>update({alt:e.target.value})}/></Field>
  <Field><FieldLabel>Zoom · {value.zoom.toFixed(1)}×</FieldLabel><Slider aria-label="Zoom" min={1} max={3} step={.1} value={[value.zoom]} onValueChange={values=>update({zoom:Array.isArray(values)?values[0]:values})}/></Field>
  <Field><FieldLabel>Forma del contenedor de imagen</FieldLabel><ToggleGroup className="flex-wrap" value={[value.frameShape]} onValueChange={values=>{if(values[0])update({frameShape:values[0] as ImageValue['frameShape']});}}>{shapes.map(([id,label,icon])=><ToggleGroupItem key={id} value={id} aria-label={label} title={label}>{icon}</ToggleGroupItem>)}</ToggleGroup></Field>
  <Field><FieldLabel>Bordes</FieldLabel><ToggleGroup value={[value.frameRounded?'rounded':'straight']} onValueChange={values=>{if(values[0])update({frameRounded:values[0]==='rounded'});}}><ToggleGroupItem value="rounded" aria-label="Bordes redondeados"><CircleDashed/></ToggleGroupItem><ToggleGroupItem value="straight" aria-label="Bordes rectos"><SquareDashed/></ToggleGroupItem></ToggleGroup></Field>
  <Field><FieldLabel>Ajuste</FieldLabel><ToggleGroup variant="outline" value={[value.fitMode]} onValueChange={values=>{if(values[0])update({fitMode:values[0] as ImageValue['fitMode'],zoom:values[0]==='CONTAIN'?1:value.zoom});}}><ToggleGroupItem value="COVER">Recortar</ToggleGroupItem><ToggleGroupItem value="CONTAIN">Completa</ToggleGroupItem></ToggleGroup></Field>
  <Field><FieldLabel>Tamaño · {Math.round(value.frameScale*100)}%</FieldLabel><Slider aria-label="Tamaño de imagen" min={.5} max={2.5} step={.05} value={[value.frameScale]} onValueChange={values=>update({frameScale:Array.isArray(values)?values[0]:values})}/></Field>
  <Button variant="outline" onClick={()=>update({rotation:(value.rotation+90)%360})}><RotateCw data-icon="inline-start"/>Girar 90°</Button>
  <div className="flex gap-2"><Button variant={adjusting?'default':'outline'} onClick={onAdjust}><Move data-icon="inline-start"/>{adjusting?'Finalizar':'Ajustar'}</Button><Button variant="outline" onClick={()=>update({cropX:50,cropY:50,zoom:1})}><RotateCcw data-icon="inline-start"/>Centrar</Button></div>
  {adjusting?<><Alert><AlertDescription>Arrastrá la imagen directamente en la vista previa. También podés ajustar la posición con estos controles.</AlertDescription></Alert><Field><FieldLabel>Posición horizontal</FieldLabel><Slider aria-label="Posición horizontal" min={0} max={100} value={[value.cropX]} onValueChange={v=>update({cropX:Array.isArray(v)?v[0]:v})}/></Field><Field><FieldLabel>Posición vertical</FieldLabel><Slider aria-label="Posición vertical" min={0} max={100} value={[value.cropY]} onValueChange={v=>update({cropY:Array.isArray(v)?v[0]:v})}/></Field></>:null}
 </FieldGroup>
 {library?<div className="admin-library"><h3>Biblioteca</h3><div className="admin-library-grid">{assets.slice(0,limit).map(asset=><Button key={asset.id} variant="outline" className="admin-library-item" title={asset.name} aria-label={`Elegir ${asset.name}`} onClick={()=>{selectAsset(asset);setLibrary(false);}}><span style={{backgroundImage:`url("${asset.url}")`}}/>{asset.name}</Button>)}{Object.entries(defaultContent.images).map(([id,initial])=><Button key={id} variant="outline" className="admin-library-item" title={initial.alt} aria-label={`Elegir ${initial.alt}`} onClick={()=>{onChange({...value,src:initial.src,assetId:undefined,alt:initial.alt,cropX:50,cropY:50,zoom:1});setLibrary(false);}}><span style={{backgroundImage:`url("${initial.src}")`}}/>{initial.alt}</Button>)}</div>{assets.length>limit?<Button variant="outline" onClick={()=>setLimit(limit+12)}>Cargar más</Button>:null}{assets.length===0?<Empty><EmptyHeader><EmptyTitle>No hay imágenes locales cargadas</EmptyTitle></EmptyHeader></Empty>:null}</div>:null}
 </div>;
}
