"use client";

import { Calendar, AlertCircle, ChevronRight } from "lucide-react";

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "national" | "company" | "festival" | "optional";
}

interface Leave {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface WFH {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

interface HolidaysAndLeavesProps {
  holidays?: Holiday[];
  leaves?: Leave[];
  wfh?: WFH[];
}

export function HolidaysAndLeaves({ holidays = [], leaves = [], wfh = [] }: HolidaysAndLeavesProps) {
  const upcomingHolidays = holidays
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
    
  const pendingLeaves = leaves.filter((l) => l.status === "pending");
  const approvedLeaves = leaves.filter((l) => l.status === "approved");
  const rejectedLeaves = leaves.filter((l) => l.status === "rejected");

  const pendingWFH = wfh.filter((w) => w.status === "pending");
  const approvedWFH = wfh.filter((w) => w.status === "approved");
  const rejectedWFH = wfh.filter((w) => w.status === "rejected");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {/* Holidays & Leaves */}
          </h2>
      </div>

      {/* Upcoming Holidays Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Holidays of this Month</h3>
          <span className="ml-auto text-sm font-semibold text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
            {upcomingHolidays.length}
          </span>
        </div>

        <div className="space-y-3">
          {upcomingHolidays.length > 0 ? (
            upcomingHolidays.map((holiday, index) => (
              <div
                key={holiday.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-200 rounded-lg font-bold text-blue-700">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{holiday.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(holiday.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap ml-4 ${
                    holiday.type === "national"
                      ? "bg-blue-200 text-blue-800"
                      : holiday.type === "company"
                      ? "bg-purple-200 text-purple-800"
                      : holiday.type === "festival"
                      ? "bg-pink-200 text-pink-800"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm">No upcoming holidays</p>
            </div>
          )}
        </div>
      </div>

      {/* Leave Applications Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Leave & WFH Applications</h3>
          {(pendingLeaves.length > 0 || pendingWFH.length > 0) && (
            <span className="ml-auto text-sm font-semibold text-white bg-orange-600 px-3 py-1 rounded-full">
              {pendingLeaves.length + pendingWFH.length} Pending
            </span>
          )}
        </div>

        {/* Pending Leaves and WFH */}
{(pendingLeaves.length > 0 || pendingWFH.length > 0) && (
  <div className="mb-6">
    <h4 className="mb-3 text-sm font-medium text-gray-700 uppercase">
      Pending Approval
    </h4>

    <div className="space-y-2">
      {pendingLeaves.map((leave) => (
        <div
          key={leave.id}
          className="flex items-start justify-between rounded-md border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">
                {leave.type}
              </p>
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                Pending
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-600">
              {new Date(leave.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              –{" "}
              {new Date(leave.endDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>

            {leave.reason && (
              <p className="mt-1 text-sm text-gray-500">
                Reason: {leave.reason}
              </p>
            )}
          </div>

          <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
        </div>
      ))}
      {pendingWFH.map((wfh) => (
        <div
          key={wfh.id}
          className="flex items-start justify-between rounded-md border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">
                Work From Home
              </p>
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                Pending
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-600">
              {new Date(wfh.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              –{" "}
              {new Date(wfh.endDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>

            {wfh.reason && (
              <p className="mt-1 text-sm text-gray-500">
                Reason: {wfh.reason}
              </p>
            )}
          </div>

          <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
        </div>
      ))}
    </div>
  </div>
)}


        {/* Approved Leaves and WFH */}
        {(approvedLeaves.length > 0 || approvedWFH.length > 0) && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 text-green-600 uppercase">
              ✓ Approved
            </h4>
            <div className="space-y-3">
              {approvedLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{leave.type}</p>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-200 text-green-800">
                        Approved
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(leave.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })} - {new Date(leave.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {approvedWFH.map((wfh) => (
                <div
                  key={wfh.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">Work From Home</p>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-200 text-green-800">
                        Approved
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(wfh.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })} - {new Date(wfh.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Leaves and WFH */}
        {(rejectedLeaves.length > 0 || rejectedWFH.length > 0) && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 text-red-600 uppercase">
              ✗ Rejected
            </h4>
            <div className="space-y-3">
              {rejectedLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{leave.type}</p>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-200 text-red-800">
                        Rejected
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(leave.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })} - {new Date(leave.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {rejectedWFH.map((wfh) => (
                <div
                  key={wfh.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">Work From Home</p>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-200 text-red-800">
                        Rejected
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(wfh.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })} - {new Date(wfh.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Applications State */}
        {leaves.length === 0 && wfh.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">No leave or WFH applications</p>
          </div>
        )}

        {/* Apply Button */}
        {/* {leaves.length > 0 && (
          <button className="w-full mt-6 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            Apply for New Leave
          </button>
        )} */}
      </div>
    </div>
  );
}
