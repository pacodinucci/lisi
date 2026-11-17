"use client";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { defaultContent, type ContentDocument, type ImageValue, type TextStyle } from "./model";

type Context = { content: ContentDocument; editing: boolean; selectedId?: string; onSelect?: (id: string) => void };
const ContentContext = createContext<Context>({ content: defaultContent, editing: false });
export function ContentProvider({children,...value}: Context & {children:ReactNode}) { return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>; }
export const useContent = () => useContext(ContentContext).content;
export function textCss(style?:TextStyle):CSSProperties {
 return style?{...style, display:style.textAlign?"block":undefined, fontSize:style.fontSize===undefined?undefined:`${style.fontSize}px`, letterSpacing:style.letterSpacing===undefined?undefined:`${style.letterSpacing}px`}:{};
}
function selection(id:string,context:Context) {
 return context.editing?{"data-content-id":id,"data-selected":context.selectedId===id||undefined,tabIndex:0,onClick:(event:React.MouseEvent)=>{event.preventDefault();event.stopPropagation();context.onSelect?.(id);},onKeyDown:(event:React.KeyboardEvent)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();context.onSelect?.(id);}}}:{};
}
export function ContentText({id}:{id:string}) {
 const ctx=useContext(ContentContext);const blocks=ctx.content.inserted.filter(b=>b.afterId===id&&!ctx.content.deleted.includes(b.id));
 return <><span {...selection(id,ctx)} style={textCss(ctx.content.styles[id])}>{ctx.content.texts[id]}</span>{blocks.map(block=><span key={block.id} {...selection(block.id,ctx)} style={{display:"block",...textCss(block.style)}}>{block.content}</span>)}</>;
}
const shapeCss=(image:ImageValue):CSSProperties=>{
 const shape=image.frameShape;
 return {borderRadius:shape==="CIRCLE"||shape==="OVAL"?"50%":shape==="IRREGULAR"?"44% 56% 47% 53% / 53% 45% 55% 47%":image.frameRounded?"24px":undefined,
 aspectRatio:shape==="RECTANGLE_HORIZONTAL"?"4 / 3":shape==="RECTANGLE_VERTICAL"||shape==="OVAL"||shape==="IRREGULAR"?"4 / 5":shape==="CIRCLE"||shape==="SQUARE"?"1 / 1":undefined};
};
export function ContentImage({id,className,image=false,width=220,height=80,decorative=false,children}:{id:string;className?:string;image?:boolean;width?:number;height?:number;decorative?:boolean;children?:ReactNode}) {
 const ctx=useContext(ContentContext);const value=ctx.content.images[id];const initial=defaultContent.images[id];
 const changed=JSON.stringify(value)!==JSON.stringify(initial);
 const outer:CSSProperties=changed?{...shapeCss(value),position:!image&&!className?.startsWith("experience-photo")?"relative":undefined,overflow:"hidden",scale:String(value.frameScale)}:{};
 const transform=`scale(${value.zoom}) rotate(${value.rotation}deg)`;
 if(image) return <span {...selection(id,ctx)} className={className} style={{display:"block",...outer}}><Image src={value.src||initial.src} alt={decorative?"":value.alt} width={width} height={height} unoptimized style={{width:"100%",height:changed?"100%":"auto",objectFit:!changed||value.fitMode==="CONTAIN"?"contain":"cover",objectPosition:`${value.cropX}% ${value.cropY}%`,transform:changed?transform:undefined}} /></span>;
 // Preserve the exact CSS background crop until a slot is edited. New media is a separate layer so zoom never moves its container/caption.
 return <div className={className} data-parallax={id==="hero.image"?true:undefined} {...selection(id,ctx)} role="img" aria-label={value.alt} style={changed?{...outer,backgroundImage:"none",isolation:"isolate"}:undefined}>{changed?<span aria-hidden="true" style={{position:"absolute",inset:0,zIndex:-1,backgroundImage:`url("${value.src}")`,backgroundSize:value.fitMode==="CONTAIN"?"contain":"cover",backgroundPosition:`${value.cropX}% ${value.cropY}%`,backgroundRepeat:"no-repeat",transform}}/>:null}{children}</div>;
}
