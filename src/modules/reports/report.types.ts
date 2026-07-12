import { REPORT_LANGUAGES, REPORT_STATUSES } from "./report.constants";


export type ReportLanguageValue =
  (typeof REPORT_LANGUAGES)[number];

export type ReportStatusValue =
  (typeof REPORT_STATUSES)[number];

export interface CreateReportInput {
  name?: string;
  contact?: string;
  location: string;
  description: string;
  language: ReportLanguageValue;
}