import {NextResponse} from 'next/server';
import {reviewCatalog} from '@/server/review-catalog';
export async function GET() {
  return NextResponse.json(reviewCatalog(), {headers: {'Cache-Control': 'no-store'}});
}
