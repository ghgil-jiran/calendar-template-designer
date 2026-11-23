export type ScheduleEvent = {id: string; startDate: string; endDate: string; title: string};
export type ScheduleExtraction = {
  events: ScheduleEvent[];
  warnings: string[];
  sourceName: string;
  totalLines: number;
  method?: 'shared-ai' | 'basic';
  engineVersion?: string;
};
