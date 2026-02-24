/**
 * Timezone and Date Utilities for Cron System
 * All timestamps use Asia/Kolkata (IST) timezone
 */

import { toZonedTime, formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "Asia/Kolkata";

/**
 * Get current time in IST
 */
export function getNowIST(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/**
 * Format date in IST with readable format
 */
export function formatIST(date: Date, format = "yyyy-MM-dd HH:mm:ss"): string {
  return formatInTimeZone(date, TIMEZONE, format);
}

/**
 * Convert UTC date to IST
 */
export function convertToIST(utcDate: Date): Date {
  return toZonedTime(utcDate, TIMEZONE);
}

/**
 * Get start of day in IST
 */
export function startOfDayIST(): Date {
  const now = toZonedTime(new Date(), TIMEZONE);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of day in IST
 */
export function endOfDayIST(): Date {
  const now = toZonedTime(new Date(), TIMEZONE);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Check if date is weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if date is weekday (Mon-Fri)
 */
export function isWeekday(date: Date): boolean {
  return !isWeekend(date);
}

/**
 * Get day name from date
 */
export function getDayName(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

/**
 * Check if it's currently within business hours
 * Business hours: 9 AM to 6 PM IST
 */
export function isBusinessHours(date?: Date): boolean {
  const checkDate = date ? toZonedTime(date, TIMEZONE) : getNowIST();
  const hour = checkDate.getHours();
  return hour >= 9 && hour < 18; // 9 AM to 6 PM
}

/**
 * Get human-readable execution summary
 */
export function formatExecutionSummary(summary: {
  totalUsers: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
}): string {
  const parts: string[] = [];

  if (summary.totalUsers === 0) {
    parts.push("No users processed");
  } else {
    parts.push(`Total: ${summary.totalUsers}`);
    if (summary.successCount > 0) parts.push(`✓ Success: ${summary.successCount}`);
    if (summary.skippedCount > 0) parts.push(`⊘ Skipped: ${summary.skippedCount}`);
    if (summary.failedCount > 0) parts.push(`✗ Failed: ${summary.failedCount}`);
  }

  return parts.join(" | ");
}
