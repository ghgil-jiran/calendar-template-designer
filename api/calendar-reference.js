import { assertInternalAccess, sendError } from '../server/template-persistence.js';

function userServiceOrigin() {
  const value = process.env.USER_SERVICE_ORIGIN?.trim().replace(/\/$/, '');
  if (!value || !/^https:\/\//i.test(value)) {
    throw Object.assign(new Error('Missing USER_SERVICE_ORIGIN'), {
      statusCode: 503,
      code: 'CALENDAR_REFERENCE_NOT_CONFIGURED'
    });
  }
  return value;
}

export default async function handler(request, response) {
  try {
    await assertInternalAccess(request);
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      response.status(405).json({ error: { code: 'bad_request', message: 'GET 요청만 지원합니다.' } });
      return;
    }
    const year = Number(request.query?.year);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      response.status(400).json({ error: { code: 'bad_request', message: 'year는 2000~2100 정수여야 합니다.' } });
      return;
    }
    const upstream = await fetch(`${userServiceOrigin()}/api/calendar/reference?year=${year}`, {
      signal: AbortSignal.timeout(18_000)
    });
    const body = await upstream.text();
    response.statusCode = upstream.status;
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', upstream.headers.get('cache-control') || 'public, s-maxage=3600, stale-while-revalidate=86400');
    response.end(body);
  } catch (error) {
    if (error?.name === 'TimeoutError') {
      response.status(504).json({ error: { code: 'timeout', message: '공공 달력 API 응답 시간이 초과됐습니다.' } });
      return;
    }
    sendError(response, error);
  }
}
