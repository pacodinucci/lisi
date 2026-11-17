import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultContent, contentSlots, validateContent, cloneContent } from '../../src/modules/content/model.ts';

test('default catalog has unique editable text and image slots', () => {
  assert.equal(new Set(contentSlots.map(s => s.id)).size, contentSlots.length);
  assert.ok(contentSlots.some(s => s.kind === 'image'));
  assert.ok(contentSlots.some(s => s.area === 'navbar'));
  assert.ok(contentSlots.some(s => s.area === 'footer'));
  assert.deepEqual(validateContent(defaultContent), defaultContent);
});
test('editing a clone never mutates the initial public content', () => {
  const copy = cloneContent(defaultContent);
  copy.texts['hero.description'] = 'Edited';
  assert.notEqual(defaultContent.texts['hero.description'], 'Edited');
});
test('rejects unsafe links and malformed style/image updates without mutation', () => {
  for (const mutate of [
    doc => { doc.texts['contact.email.href'] = 'javascript:alert(1)'; },
    doc => { doc.styles['hero.description'] = { fontSize: -100 }; },
    doc => { doc.images['hero.image'].src = 'https://evil.example/image.png'; },
    doc => { doc.images['hero.image'].zoom = 100; },
    doc => { doc.images['hero.image'].assetId = 'uploaded'; doc.images['hero.image'].src = ''; doc.images['hero.image'].alt = 'a'.repeat(1001); },
  ]) {
    const doc = cloneContent(defaultContent);
    mutate(doc);
    assert.throws(() => validateContent(doc));
  }
  assert.deepEqual(validateContent(defaultContent), defaultContent);
});
