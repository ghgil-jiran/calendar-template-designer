import type {TemplateCard} from '../api/contracts';
// Signed package images already identify the saved preview; never rewrite their query.
export function largePreviewUrl(page:TemplateCard['pages'][number]):string|null{
 if(page.largeImageUrl)return page.largeImageUrl;
 const url=page.imageUrl;
 if(url?.startsWith('/api/workspace/previews/'))return url+(url.includes('?')?'&':'?')+'size=large';
 return url;
}
