import { test } from 'node:test';
import assert from 'node:assert/strict';

test('shared entry point preserves and exposes the content APIs', async () => {
 const api = await import('../../src/modules/content/index.ts');
 for (const name of ['cloneContent','validateContent','isSafeLink','loadDraft','loadApplied','saveDraft','applyContent','saveAsset','listAssets','resolveAssetUrl','optimizeImageForUpload']) assert.equal(typeof api[name], 'function', name);
 assert.deepEqual(api.validateContent(api.defaultContent), api.defaultContent);
 assert.ok(api.contentSlots.length > 0);
 assert.equal(api.IMAGE_UPLOAD_MAX_DIMENSION, 2400);
 assert.equal(api.IMAGE_UPLOAD_MAX_SIZE_BYTES, 10 * 1024 * 1024);
 assert.deepEqual(api.IMAGE_UPLOAD_ACCEPTED_TYPES, ['image/jpeg','image/png','image/webp','image/avif']);
});
