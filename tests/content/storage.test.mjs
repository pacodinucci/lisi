import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { loadDraft, loadApplied, saveDraft, applyContent, saveAsset, listAssets } from '../../src/modules/content/storage.ts';
import { defaultContent, cloneContent } from '../../src/modules/content/model.ts';
beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });
test('draft and applied content persist separately and rejected data changes neither', async () => {
 const doc=cloneContent(defaultContent);doc.texts['hero.description']='Draft changed';
 await saveDraft(doc);
 assert.equal((await loadDraft()).texts['hero.description'],'Draft changed');
 assert.deepEqual(await loadApplied(),defaultContent);
 await applyContent(doc);
 assert.equal((await loadApplied()).texts['hero.description'],'Draft changed');
 const invalid=cloneContent(doc);invalid.texts['contact.email.href']='javascript:bad()';
 await assert.rejects(applyContent(invalid));
 assert.deepEqual(await loadDraft(),doc);assert.deepEqual(await loadApplied(),doc);
});
test('missing image references reject writes without changing either document', async () => {
 const beforeDraft=await loadDraft(), beforeApplied=await loadApplied();
 const doc=cloneContent(beforeDraft);doc.images['hero.image'].assetId='missing-image';doc.images['hero.image'].src='';
 for (const assetId of ['missing-image','invalid/id',42]) {
  doc.images['hero.image'].assetId=assetId;
  for (const save of [saveDraft,applyContent]) {
   await assert.rejects(async()=>save(doc), /Falta una imagen|contenido local no es válido/);
   assert.deepEqual(await loadDraft(),beforeDraft);assert.deepEqual(await loadApplied(),beforeApplied);
  }
 }
});
test('synchronous second-write errors and transaction aborts preserve both documents', async () => {
 const beforeDraft=await loadDraft(), beforeApplied=await loadApplied();
 const doc=cloneContent(beforeDraft);doc.texts['hero.description']='Must not commit';
 const original=IDBObjectStore.prototype.put;
 for (const failure of ['throw','abort']) {
  let count=0;
  IDBObjectStore.prototype.put=function(...args) {
   if(this.name==='documents' && ++count===2) {
    if(failure==='throw') throw new Error('Injected put failure');
    this.transaction.abort();
    throw new Error('Injected abort');
   }
   return original.apply(this,args);
  };
  try { await assert.rejects(applyContent(doc), /Injected|guardar/); }
  finally { IDBObjectStore.prototype.put=original; }
  assert.deepEqual(await loadDraft(),beforeDraft);assert.deepEqual(await loadApplied(),beforeApplied);
 }
});
test('malformed assets reject without changing the asset library', async () => {
 const before=await listAssets();
 for (const change of [{width:NaN},{height:Infinity},{width:1.5},{name:null},{createdAt:NaN},{blob:new Blob([],{type:'image/webp'})}]) {
  await assert.rejects(saveAsset({id:'bad-image',name:'bad.webp',blob:new Blob(['webp'],{type:'image/webp'}),width:200,height:100,createdAt:1,...change}), /imagen optimizada/);
  assert.deepEqual(await listAssets(),before);
 }
});
test('stores binary image assets without localStorage',async()=>{
 await saveAsset({id:'test-image',name:'test.webp',blob:new Blob(['webp'],{type:'image/webp'}),width:200,height:100,createdAt:1});
 const assets=await listAssets();assert.equal(assets[0].id,'test-image');assert.equal(assets[0].blob.type,'image/webp');
 const doc=cloneContent(defaultContent);doc.images['hero.image'].assetId='test-image';doc.images['hero.image'].src='blob:temporary';
 await saveDraft(doc);const draft=await loadDraft();assert.match(draft.images['hero.image'].src,/^blob:/);assert.notEqual(draft.images['hero.image'].src,'blob:temporary');
 await applyContent(draft);assert.deepEqual(await loadApplied(),draft);
});
