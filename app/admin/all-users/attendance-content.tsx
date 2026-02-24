"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Edit2,
  Save,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Calendar,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  loginTime?: string;
  logoutTime?: string;
  totalWorkingHours?: number;
  status: "FULL_DAY" | "HALF_DAY_FIRST" | "HALF_DAY_SECOND" | "ABSENT" | "LEAVE" | "WFH" | "HOLIDAY";
  shift: "FIRST_HALF" | "SECOND_HALF" | "NONE";
  isManual: boolean;
  remarks?: string;
}

interface Employee {
  id: string;
  name: string;
  email?: string;
  designation?: string;
}

export default function AttendanceManagement() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState("today"); // "today" or "logs"
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<Partial<AttendanceRecord>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState<Partial<AttendanceRecord>>({
    status: "FULL_DAY",
    shift: "FIRST_HALF",
  });
  const itemsPerPage = 15;

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(
          data.map((emp: any) => ({
            id: emp.id,
            name: emp.name,
            email: emp.email,
            designation: emp.designation,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/attendance", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch attendance: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Transform the API response to match the interface
      const transformedData = result.data.map((record: any) => ({
        id: record.id,
        userId: record.userId,
        userName: record.user.name,
        date: new Date(record.date).toISOString().split("T")[0],
        loginTime: record.loginTime
          ? new Date(record.loginTime).toTimeString().slice(0, 5)
          : undefined,
        logoutTime: record.logoutTime
          ? new Date(record.logoutTime).toTimeString().slice(0, 5)
          : undefined,
        totalWorkingHours: record.totalWorkingHours,
        status: record.status,
        shift: record.shift,
        isManual: record.isManual,
        remarks: record.remarks,
      }));

      setAttendance(transformedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      alert("Failed to fetch attendance records. Please try again.");
      setLoading(false);
    }
  };

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  // Filter attendance based on selected tab and filters
  const getFilteredAttendance = () => {
    let filtered = attendance;

    // Filter by selected date
    filtered = filtered.filter((record) => record.date === selectedDate);

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((record) =>
        record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.userId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((record) => record.status === filterStatus);
    }

    return filtered;
  };

  // Get attendance statistics for selected date
  const getStatistics = () => {
    const dateRecords = attendance.filter((record) => record.date === selectedDate);
    const presentCount = dateRecords.filter((r) => r.status === "FULL_DAY").length;
    const halfDayCount = dateRecords.filter((r) => 
      r.status === "HALF_DAY_FIRST" || r.status === "HALF_DAY_SECOND"
    ).length;
    const checkedIn = dateRecords.filter((r) => r.loginTime).length;
    const notCheckedIn = employees.length - checkedIn;
    const absentCount = dateRecords.filter((r) => r.status === "ABSENT").length;

    return {
      total: employees.length,
      present: presentCount,
      halfDay: halfDayCount,
      absent: absentCount,
      checkedIn,
      notCheckedIn,
    };
  };

  // Get employees who haven't checked in today
  const getNotCheckedInEmployees = () => {
    const dateRecords = attendance.filter((record) => record.date === selectedDate);
    const checkedInIds = new Set(dateRecords.map((r) => r.userId));
    return employees.filter((emp) => !checkedInIds.has(emp.id));
  };

  // Get checked-in employees for today
  const getTodayCheckedInEmployees = () => {
    const dateRecords = attendance.filter((record) => record.date === selectedDate);
    return dateRecords.filter((r) => r.loginTime).sort((a, b) => {
      const timeA = a.loginTime || "";
      const timeB = b.loginTime || "";
      return timeA.localeCompare(timeB);
    });
  };

  const filteredAttendance = getFilteredAttendance();
  const stats = getStatistics();
  const notCheckedInEmployees = getNotCheckedInEmployees();
  const todayCheckedIn = getTodayCheckedInEmployees();

  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const paginatedAttendance = filteredAttendance.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEditClick = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditData({ ...record });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord) return;

    try {
      // Validate that remarks is provided
      if (!editData.remarks || editData.remarks.trim() === "") {
        alert("Remarks are mandatory when editing attendance");
        return;
      }

      // Make API call to update attendance
      const response = await fetch(`/api/attendance/${selectedRecord.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginTime: editData.loginTime,
          logoutTime: editData.logoutTime,
          status: editData.status,
          shift: editData.shift,
          remarks: editData.remarks,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update attendance");
      }

      const updatedRecord = await response.json();

      // Update local state
      setAttendance((prev) =>
        prev.map((record) =>
          record.id === selectedRecord.id
            ? {
                ...record,
                loginTime: updatedRecord.loginTime
                  ? new Date(updatedRecord.loginTime).toTimeString().slice(0, 5)
                  : undefined,
                logoutTime: updatedRecord.logoutTime
                  ? new Date(updatedRecord.logoutTime).toTimeString().slice(0, 5)
                  : undefined,
                totalWorkingHours: updatedRecord.totalWorkingHours,
                status: updatedRecord.status,
                shift: updatedRecord.shift,
                isManual: updatedRecord.isManual,
                remarks: updatedRecord.remarks,
              }
            : record
        )
      );

      setShowEditModal(false);
      setSelectedRecord(null);
      setEditData({});

      alert("Attendance updated successfully!");
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert(error instanceof Error ? error.message : "Failed to update attendance");
    }
  };

  const handleCreateAttendance = async () => {
    try {
      // Validate required fields
      if (!createData.userId || !createData.date || !createData.status) {
        alert("Employee, date, and status are required");
        return;
      }

      if (!createData.remarks || createData.remarks.trim() === "") {
        alert("Remarks are mandatory when creating attendance");
        return;
      }

      // Make API call to create attendance
      const response = await fetch("/api/attendance", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: createData.userId,
          date: createData.date,
          loginTime: createData.loginTime,
          logoutTime: createData.logoutTime,
          status: createData.status,
          shift: createData.shift,
          remarks: createData.remarks,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create attendance");
      }

      const newRecord = await response.json();

      // Add to local state
      setAttendance((prev) => [
        {
          id: newRecord.id,
          userId: newRecord.userId,
          userName: newRecord.user.name,
          date: new Date(newRecord.date).toISOString().split("T")[0],
          loginTime: newRecord.loginTime
            ? new Date(newRecord.loginTime).toTimeString().slice(0, 5)
            : undefined,
          logoutTime: newRecord.logoutTime
            ? new Date(newRecord.logoutTime).toTimeString().slice(0, 5)
            : undefined,
          totalWorkingHours: newRecord.totalWorkingHours,
          status: newRecord.status,
          shift: newRecord.shift,
          isManual: newRecord.isManual,
          remarks: newRecord.remarks,
        },
        ...prev,
      ]);

      setShowCreateModal(false);
      setCreateData({
        status: "FULL_DAY",
        shift: "FIRST_HALF",
      });

      alert("Attendance created successfully!");
    } catch (error) {
      console.error("Error creating attendance:", error);
      alert(error instanceof Error ? error.message : "Failed to create attendance");
    }
  };

  const exportToCSV = () => {
    if (filteredAttendance.length === 0) return;

    const headers = [
      "Employee Name",
      "Date",
      "Login Time",
      "Logout Time",
      "Working Hours",
      "Status",
      "Manual",
      "Remarks",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredAttendance.map((record) =>
        [
          record.userName,
          record.date,
          record.loginTime || "-",
          record.logoutTime || "-",
          record.totalWorkingHours?.toFixed(2) || "-",
          record.status,
          record.isManual ? "Yes" : "No",
          record.remarks || "-",
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getStatusColor = (
    status: string
  ): string => {
    switch (status) {
      case "FULL_DAY":
        return "bg-green-100 text-green-800";
      case "HALF_DAY_FIRST":
      case "HALF_DAY_SECOND":
        return "bg-yellow-100 text-yellow-800";
      case "ABSENT":
        return "bg-red-100 text-red-800";
      case "LEAVE":
        return "bg-blue-100 text-blue-800";
      case "WFH":
        return "bg-purple-100 text-purple-800";
      case "HOLIDAY":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          <p className="text-gray-600 mt-4">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Attendance Management</h1>
        <p className="text-gray-600">Track and manage employee attendance records</p>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Employees"
          value={stats.total}
          icon={<Users className="w-6 h-6" />}
          bgColor="bg-blue-50"
          textColor="text-blue-600"
          borderColor="border-blue-200"
        />
        <StatCard
          title="Present (Full Day)"
          value={stats.present}
          icon={<CheckCircle2 className="w-6 h-6" />}
          bgColor="bg-green-50"
          textColor="text-green-600"
          borderColor="border-green-200"
        />
        <StatCard
          title="Half Day"
          value={stats.halfDay}
          icon={<TrendingUp className="w-6 h-6" />}
          bgColor="bg-yellow-50"
          textColor="text-yellow-600"
          borderColor="border-yellow-200"
        />
        <StatCard
          title="Absent"
          value={stats.absent}
          icon={<AlertCircle className="w-6 h-6" />}
          bgColor="bg-red-50"
          textColor="text-red-600"
          borderColor="border-red-200"
        />
        <StatCard
          title="Not Checked In"
          value={stats.notCheckedIn}
          icon={<UserX className="w-6 h-6" />}
          bgColor="bg-orange-50"
          textColor="text-orange-600"
          borderColor="border-orange-200"
        />
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <div className="space-y-4">
          {/* Date Picker */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Employee
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY_FIRST">Half Day (1st)</option>
                <option value="HALF_DAY_SECOND">Half Day (2nd)</option>
                <option value="ABSENT">Absent</option>
                <option value="LEAVE">Leave</option>
                <option value="WFH">Work From Home</option>
                <option value="HOLIDAY">Holiday</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow-md border-b border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab("today");
              setCurrentPage(1);
            }}
            className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
              activeTab === "today"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCheck className="w-5 h-5" />
              Today's Attendance
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab("logs");
              setCurrentPage(1);
            }}
            className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
              activeTab === "logs"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              Attendance Logs
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-b-lg shadow-md">
        {activeTab === "today" ? (
          <TodayAttendanceView
            checkedIn={todayCheckedIn}
            notCheckedIn={notCheckedInEmployees}
            onEditClick={handleEditClick}
            getStatusColor={getStatusColor}
          />
        ) : (
          <AttendanceLogsView
            paginatedAttendance={paginatedAttendance}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onEditClick={handleEditClick}
            getStatusColor={getStatusColor}
            filteredCount={filteredAttendance.length}
            totalCount={attendance.length}
          />
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedRecord && (
        <AttendanceEditModal
          record={selectedRecord}
          editData={editData}
          onEditDataChange={setEditData}
          onSave={handleSaveEdit}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRecord(null);
            setEditData({});
          }}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <AttendanceCreateModal
          employees={employees}
          createData={createData}
          onCreateDataChange={setCreateData}
          onSave={handleCreateAttendance}
          onClose={() => {
            setShowCreateModal(false);
            setCreateData({
              status: "FULL_DAY",
              shift: "FIRST_HALF",
            });
          }}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

function StatCard({ title, value, icon, bgColor, textColor, borderColor }: StatCardProps) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-6 flex items-center gap-4 hover:shadow-md transition-shadow`}>
      <div className={`${textColor} p-3 bg-white rounded-lg`}>{icon}</div>
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className={`${textColor} font-bold text-2xl`}>{value}</p>
      </div>
    </div>
  );
}

function TodayAttendanceView({
  checkedIn,
  notCheckedIn,
  onEditClick,
  getStatusColor,
}: {
  checkedIn: AttendanceRecord[];
  notCheckedIn: Employee[];
  onEditClick: (record: AttendanceRecord) => void;
  getStatusColor: (status: string) => string;
}) {
  return (
    <div className="p-6">
      {/* Checked In Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-800">Checked In Today ({checkedIn.length})</h2>
        </div>
        {checkedIn.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-green-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check-in Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check-out Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hours Worked</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {checkedIn.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.userName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        {record.loginTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.logoutTime || "Still working"}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.totalWorkingHours?.toFixed(1) || "-"}h</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                        {record.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => onEditClick(record)} className="text-blue-600 hover:text-blue-900 transition-colors inline-flex items-center gap-1">
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-green-700 font-medium">No check-ins recorded yet for today</p>
          </div>
        )}
      </div>

      {/* Not Checked In Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserX className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-800">Not Checked In Today ({notCheckedIn.length})</h2>
        </div>
        {notCheckedIn.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notCheckedIn.map((emp) => (
              <div key={emp.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <UserX className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{emp.designation || "Employee"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <p className="text-blue-700 font-medium">All employees have checked in!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceLogsView({
  paginatedAttendance,
  totalPages,
  currentPage,
  setCurrentPage,
  onEditClick,
  getStatusColor,
  filteredCount,
  totalCount,
}: {
  paginatedAttendance: AttendanceRecord[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onEditClick: (record: AttendanceRecord) => void;
  getStatusColor: (status: string) => string;
  filteredCount: number;
  totalCount: number;
}) {
  return (
    <div className="p-6">
      {/* Summary */}
      <div className="mb-4 text-sm text-gray-600">
        <p>
          Total Records: <span className="font-semibold text-gray-900">{totalCount}</span> | Filtered: <span className="font-semibold text-gray-900">{filteredCount}</span>
        </p>
      </div>

      {paginatedAttendance.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No attendance records found</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Login</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Logout</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hours</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.userName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.loginTime || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.logoutTime || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.totalWorkingHours?.toFixed(1) || "-"}h</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                        {record.status.replace(/_/g, " ")}
                      </span>
                      {record.isManual && <span className="ml-2 inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">Manual</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => onEditClick(record)} className="text-blue-600 hover:text-blue-900 transition-colors inline-flex items-center gap-1">
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage - 2 + i;
                if (page < 1 || page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"}`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AttendanceEditModal({
  record,
  editData,
  onEditDataChange,
  onSave,
  onClose,
}: {
  record: AttendanceRecord;
  editData: Partial<AttendanceRecord>;
  onEditDataChange: (data: Partial<AttendanceRecord>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Edit Attendance</h2>
            <p className="text-blue-100">
              {record.userName} - {new Date(record.date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-600 rounded transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Login Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Login Time
              </label>
              <input
                type="time"
                value={editData.loginTime || ""}
                onChange={(e) =>
                  onEditDataChange({ ...editData, loginTime: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Logout Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Logout Time
              </label>
              <input
                type="time"
                value={editData.logoutTime || ""}
                onChange={(e) =>
                  onEditDataChange({ ...editData, logoutTime: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attendance Status
            </label>
            <select
              value={editData.status || record.status}
              onChange={(e) =>
                onEditDataChange({
                  ...editData,
                  status: e.target.value as AttendanceRecord["status"],
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="FULL_DAY">Full Day</option>
              <option value="HALF_DAY_FIRST">Half Day (First Half)</option>
              <option value="HALF_DAY_SECOND">Half Day (Second Half)</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
              <option value="WFH">Work From Home</option>
              <option value="HOLIDAY">Holiday</option>
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Remarks (Required for Manual Edit)
            </label>
            <textarea
              value={editData.remarks || ""}
              onChange={(e) =>
                onEditDataChange({ ...editData, remarks: e.target.value })
              }
              placeholder="Add remarks for this attendance change..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold">This edit will be marked as manual.</p>
              <p>An audit log entry will be created for this change.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function AttendanceCreateModal({
  employees,
  createData,
  onCreateDataChange,
  onSave,
  onClose,
}: {
  employees: Array<{ id: string; name: string }>;
  createData: Partial<AttendanceRecord>;
  onCreateDataChange: (data: Partial<AttendanceRecord>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <h2 className="text-2xl font-bold">Add Attendance Record</h2>
          <p className="text-blue-100 mt-1">Create attendance for past or future dates</p>
        </div>

        <div className="p-8 space-y-6 max-h-96 overflow-y-auto">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Employee *
            </label>
            <select
              value={createData.userId || ""}
              onChange={(e) => onCreateDataChange({ ...createData, userId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={createData.date || ""}
              onChange={(e) => onCreateDataChange({ ...createData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status *
            </label>
            <select
              value={createData.status || "FULL_DAY"}
              onChange={(e) => onCreateDataChange({ ...createData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="FULL_DAY">Full Day</option>
              <option value="HALF_DAY_FIRST">Half Day (1st Half)</option>
              <option value="HALF_DAY_SECOND">Half Day (2nd Half)</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
              <option value="WFH">Work From Home</option>
              <option value="HOLIDAY">Holiday</option>
            </select>
          </div>

          {/* Shift */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Shift
            </label>
            <select
              value={createData.shift || "FIRST_HALF"}
              onChange={(e) => onCreateDataChange({ ...createData, shift: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="FIRST_HALF">First Half</option>
              <option value="SECOND_HALF">Second Half</option>
              <option value="NONE">None</option>
            </select>
          </div>

          {/* Login Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Login Time
            </label>
            <input
              type="time"
              value={createData.loginTime || ""}
              onChange={(e) => onCreateDataChange({ ...createData, loginTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Logout Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Logout Time
            </label>
            <input
              type="time"
              value={createData.logoutTime || ""}
              onChange={(e) => onCreateDataChange({ ...createData, logoutTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Remarks * (Mandatory)
            </label>
            <textarea
              value={createData.remarks || ""}
              onChange={(e) => onCreateDataChange({ ...createData, remarks: e.target.value })}
              placeholder="Provide a reason or note for this attendance record"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 px-8 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Attendance
          </button>
        </div>
      </div>
    </div>
  );
}
