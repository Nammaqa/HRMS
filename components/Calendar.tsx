// "use client";

// import { useState } from "react";
// import { ChevronLeft, ChevronRight } from "lucide-react";

// interface CalendarProps {
//   onDateSelect?: (date: Date) => void;
// }

// export function Calendar({ onDateSelect }: CalendarProps) {
//   const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 11)); // January 11, 2026

//   const getDaysInMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
//   };

//   const getFirstDayOfMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
//   };

//   const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
//   const daysInMonth = getDaysInMonth(currentDate);
//   const firstDay = getFirstDayOfMonth(currentDate);
//   const days = [];

//   // Empty cells for days before month starts
//   for (let i = 0; i < firstDay; i++) {
//     days.push(null);
//   }

//   // Days of the month
//   for (let i = 1; i <= daysInMonth; i++) {
//     days.push(i);
//   }

//   const handlePrevMonth = () => {
//     setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
//   };

//   const handleNextMonth = () => {
//     setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
//   };

//   const handleDateClick = (day: number) => {
//     if (day && onDateSelect) {
//       const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
//       onDateSelect(selectedDate);
//     }
//   };

//   const today = new Date();
//   const isToday = (day: number) =>
//     day === today.getDate() &&
//     currentDate.getMonth() === today.getMonth() &&
//     currentDate.getFullYear() === today.getFullYear();

//   return (
//     <div className="bg-white rounded-lg shadow-md p-4">
//       {/* Calendar Header */}
//       <div className="flex items-center justify-between mb-4">
//         <button
//           onClick={handlePrevMonth}
//           className="p-1 hover:bg-gray-100 rounded-md transition-colors"
//           aria-label="Previous month"
//         >
//           <ChevronLeft className="w-5 h-5 text-gray-600" />
//         </button>
//         <h3 className="text-lg font-semibold text-gray-800">{monthName}</h3>
//         <button
//           onClick={handleNextMonth}
//           className="p-1 hover:bg-gray-100 rounded-md transition-colors"
//           aria-label="Next month"
//         >
//           <ChevronRight className="w-5 h-5 text-gray-600" />
//         </button>
//       </div>

//       {/* Weekday Headers */}
//       <div className="grid grid-cols-7 gap-2 mb-2">
//         {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
//           <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
//             {day}
//           </div>
//         ))}
//       </div>

//       {/* Calendar Days */}
//       <div className="grid grid-cols-7 gap-2">
//         {days.map((day, index) => (
//           <div key={index}>
//             {day ? (
//               <button
//                 onClick={() => handleDateClick(day)}
//                 className={`w-full h-8 text-sm font-medium rounded-md transition-colors ${
//                   isToday(day)
//                     ? "bg-blue-500 text-white hover:bg-blue-600"
//                     : "text-gray-700 hover:bg-gray-100"
//                 }`}
//               >
//                 {day}
//               </button>
//             ) : (
//               <div className="w-full h-8" />
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Legend */}
//       <div className="mt-4 pt-4 border-t border-gray-200">
//         <div className="text-xs text-gray-600 space-y-2">
//           <div className="flex items-center gap-2">
//             <div className="w-3 h-3 bg-blue-500 rounded-full" />
//             <span>Today</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
