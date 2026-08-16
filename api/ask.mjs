import { handleAsk } from '../server/handlers.mjs';
import { applyCors, getClientIp, readJsonBody, sendJson, handleOptions } from './_shared.mjs';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleOptions(req, res);
  applyCors(req, res);

  if (req.method !== 'POST') {
    return sendJson(res, 404, { error: 'not_found' });
  }

  let body;
  try {
    body = readJsonBody(req);
  } catch (e) {
    const status = e.message === 'payload_too_large' ? 413 : 400;
    return sendJson(res, status, { error: e.message });
  }

  const ip = getClientIp(req);
  const { status, body: resBody } = await handleAsk({ question: body.question, ip });
  return sendJson(res, status, resBody);
}
