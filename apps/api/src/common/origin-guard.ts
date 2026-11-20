import type { Request, Response, NextFunction } from 'express';

/** Require a same-origin browser request for state-changing cookie-authenticated calls. */
export function enforceWriteOrigin(req: Request, res: Response, next: NextFunction) {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) return next();
  if (!req.cookies?.proativa_session) return next(); // Bearer integrations do not use cookies.
  const allowed = new Set((process.env.WEB_ORIGIN || 'http://localhost:8080').split(',').map(v => v.trim()).filter(Boolean));
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  let source: string | undefined;
  try { source = origin || (referer ? new URL(referer).origin : undefined); } catch { source = undefined; }
  if (!source || !allowed.has(source)) return res.status(403).json({ message: 'Origem nao autorizada para esta operacao' });
  return next();
}
