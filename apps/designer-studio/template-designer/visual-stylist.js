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

    const backgrounds = {
        frame_margin_split:['split','grid','band'], full_bleed_overlay:['none'],
        year_only_focus:['paper','band'], symbol_year_merge:['solid','split'],
        typo_poster:['ruled','paper'], pattern_scatter_center:['solid','paper'],
        art_canvas_footnote:['paper','solid'], editorial_ticket_split:['grid','band'],
        index_grid_12:['solid','paper'], diy_blank_prompt:['grid','solid']
    };

    function coverStyle(archetype, design, direction, variation) {
        const pool = backgrounds[archetype];
        const paper = /따뜻|아이보리/.test(direction) ? '#F8F1E4' : design.paper;
        const linear = channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
        const luminance = hex => [.2126,.7152,.0722].reduce((sum, weight, i) =>
            sum + weight * linear(Number.parseInt(hex.slice(i*2+1,i*2+3),16) / 255), 0);
        const contrast = (a,b) => (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        const paperLight = luminance(paper);
        const ink = contrast(luminance(design.ink),paperLight) >= 4.5 ? design.ink
            : contrast(0,paperLight) >= 4.5 ? '#000000' : '#FFFFFF';
        const backgroundType = /단색|배경 없이/.test(direction) && pool.includes('solid') ? 'solid' : pool[variation % pool.length];
        return {backgroundType,paper,ink,accent:design.accent,
            frameEffects:{radius:archetype === 'full_bleed_overlay' ? 0 : 8, borderStyle:'dashed'},
            ...(backgroundType === 'paper' ? {assetSpec:{assetType:'texture', intent:'색을 방해하지 않는 매트 종이의 미세한 결'}} : {})};
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

    window.VisualStylist = Object.freeze({defaultPaperStyle, monthAccent, monthPrimary, coverStyle, describeBookStyle, describePageStyle,
        recommendYearVector:window.ACDLDesignerYearStyle.recommendVectorYearStyle});
})();
