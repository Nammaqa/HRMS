"use client";

import { useEffect, useState } from "react";

interface EmployeeSummaryRow {
  userId: number;
  name: string;
  email: string;
  totalPresentDays: number;
  totalLeaveDays: number;
  totalWFHDays: number;
  totalAbsentDays: number;
}

export default function EmployeeSummarySection() {
  const [rows, setRows] = useState<EmployeeSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/admin/employee-summary", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to load summary: ${response.statusText}`);
        }

        const data: EmployeeSummaryRow[] = await response.json();
        setRows(data);
      } catch (err) {
        console.error("Error fetching employee summary:", err);
        setError("Unable to load employee summary. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const formatNumber = (value: number) => {
    return Number.isInteger(value) ? value : +value.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          <p className="text-gray-600 mt-4">Loading employee summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
        <p className="text-lg font-semibold">No employee summary data available.</p>
        <p className="mt-2">Add attendance, leave, or WFH records to see the summary populated.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Employee Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Email
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Present Days
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Leave Days
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              WFH Days
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Absent Days
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row) => (
            <tr key={row.userId} className="hover:bg-slate-50">
              <td className="px-4 py-4 text-sm font-medium text-gray-900">
                {row.name}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {row.email}
              </td>
              <td className="px-4 py-4 text-sm text-right text-gray-900">
                {formatNumber(row.totalPresentDays)}
              </td>
              <td className="px-4 py-4 text-sm text-right text-gray-900">
                {formatNumber(row.totalLeaveDays)}
              </td>
              <td className="px-4 py-4 text-sm text-right text-gray-900">
                {formatNumber(row.totalWFHDays)}
              </td>
              <td className="px-4 py-4 text-sm text-right text-gray-900">
                {formatNumber(row.totalAbsentDays)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
