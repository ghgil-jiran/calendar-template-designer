import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.resolve('apps/designer-studio/index.html'), 'utf8');

test('monthly quote is available as a calendar domain object', () => {
  assert.match(html, /data-widget-add="monthly-quote"><strong>월력용 명언 문구<\/strong>/);
  assert.match(html, /type==="monthly-quote"&&selectedPage\(\)\?\.role!=="monthly-back"/);
  assert.match(html, /scope=type==="monthly-quote"\?"master"/);
});

test('monthly quote uses a compact free-placement default and may overlap other objects', () => {
  assert.match(html, /"monthly-quote":\{x:7,y:18,width:38,height:32\}/);
  assert.match(html, /const elem=\{id:`element\.\$\{type\}\.\$\{Date\.now\(\)\}`,type,\.\.\.defaults,zIndex:maxZ\(scope\)\+1\}/);
  assert.doesNotMatch(html, /findOpenWidgetPlacement|widgetOverlap|placementItems/);
});

test('monthly quote separates shared styling from YYYY-MM content', () => {
  assert.match(html, /project\.book\.monthlyQuotes \|\|= \{\}/);
  assert.match(html, /function monthlyQuoteKey\(p=selectedPage\(\)\)/);
  assert.match(html, /project\.book\.monthlyQuotes\[key\]=\{title:"이 달의 명언"/);
  assert.match(html, /applyMonthlyQuoteContent/);
  assert.match(html, /applyMonthlyQuoteStyle/);
});

test('monthly quote seed and runtime dataset preserve attribution metadata', () => {
  assert.equal((html.match(/quoteKo:/g) || []).length >= 12, true);
  assert.match(html, /sourceStatus:"original"/);
  assert.match(html, /translationType:"editorial"/);
  assert.match(html, /monthlyQuotes:project\.book\.monthlyQuotes\|\|\{\}/);
  assert.match(html, /dataset\.monthlyQuotes\[`\$\{p\.calendarYear\}/);
});
