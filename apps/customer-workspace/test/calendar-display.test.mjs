import test from 'node:test';import assert from 'node:assert/strict';
import {templateCalendarDisplay,resolveCalendarDisplay} from '../src/lib/materials/calendar-display.ts';
test('template defaults preserve false flags and only holiday/lunar choices can override them',()=>{
 const source={settings:{calendarData:{includeHolidays:true,includeLunar:true,includeAnniversaries:false,includeSolarTerms:false}}},defaults=templateCalendarDisplay(source),before=JSON.stringify(source);
 assert.deepEqual(resolveCalendarDisplay(defaults),source.settings.calendarData);
 const selected=resolveCalendarDisplay(defaults,{includeHolidays:false,includeLunar:false,includeAnniversaries:true,includeSolarTerms:true});
 assert.deepEqual(selected,{includeHolidays:false,includeLunar:false,includeAnniversaries:false,includeSolarTerms:false});assert.equal(JSON.stringify(source),before);
});
test('locked options reflect template true values too, and missing settings remain compatible',()=>{
 const defaults=templateCalendarDisplay(null);assert.equal(defaults.includeHolidays,true);assert.equal(defaults.includeAnniversaries,true);
 assert.equal(resolveCalendarDisplay(defaults,{includeAnniversaries:false}).includeAnniversaries,true);
});
