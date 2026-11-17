"use client";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cloneContent, type ContentDocument, type ContentSlot, type TextStyle } from "../content/model";
import { moveInserted } from "./editor-state";

type Props={doc:ContentDocument;slot:ContentSlot;onChange:(doc:ContentDocument)=>void;onSelect:(id:string)=>void};
export function TextPanel({doc,slot,onChange,onSelect}:Props) {
 const block=doc.inserted.find(b=>b.id===slot.id);const value=block?.content??doc.texts[slot.id]??"";
 const style=block?.style??doc.styles[slot.id]??{};
 const update=(text:string)=>{const next=cloneContent(doc);const extra=next.inserted.find(b=>b.id===slot.id);if(extra)extra.content=text;else next.texts[slot.id]=text;onChange(next);};
 const updateStyle=(key:keyof TextStyle,value:string|number|undefined)=>{const next=cloneContent(doc);const extra=next.inserted.find(b=>b.id===slot.id);const target=extra?extra.style:(next.styles[slot.id]??={});if(value===undefined)delete target[key];else Object.assign(target,{[key]:value});onChange(next);};
 return <div className="admin-fields"><div className="admin-panel-title"><span>{slot.kind==="link"?"Enlace seleccionado":"Texto seleccionado"}</span>{block?<div className="flex gap-1"><Button size="icon-sm" variant="ghost" aria-label="Subir texto" onClick={()=>onChange({...doc,inserted:moveInserted(doc.inserted,slot.id,-1)})}><ArrowUp/></Button><Button size="icon-sm" variant="ghost" aria-label="Bajar texto" onClick={()=>onChange({...doc,inserted:moveInserted(doc.inserted,slot.id,1)})}><ArrowDown/></Button><Button size="icon-sm" variant="destructive" aria-label="Eliminar texto agregado" onClick={()=>{onChange({...doc,inserted:doc.inserted.filter(b=>b.id!==slot.id),deleted:doc.deleted.filter(id=>id!==slot.id)});onSelect(block.afterId);}}><Trash2/></Button></div>:null}</div>
 <FieldGroup>
  <Field><FieldLabel htmlFor="content-value">{slot.kind==="link"?"Destino del enlace":"Contenido"}</FieldLabel>{slot.multiline||block?<Textarea id="content-value" rows={6} value={value} onChange={e=>update(e.target.value)}/>:<Input id="content-value" value={value} onChange={e=>update(e.target.value)}/>}</Field>
  {slot.kind!=="link"?<>
  <Field><FieldLabel htmlFor="text-font">Fuente</FieldLabel><NativeSelect id="text-font" value={style.fontFamily??"inherit"} onChange={e=>updateStyle("fontFamily",e.target.value)}><NativeSelectOption value="inherit">Default</NativeSelectOption><NativeSelectOption value="var(--font-syne)">Syne</NativeSelectOption><NativeSelectOption value="var(--font-inter)">Inter</NativeSelectOption><NativeSelectOption value="Arial, sans-serif">Arial</NativeSelectOption><NativeSelectOption value="Georgia, serif">Georgia</NativeSelectOption></NativeSelect></Field>
  <Field><FieldLabel htmlFor="text-color">Color</FieldLabel><Input id="text-color" value={style.color??""} placeholder="#111b3b" onChange={e=>updateStyle("color",e.target.value||undefined)}/><ToggleGroup aria-label="Paleta de texto" value={style.color?[style.color]:[]} onValueChange={values=>{if(values[0])updateStyle("color",values[0]);}}>{["#111b3b","#3f8fd1","#d0aa3e","#ffffff","#1d315b"].map(color=><ToggleGroupItem key={color} value={color} aria-label={`Usar color ${color}`}><span className="admin-swatch" style={{backgroundColor:color}}/></ToggleGroupItem>)}</ToggleGroup></Field>
  <Field><FieldLabel htmlFor="text-size">Tamaño</FieldLabel><div className="flex items-center gap-3"><Slider aria-label="Tamaño de texto" min={10} max={120} value={[style.fontSize??slot.defaultSize??16]} onValueChange={values=>updateStyle("fontSize",Array.isArray(values)?values[0]:values)}/><Input id="text-size" className="w-20" type="number" min={10} max={160} value={style.fontSize??""} placeholder="Default" onChange={e=>updateStyle("fontSize",e.target.value?Number(e.target.value):undefined)}/></div></Field>
  <FieldGroup className="admin-two-fields"><Field><FieldLabel htmlFor="text-weight">Peso</FieldLabel><NativeSelect id="text-weight" value={style.fontWeight??""} onChange={e=>updateStyle("fontWeight",e.target.value?Number(e.target.value):undefined)}>{[["","Default"],[300,"Light"],[400,"Regular"],[500,"Medium"],[600,"Semibold"],[700,"Bold"]].map(([v,l])=><NativeSelectOption key={v} value={v}>{l}</NativeSelectOption>)}</NativeSelect></Field>
  <Field><FieldLabel htmlFor="text-align">Alineación</FieldLabel><NativeSelect id="text-align" value={style.textAlign??""} onChange={e=>updateStyle("textAlign",e.target.value||undefined)}>{[["","Default"],["left","Izquierda"],["center","Centro"],["right","Derecha"],["justify","Justificado"]].map(([v,l])=><NativeSelectOption key={v} value={v}>{l}</NativeSelectOption>)}</NativeSelect></Field></FieldGroup>
  <FieldGroup className="admin-two-fields"><Field><FieldLabel htmlFor="text-leading">Interlineado</FieldLabel><Input id="text-leading" type="number" min={.8} max={3} step={.05} value={style.lineHeight??""} placeholder="Default" onChange={e=>updateStyle("lineHeight",e.target.value?Number(e.target.value):undefined)}/></Field><Field><FieldLabel htmlFor="text-tracking">Tracking</FieldLabel><Input id="text-tracking" type="number" min={-10} max={40} step={.1} value={style.letterSpacing??""} placeholder="Default" onChange={e=>updateStyle("letterSpacing",e.target.value?Number(e.target.value):undefined)}/></Field></FieldGroup>
  {!block?<Button variant="outline" onClick={()=>{const id=`extra-${crypto.randomUUID()}`;onChange({...doc,inserted:[...doc.inserted,{id,afterId:slot.id,content:"Nuevo texto",style:{}}]});onSelect(id);}}><Plus data-icon="inline-start"/>Agregar texto</Button>:null}
  </>:null}
 </FieldGroup></div>;
}
