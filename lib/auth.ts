export function isAdmin(req: Request) {
  const pin = process.env.ADMIN_PIN;
  if (!pin) return true;
  return req.headers.get("x-admin-pin") === pin;
}
