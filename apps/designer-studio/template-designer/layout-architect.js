(() => {
    'use strict';

    const frontThemeAreas = ['month-heading','memo-heading','memo-heading','memo-heading'];
    const backThemeAreas = ['memo-heading','image-caption','memo-heading'];
    const draftRecommendations = [
        ['annual','scheduler','2','2',1], ['scheduler','annual','1','1',1],
        ['annual','scheduler','3','2',2], ['scheduler','annual','4','3',1],
        ['annual','scheduler','1','2',4], ['scheduler','annual','2','3',3],
        ['annual','scheduler','4','2',3]
    ];

    // Areas are ordered within their grid. Relative tracks preserve the preview
    // proportions while auto tracks let text and the date strip size naturally.
    function describePage(page, preset) {
        const {role, layout, image_count: imageCount} = page;
        if (role === 'cover') return {arrangement:preset === 'habits' ? 'habit-cover' : 'cover', main:['title','artwork']};
        if (role === 'back-cover') return {arrangement:preset === 'habits' ? 'habit-ending' : 'ending', main:['year','title']};
        if (role === 'inside-front' || role === 'inside-back') {
            if (layout === 'photo') return {arrangement:'photo-focus', main:['images'], imageCount:1};
            if (layout === 'annual') {
                const arrangement = preset === 'numbers' ? 'number-annual' : preset === 'habits' ? 'habit-annual' : 'annual';
                return {arrangement, columns:4, rows:3, main:arrangement === 'number-annual' ? ['year-watermark','monthly-calendars'] : ['monthly-calendars']};
            }
            return {arrangement:'scheduler', columns:4, rows:3, entriesPerMonth:3, main:['month','theme-text','events']};
        }
        if (role === 'month-front') {
            if (preset === 'habits' && layout === '2') return {arrangement:'habit-month', main:['calendar','habit-prompt']};
            if (layout === '5') return {arrangement:'number-month', main:['calendar', 'month-watermark']};
            if (layout === '1') return {arrangement:'full', main:['calendar']};
            return {arrangement:'columns', tracks:[2,1], main:['calendar'],
                side:['memo', ...({3:['images'], 4:['adjacent-months']}[layout] ?? [])],
                ...(layout === '3' ? {imageCount:1} : {})};
        }
        if (role !== 'month-back') return null;
        if (layout === '4') return {arrangement:'number-memo', main:['calendar-with-daily-memo']};
        if (layout === '5') return {arrangement:'habit-tracker', main:['habit-tracker']};
        if (layout === '2') return {arrangement:'rows', tracks:[1,'auto'], main:['images','date-strip','caption'], imageCount};
        return {arrangement:'columns', tracks:[2,1], main:['images'], imageCount,
            side:['3','7'].includes(layout) ? ['memo','adjacent-months'] : ['memo'],
            ...(['6','7'].includes(layout) ? {imageSide:'right'} : {})};
    }

    // Only accept known compositions. Legacy drafts derive the same layout
    // from their saved role, layout ID and image count.
    function pageComposition(page, preset) {
        const expected = describePage(page, preset);
        return JSON.stringify(page.composition) === JSON.stringify(expected) ? page.composition : expected;
    }

    const curator = window.ThemeCurator;

    function generatePageLayout(values, id, plan = curator.planPages(values, id)) {
        const {insideFront, insideBack, front, back, pages, imageCounts, imageCount, imageCountMode, imageCountMax} = plan;
        const draftLayout = {page_count: pages.length, inside_front: insideFront, inside_back: insideBack,
            month_front: front, month_back: back, image_count: imageCount, image_count_mode: imageCountMode,
            ...(imageCountMax === 10 ? {image_count_max:imageCountMax} : {}),
            pages: pages.map(page => {
                const themeArea = page.role === 'month-front' ? frontThemeAreas[Number(front) - 1]
                    : page.role === 'month-back' ? backThemeAreas[Number(back) - 1] ?? (['6','7'].includes(back) ? 'memo-heading' : undefined) : undefined;
                const configuredPage = themeArea === undefined ? page : {...page, theme_area:themeArea};
                return {...configuredPage, composition:describePage(configuredPage, values.preset)};
            })};
        return {draftLayout, imageCounts};
    }

    function recommendPageLayout(values, current, id, previousIndex) {
        const keys = ['insideFront','insideBack','front','back','imageCount'];
        const signature = layout => JSON.stringify(layout.pages.map(page => [page.layout, page.image_count]));
        for (let step = 1; step <= draftRecommendations.length; step++) {
            const index = (previousIndex + step) % draftRecommendations.length;
            const next = {...values, imageCountMax:current.image_count_max};
            keys.forEach((key, position) => {
                if (values[key] === 'auto') next[key] = draftRecommendations[index][position];
            });
            if (values.imageCountMode === 'auto') next.imageCountMode = current.image_count_mode;
            const {draftLayout} = generatePageLayout(next, id);
            if (signature(draftLayout) !== signature(current)) return {draftLayout, index};
        }
        return null;
    }

    const coverArchetypes = {
        frame_margin_split:['여백과 프레임', ['art',8,15,58,70], ['year',69,33,23,16], ['title',69,53,23,26]],
        full_bleed_overlay:['전면 오버레이', ['art',0,0,100,100], ['year',8,63,36,12], ['title',8,77,84,14]],
        year_only_focus:['연도 단독', ['year',10,22,80,49], ['title',18,77,64,13]],
        symbol_year_merge:['심볼과 연도', ['symbol',20,17,60,55], ['year',12,27,76,43], ['title',17,76,66,14]],
        typo_poster:['타이포 포스터', ['year',10,16,35,11], ['title',10,33,80,50]],
        pattern_scatter_center:['패턴과 중앙 여백', ['scatter',7,14,86,76], ['year',22,34,56,28], ['title',22,65,56,13]],
        art_canvas_footnote:['아트 캔버스와 각주', ['art',10,14,80,65], ['year',11,82,22,9], ['title',36,82,54,9]],
        editorial_ticket_split:['에디토리얼 티켓', ['title',10,19,80,23], ['line',10,47,80,1], ['year',10,54,80,31]],
        index_grid_12:['12칸 인덱스', ['year',12,14,76,12], ['index',12,31,76,45], ['title',12,80,76,12]],
        diy_blank_prompt:['참여형 빈칸', ['year',12,14,34,12], ['blank',12,31,76,43], ['title',12,78,76,14]]
    };

    function coverLayoutFor(archetype, photos) {
        if (!Object.hasOwn(coverArchetypes, archetype)) return null;
        const [label,...parts] = coverArchetypes[archetype];
        const slots = parts.map(([role,xPct,yPct,wPct,hPct], zIndex) => ({
            role,xPct,yPct,wPct,hPct,zIndex,
            ...(['art','symbol'].includes(role) ? {displayLabel:role === 'art' && photos ? '사진 이미지' : '일러스트 이미지'} : {})
        }));
        return {archetype,label,slots};
    }

    function recommendCoverArchetypes(text, photos, type) {
        if (photos) return type === 'full'
            ? ['full_bleed_overlay','frame_margin_split','art_canvas_footnote']
            : ['frame_margin_split','art_canvas_footnote','full_bleed_overlay'];
        if (/열두 달의 색|12색|팔레트|컬러|색상/.test(text)) return ['index_grid_12','year_only_focus','symbol_year_merge','pattern_scatter_center'];
        if (/활동|체크|습관|기록표/.test(text)) return ['diy_blank_prompt','editorial_ticket_split','typo_poster'];
        if (/일러스트|그림|오브제/.test(text)) return ['art_canvas_footnote','symbol_year_merge','pattern_scatter_center','year_only_focus'];
        return ['year_only_focus','typo_poster','editorial_ticket_split','symbol_year_merge','pattern_scatter_center'];
    }

    function monthGrid(year, month, firstDayOfWeek = 'SUN') {
        const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + (firstDayOfWeek === 'MON' ? 6 : 0)) % 7;
        const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const weekRows = Math.max(5, Math.ceil((offset + days) / 7));
        return {firstDayOfWeek, offset, days, weekRows};
    }

    window.LayoutArchitect = Object.freeze({monthGrid, coverLayoutFor, recommendCoverArchetypes, recommendPageLayout, frontThemeAreas, backThemeAreas, draftRecommendations, generatePageLayout, pageComposition, designerPresets:curator.designerPresets});
})();
