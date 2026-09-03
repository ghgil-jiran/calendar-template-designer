function env(name) {
  const value = process.env[name]?.trim();
  if (!value) throw Object.assign(new Error(`Missing ${name}`), { statusCode: 503, code: 'SERVER_NOT_CONFIGURED' });
  return value;
}

function config() {
  return {
    url: env('SUPABASE_URL').replace(/\/$/, ''),
    serviceKey: env('SUPABASE_SERVICE_ROLE_KEY')
  };
}

async function jsonResponse(response, fallbackCode) {
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw Object.assign(new Error(body?.msg || body?.message || fallbackCode), { statusCode: response.status === 400 ? 401 : response.status, code: fallbackCode });
  return body;
}

export function bearerToken(request) {
  const header = String(request.headers?.authorization || request.headers?.Authorization || '').trim();
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw Object.assign(new Error('Sign in required'), { statusCode: 401, code: 'AUTH_REQUIRED' });
  return match[1];
}

export async function verifyMasterAdminToken(accessToken) {
  const { url, serviceKey } = config();
  const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: `Bearer ${accessToken}` } });
  const user = await jsonResponse(userResponse, 'INVALID_SESSION');
  const adminResponse = await fetch(`${url}/rest/v1/template_admins?select=user_id,email,role,active&user_id=eq.${encodeURIComponent(user.id)}&role=eq.master_admin&active=is.true&limit=1`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });
  const admins = await jsonResponse(adminResponse, 'ADMIN_LOOKUP_FAILED');
  if (!admins?.length) throw Object.assign(new Error('Master Admin access required'), { statusCode: 403, code: 'MASTER_ADMIN_REQUIRED' });
  return { id: user.id, email: user.email, role: 'master_admin' };
}

export async function requireMasterAdmin(request) {
  return verifyMasterAdminToken(bearerToken(request));
}

export async function signInMasterAdmin(email, password) {
  const { url, serviceKey } = config();
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: serviceKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const session = await jsonResponse(response, 'INVALID_CREDENTIALS');
  const user = await verifyMasterAdminToken(session.access_token);
  return { user, accessToken: session.access_token, refreshToken: session.refresh_token, expiresIn: session.expires_in };
}

export async function refreshMasterAdmin(refreshToken) {
  const { url, serviceKey } = config();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: serviceKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const session = await jsonResponse(response, 'INVALID_SESSION');
  const user = await verifyMasterAdminToken(session.access_token);
  return { user, accessToken: session.access_token, refreshToken: session.refresh_token, expiresIn: session.expires_in };
}
