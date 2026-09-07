import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const runtime=fs.readFileSync(new URL('../apps/designer-studio/calendar-type-platform-runtime.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8');
const migration=fs.readFileSync(new URL('../supabase/migrations/202609070003_calendar_type_platform.sql',import.meta.url),'utf8');

test('calendar type gallery exposes filters, status, settings and direct template creation',()=>{for(const value of ['typeFamilyFilter','typeStatusFilter','typeSearch','data-configure-type','data-create-type','typePlatformAdd'])assert.match(runtime,new RegExp(value))});
test('new templates start blank and show type constraints inside basic settings',()=>{assert.match(runtime,/creationMode='blank'/);assert.match(runtime,/renderBasicTypeContext/);assert.match(runtime,/빈 페이지 구성에서 시작하며 디자인과 AI 이미지는 새로 만듭니다/);assert.doesNotMatch(runtime,/creationProductPage|creationStartMode|기존 템플릿을 디자인 참고자료로 사용/);assert.match(runtime,/calendarTypeSnapshot/)});
test('legacy local calendar type manager is bypassed when the common domain is loaded',()=>{assert.match(html,/calendar-type-domain\.js/);assert.match(html,/calendar-type-platform-runtime\.js/);assert.match(fs.readFileSync(new URL('../apps/designer-studio/features/template-settings-workspace-runtime.js',import.meta.url),'utf8'),/if\(window\.ACDLCalendarTypeDomain\)return/)});
test('Supabase schema owns five normalized calendar type tables without changing template rows',()=>{for(const table of ['calendar_product_families','calendar_type_definitions','calendar_type_sizes','calendar_type_capabilities','calendar_type_page_rules'])assert.match(migration,new RegExp(`create table if not exists public\\.${table}`));assert.doesNotMatch(migration,/update public\.template_(projects|versions|assets)/)});
