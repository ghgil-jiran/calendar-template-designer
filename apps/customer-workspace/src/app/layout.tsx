import type {Metadata} from 'next';
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/600.css';
import '@fontsource/noto-sans-kr/700.css';
import './globals.css';
export const metadata: Metadata = {title: '우리학교달력 · 신규 서비스 검토', description: '디자인을 고르고 학교 자료를 넣어 만드는 학사달력', robots: {index: false, follow: false}};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="ko"><body>{children}</body></html>;
}
