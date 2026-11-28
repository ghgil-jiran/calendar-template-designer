(() => {
    'use strict';

    function defaultPaperStyle() {
        return {paper_bg:'#F5F1E8', ink_primary:'#23211E'};
    }

    function monthAccent(index) {
        return ['#45645A','#7D4F62','#355E80','#805C30'][Math.floor(index / 3)];
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

    window.VisualStylist = Object.freeze({defaultPaperStyle, monthAccent, describePageStyle,
        recommendYearVector:window.ACDLDesignerYearStyle.recommendVectorYearStyle});
})();
