import { handleResult } from '../../server/handlers.mjs';
import { applyCors, getClientIp, sendJson, handleOptions } from '../_shared.mjs';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  applyCors(req, res);

  if (req.method !== 'GET') {
    return sendJson(res, 404, { error: 'not_found' });
  }

  const id = req.query.id;
  const ip = getClientIp(req);
  const { status, body: resBody } = await handleResult({ id, ip });
  return sendJson(res, status, resBody);
}
