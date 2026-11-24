// Messages between the page and the converter worker.

export interface ConvertRequest {
  id: number;
  markdown: string;
  preserveLinks: boolean;
  monospaceCode: boolean;
}

export type ConvertResponse =
  | { id: number; text: string }
  | { id: number; error: string };
