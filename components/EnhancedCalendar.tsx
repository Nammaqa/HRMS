"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DayStatus =
  | "leave"
  | "full-day"
  | "half-day"
  | "holiday"
  | "wfh"
  | "present"
  | "absent"
  | null;

interface DayInfo {
  date: string;
  status: DayStatus;
  label?: string;
}

interface EnhancedCalendarProps {
  onDateSelect?: (date: Date) => void;
  dayStatuses?: DayInfo[];
  userId?: string;
  fetchAllMonthData?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  leave: "bg-red-200 text-red-700",
  "full-day": "bg-emerald-200 text-emerald-700",
  "half-day": "bg-amber-200 text-amber-700",
  holiday: "bg-sky-200 text-sky-700",
  wfh: "bg-violet-200 text-violet-700",
  present: "bg-green-200 text-green-700",
  absent: "bg-red-200 text-red-700",
};

export function EnhancedCalendar({
  onDateSelect,
  dayStatuses = [],
  userId,
  fetchAllMonthData = true,
}: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<DayInfo[]>(dayStatuses);
  const [holidays, setHolidays] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  
  const statusMap = new Map(calendarData.map((d) => [d.date, d]));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const getKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;

  // Function to check if a given day is Sunday (0 = Sunday)
  const isSunday = (day: number) => {
    const dayOfWeek = new Date(year, month, day).getDay();
    return dayOfWeek === 0;
  };

  // Function to check if a given day is Saturday (6 = Saturday)
  const isSaturday = (day: number) => {
    const dayOfWeek = new Date(year, month, day).getDay();
    return dayOfWeek === 6;
  };

  // Function to check if a date is in the past
  const isPastDate = (day: number) => {
    const dateToCheck = new Date(year, month, day);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  };

  // Function to get background color based on status
  const getBackgroundColor = (status: DayStatus): string => {
    switch (status) {
      case "leave":
        return "bg-red-500";
      case "full-day":
        return "bg-green-500";
      case "half-day":
        return "bg-amber-500";
      case "wfh":
        return "bg-violet-500";
      case "holiday":
        return "bg-sky-500";
      case "present":
        return "bg-green-500";
      case "absent":
        return "bg-red-500";
      default:
        return "";
    }
  };

  // Fetch holidays for the current month
  const fetchHolidays = async () => {
    try {
      const response = await fetch("/api/holidays", {
        credentials: "include",
      });

      if (response.ok) {
        const { data } = await response.json();
        if (data && Array.isArray(data)) {
          const holidayMap = new Map();
          data.forEach((holiday: any) => {
            const date = new Date(holiday.date);
            const dateStr = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            holidayMap.set(dateStr, holiday);
          });
          setHolidays(holidayMap);
        }
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  // Fetch attendance data for the current month
  const fetchAttendanceData = async () => {
    if (!fetchAllMonthData) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/attendance/monthly?year=${year}&month=${month + 1}`,
        { credentials: "include" }
      );

      if (response.ok) {
        const { data } = await response.json();
        if (data && Array.isArray(data)) {
          // Transform API data to DayInfo format
          const attendanceMap = data.map((record: any) => {
            const date = new Date(record.date);
            const dateStr = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

            // Priority statuses we should preserve
            let status: DayStatus | null = null;
            if (record.status === "LEAVE") {
              status = "leave";
            } else if (record.status === "WFH") {
              status = "wfh";
            } else if (record.status === "HOLIDAY") {
              status = "holiday";
            }

            // Map based on total working hours when available
            const twh = record.totalWorkingHours;
            if (typeof twh === "number") {
              if (twh >= 8.5) {
                status = "full-day"; // green
              } else if (twh >= 4) {
                status = "half-day"; // orange
              } else {
                status = "absent"; // red
              }
            }

            // If we still don't have status (no hours & not a special case),
            // fall back to the stored status field.
            if (!status) {
              if (record.status === "ABSENT") {
                status = "absent";
              } else if (record.status === "FULL_DAY") {
                status = "present";
              } else if (record.status === "HALF_DAY_FIRST" || record.status === "HALF_DAY_SECOND") {
                status = "half-day";
              }
            }

            return {
              date: dateStr,
              status,
              label: record.status,
            };
          });

          setCalendarData(attendanceMap);
        }
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      // Fall back to passed dayStatuses
      setCalendarData(dayStatuses);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when month/year changes
  useEffect(() => {
    fetchAttendanceData();
    fetchHolidays();
  }, [year, month, fetchAllMonthData]);

  // Set up auto-refresh every 30 seconds to check for approved WFH requests
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAttendanceData();
    }, 30000); // Refresh every 30 seconds

    // Listen for WFH approval/rejection events for immediate refresh
    const handleWFHApproved = () => {
      fetchAttendanceData();
    };

    const handleWFHRejected = () => {
      fetchAttendanceData();
    };

    // Listen for Leave approval/rejection events for immediate refresh
    const handleLeaveApproved = () => {
      fetchAttendanceData();
    };

    const handleLeaveRejected = () => {
      fetchAttendanceData();
    };

    window.addEventListener("wfh-approved", handleWFHApproved);
    window.addEventListener("wfh-rejected", handleWFHRejected);
    window.addEventListener("leave-approved", handleLeaveApproved);
    window.addEventListener("leave-rejected", handleLeaveRejected);

    return () => {
      clearInterval(interval);
      window.removeEventListener("wfh-approved", handleWFHApproved);
      window.removeEventListener("wfh-rejected", handleWFHRejected);
      window.removeEventListener("leave-approved", handleLeaveApproved);
      window.removeEventListener("leave-rejected", handleLeaveRejected);
    };
  }, [year, month, fetchAllMonthData]);

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl bg-white/60 backdrop-blur-xl shadow-2xl border border-white/40 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1))}
          className="p-2 rounded-full hover:bg-black/5 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold tracking-wide">
          {monthLabel}
        </h2>

        <button
          onClick={() => setCurrentDate(new Date(year, month + 1))}
          className="p-2 rounded-full hover:bg-black/5 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 text-xs text-center text-gray-500 mb-3">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-7 gap-y-3">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = getKey(day);
          const info = statusMap.get(key);
          const holiday = holidays.get(key);
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const sunday = isSunday(day);
          const saturday = isSaturday(day);
          const pastDate = isPastDate(day);

          // Determine the status to display
          let displayStatus: DayStatus = null;
          let displayLabel = "";

          // Priority: Holiday > Attendance Data > Past Date Absent (excluding Saturdays) > Nothing
          if (holiday) {
            displayStatus = "holiday";
            displayLabel = holiday.name;
          } else if (info?.status) {
            displayStatus = info.status;
            displayLabel = info.label || info.status;
          } else if (pastDate && !sunday && !isSaturday(day)) {
            // Only mark absent for past dates that are not Sundays or Saturdays
            displayStatus = "absent";
            displayLabel = "ABSENT";
          }

          // For today: show color based on attendance status
          const isTodayCheckedIn = isToday && (info?.status === "present" || info?.status === "full-day");
          const isTodayHalfDay = isToday && info?.status === "half-day";

          // For Saturday: check if attendance is marked
          const saturdayHasAttendance = saturday && info?.status;

          // Get background color
          const backgroundColor = getBackgroundColor(displayStatus);
          const hasColor = !!backgroundColor;

          return (
            <button
              key={day}
              onClick={() =>
                onDateSelect?.(new Date(year, month, day))
              }
              className={`
                relative mx-auto w-10 h-10 rounded-full
                flex items-center justify-center
                transition-all duration-200
                font-semibold text-sm
                ${
                  saturday
                    ? saturdayHasAttendance
                      ? "text-green-600"
                      : "text-black"
                    : sunday
                    ? "text-gray-400 bg-gray-100/50"
                    : hasColor
                    ? `${backgroundColor} text-white`
                    : isToday
                    ? isTodayCheckedIn
                      ? "bg-green-500 scale-110 shadow-lg text-white"
                      : isTodayHalfDay
                      ? "bg-amber-500 scale-110 shadow-lg text-white"
                      : "ring-2 ring-black scale-110 text-black"
                    : "text-black hover:bg-black/5"
                }
              `}
            >
              <span className="font-medium">{day}</span>

              {/* Tooltip */}
              {displayLabel && (
                <span className="absolute -top-9 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded-md whitespace-nowrap">
                  {displayLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        <Legend color="bg-green-500" label="Present" />
        <Legend color="bg-amber-500" label="Half-day" />
        <Legend color="bg-red-500" label="Absent or Leave" />
        <Legend color="bg-sky-500" label="Holiday" />
        <Legend color="bg-violet-500" label="WFH" />
        <Legend color="bg-gray-400" label="Sunday" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
