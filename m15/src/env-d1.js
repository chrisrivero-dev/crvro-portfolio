/* Option D, treatment d1: shared geometry, own light grade. */
export { build, target, views } from './env-d.js';
import { makeLighting } from './env-d.js';
export const lighting = makeLighting('d1');
