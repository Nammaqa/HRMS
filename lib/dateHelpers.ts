import { prisma } from "./prisma";

/**
 * Check if a date is a weekend (Sunday or Saturday)
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Get the day name (Sunday, Monday, etc.)
 */
export function getDayName(date: Date): string {
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  return days[date.getDay()];
}

/**
 * Check if a date is a holiday in the database
 */
export async function isHoliday(date: Date): Promise<{ isHoliday: boolean; name?: string }> {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const holiday = await prisma.holiday.findFirst({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  if (holiday) {
    return { isHoliday: true, name: holiday.name };
  }

  return { isHoliday: false };
}

/**
 * Check if attendance is on weekend or holiday and needs approval
 */
export async function requiresWeekendHolidayApproval(date: Date): Promise<{
  requiresApproval: boolean;
  dayType?: string;
  holidayName?: string;
}> {
  const weekendCheck = isWeekend(date);

  if (weekendCheck) {
    const dayName = getDayName(date);
    return {
      requiresApproval: true,
      dayType: dayName,
    };
  }

  const holidayCheck = await isHoliday(date);
  if (holidayCheck.isHoliday) {
    return {
      requiresApproval: true,
      dayType: "HOLIDAY",
      holidayName: holidayCheck.name,
    };
  }

  return { requiresApproval: false };
}
