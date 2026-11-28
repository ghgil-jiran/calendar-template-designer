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

    function monthGrid(year, month, firstDayOfWeek = 'SUN') {
        const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + (firstDayOfWeek === 'MON' ? 6 : 0)) % 7;
        const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const weekRows = Math.max(5, Math.ceil((offset + days) / 7));
        return {firstDayOfWeek, offset, days, weekRows};
    }

    window.LayoutArchitect = Object.freeze({monthGrid, recommendPageLayout, frontThemeAreas, backThemeAreas, draftRecommendations, generatePageLayout, pageComposition, designerPresets:curator.designerPresets});
})();
