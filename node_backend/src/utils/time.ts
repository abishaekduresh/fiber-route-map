/**
 * Returns current UTC timestamp formatted for MySQL (YYYY-MM-DD HH:mm:ss)
 */
export const nowDb = (): string => {
  const date = new Date();
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
};
