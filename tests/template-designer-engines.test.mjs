import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const studio = new URL('../apps/designer-studio/', import.meta.url);
const html = readFileSync(new URL('template-designer.html', studio), 'utf8');

function engines() {
    const window = {};
    const context = vm.createContext({window});
    const scripts = [...html.matchAll(/<script src="(\.\/template-designer\/[^?]+)\?[^"]+"><\/script>/g)];
    assert.equal(scripts.length, 7);
    for (const [,path] of scripts) {
        vm.runInContext(readFileSync(new URL(path, studio), 'utf8'), context);
    }
    return window;
}

test('cover recommendations retain theme composition and independent year styles', () => {
    const {CoverArtDirector: cover, ACDLDesignerYearStyle: year} = engines();
    assert.equal(cover.recommendCover({title:'가족 사진 4장', coverType:'multi'}).layout, 'grid');
    assert.equal(cover.recommendCover({title:'가족 사진 4장', coverType:'multi'}, 1).layout, 'feature');
    const label = cover.recommendCover({title:'기록', coverType:'type', coverCount:0}, 1);
    assert.equal(label.yearLayout, 'split');
    assert.equal(year.recommendYearStyle(1).yearFill, 'mixed');
    const rendered = year.renderYearTypography({title:'2027 가족'}, label, {escapeHtml:String});
    assert.match(rendered, /year-layout-split.*year-fill-mixed/);
    assert.match(rendered, /aria-label="2027"/);
});

test('page layout and copy keep the 28-page result, image counts, and preset copy', () => {
    const {LayoutArchitect: layout, ThemeCopywriter: copy} = engines();
    const values = {title:'THE YEAR IN OBJECTS', insideFront:'annual', insideBack:'scheduler',
        front:'3', back:'2', imageCount:2, imageCountMode:'random-plus'};
    const result = layout.generatePageLayout(values, 'saved-draft');
    assert.equal(result.draftLayout.pages.length, 28);
    assert.equal(result.draftLayout.pages[1].layout, 'annual');
    assert.equal(result.draftLayout.pages[26].layout, 'scheduler');
    assert.equal(result.draftLayout.pages[27].number, 28);
    assert.deepEqual(result.imageCounts, layout.generatePageLayout(values, 'saved-draft').imageCounts);
    const referenceMonths = Array.from({length:12}, (_, index) => ({memo_title:'기존 문구 '+index}));
    const {months} = copy.generateThemeCopy(values.title, '기록', referenceMonths);
    for (const [index, month] of months.entries()) {
        assert.equal(month.theme_text, referenceMonths[index].memo_title);
        assert.equal(result.imageCounts[index], result.draftLayout.pages[index * 2 + 3].image_count);
    }
    const habits = layout.generatePageLayout({...values, back:'5'}, 'saved-draft');
    assert.ok(habits.imageCounts.every(count => count === 0));
});

test('monthly compositions are saved and legacy pages resolve to the same elements and proportions', () => {
    const {LayoutArchitect: layout} = engines();
    const values = {title:'기록 달력', insideFront:'annual', insideBack:'scheduler', imageCount:2};
    for (const front of ['1','2','3','4','5']) {
        for (const back of ['1','2','3','4','5']) {
            const {draftLayout} = layout.generatePageLayout({...values, front, back}, 'layout-test');
            for (const page of draftLayout.pages.slice(2,26)) {
                const {composition, ...legacyPage} = page;
                assert.ok(composition.main.length > 0);
                assert.deepEqual(layout.pageComposition(legacyPage), composition);
                const saved = JSON.parse(JSON.stringify(page));
                assert.equal(layout.pageComposition(saved), saved.composition);
            }
        }
    }
    const {draftLayout} = layout.generatePageLayout({...values, front:'4', back:'2'}, 'layout-test');
    assert.equal(draftLayout.pages[2].composition.side.join(','), 'memo,adjacent-months');
    assert.equal(draftLayout.pages[3].composition.tracks.join(','), '1,auto');
    assert.equal(draftLayout.pages[3].composition.main.join(','), 'images,date-strip,caption');
    assert.equal(draftLayout.pages[3].composition.imageCount, 2);
});

test('cover, annual and scheduler compositions support stored and pre-upgrade drafts', () => {
    const {CoverArtDirector: covers, LayoutArchitect: layout} = engines();
    const cover = covers.recommendCover({title:'여행', coverType:'split', coverCount:1}, 0);
    assert.equal(cover.composition.columns.join(':'), '2:1');
    const {composition, ...legacyCover} = cover;
    assert.deepEqual(covers.resolveCoverComposition(legacyCover), composition);
    assert.equal(covers.recommendCover({title:'숫자형', coverType:'numeric'}).composition.areas[0], 'year-art');
    const values = {title:'기록 달력', insideFront:'annual', insideBack:'scheduler', front:'2', back:'5'};
    for (const [preset, annual] of [['','annual'], ['numbers','number-annual'], ['habits','habit-annual']]) {
        const {draftLayout} = layout.generatePageLayout({...values, preset}, 'layout-test');
        assert.equal(draftLayout.pages[1].composition.arrangement, annual);
        assert.equal(draftLayout.pages[26].composition.entriesPerMonth, 3);
        for (const page of draftLayout.pages) {
            const {composition, ...legacyPage} = page;
            assert.deepEqual(layout.pageComposition(legacyPage, preset), composition);
        }
    }
});

test('separated engines render recommended covers and preserve edited habit copy', () => {
    const {CoverArtDirector: cover, LayoutArchitect: layout, ThemeCopywriter: copy} = engines();
    const hooks = {escapeHtml: String, illustrationSource: () => '', illustrationPlaceholder: () => '<span>sample</span>'};
    for (const preset of Object.values(layout.designerPresets)) {
        const design = cover.recommendCover({title: preset.title, ...preset.layout});
        assert.match(cover.renderRecommendedCover({title: preset.title}, design, hooks), /<svg|data-cover-title-style/);
    }
    const draft = {cover: {}, back_cover: {}, months: [{month: 1}, {month: 2}]};
    copy.applyHabitCopy(draft, {cover: {title:'저장한 표지'}, months:[{month:1,front_text:'기존 문구'}]});
    assert.equal(draft.cover.title, '저장한 표지');
    assert.equal(draft.months[0].front_text, '기존 문구');
    assert.equal(draft.months[1].front_text, copy.habitMonths[1][0]);
});

test('orchestrator adds stable slots to both existing 28-page presets without changing their layouts', () => {
    const {ACDLDesignerOrchestrator: designer, LayoutArchitect: layout} = engines();
    for (const [preset, defaults] of Object.entries(layout.designerPresets)) {
        const values = {title:defaults.title, description:'', preset, insideBack:'annual', imageCount:1, ...defaults.layout};
        const context = designer.createContext(values);
        const draft = designer.generateDraft(context, 'fixture-'+preset, [], () => []);
        assert.deepEqual(draft.draft_layout, layout.generatePageLayout(values, draft.set_id).draftLayout);
        draft.cover.title = '검토 후 바꾼 제목';
        const published = designer.withDesignSpec(draft);
        const {pages, canvas, engineVersions, roleOutputs} = published.design_spec;
        assert.equal(pages.length, 28);
        assert.equal(canvas.totalPages, 28);
        assert.deepEqual(Object.keys(engineVersions), ['CoverArtDirector', 'ThemeCopywriter', 'LayoutArchitect', 'VisualStylist', 'ThemeCurator']);
        assert.equal(roleOutputs.themeBrief.pagePlan.length, 28);
        assert.equal(roleOutputs.copySet.cover.title, draft.cover.title);
        assert.equal(roleOutputs.layoutGridSet.length, 28);
        assert.equal(roleOutputs.styleTokenSet.length, 28);
        assert.equal(roleOutputs.coverCandidateSet[0], draft.cover.cover_design);
        assert.deepEqual(draft.months.map(month => month.photo_slots),
            layout.generatePageLayout(values, draft.set_id).imageCounts);
        assert.equal(pages[1].pageRole, 'inside-front');
        assert.equal(pages[26].arrangement, preset === 'numbers' ? 'number-annual' : 'habit-annual');
        assert.equal(pages[0].slots.find(slot=>slot.role === 'title')?.defaultText,
            draft.cover.title);
        const ids = pages.flatMap(page=>page.slots.map(slot=>slot.slotId));
        assert.equal(new Set(ids).size, ids.length);
        assert.ok(pages.every(page=>page.slots.every(slot=>slot.type)));
        assert.equal(draft.design_spec, undefined);
    }
    const legacy = {title:'기본 시안'};
    assert.equal(designer.withDesignSpec(legacy), legacy);
});

test('the existing built-in designs keep their legacy cover and monthly preview pairs', () => {
    const {ACDLDesignerOrchestrator: designer} = engines();
    const registry = html.slice(html.indexOf('const CALENDAR_SETS_REGISTRY = ['), html.indexOf('// Active State Pointer'));
    const pairs = html.match(/function designPairs\(\) \{[^]*?\n        \}/)[0];
    const sets = vm.runInNewContext(registry + pairs + `
        let calendarDataset;
        CALENDAR_SETS_REGISTRY.map(set => {
            calendarDataset = set;
            return {set, pairs: designPairs()};
        });
    `);
    assert.ok(sets.length > 0);
    for (const {set, pairs} of sets) {
        assert.equal(designer.withDesignSpec(set), set);
        assert.equal(pairs.length, 13);
        assert.equal(pairs[0], set.cover);
        assert.deepEqual(Array.from(pairs.slice(1), page => page.month),
            Array.from({length:12}, (_, index) => index + 1));
    }
});

test('cover candidate selection only replaces the cover and keeps both presets intact', () => {
    const {ACDLDesignerOrchestrator: designer, LayoutArchitect: layout, CoverArtDirector: director} = engines();
    for (const [preset, defaults] of Object.entries(layout.designerPresets)) {
        const values = {title:defaults.title, description:'', preset, insideBack:'annual', imageCount:1, ...defaults.layout};
        const draft = designer.generateDraft(designer.createContext(values), 'cover-choice-'+preset, [], () => []);
        const initial = draft.cover.cover_design;
        const options = director.recommendCoverAlternatives(values, initial);
        assert.equal(options.length, 2);
        assert.equal(new Set([initial, ...options].map(design => JSON.stringify(design))).size, 3);
        assert.ok(options.every(option => option.photos === initial.photos));
        if (preset === 'habits') assert.equal(options.map(option => option.habitComposition).join(','), 'check,dots');
        const selected = designer.selectCoverCandidate(draft, options[1]);
        assert.equal(selected.cover.cover_design, options[1]);
        assert.equal(selected.cover.title, draft.cover.title);
        assert.equal(draft.cover.cover_design, initial);
        assert.equal(selected.months, draft.months);
        assert.equal(selected.draft_layout, draft.draft_layout);
        assert.deepEqual(designer.withDesignSpec(selected).design_spec.pages.slice(1),
            designer.withDesignSpec(draft).design_spec.pages.slice(1));
        assert.equal(designer.withDesignSpec(selected).design_spec.roleOutputs.coverCandidateSet[0], options[1]);
    }
});

test('review renders the six representative faces, including both January sides', () => {
    const window = engines();
    const designer = window.ACDLDesignerOrchestrator;
    const values = {title:'검토 시안', description:'', insideFront:'scheduler', insideBack:'annual', front:'1', back:'1'};
    const draft = designer.generateDraft(designer.createContext(values), 'review-faces', [], () => []);
    const summary = {};
    const review = {open:false, showModal() { this.open = true; }};
    const context = vm.createContext({
        draft, draftReview:review, document:{getElementById:() => summary},
        renderCoverCandidates:() => '', renderCoverReview:() => '', renderDesignCopyReview:() => '',
        renderDraftFace: (item, back, dataset, face) => `<div data-rendered-face="${face.number}"></div>`,
        escapeHtml:String
    });
    const render = html.slice(html.indexOf('        function showDraftReview('), html.indexOf("        document.getElementById('returnToDraft')"));
    vm.runInContext(render + '\nshowDraftReview(draft);', context);
    assert.equal(review.open, true);
    assert.deepEqual([...summary.innerHTML.matchAll(/data-rendered-face="(\d+)"/g)].map(match => Number(match[1])),
        [1,2,3,4,27,28]);
    assert.match(summary.innerHTML, /3면 · 1월 앞면/);
    assert.match(summary.innerHTML, /4면 · 1월 뒷면/);
});

test('title and vector year recommendations preserve the other cover fields and all inner faces', () => {
    const {CoverArtDirector: director, ThemeCopywriter: copy, ACDLDesignerOrchestrator: designer} = engines();
    const values = {title:'모던 달력', description:'', preset:'numbers', insideFront:'scheduler',
        insideBack:'annual', front:'5', back:'4', coverType:'numeric'};
    const draft = designer.generateDraft(designer.createContext(values), 'scoped-cover', [], () => []);
    draft.cover.cover_design = director.recommendCover({...values, numericOptions:{form:'vector'}});
    const initial = draft.cover.cover_design;
    assert.equal(initial.yearArt.assetId, 'angular');
    const title = copy.recommendCoverTitle(draft, 'ko');
    assert.notEqual(title, draft.cover.title);
    const titled = {...draft, cover:{...draft.cover, title}};
    assert.equal(titled.cover.cover_design, initial);
    const updated = designer.recommendCoverYear(titled, '굵은 숫자 강조', 0);
    assert.equal(updated.cover.title, title);
    assert.equal(updated.cover.cover_design.yearArt.assetId, 'bold');
    assert.equal(updated.cover.cover_design.yearArt.digits, initial.yearArt.digits);
    assert.equal(updated.cover.cover_design.yearArt.orbit, initial.yearArt.orbit);
    const spec = designer.withDesignSpec(updated).design_spec;
    assert.equal(spec.pages[0].style.yearVectorAssetId, 'bold');
    assert.deepEqual(spec.pages.slice(1), designer.withDesignSpec(draft).design_spec.pages.slice(1));
});

test('an analog theme recommends a split-flap vector and retains its identity on reopening', () => {
    const {CoverArtDirector: director, ACDLDesignerOrchestrator: designer} = engines();
    const values = {title:'아날로그 기록', description:'기계식 달력', coverType:'numeric', numericOptions:{form:'vector'},
        insideFront:'scheduler', insideBack:'annual', front:'1', back:'1'};
    const draft = designer.generateDraft(designer.createContext(values), 'split-flap', [], () => []);
    const cover = draft.cover.cover_design;
    assert.equal(cover.yearArt.assetId, 'split-flap');
    const alternatives = director.recommendCoverAlternatives(values, cover);
    assert.equal(new Set([cover, ...alternatives].map(option => option.yearArt.assetId)).size, 3);
    const stored = JSON.parse(JSON.stringify(designer.withDesignSpec(designer.selectCoverCandidate(draft, cover))));
    assert.equal(stored.design_spec.pages[0].style.yearVectorAssetId, 'split-flap');
    assert.match(director.renderRecommendedCover(stored.cover, stored.cover.cover_design, {escapeHtml:String}),
        /aria-label="2027" data-year-art>.*rx="6".*viewBox="0 50 100 50"/s);
});

test('the number preset exports its 12 monthly colors and renders the same palette on the mosaic cover', () => {
    const window = engines();
    const {ACDLDesignerOrchestrator: designer, CoverArtDirector: director, LayoutArchitect: layout} = window;
    const values = {title:'열두 달의 색', description:'12색 도트 모자이크', preset:'numbers',
        ...layout.designerPresets.numbers.layout, insideBack:'annual'};
    const draft = designer.generateDraft(designer.createContext(values), 'monthly-color-sync', [], () => []);
    const spec = designer.withDesignSpec(draft).design_spec;
    const monthlyPalette = spec.monthlyStyleTokens.map(token => token.primary);
    assert.equal(new Set(monthlyPalette).size, 12);
    assert.equal(spec.roleOutputs.themeBrief.hasUserPhoto, false);
    assert.equal(new Set(spec.roleOutputs.themeBrief.monthlyPlan.map(month => month.crossKeyword)).size, 12);
    assert.equal(draft.cover.cover_design.yearArt.assetId, 'dot-mosaic');
    const svg = director.renderRecommendedCover(draft.cover, draft.cover.cover_design, {escapeHtml:String, monthlyPalette});
    const pattern = svg.match(/<pattern[^>]*>([\s\S]*?)<\/pattern>/)[1];
    assert.deepEqual([...pattern.matchAll(/fill="(#[\da-f]+)"/gi)].map(match => match[1]), [...monthlyPalette]);
    assert.equal(layout.monthGrid(2027, 2, 'MON').weekRows, 5);
    assert.equal(layout.monthGrid(2027, 1).weekRows, 6);
    assert.equal(spec.pages[2].calendarSpec.weekRows, 6);
});

test('automatic choices resolve preset layouts and explicit photo pages support up to ten images', () => {
    const {LayoutArchitect: layout, ACDLDesignerOrchestrator: designer} = engines();
    const auto = {title:'새 시안', description:'', preset:'numbers', insideFront:'auto', insideBack:'auto',
        front:'auto', back:'auto', imageCount:'auto', imageCountMode:'auto', imageCountMax:10};
    const {draftLayout: preset} = layout.generatePageLayout(auto, 'auto');
    assert.deepEqual([preset.inside_front, preset.inside_back, preset.month_front, preset.month_back, preset.image_count],
        ['scheduler','annual','5','4',0]);

    const values = {...auto, preset:'', insideFront:'photo', insideBack:'photo', back:'7', imageCount:'8', imageCountMode:'random-plus'};
    const draft = designer.generateDraft(designer.createContext(values), 'photo-focus', [], () => []);
    const {design_spec: spec} = designer.withDesignSpec(draft);
    assert.equal(spec.pages.length, 28);
    assert.equal(spec.pages[1].arrangement, 'photo-focus');
    assert.equal(spec.pages[26].slots[0].type, 'image');
    assert.equal(spec.pages[3].composition.imageSide, 'right');
    assert.equal(spec.pages[3].composition.side.join(','), 'memo,adjacent-months');
    assert.equal(Math.max(...draft.months.map(month => month.photo_slots)), 10);
    assert.equal(Math.min(...draft.months.map(month => month.photo_slots)), 8);
    assert.equal(spec.roleOutputs.themeBrief.pageChoices.backImageCountMax, 10);
    const legacy = layout.generatePageLayout({...values, back:'2', imageCount:'2', imageCountMax:undefined}, 'legacy');
    assert.equal(Math.max(...legacy.imageCounts), 4);
    assert.equal(legacy.draftLayout.image_count_max, undefined);

    const fixed = layout.generatePageLayout({...values, back:'1', imageCount:'10', imageCountMode:'fixed'}, 'ten');
    assert.ok(fixed.imageCounts.every(count => count === 10));
});

test('layout recommendations change only automatic fields and preserve explicit image settings', () => {
    const {LayoutArchitect: layout} = engines();
    const values = {title:'선택 구성', insideFront:'photo', insideBack:'auto', front:'3', back:'7',
        imageCount:'8', imageCountMode:'random-plus', imageCountMax:10};
    const {draftLayout: current} = layout.generatePageLayout(values, 'locked-layout');
    const {draftLayout: next} = layout.recommendPageLayout(values, current, 'locked-layout', -1);
    assert.notEqual(next.inside_back, current.inside_back);
    assert.equal(next.inside_front, 'photo');
    assert.equal(next.month_front, '3');
    assert.equal(next.month_back, '7');
    assert.equal(next.image_count, 8);
    assert.equal(next.image_count_mode, 'random-plus');
    assert.deepEqual(next.pages.filter(page => page.role === 'month-back'),
        current.pages.filter(page => page.role === 'month-back'));
    assert.equal(layout.recommendPageLayout({...values, insideBack:current.inside_back},
        current, 'locked-layout', -1), null);
});

test('applying reviewed copy updates titles and monthly text without modifying layout or image data', () => {
    const source = html.slice(html.indexOf('        function applyReviewCopy('), html.indexOf('        function designCopyField('));
    const draft = {cover:{title:'이전', cover_design:{type:'numeric'}}, back_cover:{}, draft_layout:{page_count:28},
        months:[{month:1, photo_slots:3, illustration_image:'saved-image'}]};
    const copy = {cover:'표지 수정', backCover:'뒷표지 수정', coverImagePrompt:'표지 이미지',
        annual:'연력', scheduler:'스케줄러', months:[{front:'새 앞면', back:'새 뒷면', scheduler:'카드', imagePrompt:'월 이미지'}]};
    vm.runInNewContext(source + '\napplyReviewCopy(draft, copy);', {draft, copy});
    assert.equal(draft.cover.title, '표지 수정');
    assert.equal(draft.back_cover.title, '뒷표지 수정');
    assert.equal(draft.months[0].theme_text, '새 앞면');
    assert.equal(draft.months[0].back_text, '새 뒷면');
    assert.equal(draft.months[0].illustration_image, 'saved-image');
    assert.equal(draft.months[0].photo_slots, 3);
    assert.equal(draft.draft_layout.page_count, 28);
});

test('photo recommendations render labelled frames and keep asset descriptions in the exported specification', () => {
    const {ACDLDesignerOrchestrator: designer, CoverArtDirector: director} = engines();
    const values = {title:'가족 여행', description:'추억', coverType:'multi', coverCount:4,
        insideFront:'annual',insideBack:'scheduler',front:'1',back:'1',imageCount:1};
    const draft = designer.generateDraft(designer.createContext(values), 'wireframe', [], () => []);
    const cover = draft.cover.cover_design;
    const candidates = [cover, ...director.recommendCoverAlternatives(values, cover)];
    assert.equal(new Set(candidates.map(candidate => candidate.archetype)).size, 3);
    const markup = director.renderRecommendedCover({...draft.cover, illustration_image:'example.png'},cover,{escapeHtml:String});
    assert.equal([...markup.matchAll(/aria-label="사진"/g)].length,4);
    assert.doesNotMatch(markup, /example\.png/);
    const spec = designer.withDesignSpec(draft).design_spec;
    const slot = spec.pages[0].slots.find(slot => slot.role === 'art');
    assert.equal(slot.frameCount,4);
    assert.equal(slot.assetSpec.assetType,'photo');
    assert.ok(slot.uploadGuideText);
});
