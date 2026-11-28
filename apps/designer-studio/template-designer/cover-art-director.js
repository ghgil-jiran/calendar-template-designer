(() => {
    'use strict';

    const {recommendYearStyle} = window.ACDLDesignerYearStyle;

    const coverTypes = {"full":"전면 사진형","split":"사진·제목 분할형","center":"여백 있는 중앙 사진형","multi":"여러 사진 배열형","graphic":"사진 + 그래픽형","illustration":"일러스트·도형 중심형","type":"타이포그래피·라벨형","numeric":"숫자형 · 연도 그래픽"};
    const coverLayouts = {
        full:['전면 사진', 'full'], splitTop:['상하 분할', 'split'], splitSide:['좌우 분할','split'],
        center:['중앙 사진','center'], row:['가로 나열','multi'], grid:['2×2 격자','multi'],
        feature:['대표 사진 + 보조 사진','multi'], surround:['중앙 제목 격자','multi'],
        decorated:['중앙 사진 + 주변 그래픽','graphic'], graphicSide:['사진·그래픽 분할','graphic'],
        illustration:['도형·일러스트 중심','illustration'], type:['중앙 타이포그래피·라벨','type'], numeric:['연도 벡터','numeric']
    };
    const coverBackgrounds = { plain:'단색', band:'색 띠·색면', geometry:'기하 도형', pattern:'반복 패턴', theme:'테마 장식', texture:'질감·빛' };
    const coverTitleStyles = { editorial:'제목 중심', year:'연도 강조', stacked:'제목·연도 두 줄' };
    function coverComposition(design) {
        const {layout, photos} = design;
        if (layout === 'numeric') return {layout, photoCount:0, areas:['year-art'], rows:[1]};
        const titleOnly = layout === 'type';
        const singleRow = ['full','splitSide','graphicSide','surround','type'].includes(layout);
        return {layout, photoCount:photos,
            areas:titleOnly ? ['title'] : ['title', layout === 'illustration' ? 'illustration' : 'photos'],
            rows:singleRow ? [1] : ['auto',1],
            ...(['splitSide','graphicSide','feature'].includes(layout) ? {columns:[2,1]} : {}),
            ...(layout === 'surround' ? {gridColumns:3, titleSlot:4} : layout === 'grid' ? {gridColumns:2} : layout === 'row' ? {gridColumns:photos} : {}),
            ...(layout === 'center' ? {photoWidth:2/3} : layout === 'decorated' ? {photoWidth:3/4} : {})};
    }

    function withComposition(design) {
        return {...design, composition:coverComposition(design)};
    }

    function resolveCoverComposition(design) {
        const expected = coverComposition(design);
        return JSON.stringify(design.composition) === JSON.stringify(expected) ? design.composition : expected;
    }

    function recommendCover(values, variation = 0, seen = []) {
        const brief = [values.title, values.description, values.direction].filter(Boolean).join(' ');
        if (values.coverType === 'numeric' || (!values.coverType && /숫자형|숫자로\s*표현|연도\s*(그래픽|조형)/.test(brief))) {
            if (values.coverCount && Number(values.coverCount) !== 0) {
                throw new Error('숫자형 표지는 사진 장수를 자동 또는 0장으로 지정해 주세요.');
            }
            return withComposition(recommendNumericCover(2027, [values.title, values.description].filter(Boolean).join(' '), values.direction, seen, values.numericOptions, values.previousYearAsset));
        }
        const child = /어린이|성장|유아|놀이|키즈|발랄|경쾌/.test(brief);
        const family = /가족|세대|부모님|손주|추억/.test(brief);
        const quiet = /차분|기록|고급|클래식|전통|기념/.test(brief);
        const corporate = /기업|브랜드|기념판|타이포|로고/.test(brief);
        const graphic = /도형|일러스트|캐릭터|벡터|그래픽/.test(brief);
        const themeDecoration = /꽃|숲|계절|자연|성장|어린이/.test(brief);
        const noPhoto = /사진\s*(없이|없는|없음)|무사진|0\s*(장|컷)/.test(brief);
        const countMatch = brief.match(/(?:사진|이미지)\s*(?:은|는)?\s*([0-9]+)\s*(?:장|컷)/);
        const count = values.coverCount !== '' && values.coverCount != null ? Number(values.coverCount)
            : noPhoto ? 0 : countMatch ? Number(countMatch[1]) : null;
        const locked = values.coverType || '';
        const zeroType = ['illustration','type'].includes(locked);
        if (count !== null && ![0,1,2,3,4,8].includes(count)) throw new Error('표지 사진 수는 0~4장 또는 8장으로 지정해 주세요.');
        if (locked && count !== null && (zeroType ? count !== 0 : locked === 'multi' ? count < 2 : count !== 1)) {
            throw new Error('표지 구성과 사진 장수가 맞지 않습니다. 예를 들어 여러 사진 배열형은 2장 이상을 사용합니다.');
        }
        const type = locked || (count === 0 ? corporate ? 'type' : 'illustration'
            : count > 1 ? 'multi' : count === 1 ? child || graphic ? 'graphic' : /풍경|여행|전면/.test(brief) ? 'full' : 'split'
            : corporate ? 'type' : graphic && !child ? 'illustration' : child ? 'graphic' : family ? 'multi'
            : /풍경|여행/.test(brief) ? 'full' : 'center');
        const photos = count ?? (['illustration','type'].includes(type) ? 0 : type === 'multi' ? 4 : 1);
        const pick = options => options[variation % options.length];
        const layout = type === 'split' ? pick(/좌우|오른쪽/.test(brief) ? ['splitSide'] : /상하|하단|상단/.test(brief) ? ['splitTop'] : ['splitSide','splitTop'])
            : type === 'graphic' ? pick(['decorated','graphicSide'])
            : type === 'multi' ? photos === 8 ? 'surround' : /대표|주인공|보조/.test(brief) ? 'feature'
                : /2\s*[×xX]\s*2/.test(brief) ? (photos === 4 ? 'grid' : 'feature')
                : pick(photos === 4 ? ['grid','feature','row'] : ['row','feature'])
            : type;
        const palettes = /따뜻|포근|아이보리/.test(brief) || family
            ? [['#F8F1E4','#29483C','#C7A47C'],['#F5E6DC','#623F38','#A95E4C'],['#F4EFDE','#454329','#829270']]
            : child ? [['#FFF3D5','#253A60','#EF955C'],['#E7F6F3','#244B66','#55AFA5'],['#FFF1F1','#603649','#E5859C']]
            : [['#F6F4EE','#263F48','#79A0A2'],['#E8F0F8','#25395D','#7795B5'],['#F3EEE7','#383233','#8B746C']];
        const additionalPalettes = [['#F2EDE4','#41372F','#A86953'],['#EDF1E8','#304738','#789066'],
            ['#F2EAF1','#4B3349','#9E7091'],['#E8EFF0','#284750','#528D98']];
        const [paper, ink, accent] = [...palettes, ...additionalPalettes][variation % 7];
        const background = type === 'full' ? 'plain' : pick(type === 'illustration'
            ? themeDecoration ? ['theme','geometry','pattern'] : ['geometry','pattern','band']
            : child ? ['band','pattern','geometry'] : graphic ? ['geometry','theme','band'] : quiet ? ['plain','texture','band'] : ['plain','band','texture']);
        const serif = /명조|세리프/.test(brief) || (!/고딕|산세리프/.test(brief) && (quiet || family) && variation % 3 !== 1);
        const direction = values.direction || '';
        const titleBrief = direction + ' ' + [values.title, values.description].join(' ');
        const explicitTitleStyle = text => /연도\s*(강조|크게)|숫자\s*강조/.test(text) ? 'year'
            : /두\s*줄|분리/.test(text) ? 'stacked' : /제목\s*(강조|중심|크게)/.test(text) ? 'editorial' : null;
        const titleStyle = explicitTitleStyle(direction) || explicitTitleStyle(titleBrief) ||
            pick(type === 'type' ? ['year','stacked','editorial'] : type === 'split' ? ['stacked','editorial','year'] : ['editorial','stacked','year']);
        const yearStyle = type === 'type' ? recommendYearStyle(variation) : {};
        return withComposition({type,layout,photos,background,paper,ink,accent,serif,titleStyle,
            ...yearStyle,
            reason: type === 'multi' ? '여러 장면을 한 면에 모아 주제의 흐름을 보여줍니다.'
                : type === 'full' ? '대표 장면을 표지 전체로 펼쳐 첫인상을 만듭니다.'
                : type === 'illustration' ? '사진 없이 도형과 장식으로 주제를 표현합니다.'
                : type === 'type' ? '제목과 연도를 중심에 두고 여백을 살립니다.'
                : type === 'graphic' ? '사진을 중심에 두고 색과 장식으로 테마를 드러냅니다.'
                : '사진과 제목이 각각 잘 읽히도록 공간을 배분합니다.'});
    }

    function recommendCoverAlternatives(values, selected, variation = 0, seen = []) {
        const history = [...seen, selected.yearArt?.digits].filter(Boolean);
        const habitCompositions = ['grid','check','dots'];
        const requestedHabit = /점|원형/.test(values.direction) ? 'dots'
            : /격자|그리드/.test(values.direction) ? 'grid'
            : /큰 체크|굵은 체크/.test(values.direction) ? 'check' : null;
        const currentHabit = selected.habitComposition || 'grid';
        const alternatives = habitCompositions.filter(composition => composition !== currentHabit);
        if (requestedHabit && alternatives.includes(requestedHabit)) {
            alternatives.splice(alternatives.indexOf(requestedHabit), 1);
            alternatives.unshift(requestedHabit);
        }
        const previousYearAssets = [selected.yearArt?.assetId].filter(Boolean);
        return [1,2].map((offset, index) => {
            const design = recommendCover({...values, coverType:selected.type, coverCount:selected.photos, previousYearAsset:previousYearAssets},
                variation + offset, history);
            if (design.yearArt) {
                history.push(design.yearArt.digits);
                if (design.yearArt.assetId) previousYearAssets.push(design.yearArt.assetId);
            }
            if (values.preset === 'habits') design.habitComposition = alternatives[index];
            return design;
        });
    }

    // The designer currently uses a 4:3 desk-cover canvas and a 2027 calendar.
    const numericCanvas = { width: 400, height: 300, artworkHeight: 246 };
    function composeNumericDigits(year) {
        const { width, artworkHeight } = numericCanvas;
        const digits = String(year).split('');
        const stacked = Math.random() < 0.4;
        const columns = stacked ? Math.ceil(digits.length / 2) : digits.length;
        const rows = Math.ceil(digits.length / columns);
        const glyphWidth = 84;
        const glyphHeight = 100;
        const gap = 12;
        const rowGap = 8;
        const blockWidth = columns * glyphWidth + (columns - 1) * gap;
        const blockHeight = rows * glyphHeight + (rows - 1) * rowGap;
        const scale = Math.min(width * 0.92 / blockWidth, artworkHeight * 0.98 / blockHeight)
            * (0.72 + Math.random() * 0.28);
        const align = [0.12, 0.5, 0.88][Math.floor(Math.random() * 3)];
        const left = (width - blockWidth * scale) * align;
        const top = (artworkHeight - blockHeight * scale) * (0.15 + Math.random() * 0.7);

        return digits.map((digit, index) => ({
            digit, fill: index,
            x: Math.round(left + (index % columns) * (glyphWidth + gap) * scale),
            y: Math.round(top + Math.floor(index / columns) * (glyphHeight + rowGap) * scale),
            width: Math.round(glyphWidth * scale), height: Math.round(glyphHeight * scale)
        }));
    }

    function recommendNumericCover(year, brief, direction = '', seen = [], options = {}, previousYearAsset) {
        const pick = options => options[Math.floor(Math.random() * options.length)];
        const distance = (a, b) => a.reduce((sum, digit, index) => {
            const other = b[index];
            return sum + Math.hypot(digit.x - other.x, digit.y - other.y,
                digit.width - other.width, digit.height - other.height);
        }, 0) / a.length;
        const history = seen.filter(candidate => candidate?.length === String(year).length);
        let best = null;
        let separation = -1;
        for (let attempt = 0; attempt < 72; attempt++) {
            const candidate = composeNumericDigits(year);
            const nearest = history.reduce((minimum, previous) => Math.min(minimum, distance(candidate, previous)), Infinity);
            if (nearest > separation) {
                best = candidate;
                separation = nearest;
            }
            if (nearest >= 14) break;
        }
        const warm = [['#FFF4E4','#512F2C','#A33E2A','#75471B','#375B48'], ['#FCEBDC','#5B263E','#944233','#4C5033','#385693']];
        const cool = [['#F1F4FF','#162B55','#3349A5','#285D54','#91402C'], ['#EAF4ED','#123F3A','#35549A','#785227','#852F62']];
        const temperatureOf = text => /따뜻|포근|아이보리/.test(text) ? warm
            : /차분|차갑|시원/.test(text) ? cool : null;
        const [paper, ink, accent, third, fourth] = pick(temperatureOf(direction) ?? temperatureOf(brief)
            ?? [...warm, ...cool, ['#181F32','#F4F2E0','#FFAA94','#A1DED9','#BFC4FC']]);
        const backgroundOf = text => /배경\s*(없|없이)/.test(text) ? 'plain'
            : /그라데이션|색 변화/.test(text) ? 'texture'
            : /도형\s*배경/.test(text) ? 'geometry' : null;
        const background = backgroundOf(direction) ?? backgroundOf(brief) ?? pick(['plain','band','geometry','texture']);
        const colorPreference = ['mono','pair','digit'].includes(options.color) ? options.color : 'auto';
        const formPreference = ['vector','font'].includes(options.form) ? options.form : 'auto';
        const colorModeOf = text => /단색/.test(text) ? 'mono' : /숫자별/.test(text) ? 'digit' : null;
        const colorMode = colorPreference === 'auto'
            ? colorModeOf(direction) ?? colorModeOf(brief) ?? pick(['mono','mono','pair','digit'])
            : colorPreference;
        const preferredPath = window.VisualStylist.recommendYearVector(direction || brief, previousYearAsset);
        const form = formPreference === 'auto' ? (preferredPath.assetId === 'split-flap' ? 'vector' : pick(['vector','font'])) : formPreference;
        const font = /명조|세리프/.test(direction) ? 'serif' : pick(['sans','serif']);
        const palette = [ink, accent, third, fourth];
        const pathStyle = form === 'vector' ? preferredPath : {stroke:16, round:false};
        const digits = best.map(({ fill, ...digit }) => ({
            ...digit,
            color: colorMode === 'mono' ? ink : colorMode === 'pair' ? (fill < best.length / 2 ? ink : accent)
                : palette[fill % palette.length]
        }));
        return { type:'numeric', layout:'numeric', photos:0, background, paper, ink, accent, titleStyle:'year',
            yearArt: { year, digits, ...pathStyle, form, font, colorMode, preferences: {color:colorPreference, form:formPreference}, orbit: Math.round(Math.random() * numericCanvas.width) } };
    }

    function renderRecommendedCover(item, theme, {escapeHtml, illustrationSource, illustrationPlaceholder, yearPhoto}) {
        if (theme?.type === 'numeric') return window.ACDLDesignerYearStyle.renderNumericCover(item, theme, {numericCanvas, escapeHtml});
        if (!theme || !Object.hasOwn(coverLayouts, theme.layout) || !Object.hasOwn(coverBackgrounds, theme.background) ||
            ![0,1,2,3,4,8].includes(theme.photos) || ![theme.paper,theme.ink,theme.accent].every(color => /^#[\da-f]{6}$/i.test(color))) return '';
        const frame = n => '<div class="relative grid min-h-0 min-w-0 place-items-center overflow-hidden border border-current/20 bg-white/35 text-[9px]">' +
            (n === 1 && illustrationSource(item.illustration_image) ? '<img class="absolute inset-0 h-full w-full object-cover" src="' + escapeHtml(item.illustration_image) + '" alt="표지 이미지">' : illustrationPlaceholder(n - 1, theme.accent)) + '</div>';
        const titleStyle = Object.hasOwn(coverTitleStyles, theme.titleStyle) ? theme.titleStyle : 'editorial';
        const compactTitle = ['splitSide','graphicSide','surround'].includes(theme.layout);
        const titleSize = compactTitle ? '5cqw' : String(item.title ?? '').length > 22 ? '5cqw' : '7cqw';
        const name = '<h3 class="font-semibold leading-tight" style="font-size:' + (titleStyle === 'year' ? '4cqw' : titleSize) + '">' + escapeHtml(item.title) + '</h3>';
        const subtitle = typeof item.cover_subtitle === 'string' && item.cover_subtitle.trim()
            ? '<p class="leading-tight" style="font-size:2.5cqw">' + escapeHtml(item.cover_subtitle) + '</p>' : '';
        const year = '<span class="leading-none" style="font-size:' + (titleStyle === 'year' ? (compactTitle ? '9cqw' : '14cqw') : '4.5cqw') + '">2027</span>';
        const label = '<span class="font-sans tracking-[0.16em]" style="font-size:2.15cqw">CALENDAR</span>';
        const heading = titleStyle === 'year' ? year + label + name + subtitle
            : titleStyle === 'stacked' ? name + year + label + subtitle
            : '<span class="font-sans tracking-[0.16em]" style="font-size:2.15cqw">2027 CALENDAR</span>' + name + subtitle;
        const title = '<div class="relative z-10 grid min-w-0 gap-1 break-words" data-cover-title-style="' + titleStyle + '">' + heading + '</div>';
        const composition = resolveCoverComposition(theme);
        const frames = Array.from({length:composition.photoCount}, (_,i) => frame(i+1));
        const columns = composition.columns?.map(track => track + 'fr').join(' ');
        const grid = (columns, contents) => '<div class="grid min-h-0 gap-1" style="grid-template-columns:repeat(' + columns + ',minmax(0,1fr))">' + contents.join('') + '</div>';
        let body;
        switch (composition.layout) {
            case 'full': body = '<div class="absolute inset-0 grid">' + frames[0] + '</div><div class="absolute bottom-4 left-4 max-w-[80%] bg-white/90 p-2">' + title + '</div>'; break;
            case 'splitSide':
            case 'graphicSide': body = '<div class="grid min-h-0 items-center gap-3" style="grid-template-columns:' + columns + '"><div class="grid h-full">' + frames[0] + '</div>' + title + '</div>'; break;
            case 'surround': body = grid(composition.gridColumns,[...frames.slice(0,composition.titleSlot),'<div class="grid place-items-center text-center">' + title + '</div>',...frames.slice(composition.titleSlot)]); break;
            case 'feature': body = title + '<div class="grid min-h-0 gap-1" style="grid-template-columns:' + columns + '">' + frames[0] + grid(1,frames.slice(1)) + '</div>'; break;
            case 'row': body = title + grid(composition.gridColumns,frames); break;
            case 'grid': body = title + grid(composition.gridColumns,frames); break;
            case 'illustration': body = title + (illustrationSource(item.illustration_image) ? frame(1) : '<div aria-hidden="true" class="grid grid-cols-3 items-center gap-2 opacity-80"><span class="aspect-square rounded-full" style="background:var(--accent)"></span><span class="aspect-square rotate-12 rounded-lg bg-current"></span><span class="aspect-square rounded-t-full border-4 border-current"></span></div>'); break;
            case 'type':
                if (theme.yearLayout) { body = window.ACDLDesignerYearStyle.renderYearTypography(item,theme,{yearPhoto,escapeHtml}); break; }
                body = '<div class="self-center justify-self-center rounded border border-current p-4 text-center">' + title + '</div>'; break;
            case 'center': body = title + '<div class="mx-auto grid" style="width:' + composition.photoWidth * 100 + '%">' + frames[0] + '</div>'; break;
            case 'decorated': body = title + '<div class="mx-auto grid border-4 border-white/70" style="width:' + composition.photoWidth * 100 + '%">' + frames[0] + '</div>'; break;
            default: body = title + frames[0];
        }
        const backgrounds = {
            plain:'none', band:'linear-gradient(0deg,var(--accent) 22%,transparent 22%)',
            geometry:'linear-gradient(140deg,var(--accent) 21%,transparent 21%)',
            pattern:'radial-gradient(var(--accent) 1px,transparent 1px)',
            theme:'radial-gradient(ellipse at 12% 22%,var(--accent) 0 8%,transparent 9%),radial-gradient(ellipse at 88% 80%,var(--accent) 0 9%,transparent 10%)',
            texture:'linear-gradient(125deg,transparent 28%,#ffffff77 28% 42%,transparent 42% 66%,#ffffff66 66% 79%,transparent 79%)'
        };
        return '<div class="relative grid h-full w-full min-h-0 gap-2 overflow-hidden p-4 ' + (theme.serif ? 'font-serif' : 'font-sans') + (theme.type === 'type' && theme.yearLayout === 'crop' ? ' cover-year-crop' : '') +
            '" style="--year-ink:' + theme.ink + ';--accent:' + theme.accent + ';container-type:inline-size;background-color:' + theme.paper + ';color:' + theme.ink + ';background-image:' +
            backgrounds[theme.background] + ';background-size:' + (theme.background==='pattern' ? '12px 12px' : 'cover') +
            ';grid-template-rows:' + composition.rows.map(track => track === 'auto' ? track : 'minmax(0,' + track + 'fr)').join(' ') + '">' + body + '</div>';
    }


    window.CoverArtDirector = Object.freeze({coverTypes, coverLayouts, coverBackgrounds, coverTitleStyles, numericCanvas, recommendCover, recommendCoverAlternatives, resolveCoverComposition, renderRecommendedCover});
})();
