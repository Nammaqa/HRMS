"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TodaysSpecial } from "@/components/TodaysSpecial";

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  workFromHomeToday: number;
  pendingLeaveRequests: number;
}

interface RecentActivity {
  id: string;
  name: string;
  action: string;
  time: string;
}


// mirror the types used by TodaysSpecial
interface SpecialOccasion {
  id: string;
  name: string;
  designation: string;
  type: "birthday" | "anniversary" | "joining";
  displayDate: string;
  profileImageUrl?: string;
}
interface SpecialOccasions {
  yesterday: SpecialOccasion[];
  today: SpecialOccasion[];
  tomorrow: SpecialOccasion[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    onLeaveToday: 0,
    workFromHomeToday: 0,
    pendingLeaveRequests: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  // birthdays no longer needed; we use specialOccasions API
  const [specialOccasions, setSpecialOccasions] = useState<SpecialOccasions>({
    yesterday: [],
    today: [],
    tomorrow: [],
  });

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify user is authenticated
      const meResponse = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!meResponse.ok) {
        router.push("/login");
        return;
      }

      // Set default stats for now - can be replaced with API calls later
      setStats({
        totalEmployees: 45,
        presentToday: 38,
        onLeaveToday: 3,
        workFromHomeToday: 4,
        pendingLeaveRequests: 5,
      });

      setRecentActivity([
        { id: "1", name: "John Doe", action: "Checked in", time: "08:45 AM" },
        { id: "2", name: "Jane Smith", action: "Checked in", time: "09:15 AM" },
        { id: "3", name: "Mike Johnson", action: "Requested leave", time: "10:30 AM" },
        { id: "4", name: "Sarah Williams", action: "Checked out", time: "05:00 PM" },
        { id: "5", name: "Tom Brown", action: "Applied for WFH", time: "Yesterday" },
      ]);

      // Fetch special occasions (yesterday/today/tomorrow) using the same API as employee dashboard
      try {
        const res = await fetch("/api/todayspecial");
        if (res.ok) {
          const data = await res.json();
          setSpecialOccasions(data);
        }
      } catch (err) {
        console.error("Error fetching special occasions:", err);
        // continue, component will show empty state if needed
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
        <div className="p-4 md:p-8 w-full max-w-[1600px] mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin inline-block w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-purple-600 rounded-full opacity-20 animate-pulse"></div>
                  </div>
                </div>
                <p className="text-gray-600 mt-6 font-medium">Loading your dashboard...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6 shadow-md">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-900 font-semibold text-lg">Error Loading Dashboard</p>
                  <p className="text-red-700 mt-1">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm shadow-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!loading && (
            <>
              {/* Hero Section */}
              <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-2xl shadow-xl p-8 mb-8 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                      Welcome to Admin Dashboard
                    </h1>
                    <p className="text-purple-100 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      System Status: All Systems Operational
                    </p>
                  </div>

                  {/* Live Clock & Date */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 min-w-[200px]">
                    <p className="text-purple-100 text-xs font-medium mb-1">Current Time</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-purple-100 text-sm mt-1">
                      {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats Overview */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Today's Overview</h3>
                    <p className="text-sm text-gray-600">Real-time attendance tracking</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">{Math.round((stats.presentToday / stats.totalEmployees) * 100) || 0}%</p>
                      <p className="text-xs text-gray-600 mt-1">Attendance Rate</p>
                    </div>
                    <div className="h-12 w-px bg-gray-200"></div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
                      <p className="text-xs text-gray-600 mt-1">Total Employees</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                {/* Total Employees */}
                <div className="group bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        👥
                      </div>
                      <p className="text-3xl font-bold text-blue-600">
                        {stats.totalEmployees}
                      </p>
                    </div>
                    <p className="text-gray-900 font-semibold text-sm mb-1">Total Employees</p>
                    <p className="text-gray-500 text-xs">Active in system</p>
                  </div>
                </div>

                {/* Present Today */}
                <div className="group bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        ✅
                      </div>
                      <p className="text-3xl font-bold text-green-600">
                        {stats.presentToday}
                      </p>
                    </div>
                    <p className="text-gray-900 font-semibold text-sm mb-1">Present Today</p>
                    <p className="text-gray-500 text-xs">{stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}% attendance</p>
                  </div>
                </div>

                {/* On Leave */}
                <div className="group bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        🏖️
                      </div>
                      <p className="text-3xl font-bold text-orange-600">
                        {stats.onLeaveToday}
                      </p>
                    </div>
                    <p className="text-gray-900 font-semibold text-sm mb-1">On Leave Today</p>
                    <p className="text-gray-500 text-xs">Approved absences</p>
                  </div>
                </div>

                {/* Work From Home */}
                <div className="group bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        🏠
                      </div>
                      <p className="text-3xl font-bold text-purple-600">
                        {stats.workFromHomeToday}
                      </p>
                    </div>
                    <p className="text-gray-900 font-semibold text-sm mb-1">Work From Home</p>
                    <p className="text-gray-500 text-xs">Remote work today</p>
                  </div>
                </div>

                {/* Pending Requests */}
                <div className="group bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        ⏳
                      </div>
                      <p className="text-3xl font-bold text-red-600">
                        {stats.pendingLeaveRequests}
                      </p>
                    </div>
                    <p className="text-gray-900 font-semibold text-sm mb-1">Pending Requests</p>
                    <p className="text-gray-500 text-xs">Awaiting approval</p>
                  </div>
                </div>
              </div>

              {/* Today's Special Section */}
              <div className="mb-8">
                <TodaysSpecial occasions={specialOccasions} />
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-8 hover:shadow-lg transition-shadow border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Activity</h2>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-semibold text-gray-800">{activity.name}</p>
                          <p className="text-sm text-gray-600 mt-1">{activity.action}</p>
                        </div>
                        <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{activity.time}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>

              {/* Info Banners */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    📊 Attendance Rate
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-blue-600">
                      {stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}%
                    </div>
                    <div className="text-blue-800 text-sm">
                      <p className="font-medium">{stats.presentToday} out of {stats.totalEmployees} employees present today</p>
                      <p className="mt-1 opacity-75">Performance on track</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">
                    ⏳ Pending Approvals
                  </h3>
                  <p className="text-orange-800 text-sm mb-3">
                    You have <strong>{stats.pendingLeaveRequests} leave requests</strong> waiting for your approval.
                  </p>
                  <div className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer text-sm font-medium">
                    Review Requests
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
  );
}
