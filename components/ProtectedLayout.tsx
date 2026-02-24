// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { ReactNode } from "react";

// interface ProtectedLayoutProps {
//   children: ReactNode;
//   requiredRole: "admin" | "user";
// }

// export function ProtectedLayout({
//   children,
//   requiredRole,
// }: ProtectedLayoutProps) {
//   const router = useRouter();
//   const [isValid, setIsValid] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const validateAccess = async () => {
//       try {
//         const response = await fetch("/api/auth/me", {
//           method: "GET",
//           credentials: "include",
//         });

//         if (!response.ok) {
//           router.push("/login");
//           return;
//         }

//         const data = await response.json();
//         const userRole = data.user?.role;

//         // Check if user has correct role
//         if (requiredRole === "admin" && userRole !== "admin") {
//           router.push("/employee");
//           return;
//         }

//         if (requiredRole === "user" && userRole === "admin") {
//           router.push("/admin");
//           return;
//         }

//         setIsValid(true);
//       } catch (error) {
//         console.error("Auth check failed:", error);
//         router.push("/login");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     validateAccess();
//   }, [router, requiredRole]);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-gray-100">
//         <div className="text-center">
//           <div className="h-12 w-12 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!isValid) {
//     return null;
//   }

//   return <>{children}</>;
// }
