"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmployeesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/all-users?tab=employees");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin inline-block w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
        <p className="text-gray-600 mt-4 font-medium">Redirecting...</p>
      </div>
    </div>
  );
}

