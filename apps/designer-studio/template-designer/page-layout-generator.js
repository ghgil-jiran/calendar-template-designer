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
            side:layout === '3' ? ['memo','adjacent-months'] : ['memo']};
    }

    // Only accept known compositions. Legacy drafts derive the same layout
    // from their saved role, layout ID and image count.
    function pageComposition(page, preset) {
        const expected = describePage(page, preset);
        return JSON.stringify(page.composition) === JSON.stringify(expected) ? page.composition : expected;
    }

    function generatePageLayout(values, id) {
        const { insideFront, insideBack, front, back } = values;
        const imageCount = ['4','5'].includes(back) ? 0 : back === '1' ? 1 : Number(values.imageCount);
        const imageCountMode = imageCount > 0 && back !== '1' && imageCount < 4 && values.imageCountMode === 'random-plus' ? 'random-plus' : 'fixed';
        if (!values.title.trim() || !['annual','scheduler'].includes(insideFront) || !['annual','scheduler'].includes(insideBack)
            || !['1','2','3','4','5'].includes(front) || !['1','2','3','4','5'].includes(back)
            || !Number.isInteger(imageCount) || imageCount < (['4','5'].includes(back) ? 0 : 1) || imageCount > 4) {
            throw new Error('제목과 면 구성을 확인해 주세요.');
        }
        const imageCounts = Array.from({length:12}, (_,index) => imageCountMode === 'random-plus' ? imageCount + index % (5-imageCount) : imageCount);
        if (imageCountMode === 'random-plus') {
            // Shuffle deterministically so editing, reopening, and exporting retain the same counts.
            let seed = Array.from(id).reduce((hash, char) => Math.imul(hash ^ char.codePointAt(0),16777619),2166136261);
            for (let i = imageCounts.length - 1; i > 0; i--) {
                seed = Math.imul(seed,1664525) + 1013904223 | 0;
                const j = (seed >>> 0) % (i + 1);
                [imageCounts[i],imageCounts[j]] = [imageCounts[j],imageCounts[i]];
            }
        }
        const pages = [{ number: 1, role: 'cover' }, { number: 2, role: 'inside-front', layout: insideFront },
            ...imageCounts.flatMap((count, index) => {
                const month = index + 1;
                return [
                    { number: month * 2 + 1, role: 'month-front', month, layout: front, theme_area: frontThemeAreas[Number(front) - 1], image_count: front === '3' ? 1 : 0 },
                    { number: month * 2 + 2, role: 'month-back', month, layout: back, theme_area: backThemeAreas[Number(back) - 1], image_count: count }
                ];
            }),
            { number: 27, role: 'inside-back', layout: insideBack }, { number: 28, role: 'back-cover' }].map(page => ({...page, composition:describePage(page, values.preset)}));
        const draftLayout = {page_count: 28, inside_front: insideFront, inside_back: insideBack,
            month_front: front, month_back: back, image_count: imageCount, image_count_mode: imageCountMode, pages};
        return {draftLayout, imageCounts};
    }

    window.ACDLDesignerPageLayout = Object.freeze({frontThemeAreas, backThemeAreas, draftRecommendations, generatePageLayout, pageComposition});
})();
