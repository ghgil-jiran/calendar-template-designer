(() => {
    'use strict';

    const curator = window.ThemeCurator;
    const layout = window.LayoutArchitect;
    const cover = window.CoverArtDirector;
    const copy = window.ThemeCopywriter;
    const style = window.VisualStylist;
    const engineVersions = Object.freeze({CoverArtDirector:'v1_rule', ThemeCopywriter:'v1_rule', LayoutArchitect:'v1_rule', VisualStylist:'v1_rule', ThemeCurator:'v1_rule'});

    function generateDraft(context, id, referenceMonths, normalizeHabitRows) {
        const {title, description, preset} = context.theme;
        const {options} = context;
        const input = {...options, title, description, preset};
        const plan = curator.planPages(input, id);
        const {draftLayout} = layout.generatePageLayout(input, id, plan);
        const {theme, months} = copy.generateThemeCopy(title, description, referenceMonths, context.monthlyDirections);
        const coverDesign = cover.recommendCover(input);
        return {
            set_id:id, title, description, subtitle:description, target_type:`탁상달력 · ${context.canvas.totalPages}면`,
            design_preset:Object.hasOwn(layout.designerPresets, preset) ? preset : undefined,
            global_style_lock:style.defaultPaperStyle(),
            cover:{title, cover_subtitle:(options.coverSubtitle || '').trim(), concept_text:description,
                cover_design:coverDesign, photo_slots:coverDesign.photos, prompt_subject:theme + ' · 표지 대표 이미지'},
            back_cover:{title},
            months:months.map((month, index) => ({...month, accent:style.monthAccent(index), photo_slots:plan.imageCounts[index]})),
            draft_layout:draftLayout,
            ...(draftLayout.month_back === '5' ? {habit_rows:normalizeHabitRows(options.habitRows)} : {})
        };
    }

    const slotTypes = {
        title:'text', subtitle:'text', year:'text', 'year-art':'text', 'year-watermark':'text', month:'text',
        'theme-text':'text', caption:'text', 'habit-prompt':'text', 'month-watermark':'text',
        artwork:'illustration', illustration:'illustration', calendar:'monthly-calendar',
        'calendar-with-daily-memo':'monthly-calendar', 'monthly-calendars':'annual-calendar',
        'adjacent-months':'mini-calendar', 'date-strip':'date-strip', events:'schedule',
        memo:'memo', 'habit-tracker':'tracker'
    };

    function pageSlots(draft, page, composition) {
        const month = draft.months?.find(entry => entry.month === page.month);
        const coverPage = page.role === 'cover';
        const areas = coverPage && draft.cover?.cover_design && composition.arrangement !== 'habit-cover'
            ? cover.resolveCoverComposition(draft.cover.cover_design).areas : composition.main;
        const roles = coverPage
            ? [...new Set([...areas, 'title', ...(draft.cover?.cover_subtitle ? ['subtitle'] : [])])]
            : areas;
        const photoCount = coverPage ? draft.cover?.photo_slots ?? 0 : composition.imageCount ?? page.image_count ?? 0;
        const defaultText = {
            title:coverPage ? draft.cover?.title : draft.back_cover?.title,
            subtitle:draft.cover?.cover_subtitle,
            'theme-text':month?.theme_text, caption:month?.back_text ?? month?.theme_text,
            'habit-prompt':month?.front_text
        };
        return [...roles.map(role=>({role, zone:'main'})), ...(composition.side ?? []).map(role=>({role, zone:'side'}))]
            .flatMap(({role, zone})=>{
                if (role === 'images' || role === 'photos') {
                    return Array.from({length:photoCount}, (_,index)=>({
                        slotId:`p${page.number}.${role}.${index+1}`, role, zone, type:'image'
                    }));
                }
                return [{slotId:`p${page.number}.${role}`, role, zone, type:slotTypes[role],
                    ...(defaultText[role] ? {defaultText:defaultText[role]} : {})}];
            });
    }

    function selectCoverCandidate(draft, candidate) {
        return {...draft, cover:{...draft.cover, cover_design:candidate, photo_slots:candidate.photos}};
    }

    function recommendCoverYear(draft, brief, variation) {
        const design = draft.cover.cover_design;
        const yearStyle = window.ACDLDesignerYearStyle;
        if (design.yearArt) {
            const art = design.yearArt;
            const nextArt = art.form === 'font'
                ? {...art, font:art.font === 'serif' ? 'sans' : 'serif'}
                : {...art, ...style.recommendYearVector(brief, art.assetId)};
            return selectCoverCandidate(draft, {...design, yearArt:nextArt});
        }
        if (design.type !== 'type') return draft;
        let next = yearStyle.recommendYearStyle(variation);
        if (next.yearLayout === design.yearLayout && next.yearFill === design.yearFill) next = yearStyle.recommendYearStyle(variation + 1);
        return selectCoverCandidate(draft, {...design, ...next});
    }

    function withDesignSpec(draft) {
        if (!draft.draft_layout?.pages) return draft;
        const pages = draft.draft_layout.pages.map(page=>{
            const composition = layout.pageComposition(page, draft.design_preset);
            return {
                pageIndex:page.number, pageRole:page.role, ...(page.month ? {month:page.month} : {}),
                arrangement:composition.arrangement, composition,
                ...(['number-month','number-memo'].includes(composition.arrangement)
                    ? {calendarSpec:layout.monthGrid(2027, page.month)} : {}),
                slots:pageSlots(draft, page, composition), style:style.describePageStyle(draft, page)
            };
        });
        const brief = curator.createBrief({
            title:draft.title, description:draft.description ?? '', preset:draft.design_preset, language:draft.copy_language
        });
        return {...draft, design_spec:{
            schemaVersion:'designer-slots.v1',
            theme:{title:draft.title, preset:draft.design_preset ?? null},
            canvas:{...brief.canvas, totalPages:pages.length},
            ...style.describeBookStyle(draft),
            roleOutputs:{
                themeBrief:{
                    ...curator.describeParticipation(draft),
                    theme:brief.theme, language:brief.language, monthlyDirections:brief.monthlyDirections,
                    pagePlan:draft.draft_layout.pages.map(({composition, ...page}) => page)
                },
                copySet:copy.describeDraftCopy(draft),
                layoutGridSet:pages.map(({pageIndex, composition}) => ({pageIndex, composition})),
                styleTokenSet:pages.map(({pageIndex, style}) => ({pageIndex, ...style})),
                coverCandidateSet:draft.cover?.cover_design ? [draft.cover.cover_design] : []
            },
            engineVersions, pages
        }};
    }

    window.ACDLDesignerOrchestrator = Object.freeze({createContext:curator.createBrief, generateDraft, selectCoverCandidate, recommendCoverYear, withDesignSpec});
})();
