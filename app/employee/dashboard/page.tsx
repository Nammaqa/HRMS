"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { EnhancedCalendar } from "@/components/EnhancedCalendar";
import { ProfileCard } from "@/components/ProfileCard";
import { SummaryCards } from "@/components/SummaryCards";
import { RecentAttendanceTable } from "@/components/RecentAttendanceTable";
import { HolidaysAndLeaves } from "@/components/HolidaysAndLeaves";
import { TodaysSpecial } from "@/components/TodaysSpecial";
import { NotificationCard } from "@/components/NotificationCard";
import { MarkAttendanceModal } from "@/app/employee/Makeattendence";
import { ApplyLeaveModal } from "@/app/employee/Applayleave";
import { ApplyWFHModal } from "@/app/employee/applaywfh";
import { Bell, X } from "lucide-react";

/* -------------------- Interfaces -------------------- */
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  designation?: string;
  profileImageUrl?: string;
  bloodGroup?: string;
  location?: string;
  lastLoginAt?: string;
}

interface AttendanceStats {
  presentDays: number;
  absentDays: number;
  leavesDays: number;
  workFromHomeDays: number;
}

interface RecentAttendance {
  id: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "national" | "company";
}

interface Leave {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface SpecialOccasion {
  id: string;
  name: string;
  designation: string;
  type: "birthday" | "anniversary";
  displayDate: string;
  profileImageUrl?: string;
}

interface SpecialOccasions {
  yesterday: SpecialOccasion[];
  today: SpecialOccasion[];
  tomorrow: SpecialOccasion[];
  // thisMonth is kept only if other code uses it elsewhere
}

/* -------------------- Component -------------------- */
export default function EmployeeDashboard() {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AttendanceStats>({
    presentDays: 0,
    absentDays: 0,
    leavesDays: 0,
    workFromHomeDays: 0,
  });

  const [recentAttendance, setRecentAttendance] = useState<RecentAttendance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [specialOccasions, setSpecialOccasions] = useState<SpecialOccasions>({
    yesterday: [],
    today: [],
    tomorrow: [],
  });

  // Filter holidays to only those in the current month
  const currentMonthHolidays = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return holidays.filter((h) => {
      try {
        const d = new Date(h.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      } catch (e) {
        return false;
      }
    });
  }, [holidays]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true); // 🔴 Red dot state

  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [showApplyWFH, setShowApplyWFH] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchSpecialOccasions();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [router]);

  // Fetch unread notifications indicator for red dot
  useEffect(() => {
    const fetchUnread = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/notifications/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          const hasUnread = data.some((n: any) => !n.isRead);
          setHasNotifications(hasUnread);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchUnread();
  }, [user?.id]);

  /* Close modal when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const fetchUserData = async () => {
    const response = await fetch("/api/employee-dashboard", { credentials: "include" });
    const result = await response.json();

    if (result.success && result.data) {
      const { user, stats, recentAttendance, holidays, leaves } = result.data;
      setUser(user);
      setStats(stats);
      setRecentAttendance(recentAttendance);
      setHolidays(holidays);
      setLeaves(leaves);
    }
  };

  const fetchSpecialOccasions = async () => {
    const response = await fetch("/api/todayspecial");
    if (response.ok) {
      const data = await response.json();
      setSpecialOccasions(data);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  const handleQuickAction = (action: "attendance" | "wfh" | "leave") => {
    if (action === "attendance") setShowMarkAttendance(true);
    if (action === "leave") setShowApplyLeave(true);
    if (action === "wfh") setShowApplyWFH(true);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <EmployeeSidebar userName={user?.name}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="p-4 md:p-8 max-w-[1800px] mx-auto">

          {/* HERO */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 mb-6 text-white relative">
            <div className="flex flex-col lg:flex-row justify-between gap-6">

              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">{getGreeting()}</p>
                    <h1 className="text-2xl font-bold">{user?.name}</h1>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["attendance", "leave", "wfh"].map((a) => (
                    <button
                      key={a}
                      onClick={() => handleQuickAction(a as any)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium transition text-white"
                    >
                      {a === "attendance" && "Mark Attendance"}
                      {a === "leave" && "Apply Leave"}
                      {a === "wfh" && "Work From Home"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-4">

                {/* 🔔 Bell with Red Dot */}
                <button
                  onClick={() => {
                    setShowNotifications(true);
                  }}
                  className="relative bg-white/20 p-3 rounded-full hover:bg-white/30 transition"
                >
                  <Bell className="w-6 h-6" />

                  {hasNotifications && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </button>

                {/* Clock */}
                <div className="bg-white/10 p-4 rounded-xl text-center">
                  <p className="text-xl font-bold">
                    {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm">
                    {currentTime.toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
            <div className="md:col-span-9 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-9 gap-6">
                <div className="md:col-span-4">
                  <EnhancedCalendar userId={user?.id} fetchAllMonthData={true} onDateSelect={() => {}} />
                </div>
                <div className="md:col-span-5">
                  <SummaryCards {...stats} />
                </div>
              </div>

              {/* pass full object returned from API so tabs work */}
              <TodaysSpecial occasions={specialOccasions} />
            </div>

            <div className="md:col-span-3">
              <ProfileCard
                user={user}
                onLogout={handleLogout}
                onApplyLeave={() => handleQuickAction("leave")}
                onApplyWFH={() => handleQuickAction("wfh")}
                onMarkAttendance={() => handleQuickAction("attendance")}
              />
            </div>
          </div>

          <div className="space-y-8">
            <HolidaysAndLeaves holidays={currentMonthHolidays} leaves={leaves} />
            {/* <RecentAttendanceTable data={recentAttendance} /> */}
          </div>
        </div>
      </div>

      {/* 🔔 NOTIFICATION MODAL */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div
            ref={modalRef}
            className="w-full max-w-sm h-full bg-white shadow-2xl animate-slideInRight flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <button onClick={() => setShowNotifications(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {user && (
              <NotificationCard
                userId={user.id}
                onUnreadChange={(count) => setHasNotifications(count > 0)}
              />
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <MarkAttendanceModal open={showMarkAttendance} onClose={() => setShowMarkAttendance(false)} />
      <ApplyLeaveModal open={showApplyLeave} onClose={() => setShowApplyLeave(false)} />
      <ApplyWFHModal open={showApplyWFH} onClose={() => setShowApplyWFH(false)} />
    </EmployeeSidebar>
  );
}
