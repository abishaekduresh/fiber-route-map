/**
 * Returns current timestamp formatted for MySQL (YYYY-MM-DD HH:mm:ss)
 * Respects the TIMEZONE environment variable.
 */
export const nowDb = (): string => {
  const timezone = process.env.TIMEZONE || 'Asia/Kolkata';
  const date = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;

  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
};
