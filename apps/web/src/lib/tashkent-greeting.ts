/**
 * Returns a time-aware greeting in Uzbek based on local Tashkent time (Asia/Tashkent).
 * - 05:00 - 11:59: "Xayrli tong"
 * - 12:00 - 17:59: "Xayrli kun"
 * - 18:00 - 04:59: "Xayrli kech"
 */
export function getTashkentGreeting(date: Date = new Date()): string {
  if (!date || isNaN(date.getTime())) {
    date = new Date();
  }

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tashkent',
      hour: 'numeric',
      hour12: false,
      hourCycle: 'h23',
    }).formatToParts(date);

    const hourPart = parts.find((p) => p.type === 'hour');
    const hour = hourPart ? parseInt(hourPart.value, 10) : (date.getUTCHours() + 5) % 24;

    if (hour >= 5 && hour < 12) {
      return 'Xayrli tong';
    }
    if (hour >= 12 && hour < 18) {
      return 'Xayrli kun';
    }
    return 'Xayrli kech';
  } catch {
    const hour = (date.getUTCHours() + 5) % 24;
    if (hour >= 5 && hour < 12) return 'Xayrli tong';
    if (hour >= 12 && hour < 18) return 'Xayrli kun';
    return 'Xayrli kech';
  }
}
