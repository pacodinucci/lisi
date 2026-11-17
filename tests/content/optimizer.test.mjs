import { test } from 'node:test';
import assert from 'node:assert/strict';
import { optimizeImageForUpload } from '../../src/modules/content/optimize-image.ts';
test('converts to WebP, caps at 2400 and tries descending quality without enlarging',async()=>{
 let canvas;const qualities=[];
 globalThis.createImageBitmap=async()=>({width:4800,height:2400,close(){}});
 globalThis.document={createElement(){return canvas={width:0,height:0,getContext(){return {drawImage(){}}},toBlob(cb,type,quality){qualities.push(quality);cb(new Blob(['webp'],{type}));}}}};
 const output=await optimizeImageForUpload(new File(['png'],'photo.png',{type:'image/png'}));
 assert.equal(output.type,'image/webp');assert.equal(output.name,'photo.webp');assert.equal(canvas.width,2400);assert.equal(canvas.height,1200);assert.deepEqual(qualities,[.84]);
 globalThis.createImageBitmap=async()=>({width:200,height:100,close(){}});
 await optimizeImageForUpload(new File(['png'],'small.png',{type:'image/png'}));assert.equal(canvas.width,200);
});
test('rejects decode failures and exhausts quality cascade while closing bitmaps',async()=>{
 const input=new File(['png'],'large.png',{type:'image/png'});
 globalThis.createImageBitmap=async()=>{throw new Error('Decode failed');};
 await assert.rejects(optimizeImageForUpload(input), /Decode failed/);
 let closed=0;const qualities=[];
 globalThis.createImageBitmap=async()=>({width:2400,height:1200,close(){closed++;}});
 globalThis.document={createElement(){return {getContext(){return {drawImage(){}}},toBlob(cb,type,quality){qualities.push(quality);cb(new Blob([new Uint8Array(10*1024*1024+1)],{type}));}}}};
 await assert.rejects(optimizeImageForUpload(input), /por debajo de 10 MB/);
 assert.deepEqual(qualities,[.84,.72,.6,.5]);assert.equal(closed,1);
});
test('rejects unsupported input and encoders that return non-WebP',async()=>{
 await assert.rejects(optimizeImageForUpload(new File(['svg'],'x.svg',{type:'image/svg+xml'})));
 globalThis.document={createElement(){return {getContext(){return {drawImage(){}}},toBlob(cb){cb(new Blob(['png'],{type:'image/png'}))}}}};
 await assert.rejects(optimizeImageForUpload(new File(['png'],'x.png',{type:'image/png'})));
});
