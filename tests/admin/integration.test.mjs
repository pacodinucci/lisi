import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as editor from '../../src/modules/admin/editor-state.ts';

test('apply flushes the draft before apply, preserving it when apply fails', async () => {
 const writes=[]; const snapshot={text:'nuevo'};
 await assert.rejects(editor.flushAndApply(snapshot,async doc=>writes.push(['draft',doc]),async()=>{throw Error('apply failed')}),/apply failed/);
 assert.deepEqual(writes,[['draft',snapshot]]);
});
test('failed draft flush prevents apply; successful apply retains operation order', async () => {
 const writes=[];
 await assert.rejects(editor.flushAndApply('x',async()=>{throw Error('quota')},async()=>writes.push('apply')),/quota/);
 assert.deepEqual(writes,[]);
 await editor.flushAndApply('x',async doc=>writes.push(['draft',doc]),async doc=>writes.push(['apply',doc]));
 assert.deepEqual(writes,[['draft','x'],['apply','x']]);
});
test('drag positions update locally throughout a gesture and notify once on release', () => {
 const updates=[];const messages=[];
 const drag=editor.createImageDrag(position=>updates.push(position),position=>messages.push(position));
 drag.start({id:'image',x:10,y:10,cropX:50,cropY:50,width:100,height:100});
 drag.move(30,20);drag.move(40,30);
 assert.deepEqual(updates,[{id:'image',cropX:30,cropY:40},{id:'image',cropX:20,cropY:30}]);
 assert.deepEqual(messages,[]);drag.end();drag.end();
 assert.deepEqual(messages,[{id:'image',cropX:20,cropY:30}]);
 drag.start({id:'image',x:0,y:0,cropX:50,cropY:50,width:100,height:100});
 drag.move(999,-999);drag.cancel();drag.end();
 assert.deepEqual(updates.at(-1),{id:'image',cropX:0,cropY:100});
 assert.equal(messages.length,1);
});
test('image upload preserves metadata and rejects decode/storage failures before returning an asset',async()=>{
 const calls=[];const optimized={name:'new.webp'};
 const deps={optimize:async()=>optimized,decode:async()=>({width:10,height:20,close(){calls.push('close')}}),save:async asset=>calls.push(asset),id:()=> 'id',now:()=>123};
 const asset=await editor.prepareImageUpload({},deps);
 assert.deepEqual(asset,{id:'id',name:'new.webp',blob:optimized,width:10,height:20,createdAt:123});
 assert.deepEqual(calls,['close',asset]);calls.length=0;
 await assert.rejects(editor.prepareImageUpload({},{...deps,decode:async()=>{throw Error('decode')}}),/decode/);
 assert.deepEqual(calls,[]);
 await assert.rejects(editor.prepareImageUpload({},{...deps,save:async()=>{throw Error('quota')}}),/quota/);
 assert.deepEqual(calls,['close']);calls.length=0;
 await assert.rejects(editor.prepareImageUpload({},{...deps,optimize:async()=>{throw Error('unsupported')}}),/unsupported/);
 assert.deepEqual(calls,[]);
 await assert.rejects(editor.prepareImageUpload({},{...deps,id:()=>{throw Error('id unavailable')}}),/id unavailable/);
 assert.deepEqual(calls,['close']);
});
