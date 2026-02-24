"use client";

import { useRouter } from "next/navigation";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { Clock } from "lucide-react";

export default function EmployeePayroll() {
  const router = useRouter();

  return (
    <EmployeeSidebar>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-10 max-w-md w-full text-center shadow-md">
          
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-blue-100">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Payroll Module
          </h1>

          <p className="text-gray-500 mb-6">
            This feature is under development.<br />
            Coming soon 🚀
          </p>

          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Go Back
          </button>

        </div>
      </div>
    </EmployeeSidebar>
  );
}
