import { handleWorkerSubmit } from '../../server/handlers.mjs';
import { readJsonBody, sendJson } from '../_shared.mjs';

// Worker-only endpoint. Deliberately NOT CORS-enabled (never called
// from a browser) and requires the bearer secret checked inside
// handleWorkerSubmit -- see server/handlers.mjs.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 404, { error: 'not_found' });
  }

  let body;
  try {
    body = readJsonBody(req);
  } catch (e) {
    return sendJson(res, 400, { error: e.message });
  }

  const { status, body: resBody } = await handleWorkerSubmit({ authHeader: req.headers['authorization'], body });
  return sendJson(res, status, resBody);
}
