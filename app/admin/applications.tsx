"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, User, Clock } from "lucide-react";

interface Application {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "leave" | "wfh";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  leaveType?: string;
  totalDays?: number;
  attachmentUrl?: string;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
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

        // Load applications after auth check
        await fetchApplications();
        setLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchApplications = async () => {
    try {
      setError(null);
      const [leaveResponse, wfhResponse] = await Promise.all([
        fetch("/api/leave-requests", { credentials: "include" }),
        fetch("/api/wfh", { credentials: "include" })
      ]);

      console.log("Leave Response Status:", leaveResponse.status);
      console.log("WFH Response Status:", wfhResponse.status);

      if (!leaveResponse.ok) {
        const leaveError = await leaveResponse.text();
        console.error("Leave API Error:", leaveError);
        throw new Error(`Leave API failed: ${leaveResponse.status}`);
      }

      if (!wfhResponse.ok) {
        const wfhError = await wfhResponse.text();
        console.error("WFH API Error:", wfhError);
        throw new Error(`WFH API failed: ${wfhResponse.status}`);
      }

      const leaveData = await leaveResponse.json();
      const wfhData = await wfhResponse.json();

      // Store debug info
      setDebugInfo({
        leaveApi: { status: leaveResponse.status, data: leaveData },
        wfhApi: { status: wfhResponse.status, data: wfhData },
      });

      console.log("Leave Data:", leaveData);
      console.log("WFH Data:", wfhData);

      const leaveApplications: Application[] = leaveData.data || [];
      const wfhApplications: Application[] = wfhData.data || [];

      console.log("Leave Applications Count:", leaveApplications.length);
      console.log("WFH Applications Count:", wfhApplications.length);

      // Combine and sort by created date (most recent first)
      const allApplications = [...leaveApplications, ...wfhApplications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log("Total Applications:", allApplications.length);
      setApplications(allApplications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError(`Failed to load applications: ${error instanceof Error ? error.message : "Unknown error"}`);
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
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const handleApprove = async (id: string, type: "leave" | "wfh") => {
    try {
      const endpoint = type === "leave" ? `/api/leave-requests/${id}` : `/api/wfh/${id}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve application");
      }

      // Update local state
      setApplications(
        applications.map((app) =>
          app.id === id ? { ...app, status: "approved" } : app
        )
      );
    } catch (error) {
      console.error("Error approving application:", error);
      alert("Failed to approve application. Please try again.");
    }
  };

  const handleReject = async (id: string, type: "leave" | "wfh") => {
    try {
      const endpoint = type === "leave" ? `/api/leave-requests/${id}` : `/api/wfh/${id}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject application");
      }

      // Update local state
      setApplications(
        applications.map((app) =>
          app.id === id ? { ...app, status: "rejected" } : app
        )
      );
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert("Failed to reject application. Please try again.");
    }
  };

  const filteredApplications = applications.filter(
    (app) => filterStatus === "all" || app.status === filterStatus
  );

  const getTypeColor = (type: "leave" | "wfh") => {
    return type === "leave" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800";
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

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

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

                {/* Type & Dates */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Type</p>
                  <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(app.type)}`}>
                    {app.type === "leave" ? "Leave" : "Work From Home"}
                  </p>
                </div>

                {/* Date Range */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date Range</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(app.startDate).toLocaleDateString()} - {new Date(app.endDate).toLocaleDateString()}
                  </p>
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
                <p className="text-sm text-gray-600 mb-1">Reason</p>
                <p className="text-gray-900">{app.reason}</p>
              </div>

              {/* Actions */}
              {app.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(app.id, app.type)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(app.id, app.type)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Reject
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

        {/* Debug Info */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <details className="cursor-pointer">
            <summary className="font-semibold text-gray-800">Debug Info</summary>
            <div className="mt-4 text-xs text-gray-700 bg-white p-3 rounded border border-gray-300 overflow-auto max-h-60">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
//