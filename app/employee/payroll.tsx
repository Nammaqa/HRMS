"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EmployeePayroll() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-12 border border-gray-200 text-center">
          <div className="text-6xl mb-4">💼</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Payroll Module</h1>
          <p className="text-xl text-gray-600 mb-8">Coming Soon</p>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The payroll module is currently under development. This feature will allow you to view your salary
            information, payslips, and tax details.
          </p>
          <button
            onClick={() => router.push("/employee/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
