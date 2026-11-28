(() => {
    'use strict';

    const yearLayouts = {wide:'초대형 연도', split:'두 줄 연도', tiles:'숫자 네 칸', megaTiles:'초대형 숫자 네 칸', crop:'가장자리에서 잘리는 연도', label:'중앙 라벨'};
    const yearFills = {solid:'굵은 채움', outline:'윤곽선', mixed:'채움과 윤곽 혼합', photo:'숫자 안에 사진'};
    const yearPresets = [['wide','solid'],['split','mixed'],['tiles','solid'],['crop','outline'],
        ['label','solid'],['wide','photo'],['tiles','photo'],['megaTiles','outline'],['megaTiles','photo']];
    const usesDigitTiles = layout => layout === 'tiles' || layout === 'megaTiles';

    const digitPaths = {
        0: 'M50 12C25 12 18 30 18 50S25 88 50 88 82 70 82 50 75 12 50 12Z',
        1: 'M28 29 53 12V88M29 88H77',
        2: 'M17 31C18 6 81 3 81 31 81 48 55 60 39 69L18 88H83',
        3: 'M19 18C47 4 79 12 79 32 79 45 64 50 49 49 69 49 83 55 83 69 83 90 40 95 17 81',
        4: 'M63 12 17 62H83M64 12V88',
        5: 'M79 12H26L19 50C42 34 83 41 83 65 83 88 46 97 17 80',
        6: 'M76 17C47 2 18 24 18 61 18 99 82 98 82 65 82 39 38 36 19 58',
        7: 'M17 12H83L39 88',
        8: 'M50 12C16 12 14 46 50 49 90 52 96 88 50 88 4 88 10 52 50 49 86 46 84 12 50 12Z',
        9: 'M24 83C53 98 82 76 82 39 82 1 18 2 18 35 18 61 62 64 81 42'
    };


    const oversizedDigitPaths = {
        2:'M8 48Q2 36 8 22Q17 5 51 4L137 4Q176 4 185 27Q195 56 173 71Q158 80 102 89Q70 94 62 101L163 99Q188 99 188 115Q188 127 170 127H23Q6 127 5 111Q2 86 29 74Q45 67 104 57Q128 53 133 47Q123 41 99 43L30 54Q15 57 8 48Z',
        0:'M10 25Q19 5 54 5L145 4Q174 4 183 29Q194 63 185 100Q180 126 149 127H41Q9 127 6 102Q1 61 10 25Z M78 48Q77 37 94 37Q111 37 113 49L114 81Q114 93 96 94Q77 94 77 81Z',
        7:'M8 27Q8 5 35 5H161Q187 5 188 28L188 53Q187 65 179 76L135 121Q121 134 102 122L76 107Q65 100 77 89L111 58H26Q7 58 6 43Z'
    };
    let yearShapeId = 0;
    function renderOversizedYear(cover, design, year, fill, {yearPhoto, escapeHtml}) {
        const id = 'year-shape-' + ++yearShapeId;
        const shapes = [...year].map((digit,index) => {
            const transform = `translate(${index%2*200} ${Math.floor(index/2)*134})`;
            return `<path d="${oversizedDigitPaths[digit]}" transform="${transform}" fill-rule="evenodd" clip-rule="evenodd"/>`;
        });
        const image = (index,x,y,width,height,clip) => {
            const {src,x:alignX,y:alignY,zoom} = yearPhoto(cover,index);
            if (!src) return '';
            const scale = zoom/100;
            return `<image href="${escapeHtml(src)}" x="${x-(scale-1)*width*alignX/100}" y="${y-(scale-1)*height*alignY/100}"
                width="${width*scale}" height="${height*scale}" preserveAspectRatio="${alignX<34?'xMin':alignX>66?'xMax':'xMid'}${alignY<34?'YMin':alignY>66?'YMax':'YMid'} slice" clip-path="url(#${clip})"/>`;
        };
        const photos = fill === 'photo';
        const separate = photos && design.yearPhotoMode === 'digits';
        return `<svg class="cover-year-shapes" viewBox="0 0 394 269" preserveAspectRatio="none" role="img" aria-label="${year}">
            <defs><clipPath id="${id}">${shapes.join('')}</clipPath>
            ${separate ? shapes.map((shape,index)=>`<clipPath id="${id}-${index}">${shape}</clipPath>`).join('') : ''}</defs>
            ${shapes.map((shape,index)=>`<g fill="${fill==='outline'||(fill==='mixed'&&index<2)?'none':photos?'var(--accent)':'currentColor'}">${shape}</g>`).join('')}
            ${separate ? shapes.map((_,index)=>image(index+1,index%2*200,Math.floor(index/2)*134,194,134,id+'-'+index)).join('') : photos ? image(0,0,0,394,269,id) : ''}
            ${fill==='solid' ? '' : `<g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round">${(fill==='mixed'?shapes.slice(0,2):shapes).join('')}</g>`}
        </svg>`;
    }

    function renderYearTypography(cover, design, {yearPhoto, escapeHtml}) {
        const layout = Object.hasOwn(yearLayouts,design.yearLayout) ? design.yearLayout : 'label';
        const fill = Object.hasOwn(yearFills,design.yearFill) ? design.yearFill : 'solid';
        const year = '2027';
        const title = String(cover.title ?? '').trim();
        const includesYear = title.includes(year);
        const caption = layout === 'label' ? title : title.replace(/\b2027\b/g,'').trim();
        const parts = usesDigitTiles(layout) ? [...year] : [year.slice(0,2),year.slice(2)];
        const digits = fill === 'photo' && usesDigitTiles(layout) && design.yearPhotoMode === 'digits';
        const imageStyle = index => {
            const {src,x,y,zoom} = yearPhoto(cover,index);
            return src ? `background-image:url(${escapeHtml(src)});background-position:${x}% ${y}%;background-size:${zoom === 100 ? 'cover' : zoom+'% auto'}` : '';
        };
        const sharedImage = fill === 'photo' && !digits ? imageStyle(0) : '';
        const yearMarkup = layout === 'megaTiles' ? renderOversizedYear(cover,design,year,fill,{yearPhoto,escapeHtml}) : layout === 'label' && includesYear && fill === 'solid' ? '' : `
            <div class="cover-year-glyphs${sharedImage ? ' has-year-image' : ''}" aria-label="${year}" style="${sharedImage}">
                ${parts.map((part,index) => {
                    const digitImage = digits ? imageStyle(index+1) : '';
                    return `<span aria-hidden="true" class="${digitImage ? 'has-year-image' : ''}" style="${digitImage}">${part}</span>`;
                }).join('')}
            </div>`;
        const cleanCaption = yearMarkup && includesYear ? title.replace(/\b2027\b/g,'').trim() : caption;
        return `<div class="cover-year-design year-layout-${layout} year-fill-${fill}">
            ${yearMarkup}
            <div class="cover-year-caption"><span>CALENDAR</span>
            ${cleanCaption ? `<strong>${escapeHtml(cleanCaption)}</strong>` : ''}
            ${cover.cover_subtitle ? `<small>${escapeHtml(cover.cover_subtitle)}</small>` : ''}</div>
        </div>`;
    }


    function recommendYearStyle(variation) {
        const [yearLayout, yearFill] = yearPresets[variation % yearPresets.length];
        return {yearLayout, yearFill, yearPhotoMode: usesDigitTiles(yearLayout) ? 'digits' : 'single'};
    }

    function renderNumericCover(item, design, {numericCanvas, escapeHtml}) {
        const { width, height, artworkHeight } = numericCanvas;
        const { year, digits, stroke, round, orbit, form, font } = design.yearArt || {};
        const hex = value => /^#[\da-f]{6}$/i.test(value);
        if (!Number.isInteger(year) || !Array.isArray(digits) || digits.map(digit => digit?.digit).join('') !== String(year)
            || ![design.paper, design.ink, design.accent].every(hex)
            || ![stroke, orbit].every(Number.isFinite)
            || !digits.every(digit => Object.hasOwn(digitPaths, digit.digit) && hex(digit.color)
                && [digit.x, digit.y, digit.width, digit.height].every(Number.isFinite))) return '';
        const end = round ? 'round' : 'butt';
        const fontFamily = font === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif';
        const art = digits.map(digit => {
            const glyph = form === 'font'
                ? `<text x="50" y="87" text-anchor="middle" font-family="${fontFamily}" font-size="101" font-weight="700" textLength="72" lengthAdjust="spacingAndGlyphs" fill="${digit.color}">${digit.digit}</text>`
                : `<path d="${digitPaths[digit.digit]}" fill="none" stroke="${digit.color}" stroke-width="${stroke}" stroke-linecap="${end}" stroke-linejoin="${round ? 'round' : 'bevel'}"/>`;
            return `<g transform="translate(${digit.x} ${digit.y}) scale(${digit.width / 100} ${digit.height / 100})">${glyph}</g>`;
        }).join('');
        const background = design.background === 'geometry'
            ? `<circle cx="${orbit}" cy="108" r="106" fill="${design.accent}" opacity=".12"/>`
            : design.background === 'band'
                ? `<path d="M0 208L${width} ${Math.round(orbit / 3)}V${artworkHeight}H0Z" fill="${design.accent}" opacity=".1"/>`
                : '';
        const color = design.background === 'texture'
            ? `background:linear-gradient(135deg,${design.paper},color-mix(in srgb,${design.paper} 88%,${design.accent}));`
            : `background:${design.paper};`;
        return `<div class="relative h-full w-full overflow-hidden" style="container-type:inline-size;${color}color:${design.ink}">
            <svg class="absolute inset-0 block h-full w-full" viewBox="0 0 ${width} ${height}" role="img" aria-label="${year}" data-year-art>${background}${art}</svg>
            <div class="absolute inset-x-[5%] bottom-[5%] flex items-end justify-between gap-3">
                <div class="min-w-0">
                    <h3 class="truncate font-semibold leading-tight" style="font-size:3.7cqw">${escapeHtml(item.title)}</h3>
                    <p class="truncate leading-tight" style="font-size:2.6cqw">${escapeHtml(item.cover_subtitle || '')}</p>
                </div>
                <span class="shrink-0 font-mono tracking-widest" style="font-size:2.4cqw">CALENDAR</span>
            </div></div>`;
    }


    window.ACDLDesignerYearStyle = Object.freeze({yearLayouts, yearFills, digitPaths, usesDigitTiles, recommendYearStyle, renderYearTypography, renderNumericCover});
})();
