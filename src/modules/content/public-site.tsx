"use client";
import { useEffect, useState } from "react";
import { defaultContent } from "./model";
import { loadApplied } from "./storage";
import { ContentProvider } from "./render-context";
import { SitePage } from "./site-page";
export function PublicSite() {
 const [content,setContent]=useState(defaultContent);
 useEffect(()=>{
  let active=true;
  const refresh=()=>{void loadApplied().then(doc=>{if(active)setContent(doc);}).catch(error=>console.warn("No se pudo cargar el contenido local; se muestra la versión inicial.",error));};
  refresh();
  const channel="BroadcastChannel" in window?new BroadcastChannel("lisi-content"):null;
  if(channel)channel.onmessage=refresh;
  window.addEventListener("lisi-content-applied",refresh);
  window.addEventListener("focus",refresh);
  return ()=>{active=false;channel?.close();window.removeEventListener("lisi-content-applied",refresh);window.removeEventListener("focus",refresh);};
 },[]);
 return <ContentProvider content={content} editing={false}><SitePage/></ContentProvider>;
}
