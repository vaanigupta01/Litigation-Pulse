// Date helpers shared by the generator and the app. Dates are ISO "YYYY-MM-DD"
// strings in IST; internally we use day numbers (days since 1970-01-01).

const MS = 86_400_000;

export const toDay = (iso: string): number => Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / MS);
export const fromDay = (d: number): string => new Date(d * MS).toISOString().slice(0, 10);
export const dow = (d: number): number => (new Date(d * MS).getUTCDay() + 6) % 7; // 0 = Monday

export const DATA_START = toDay('2026-05-18'); // Monday
export const DATA_END = toDay('2026-11-07'); // last full day of data
export const TODAY = toDay('2026-11-08'); // "as of" 06:00 IST
export const AS_OF_LABEL = 'as of 8 Nov 2026, 06:00 IST';
export const WEEKS = 25; // 18 May .. 8 Nov (last week partial)

export type Period = 30 | 90 | 180;
export const periodStart = (p: Period): number => DATA_END - p + 1;
export const prevPeriodStart = (p: Period): number => DATA_END - 2 * p + 1;

/** Monday of week index w (0 = week of 18 May). */
export const weekStart = (w: number): number => DATA_START + 7 * w;
export const weekOf = (d: number): number => Math.floor((d - DATA_START) / 7);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDay = (d: number): string => {
  const dt = new Date(d * MS);
  return `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]}`;
};
export const fmtDayYear = (d: number): string => {
  const dt = new Date(d * MS);
  return `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
};
export const monthOf = (d: number): number => new Date(d * MS).getUTCMonth(); // 0-based
export const dayOfMonth = (d: number): number => new Date(d * MS).getUTCDate();
export const monthName = (m: number): string => MONTHS[m];
export const firstOfMonth = (year: number, m: number): number => Math.floor(Date.UTC(year, m, 1) / MS);
export const daysInMonth = (year: number, m: number): number => new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
