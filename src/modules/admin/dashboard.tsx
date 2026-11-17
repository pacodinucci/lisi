"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, FileText, FolderOpen, Menu, PanelLeftClose, Save, Settings2, SlidersHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption, NativeSelectOptGroup } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TooltipProvider } from "@/components/ui/tooltip";
import { contentSlots, defaultContent, validateContent, type ContentDocument, type ContentSlot } from "../content/model";
import { applyContent, loadDraft, saveDraft } from "../content/storage";
import { createSaveQueue, flushAndApply } from "./editor-state";
import { TextPanel } from "./text-panel";
import { ImagePanel } from "./image-panel";
const defaultTheme={primary:"#3f8fd1",navy:"#111b3b",gold:"#d0aa3e"};
type Theme=typeof defaultTheme;
const areas=[['landing','Landing'],['navbar','Navbar'],['footer','Footer']] as const;
const devices=[['1440','Desktop'],['768','768'],['390','390'],['375','375'],['320','320']];
const errorMessage=(error:unknown)=>error instanceof Error?error.message:"No se pudo guardar el contenido local.";
export function ContentDashboard() {
 const [doc,setDoc]=useState<ContentDocument>(defaultContent);
 const [loaded,setLoaded]=useState(false);const [loadError,setLoadError]=useState("");
 const [status,setStatus]=useState("");const [saveError,setSaveError]=useState("");
 const [area,setArea]=useState<ContentSlot['area']>('landing');const [selectedId,setSelectedId]=useState('hero.description');
 const [device,setDevice]=useState('1440');const [panelOpen,setPanelOpen]=useState(true);const [mobilePanel,setMobilePanel]=useState(false);const [mobileNav,setMobileNav]=useState(false);const [navOpen,setNavOpen]=useState(true);
 const [contentOpen,setContentOpen]=useState(false);
 const [settings,setSettings]=useState(false);const [theme,setTheme]=useState<Theme>(defaultTheme);
 const [adjusting,setAdjusting]=useState<string>();const [overflow,setOverflow]=useState<string[]>([]);const [applying,setApplying]=useState(false);
 const iframe=useRef<HTMLIFrameElement>(null);const latest=useRef(doc);const revision=useRef(0);const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [enqueue]=useState(()=>createSaveQueue());const saveState=useRef('');
 const style={"--primary":theme.primary,"--ring":theme.gold,"--sidebar-primary":theme.primary,"--admin-navy":theme.navy,"--admin-gold":theme.gold} as CSSProperties;
 const slots=useMemo(()=>[...contentSlots.filter(s=>s.area===area),...doc.inserted.filter(b=>!doc.deleted.includes(b.id)&&contentSlots.some(s=>s.id===b.afterId&&s.area===area)).map(b=>({id:b.id,label:b.content.slice(0,50)||'Texto agregado',section:'Textos agregados',area,kind:'text' as const,multiline:true}))],[doc.inserted,doc.deleted,area]);
 const slot=slots.find(s=>s.id===selectedId)??slots[0];const index=slots.findIndex(s=>s.id===slot?.id);
 const select=useCallback((id:string)=>{
  const direct=contentSlots.find(s=>s.id===id);const extra=latest.current.inserted.find(b=>b.id===id);const anchor=extra?contentSlots.find(s=>s.id===extra.afterId):undefined;
  if(direct||anchor){setArea((direct??anchor)!.area);setSelectedId(id);setAdjusting(undefined);setSettings(false);}
 },[]);
 useEffect(()=>{
  let active=true;
  void loadDraft().then(value=>{if(active){latest.current=value;setDoc(value);setLoaded(true);setStatus('Borrador local cargado.');}}).catch(error=>{if(active)setLoadError(errorMessage(error));});
  // Read browser-only preferences after hydration, without synchronously cascading an effect render.
  void Promise.resolve().then(()=>{
   if(!active)return;
   try {const saved=JSON.parse(localStorage.getItem('lisi-admin-theme')??'null');if(saved&&Object.keys(defaultTheme).every(key=>/^#[\da-f]{6}$/i.test(saved[key])))setTheme(saved);}catch{/* Defaults remain usable without theme storage. */}
  });
  return()=>{active=false;};
 },[]);
 const update=useCallback((next:ContentDocument)=>{
  saveState.current='pending';latest.current=next;revision.current+=1;setDoc(next);setStatus('Cambios pendientes de guardado.');setSaveError('');
 },[]);
 useEffect(()=>{
  if(!loaded||revision.current===0)return;
  const snapshot=doc;const currentRevision=revision.current;
  timer.current=setTimeout(()=>{
   void enqueue(()=>saveDraft(snapshot)).then(()=>{if(revision.current===currentRevision){saveState.current='saved';setStatus('Borrador guardado en este navegador.');setSaveError('');}}).catch(error=>{if(revision.current===currentRevision){saveState.current='error';setSaveError(errorMessage(error));}});
  },500);
  return()=>clearTimeout(timer.current);
 },[doc,loaded,enqueue]);
 useEffect(()=>{
  const warn=(event:BeforeUnloadEvent)=>{if(revision.current>0&&saveState.current!=='saved'){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
 },[]);
 const send=useCallback(()=>iframe.current?.contentWindow?.postMessage({type:'lisi-content',content:latest.current,selectedId,adjustingImageId:adjusting},window.location.origin),[selectedId,adjusting]);
 useEffect(()=>{send();},[doc,send]);
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{
   if(event.origin!==window.location.origin||event.source!==iframe.current?.contentWindow)return;
   if(event.data?.type==='lisi-preview-ready')send();
   if(event.data?.type==='lisi-select'&&typeof event.data.id==='string')select(event.data.id);
   if(event.data?.type==='lisi-overflow'&&Array.isArray(event.data.ids))setOverflow(event.data.ids.filter((id:unknown)=>typeof id==='string'));
   if(event.data?.type==='lisi-image-position'&&event.data.id===adjusting){
    const {id,cropX,cropY}=event.data;
    if(Number.isFinite(cropX)&&Number.isFinite(cropY)&&latest.current.images[id])update({...latest.current,images:{...latest.current.images,[id]:{...latest.current.images[id],cropX:Math.max(0,Math.min(100,cropX)),cropY:Math.max(0,Math.min(100,cropY))}}});
   }
  };
  window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
 },[send,select,adjusting,update]);
 async function apply() {
  if(!loaded||applying)return;
  if(overflow.length){setSaveError('Hay texto que excede el ancho en esta vista. Ajustalo antes de aplicar.');return;}
  clearTimeout(timer.current);setApplying(true);setSaveError('');
  const snapshot=latest.current;const currentRevision=revision.current;
  try {validateContent(snapshot);await enqueue(()=>flushAndApply(snapshot,saveDraft,applyContent));if(revision.current===currentRevision){saveState.current='saved';setStatus('Aplicado localmente. La web pública de este navegador ya usa estos cambios.');setSaveError('');}}
  catch(error){if(revision.current===currentRevision){saveState.current='error';setStatus('No se pudieron aplicar los cambios.');setSaveError(errorMessage(error));}}finally{setApplying(false);}
 }
 function changeTheme(next:Theme){setTheme(next);try{localStorage.setItem('lisi-admin-theme',JSON.stringify(next));}catch{setSaveError('El tema se cambió, pero no pudo guardarse para la próxima visita.');}}
 const navigation=<>
  <SidebarHeader><div className="admin-brand">LISI <span>& CO</span></div><Badge variant="secondary">Gestión local</Badge></SidebarHeader>
  <SidebarContent><SidebarGroup><SidebarGroupLabel>Gestión</SidebarGroupLabel><SidebarMenu>
   <SidebarMenuItem>
    <SidebarMenuButton aria-label="Contenido" title="Contenido" isActive={!settings} aria-expanded={contentOpen} onClick={()=>{setContentOpen(open=>!navOpen||!open);setNavOpen(true);setSettings(false);}}><FolderOpen/><span>Contenido</span><ChevronDown className="admin-content-chevron"/></SidebarMenuButton>
    <div className="admin-content-submenu" data-open={contentOpen} inert={!contentOpen} aria-hidden={!contentOpen}><div className="admin-content-submenu-inner"><SidebarMenuSub>
     {areas.map(([id,label])=><SidebarMenuSubItem key={id}><SidebarMenuSubButton render={<button type="button"/>} isActive={!settings&&area===id} onClick={()=>{setArea(id);setSelectedId(contentSlots.find(s=>s.area===id)!.id);setSettings(false);setMobileNav(false);setAdjusting(undefined);}}><FileText/><span>{label}</span></SidebarMenuSubButton></SidebarMenuSubItem>)}
    </SidebarMenuSub></div></div>
   </SidebarMenuItem>
   <SidebarMenuItem><SidebarMenuButton aria-label="Configuración" title="Configuración" isActive={settings} onClick={()=>{setSettings(true);setMobileNav(false);}}><Settings2/><span>Configuración</span></SidebarMenuButton></SidebarMenuItem>
  </SidebarMenu></SidebarGroup></SidebarContent>
  <SidebarFooter><Separator/><Button variant="ghost" aria-label="Ver sitio web" title="Ver sitio web" nativeButton={false} render={<a href="/" target="_blank" rel="noopener noreferrer"/>}><ExternalLink data-icon="inline-start"/><span>Ver sitio web</span></Button><p className="admin-small">Sin infraestructura externa.<br/>Los cambios pertenecen a este navegador.</p></SidebarFooter>
 </>;
 const slotPicker=<Field className="admin-slot-picker"><FieldLabel className="sr-only" htmlFor="slot-picker">Elemento a editar</FieldLabel><NativeSelect id="slot-picker" value={slot?.id??''} onChange={e=>select(e.target.value)}>{[...new Set(slots.map(s=>s.section))].map(section=><NativeSelectOptGroup key={section} label={section}>{slots.filter(s=>s.section===section).map(s=><NativeSelectOption key={s.id} value={s.id}>{s.label}</NativeSelectOption>)}</NativeSelectOptGroup>)}</NativeSelect></Field>;
 const panel=<><div className="admin-selector"><Button variant="ghost" size="icon-sm" aria-label="Elemento anterior" disabled={!loaded||applying} onClick={()=>select(slots[(index-1+slots.length)%slots.length].id)}><ChevronLeft/></Button><div className="min-w-0 flex-1 text-center"><p className="truncate">{slot?.label}</p><small>{index+1} de {slots.length}</small></div><Button variant="ghost" size="icon-sm" aria-label="Elemento siguiente" disabled={!loaded||applying} onClick={()=>select(slots[(index+1)%slots.length].id)}><ChevronRight/></Button><Button className="admin-apply" disabled={!loaded||applying||overflow.length>0} onClick={()=>void apply()}><Save data-icon="inline-start"/>{applying?'Aplicando…':'Aplicar local'}</Button></div>
 <div className="admin-selection-heading"><span>{slot?.kind==='image'?'IMAGEN SELECCIONADA':slot?.kind==='link'?'ENLACE SELECCIONADO':'TEXTO SELECCIONADO'}</span>{slotPicker}</div>
 <div className="admin-status" role="status" aria-live="polite">{status}</div>
 {saveError?<Alert variant="destructive"><AlertDescription>{saveError}</AlertDescription></Alert>:null}
 {overflow.length?<Alert><AlertDescription>{overflow.length} texto(s) exceden el ancho de esta vista.</AlertDescription></Alert>:null}
 <fieldset disabled={!loaded||applying} className="admin-control-fieldset">{loaded&&slot?(slot.kind==='image'?<ImagePanel key={slot.id} value={doc.images[slot.id]} onChange={image=>update({...latest.current,images:{...latest.current.images,[slot.id]:image}})} adjusting={adjusting===slot.id} onAdjust={()=>setAdjusting(adjusting?undefined:slot.id)}/>:<TextPanel doc={doc} slot={slot} onChange={next=>{saveState.current='pending';update(next);}} onSelect={select}/>):<Skeleton className="h-80 m-4"/>}</fieldset></>;
 return <TooltipProvider><div className="admin-app" style={style}><SidebarProvider defaultOpen><div className="admin-layout">
 <div className="admin-desktop-nav" data-open={navOpen}><Sidebar collapsible="none">{navigation}</Sidebar></div>
 <main className="admin-main"><header className="admin-header"><Button variant="ghost" size="icon-sm" aria-label="Alternar navegación" aria-expanded={navOpen} className="admin-desktop-toggle" onClick={()=>setNavOpen(!navOpen)}><PanelLeftClose/></Button><Button variant="ghost" size="icon-sm" aria-label="Abrir navegación" className="admin-mobile-toggle" onClick={()=>setMobileNav(true)}><Menu/></Button><span>{settings?'Configuración':`Contenido / ${areas.find(([id])=>id===area)?.[1]}`}</span><Badge variant="outline">Solo local · Sin autenticación</Badge><Button variant={panelOpen?'default':'outline'} size="sm" className="admin-desktop-toggle" onClick={()=>setPanelOpen(!panelOpen)}><SlidersHorizontal data-icon="inline-start"/>{panelOpen?'Cerrar panel de edición':'Abrir panel de edición'}</Button><Button variant="outline" size="icon-sm" className="admin-mobile-toggle" aria-label="Abrir panel de edición" onClick={()=>setMobilePanel(true)}><Settings2/></Button></header>
 {loadError?<Alert variant="destructive"><AlertDescription>{loadError} La edición está deshabilitada para proteger el contenido guardado.</AlertDescription></Alert>:null}
 {settings?<div className="admin-settings"><Card><CardHeader><CardTitle>Personalización</CardTitle><CardDescription>Colores del administrador. No modifican la identidad de la web pública.</CardDescription></CardHeader><CardContent><FieldGroup>{([['primary','Celeste principal'],['navy','Azul oscuro'],['gold','Dorado']] as const).map(([key,label])=><Field key={key}><FieldLabel htmlFor={`theme-${key}`}>{label}</FieldLabel><Input id={`theme-${key}`} type="color" value={theme[key]} onChange={e=>changeTheme({...theme,[key]:e.target.value})}/></Field>)}<Button variant="outline" onClick={()=>changeTheme(defaultTheme)}>Restablecer colores de Lisi</Button></FieldGroup></CardContent></Card></div>:<div className="admin-workspace"><Card className="admin-preview-card"><CardHeader><CardTitle className="admin-preview-title"><span>Editor de contenido</span><div className="admin-preview-actions"><ToggleGroup size="sm" variant="outline" aria-label="Ancho de vista previa" value={[device]} onValueChange={values=>{if(values[0])setDevice(values[0]);}}>{devices.map(([width,label])=><ToggleGroupItem key={width} value={width} aria-label={`Vista ${label}`}>{label}</ToggleGroupItem>)}</ToggleGroup><a className={buttonVariants({variant:'outline',size:'sm'})} href="/" target="_blank" rel="noopener noreferrer" aria-label="Preview de landing"><ExternalLink data-icon="inline-start"/>Preview de landing</a></div></CardTitle><CardDescription className="sr-only">Vista previa real de la página y selector de elementos editables.</CardDescription></CardHeader><CardContent className="admin-preview-content"><div className="admin-preview-scroll"><iframe ref={iframe} src="/admin/preview" title="Vista previa editable de Lisi" onLoad={send} style={{width:Number(device)}}/></div></CardContent></Card>{panelOpen?<aside className="admin-editor-desktop" aria-label="Panel de edición">{panel}</aside>:null}</div>}
 </main></div>
 <Sheet open={mobileNav} onOpenChange={setMobileNav}><SheetContent side="left" className="admin-app admin-mobile-nav" style={style}><SheetHeader><SheetTitle>Navegación</SheetTitle><SheetDescription>Gestión del contenido de Lisi.</SheetDescription></SheetHeader>{navigation}</SheetContent></Sheet>
 <Sheet open={mobilePanel} onOpenChange={setMobilePanel}><SheetContent side="right" className="admin-app admin-mobile-editor" style={style}><SheetHeader><SheetTitle>Panel de edición</SheetTitle><SheetDescription>Edición de contenido e imágenes, solo en este navegador.</SheetDescription></SheetHeader><div className="admin-mobile-editor-body">{panel}</div></SheetContent></Sheet>
 </SidebarProvider></div></TooltipProvider>;
}
