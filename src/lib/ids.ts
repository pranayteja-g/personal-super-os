export function newId(prefix: string = ""): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36).slice(-4);
  return prefix ? `${prefix}_${time}${rand}` : `${time}${rand}`;
}
