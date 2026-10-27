/* Option D, treatment d2: shared geometry, own light grade. */
export { build, target, views } from './env-d.js';
import { makeLighting } from './env-d.js';
export const lighting = makeLighting('d2');
