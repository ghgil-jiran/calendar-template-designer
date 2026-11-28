(() => {
    'use strict';

    function defaultPaperStyle() {
        return {paper_bg:'#F5F1E8', ink_primary:'#23211E'};
    }

    function monthAccent(index) {
        return ['#45645A','#7D4F62','#355E80','#805C30'][Math.floor(index / 3)];
    }

    const numberPalette = Object.freeze(['#34526b','#803d53','#376548','#664882','#89501e','#216366','#8a422d','#425685','#675628','#834639','#4b5267','#60413c']);

    function monthPrimary(draft, index) {
        if (draft.design_preset === 'numbers') return numberPalette[index];
        const accent = draft.months?.find(month => month.month === index + 1)?.accent;
        return /^#[\da-f]{6}$/i.test(accent) ? accent : monthAccent(index);
    }

    function describeBookStyle(draft) {
        return {
            sharedStyleTokens: {
                baseBackgroundHex:draft.global_style_lock?.paper_bg ?? defaultPaperStyle().paper_bg,
                inkColor:draft.global_style_lock?.ink_primary ?? defaultPaperStyle().ink_primary
            },
            monthlyStyleTokens: Array.from({length:12}, (_, index) => ({
                month:index + 1, primary:monthPrimary(draft, index)
            }))
        };
    }

    function describePageStyle(draft, page) {
        const cover = page.role === 'cover' ? draft.cover?.cover_design : null;
        const month = page.month ? draft.months?.find(entry => entry.month === page.month) : null;
        const shared = draft.global_style_lock ?? {};
        return {
            background: {pattern: cover?.background ?? 'solid', color: cover?.paper ?? shared.paper_bg ?? '#F5F1E8'},
            ink: cover?.ink ?? shared.ink_primary ?? '#23211E',
            ...(cover?.accent || month?.accent ? {accent: cover?.accent ?? month.accent} : {}),
            ...(cover?.titleStyle ? {titleStyle: cover.titleStyle} : {}),
            ...(cover?.yearArt?.assetId ? {yearVectorAssetId:cover.yearArt.assetId} : {}),
            ...(cover?.yearLayout ? {yearStyle: {layout: cover.yearLayout, fill: cover.yearFill}} : {})
        };
    }

    window.VisualStylist = Object.freeze({defaultPaperStyle, monthAccent, monthPrimary, describeBookStyle, describePageStyle,
        recommendYearVector:window.ACDLDesignerYearStyle.recommendVectorYearStyle});
})();
