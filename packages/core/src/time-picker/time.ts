// Times as `HH:MM` on a 24-hour clock, the form `<input type="time">` takes, and what a language
// says about them through `Intl`: whether it counts 12 or 24 hours, and its AM and PM.

export interface Time {
  /** 0 to 23 */
  hour: number;
  /** 0 to 59 */
  minute: number;
}

const HH_MM = /^(\d{2}):(\d{2})$/;
const pad = (value: number) => String(value).padStart(2, '0');

/** A real time in `HH:MM`, or nothing */
export const parseTime = (value: string | undefined): Time | undefined => {
  const match = value ? HH_MM.exec(value) : null;
  if (!match) return undefined;
  const [hour, minute] = [Number(match[1]), Number(match[2])];
  return hour < 24 && minute < 60 ? { hour, minute } : undefined;
};

export const writeTime = ({ hour, minute }: Time) => `${pad(hour)}:${pad(minute)}`;

/** Whether a string is a real time in `HH:MM` */
export const isTime = (value: string | undefined): value is string => !!parseTime(value);

/** Whether a language counts 12 hours with AM and PM, or 24 */
export type HourCycle = 12 | 24;

/** The hours a language counts, from `Intl` */
export function hourCycleOf(locale: string): HourCycle {
  try {
    const cycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
    return cycle === 'h11' || cycle === 'h12' ? 12 : 24;
  } catch {
    return 24;
  }
}

/** The hour as a 12-hour clock shows it, 1 to 12 */
export const hour12 = (hour: number) => hour % 12 || 12;

/** Whether an hour is in the afternoon */
export const isPm = (hour: number) => hour >= 12;

/** The 24-hour hour for a 12-hour one and a half of the day */
export const hour24 = (hour: number, pm: boolean) => (hour % 12) + (pm ? 12 : 0);

const periods = new Map<string, [string, string]>();

/** How a language says AM and PM, from `Intl` */
export function dayPeriods(locale: string): [am: string, pm: string] {
  let names = periods.get(locale);
  if (!names) {
    const formatter = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      hourCycle: 'h12',
      timeZone: 'UTC',
    });
    const name = (hour: number) =>
      formatter
        .formatToParts(new Date(Date.UTC(2026, 0, 1, hour)))
        .find((part) => part.type === 'dayPeriod')?.value ?? (hour < 12 ? 'AM' : 'PM');
    names = [name(9), name(21)];
    periods.set(locale, names);
  }
  return names;
}
