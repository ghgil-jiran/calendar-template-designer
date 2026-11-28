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
                    { number: month * 2 + 1, role: 'month-front', month, layout: front, image_count: front === '3' ? 1 : 0 },
                    { number: month * 2 + 2, role: 'month-back', month, layout: back, image_count: count }
                ];
            }),
            { number: totalPages - 1, role: 'inside-back', layout: insideBack }, { number: totalPages, role: 'back-cover' }];
        return {pages, imageCounts, imageCount, imageCountMode};
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

    window.ThemeCurator = Object.freeze({createBrief, planPages, designerPresets, monthlyDirections:Object.freeze(monthlyDirections)});
})();
