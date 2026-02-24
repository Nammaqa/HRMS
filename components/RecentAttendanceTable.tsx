"use client";

import { CheckCircle, XCircle, Clock } from "lucide-react";

interface RecentAttendance {
  id: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
}

interface RecentAttendanceTableProps {
  data: RecentAttendance[];
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Present":
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
            Present
          </span>
        </div>
      );
    case "Absent":
      return (
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">
            Absent
          </span>
        </div>
      );
    case "Work From Home":
      return (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            WFH
          </span>
        </div>
      );
    case "Leave":
      return (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
            Leave
          </span>
        </div>
      );
    default:
      return <span className="text-sm text-gray-600">{status}</span>;
  }
}

export function RecentAttendanceTable({ data }: RecentAttendanceTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Recent Attendance</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check-In</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check-Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-800">{record.date}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={record.status} />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{record.checkIn}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{record.checkOut}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">No attendance records found</p>
        </div>
      )}
    </div>
  );
}
