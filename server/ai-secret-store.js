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

async function callVaultRpc(name, body = {}) {
  const { url, serviceKey } = config();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const result = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error('Supabase Vault request failed');
    error.statusCode = 502;
    error.code = 'AI_SECRET_STORE_FAILED';
    throw error;
  }
  return result;
}

export async function storeOpenAIKey(apiKey) {
  const secret = String(apiKey || '').trim();
  if (secret.length < 20 || secret.length > 500 || !secret.startsWith('sk-')) {
    throw Object.assign(new Error('올바른 OpenAI API 키를 입력해 주세요.'), { statusCode: 400, code: 'INVALID_OPENAI_API_KEY' });
  }
  await callVaultRpc('set_ai_openai_api_key', { p_secret: secret });
}

export async function readOpenAIKey() {
  const result = await callVaultRpc('get_ai_openai_api_key');
  return typeof result === 'string' ? result.trim() : '';
}

export async function hasOpenAIKey() {
  return Boolean(await readOpenAIKey());
}
