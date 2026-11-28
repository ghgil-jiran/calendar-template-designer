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
    assert.equal(scripts.length, 4);
    for (const [,path] of scripts) {
        vm.runInContext(readFileSync(new URL(path, studio), 'utf8'), context);
    }
    return window;
}

test('cover recommendations retain theme composition and independent year styles', () => {
    const {ACDLDesignerCoverGenerator: cover, ACDLDesignerYearStyle: year} = engines();
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
    const {ACDLDesignerPageLayout: layout, ACDLDesignerThemeCopy: copy} = engines();
    const values = {title:'THE YEAR IN OBJECTS', insideFront:'annual', insideBack:'scheduler',
        front:'3', back:'2', imageCount:2, imageCountMode:'random-plus'};
    const result = layout.generatePageLayout(values, 'saved-draft');
    assert.equal(result.draftLayout.pages.length, 28);
    assert.equal(result.draftLayout.pages[1].layout, 'annual');
    assert.equal(result.draftLayout.pages[26].layout, 'scheduler');
    assert.equal(result.draftLayout.pages[27].number, 28);
    assert.deepEqual(result.imageCounts, layout.generatePageLayout(values, 'saved-draft').imageCounts);
    const referenceMonths = Array.from({length:12}, (_, index) => ({memo_title:'기존 문구 '+index}));
    const {months} = copy.generateThemeCopy(values.title, '기록', result.imageCounts, referenceMonths);
    for (const [index, month] of months.entries()) {
        assert.equal(month.theme_text, referenceMonths[index].memo_title);
        assert.equal(month.photo_slots, result.draftLayout.pages[index * 2 + 3].image_count);
    }
    const habits = layout.generatePageLayout({...values, back:'5'}, 'saved-draft');
    assert.ok(habits.imageCounts.every(count => count === 0));
});

test('monthly compositions are saved and legacy pages resolve to the same elements and proportions', () => {
    const {ACDLDesignerPageLayout: layout} = engines();
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
    const {ACDLDesignerCoverGenerator: covers, ACDLDesignerPageLayout: layout} = engines();
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
    const {ACDLDesignerCoverGenerator: cover, ACDLDesignerPageLayout: layout, ACDLDesignerThemeCopy: copy} = engines();
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
