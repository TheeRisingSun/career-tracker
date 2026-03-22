/**
 * Lightweight request validation helpers.
 * Use before route handlers to validate body/params.
 */
export function requireBodyFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => req.body[f] === undefined || req.body[f] === null);
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }
    next();
  };
}

export function sanitizeString(str, maxLen = 2000) {
  if (str == null) return '';
  const s = String(str).trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export function isValidDateStr(str) {
  if (typeof str !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
