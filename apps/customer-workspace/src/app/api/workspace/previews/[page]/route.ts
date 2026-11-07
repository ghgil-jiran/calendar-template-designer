import previews from '@/server/review-previews';
export const runtime = 'nodejs';
export async function GET(_request: Request, {params}: {params: Promise<{page: string}>}) {
  const {page} = await params;
  if (!/^(?:[1-9]|1[0-9]|2[0-8])$/.test(page)) return new Response('Not found', {status: 404});
  const encoded = previews[Number(page) - 1];
  if (!encoded) return new Response('Not found', {status: 404});
  return new Response(Buffer.from(encoded, 'base64'), {headers: {
    'Content-Type': 'image/jpeg',
    'Cache-Control': 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff'
  }});
}
