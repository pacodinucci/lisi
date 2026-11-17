"use client";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { createImageDrag } from "@/modules/admin/editor-state";
import { ContentProvider } from "@/modules/content/render-context";
import { SitePage } from "@/modules/content/site-page";
import { defaultContent, validateContent } from "@/modules/content/model";
export default function ContentPreview() {
 const [content,setContent]=useState(defaultContent);
 const [selectedId,setSelectedId]=useState<string>();
 const adjusting=useRef<string|undefined>(undefined);
 const notify=(message:unknown)=>{if(window.parent!==window)window.parent.postMessage(message,window.location.origin);};
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{
   if(event.origin!==window.location.origin||event.source!==window.parent||event.data?.type!=="lisi-content")return;
   try {setContent(validateContent(event.data.content));setSelectedId(event.data.selectedId);adjusting.current=event.data.adjustingImageId;}catch{/* Ignore invalid preview messages, never persist them. */}
  };
  window.addEventListener("message",receive);notify({type:"lisi-preview-ready"});
  const preventNavigation=(event:MouseEvent)=>{if((event.target as Element).closest("a"))event.preventDefault();};
  document.addEventListener("click",preventNavigation);
  return()=>{window.removeEventListener("message",receive);document.removeEventListener("click",preventNavigation);};
 },[]);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;let active=true;
  const measure=()=>{if(!active)return;clearTimeout(timer);timer=setTimeout(()=>{
   const ids=Array.from(document.querySelectorAll<HTMLElement>("[data-content-id]")).filter(el=>{
    // Screen-reader-only headings are deliberately clipped, not visible overflow.
    if(!el.textContent||el.closest(".sr-only")||el.getAttribute("role")==="img"||el.querySelector("img"))return false;
    const rect=el.getBoundingClientRect();const parent=el.parentElement?.getBoundingClientRect();
    return el.scrollWidth>el.clientWidth+2&&el.clientWidth>0||!!parent&&rect.width>parent.width+2;
   }).map(el=>el.dataset.contentId!);
   notify({type:"lisi-overflow",ids:[...new Set(ids)]});
  },150);};
  const observer=new ResizeObserver(measure);observer.observe(document.body);measure();void document.fonts.ready.then(measure);
  window.addEventListener("resize",measure);
  // Image completion (including decode failure) can change overflow without resizing the body.
  document.addEventListener("load",measure,true);document.addEventListener("error",measure,true);
  return()=>{active=false;observer.disconnect();clearTimeout(timer);window.removeEventListener("resize",measure);document.removeEventListener("load",measure,true);document.removeEventListener("error",measure,true);};
 },[content]);
 useEffect(()=>{
  const el=Array.from(document.querySelectorAll<HTMLElement>("[data-content-id]")).find(el=>el.dataset.contentId===selectedId);
  el?.scrollIntoView({block:"nearest",behavior:"smooth"});
 },[selectedId]);
 const currentImage=useEffectEvent((id:string)=>content.images[id]);
 useEffect(()=>{
  const drag=createImageDrag(({id,cropX,cropY})=>{
   setContent(previous=>({...previous,images:{...previous.images,[id]:{...previous.images[id],cropX,cropY}}}));
  },position=>notify({type:'lisi-image-position',...position}));
  const down=(event:PointerEvent)=>{
   const el=(event.target as Element).closest<HTMLElement>("[data-content-id]");const id=el?.dataset.contentId;
   if(!id||id!==adjusting.current||!el)return;
   const image=currentImage(id);if(!image)return;
   event.preventDefault();el.setPointerCapture(event.pointerId);const rect=el.getBoundingClientRect();
   drag.start({id,x:event.clientX,y:event.clientY,cropX:image.cropX,cropY:image.cropY,width:rect.width,height:rect.height});
  };
  const move=(event:PointerEvent)=>drag.move(event.clientX,event.clientY);
  const up=()=>drag.end();const cancel=()=>drag.cancel();
  document.addEventListener("pointerdown",down);document.addEventListener("pointermove",move);document.addEventListener("pointerup",up);document.addEventListener("pointercancel",cancel);
  return()=>{drag.cancel();document.removeEventListener("pointerdown",down);document.removeEventListener("pointermove",move);document.removeEventListener("pointerup",up);document.removeEventListener("pointercancel",cancel);};
 },[]);
 return <div className="content-preview"><ContentProvider content={content} editing selectedId={selectedId} onSelect={id=>notify({type:"lisi-select",id})}><SitePage/></ContentProvider></div>;
}
