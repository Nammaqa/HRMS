"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, User, Clock } from "lucide-react";

interface Application {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "leave" | "wfh" | "weekend-holiday";
  startDate: string;
  endDate: string;
  inTime?: string;
  outTime?: string;
  leaveType?: string;
  totalDays?: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  attachmentUrl?: string;
  // Weekend/Holiday specific
  dayType?: string;
  holidayName?: string;
  totalWorkingHours?: number;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [applications, setApplications] = useState<Application[]>([]);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = await response.json();
        if (data.user?.role !== "admin") {
          router.push("/employee/dashboard");
          return;
        }

        // Fetch WFH applications
        await fetchApplications();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Fetch WFH, Leave requests, and Weekend/Holiday attendance
      const [wfhResponse, leaveResponse, weekendHolidayResponse] = await Promise.all([
        fetch("/api/wfh", { credentials: "include" }),
        fetch("/api/leave-requests", { credentials: "include" }),
        fetch("/api/weekend-holiday-attendance", { credentials: "include" }),
      ]);

      const allApplications: Application[] = [];

      if (wfhResponse.ok) {
        const { data: wfhData } = await wfhResponse.json();
        allApplications.push(...(wfhData || []));
      }

      if (leaveResponse.ok) {
        const { data: leaveData } = await leaveResponse.json();
        allApplications.push(...(leaveData || []));
      }

      if (weekendHolidayResponse.ok) {
        const { data: weekendHolidayData } = await weekendHolidayResponse.json();
        // Transform weekend/holiday attendance to match Application interface
        const transformedData = weekendHolidayData.map((item: any) => ({
          id: item.id,
          employeeId: item.user.employeeId,
          employeeName: item.user.name,
          type: "weekend-holiday",
          startDate: item.date,
          endDate: item.date,
          dayType: item.dayType,
          holidayName: item.holidayName,
          totalWorkingHours: item.totalWorkingHours,
          reason: `${item.dayType} attendance${
            item.holidayName ? ` (${item.holidayName})` : ""
          }`,
          status: item.status.toLowerCase(),
          createdAt: item.createdAt,
        }));
        allApplications.push(...transformedData);
      }

      // Sort by createdAt descending
      allApplications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setApplications(allApplications);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading applications...</p>
        </div>
      </div>
    );
  }

  const handleApprove = async (id: string, type: "leave" | "wfh" | "weekend-holiday") => {
    try {
      setApproving(id);
      const endpoint =
        type === "leave"
          ? `/api/leave-requests/${id}`
          : type === "weekend-holiday"
          ? `/api/weekend-holiday-attendance/${id}`
          : `/api/wfh/${id}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "APPROVED",
        }),
      });

      if (response.ok) {
        // Update local state
        setApplications(
          applications.map((app) =>
            app.id === id ? { ...app, status: "approved" } : app
          )
        );
        // Broadcast update event
        window.dispatchEvent(new Event(type === "leave" ? "leave-approved" : type === "weekend-holiday" ? "weekend-holiday-approved" : "wfh-approved"));
      } else {
        alert("Failed to approve application");
      }
    } catch (error) {
      console.error("Error approving application:", error);
      alert("Error approving application");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (id: string, type: "leave" | "wfh" | "weekend-holiday") => {
    try {
      setRejecting(id);
      const endpoint =
        type === "leave"
          ? `/api/leave-requests/${id}`
          : type === "weekend-holiday"
          ? `/api/weekend-holiday-attendance/${id}`
          : `/api/wfh/${id}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REJECTED",
        }),
      });

      if (response.ok) {
        // Update local state
        setApplications(
          applications.map((app) =>
            app.id === id ? { ...app, status: "rejected" } : app
          )
        );
        // Broadcast update event
        window.dispatchEvent(new Event(type === "leave" ? "leave-rejected" : type === "weekend-holiday" ? "weekend-holiday-rejected" : "wfh-rejected"));
      } else {
        alert("Failed to reject application");
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert("Error rejecting application");
    } finally {
      setRejecting(null);
    }
  };

  const filteredApplications = applications.filter(
    (app) => filterStatus === "all" || app.status === filterStatus
  );

  const getTypeColor = (type: "leave" | "wfh" | "weekend-holiday") => {
    if (type === "leave") return "bg-orange-100 text-orange-800";
    if (type === "wfh") return "bg-blue-100 text-blue-800";
    return "bg-purple-100 text-purple-800"; // weekend-holiday
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-2">Review and manage employee leave and WFH requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-100 flex gap-2 flex-wrap">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div key={app.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Employee Info */}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{app.employeeName}</p>
                      <p className="text-xs text-gray-600">{app.employeeId}</p>
                    </div>
                  </div>
                </div>

                {/* Type & Details */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Type</p>
                  <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(app.type)}`}>
                    {app.type === "leave"
                      ? "Leave"
                      : app.type === "wfh"
                      ? "Work From Home"
                      : "Weekend/Holiday"}
                  </p>
                  {app.type === "weekend-holiday" && app.dayType && (
                    <p className="text-xs text-gray-500 mt-1">{app.dayType}</p>
                  )}
                </div>

                {/* Date Range or Working Hours */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {app.type === "weekend-holiday" ? "Date" : "Date Range"}
                  </p>
                  {app.type === "weekend-holiday" ? (
                    <>
                      <p className="text-gray-900 font-medium">
                        {new Date(app.startDate).toLocaleDateString()}
                      </p>
                      {app.totalWorkingHours && (
                        <p className="text-xs text-gray-500 mt-1">
                          {app.totalWorkingHours.toFixed(1)} hours
                        </p>
                      )}
                      {app.holidayName && (
                        <p className="text-xs text-gray-500 mt-1">
                          {app.holidayName}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-gray-900 font-medium">
                        {new Date(app.startDate).toLocaleDateString()} -
                        {new Date(app.endDate).toLocaleDateString()}
                      </p>
                      {app.type === "wfh" && app.inTime && app.outTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          {app.inTime} - {app.outTime}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Status */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(app.status)}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">
                  {app.type === "weekend-holiday" ? "Details" : "Reason"}
                </p>
                <p className="text-gray-900">{app.reason}</p>
              </div>

              {/* Attachment */}
              {app.attachmentUrl && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">📎 Supporting Document</p>
                  <a
                    href={app.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    View Document
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Actions */}
              {app.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(app.id, app.type)}
                    disabled={approving === app.id || rejecting === app.id}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approving === app.id ? (
                      <>
                        <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(app.id, app.type)}
                    disabled={approving === app.id || rejecting === app.id}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rejecting === app.id ? (
                      <>
                        <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No {filterStatus !== "all" ? filterStatus : ""} applications</p>
          </div>
        )}
      </div>
    </div>
  );
}
