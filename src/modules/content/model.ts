import { seed, slots } from "./seed";

export type TextStyle = { fontFamily?: string; color?: string; fontSize?: number; fontWeight?: number; textAlign?: "left" | "center" | "right" | "justify"; lineHeight?: number; letterSpacing?: number };
export type ImageValue = { src: string; assetId?: string; alt: string; cropX: number; cropY: number; zoom: number; frameShape: "ORIGINAL" | "RECTANGLE_HORIZONTAL" | "RECTANGLE_VERTICAL" | "SQUARE" | "OVAL" | "CIRCLE" | "IRREGULAR"; frameRounded: boolean; fitMode: "COVER" | "CONTAIN"; frameScale: number; rotation: number };
export type InsertedText = { id: string; afterId: string; content: string; style: TextStyle };
export type ContentDocument = { version: 1; texts: Record<string, string>; styles: Record<string, TextStyle>; images: Record<string, ImageValue>; inserted: InsertedText[]; deleted: string[] };
export type ContentSlot = { id: string; label: string; section: string; area: "landing" | "navbar" | "footer"; kind: "text" | "image" | "link"; multiline?: boolean; defaultSize?: number };
export const defaultContent = seed;
export const contentSlots = slots;
export const cloneContent = (doc: ContentDocument): ContentDocument => structuredClone(doc);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const fail = (): never => { throw new Error("El contenido local no es válido. No se reemplazaron los datos guardados."); };
export function isSafeLink(value: string) {
  return /^(#[\w-]+|\/(?!\/)[^\s]*|https:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[\d\s()-]+)$/.test(value);
}
function validateStyle(style: unknown) {
  if (!record(style)) fail();
  for (const [key,value] of Object.entries(style as Record<string, unknown>)) {
    if (value === undefined) continue;
    if (key === "fontFamily") { if (!["inherit", "var(--font-syne)", "var(--font-inter)", "Arial, sans-serif", "Georgia, serif"].includes(String(value))) fail(); }
    else if (key === "color") { if (typeof value !== "string" || !/^#[\da-f]{6}$/i.test(value)) fail(); }
    else if (key === "textAlign") { if (!["left","center","right","justify"].includes(String(value))) fail(); }
    else {
      const bounds: Record<string, number[]> = {fontSize:[10,160],fontWeight:[300,900],lineHeight:[.8,3],letterSpacing:[-10,40]};
      if (!bounds[key] || typeof value !== "number" || !Number.isFinite(value) || value < bounds[key][0] || value > bounds[key][1]) fail();
    }
  }
}
export function validateContent(input: unknown): ContentDocument {
  if (!record(input) || input.version !== 1 || !record(input.texts) || !record(input.styles) || !record(input.images) || !Array.isArray(input.inserted) || !Array.isArray(input.deleted)) fail();
  const doc = input as unknown as ContentDocument;
  for (const slot of contentSlots) {
    if (slot.kind === "image") {
      const image = doc.images[slot.id];
      if (!record(image) || typeof image.src !== "string" || typeof image.alt !== "string" || image.alt.length > 1000) fail();
      if (!/^\/(?!\/)/.test(image.src) && !(image.assetId && (image.src === "" || image.src.startsWith("blob:")))) fail();
      if (image.assetId !== undefined && (typeof image.assetId !== "string" || !/^[\w-]{1,100}$/.test(image.assetId))) fail();
      for (const [key,min,max] of [["cropX",0,100],["cropY",0,100],["zoom",1,3],["frameScale",.5,2.5],["rotation",0,270]] as const) {
        if (typeof image[key] !== "number" || !Number.isFinite(image[key]) || image[key] < min || image[key] > max) fail();
      }
      if (image.rotation % 90 !== 0 || !["ORIGINAL","RECTANGLE_HORIZONTAL","RECTANGLE_VERTICAL","SQUARE","OVAL","CIRCLE","IRREGULAR"].includes(image.frameShape) || !["COVER","CONTAIN"].includes(image.fitMode) || typeof image.frameRounded !== "boolean") fail();
    } else {
      if (typeof doc.texts[slot.id] !== "string" || doc.texts[slot.id].length > 10000 || (slot.kind === "link" && !isSafeLink(doc.texts[slot.id]))) fail();
    }
  }
  for (const [id,style] of Object.entries(doc.styles)) { if (!contentSlots.some(s=>s.id===id) && !doc.inserted.some(s=>s.id===id)) fail(); validateStyle(style); }
  const ids = new Set<string>();
  for (const block of doc.inserted) {
    if (!record(block) || typeof block.id !== "string" || !/^extra-[\w-]+$/.test(block.id) || ids.has(block.id) || !contentSlots.some(s=>s.id===block.afterId && s.kind==="text") || typeof block.content !== "string" || block.content.length > 10000) fail();
    ids.add(block.id); validateStyle(block.style);
  }
  if (doc.deleted.some(id=>typeof id !== "string" || !doc.inserted.some(b=>b.id===id))) fail();
  return cloneContent(doc);
}
