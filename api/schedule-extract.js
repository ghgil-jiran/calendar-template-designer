import { assertInternalAccess, sendError } from '../server/template-persistence.js';

export const config = { api: { bodyParser: false } };

const MAX_FILE_BYTES = 10 * 1024 * 1024 + 1024 * 1024;

function userServiceOrigin() {
  const value = process.env.USER_SERVICE_ORIGIN?.trim().replace(/\/$/, '');
  if (!value || !/^https:\/\//i.test(value)) {
    throw Object.assign(new Error('Missing USER_SERVICE_ORIGIN'), {
      statusCode: 503,
      code: 'SCHEDULE_API_NOT_CONFIGURED'
    });
  }
  return value;
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_FILE_BYTES) {
      throw Object.assign(new Error('Schedule file too large'), {
        statusCode: 413,
        code: 'FILE_TOO_LARGE'
      });
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(request, response) {
  try {
    await assertInternalAccess(request);
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      response.status(405).json({ error: { code: 'bad_request', message: 'POST 요청만 지원합니다.' } });
      return;
    }

    const contentType = String(request.headers['content-type'] || '');
    if (!contentType.includes('multipart/form-data')) {
      response.status(400).json({ error: { code: 'bad_request', message: '일정 파일을 multipart/form-data로 전송해야 합니다.' } });
      return;
    }

    const upstream = await fetch(`${userServiceOrigin()}/api/ai/schedule-extract`, {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: await readBody(request),
      signal: AbortSignal.timeout(58_000)
    });
    const body = await upstream.text();
    response.statusCode = upstream.status;
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(body);
  } catch (error) {
    if (error?.name === 'TimeoutError') {
      response.status(504).json({ error: { code: 'timeout', message: '공통 일정 추출 API 응답 시간이 초과됐습니다.' } });
      return;
    }
    sendError(response, error);
  }
}
