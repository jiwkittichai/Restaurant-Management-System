export function localDate(date: Date) {
  return new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 10);
}

export const monthStart = (date = new Date()) => `${localDate(date).slice(0, 7)}-01`;
export const daysAgo = (days: number) => localDate(new Date(Date.now() - days * 86400000));
