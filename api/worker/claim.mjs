import { handleWorkerClaim } from '../../server/handlers.mjs';
import { sendJson } from '../_shared.mjs';

// Worker-only endpoint. Deliberately NOT CORS-enabled (never called
// from a browser) -- the browser must never be able to reach this
// successfully, and it can't: it has no worker secret, checked inside
// handleWorkerClaim (see server/handlers.mjs).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 404, { error: 'not_found' });
  }
  const { status, body } = await handleWorkerClaim({ authHeader: req.headers['authorization'] });
  return sendJson(res, status, body);
}
