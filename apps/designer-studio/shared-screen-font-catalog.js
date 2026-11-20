/* Shared choices for authoring and customer controls. Keep authored legacy values selectable. */
(function (root) {
  const families = Object.freeze([
    'Pretendard', 'Noto Sans KR', 'Noto Serif KR', 'Nanum Gothic', 'Nanum Myeongjo',
    'Jua', 'KoPub Batang', 'IBM Plex Sans KR', 'IBM Plex Sans', 'Playfair Display',
    'Montserrat', 'Bodoni Moda', 'Bebas Neue', 'DM Sans', 'Arial', 'Times New Roman'
  ]);
  function choices(current) {
    return current && !families.includes(current) ? [current, ...families] : families;
  }
  root.ACDLFontCatalog = Object.freeze({ families, choices });
})(globalThis);
