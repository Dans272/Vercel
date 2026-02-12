
import { MONTHS } from '../constants.tsx';

export const parseGedcomDate = (dateStr?: string): number => {
  if (!dateStr) return 9999;
  const cleaned = dateStr.toUpperCase().replace(/ABT|EST|BEF|AFT|BET|AND|\//g, '').trim();
  const yearMatch = cleaned.match(/\d{4}/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0], 10);
    const foundMonthIndex = MONTHS.findIndex((m) => cleaned.includes(m));
    if (foundMonthIndex !== -1) return year + foundMonthIndex / 12;
    return year;
  }
  return 9999;
};

export const parseGedcomMonthDayYear = (dateStr?: string) => {
  if (!dateStr) return {};
  const cleaned = dateStr.toUpperCase().replace(/ABT|EST|BEF|AFT|BET|AND|\//g, '').trim();
  const yearMatch = cleaned.match(/\b(\d{4})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
  const monthIndex = MONTHS.findIndex((m) => new RegExp(`\\b${m}\\b`).test(cleaned));
  const month = monthIndex >= 0 ? monthIndex + 1 : undefined;
  let day: number | undefined;
  if (month) {
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const mIdx = parts.findIndex((p) => p === MONTHS[month - 1]);
    if (mIdx > 0) {
      const candidate = parseInt(parts[mIdx - 1], 10);
      if (!Number.isNaN(candidate) && candidate >= 1 && candidate <= 31) day = candidate;
    }
  }
  return { month, day, year };
};

export const formatFullDate = (dateStr?: string): string => {
  const { month, day, year } = parseGedcomMonthDayYear(dateStr);
  if (!month || !day || !year) return dateStr || 'Undated';
  try {
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr || 'Undated';
  }
};
