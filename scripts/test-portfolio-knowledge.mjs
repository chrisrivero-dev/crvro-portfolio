#!/usr/bin/env node
import assert from 'node:assert/strict';
import { DESTINATIONS, matchQuery } from '../src/data/portfolioNavigator.js';

const cases = [
  ['What is Zarvin One?', 'single', ['zarvin-one']],
  ['Show me Zarvin One', 'single', ['zarvin-one']],
  ['Can I try Zarvin One?', 'single', ['zarvin-demo']],
  ['Show me the guided tour', 'single', ['zarvin-guided-tour']],
  ["What's the difference between Hermes and Zarvin One?", 'multi', ['zarvin-one', 'openclaw']],
  ['What AI projects has Christopher built?', 'multi', ['zarvin-one', 'openclaw', 'sidecar']],
  ['Show me Sidecar', 'single', ['sidecar']],
  ['Show me Hermes', 'single', ['openclaw']],
  ['Show me Help Nearby', 'single', ['help-nearby']],
  ['Show me GroundRules', 'single', ['groundrules']],
];

for (const [question, kind, keys] of cases) {
  const result = matchQuery(question);
  assert.equal(result.kind, kind, `${question}: expected ${kind}, got ${result.kind}`);
  assert.deepEqual(result.results.map((item) => item.key), keys, `${question}: wrong destinations`);
  console.log(`PASS ${question} -> ${keys.join(', ')}`);
}

assert.equal(DESTINATIONS['zarvin-one'].href, '/projects/zarvin-one');
assert.equal(DESTINATIONS['zarvin-demo'].href, 'https://zarvin-one-mobile.expo.app/');
assert.equal(DESTINATIONS['zarvin-guided-tour'].href, 'https://zarvin-one-mobile.expo.app/guided-demo');
console.log('PASS Zarvin destination registry');
