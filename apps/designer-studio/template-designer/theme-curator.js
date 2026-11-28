(() => {
    'use strict';

    const totalPages = 28;
    const monthlyDirections = [
        '새해의 시작과 첫인상', '겨울의 끝과 다음 계절의 기대', '봄의 시작과 새로운 일상',
        '봄의 변화와 발견', '초록이 짙어지는 계절', '상반기를 돌아보는 여유',
        '한여름의 활기', '여름의 쉼과 여운', '가을의 시작과 새로운 리듬',
        '가을의 깊이와 수확', '한 해를 돌아보는 기록', '한 해의 마무리와 다음 해의 기대'
    ];

    function planPages(values, id) {
        const preset = designerPresets[values.preset]?.layout ?? {};
        const insideFront = values.insideFront === 'auto'
            ? (values.insideBack === 'annual' ? 'scheduler' : values.insideBack === 'scheduler' ? 'annual' : preset.insideFront ?? 'annual')
            : values.insideFront;
        const insideBack = values.insideBack === 'auto' ? (insideFront === 'annual' ? 'scheduler' : 'annual') : values.insideBack;
        const front = values.front === 'auto' ? preset.front ?? '1' : values.front;
        const back = values.back === 'auto' ? preset.back ?? '1' : values.back;
        const imageCountMax = values.imageCountMax === 10 ? 10 : 4;
        const noImages = ['4','5'].includes(back);
        const imageCount = noImages ? 0 : (back === '1' && imageCountMax === 4) || values.imageCount === 'auto' ? 1 : Number(values.imageCount);
        const imageCountMode = imageCount > 0 && !(back === '1' && imageCountMax === 4) && imageCount < imageCountMax && values.imageCountMode === 'random-plus' ? 'random-plus' : 'fixed';
        if (!values.title.trim() || !['annual','scheduler','photo'].includes(insideFront) || !['annual','scheduler','photo'].includes(insideBack)
            || !['1','2','3','4','5'].includes(front) || !['1','2','3','4','5','6','7'].includes(back)
            || !Number.isInteger(imageCount) || imageCount < (noImages ? 0 : 1) || imageCount > imageCountMax) {
            throw new Error('제목과 면 구성을 확인해 주세요.');
        }
        const imageCounts = Array.from({length:12}, (_,index) =>
            imageCountMode === 'random-plus' ? imageCount + index % (imageCountMax + 1 - imageCount) : imageCount);
        if (imageCountMode === 'random-plus') {
            // Shuffle deterministically so editing, reopening, and exporting retain the same counts.
            let seed = Array.from(id).reduce((hash, char) => Math.imul(hash ^ char.codePointAt(0),16777619),2166136261);
            for (let i = imageCounts.length - 1; i > 0; i--) {
                seed = Math.imul(seed,1664525) + 1013904223 | 0;
                const j = (seed >>> 0) % (i + 1);
                [imageCounts[i],imageCounts[j]] = [imageCounts[j],imageCounts[i]];
            }
        }
        const pages = [{ number: 1, role: 'cover' }, { number: 2, role: 'inside-front', layout: insideFront, ...(insideFront === 'photo' ? {image_count:1} : {}) },
            ...imageCounts.flatMap((count, index) => {
                const month = index + 1;
                return [
                    { number: month * 2 + 1, role: 'month-front', month, layout: front, image_count: front === '3' ? 1 : 0 },
                    { number: month * 2 + 2, role: 'month-back', month, layout: back, image_count: count }
                ];
            }),
            { number: totalPages - 1, role: 'inside-back', layout: insideBack, ...(insideBack === 'photo' ? {image_count:1} : {}) }, { number: totalPages, role: 'back-cover' }];
        return {pages, imageCounts, imageCount, imageCountMode, imageCountMax, insideFront, insideBack, front, back};
    }

    const designerPresets = Object.freeze({
        numbers:{title:'숫자로 표현하는 디자인 달력',layout:{coverType:'numeric',insideFront:'scheduler',front:'5',back:'4'}},
        habits:{title:'하루하루 체크하기',layout:{coverType:'illustration',insideFront:'scheduler',front:'2',back:'5'}}
    });

    function createBrief(values) {
        const {title, description, preset, language} = values;
        return {
            theme: {title:title.trim(), description:description.trim(), preset:preset || null},
            canvas: {year:2027, totalPages, aspectRatio:[4,3]},
            language: language ?? null,
            monthlyDirections: [...monthlyDirections],
            options: {...values}
        };
    }

    function describeParticipation(draft) {
        const layout = draft.draft_layout;
        const pagePlan = layout.pages;
        return {
            pageChoices:{
                insideFront:layout.inside_front, insideBack:layout.inside_back,
                monthlyFront:layout.month_front, monthlyBack:layout.month_back,
                backImageCount:layout.image_count, backImageCountMode:layout.image_count_mode,
                backImageCountMax:layout.image_count_max ?? 4,
                monthlyBackImageCounts:pagePlan.filter(page => page.role === 'month-back').map(page => page.image_count)
            },
            hasUserPhoto: Boolean(draft.cover?.photo_slots || pagePlan.some(page => page.image_count > 0)),
            backPagePurpose: draft.draft_layout.month_back === '5' ? 'habit_tracker' : 'free_memo',
            monthlyPlan: monthlyDirections.map((crossKeyword, index) => ({month:index + 1, crossKeyword}))
        };
    }

    window.ThemeCurator = Object.freeze({createBrief, describeParticipation, planPages, designerPresets, monthlyDirections:Object.freeze(monthlyDirections)});
})();
