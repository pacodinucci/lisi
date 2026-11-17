import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSaveQueue, moveInserted } from '../../src/modules/admin/editor-state.ts';
test('save queue serializes saves and apply barriers cannot be overtaken',async()=>{
 const log=[];let release;const queue=createSaveQueue();
 const first=queue(async()=>{log.push('first');await new Promise(r=>{release=r});log.push('first-done')});
 const second=queue(async()=>{log.push('second')});
 await new Promise(r=>setImmediate(r));assert.deepEqual(log,['first']);release();await first;await second;assert.deepEqual(log,['first','first-done','second']);
 await assert.rejects(queue(async()=>{throw Error('quota')}));await queue(async()=>log.push('recovered'));assert.equal(log.at(-1),'recovered');
});
test('moving an added text affects only siblings and preserves content',()=>{
 const blocks=[{id:'a',afterId:'x',content:'A'},{id:'b',afterId:'y',content:'B'},{id:'c',afterId:'x',content:'C'}];
 const moved=moveInserted(blocks,'c',-1);assert.deepEqual(moved.map(b=>b.id),['c','b','a']);assert.deepEqual(blocks.map(b=>b.id),['a','b','c']);
});
