import type {SchoolInput} from '../api/contracts.ts';
type Display=NonNullable<SchoolInput['calendarDisplay']>;
export function templateCalendarDisplay(project?:{settings?:{calendarData?:Partial<Display>}}|null,templateName?:string):Display{
 const settings=project?.settings?.calendarData;
 return {includeHolidays:settings?.includeHolidays!==false,includeAnniversaries:settings?.includeAnniversaries!==false,includeSolarTerms:settings?.includeSolarTerms!==false,includeLunar:/샘플\s*[EF]\b/i.test(templateName??'')?false:settings?.includeLunar!==false};
}
export function resolveCalendarDisplay(defaults:Display,chosen?:Partial<Display>):Display{
 return {...defaults,...chosen,includeAnniversaries:defaults.includeAnniversaries,includeSolarTerms:defaults.includeSolarTerms};
}
