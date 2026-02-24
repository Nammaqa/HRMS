"use client";

import { Calendar, Clock, Users, TrendingUp, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface SummaryCardsProps {
  presentDays: number;
  absentDays: number;
  leavesDays: number;
  workFromHomeDays: number;
}

interface LeaveBalance {
  earnedLeave: number;
  sickLeave: number;
  specialLeave: number;
}

export function SummaryCards({
  presentDays,
  absentDays,
  leavesDays,
  workFromHomeDays,
}: SummaryCardsProps) {
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const totalDays = presentDays + absentDays + leavesDays + workFromHomeDays;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/leave-balance", {
          credentials: "include",
        });

        if (response.ok) {
          const { data } = await response.json();
          setLeaveBalance(data);
        }
      } catch (error) {
        console.error("Error fetching leave balance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveBalance();
  }, []);

  return (
    <div className="space-y-6">
      {/* Year Indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Attendance Overview</h2>
        <span className="text-sm font-medium text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
          Year {currentYear}
        </span>
      </div>

      {/* Row 1: Present & Absent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Present Days Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present Days</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{presentDays}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        {/* Work From Home Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Work From Home</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{workFromHomeDays}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        {/* Absent Days Card */}
        {/* <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent Days</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{absentDays}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div> */}
      </div>

      {/* Row 2: Leave & Work From Home */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Days Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Leave Days Taken</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{leavesDays}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        
      </div>

      {/* Row 3: Leave Balance */}
      {!loading && leaveBalance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Earned Leave */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-orange-900">Earned Leave</p>
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-4xl font-bold text-orange-700">{leaveBalance.earnedLeave}</p>
            <p className="text-xs text-orange-600 mt-2">Available days</p>
          </div>

          {/* Sick Leave */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-red-900">Sick Leave</p>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-4xl font-bold text-red-700">{leaveBalance.sickLeave.toFixed(1)}</p>
            <p className="text-xs text-red-600 mt-2">Available days</p>
          </div>

          {/* Special Leave */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-blue-900">Special Leave</p>
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-4xl font-bold text-blue-700">{leaveBalance.specialLeave.toFixed(1)}</p>
            <p className="text-xs text-blue-600 mt-2">Available days</p>
          </div>
        </div>
      )}
    </div>
  );
}
