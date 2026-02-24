"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@mui/material";
import AttendanceManagement from "./attendance-content";
import {
  Search,
  Download,
  Edit2,
  Eye,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Briefcase,
  BookOpen,
  DollarSign,
  FileText,
  Save,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;
  designation?: string;
  bloodGroup?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  dateOfMarriage?: string;
  fatherName?: string;
  motherName?: string;
  alternateContact?: string;
  emergencyContact?: string;
  personalEmail?: string;
  currentAddress?: string;
  permanentAddress?: string;
  projectClient?: string;
  designationAtCompany?: string;
  dateOfJoining?: string;
  dateOfDeployment?: string;
  totalExperience?: number;
  dateOfExit?: string;
  masterDegree?: string;
  masterYOP?: number;
  masterPercentage?: number;
  secondaryDegree?: string;
  secondaryYOP?: number;
  secondaryPercentage?: number;
  twelfthDegree?: string;
  twelfthYOP?: number;
  twelfthPercentage?: number;
  tenthDegree?: string;
  tenthYOP?: number;
  tenthPercentage?: number;
  aadharNumber?: string;
  panCard?: string;
  citizenship?: string;
  bankHolderName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankBranch?: string;
  uanNumber?: string;
  pfNumber?: string;
  laptopProvider?: string;
  assetDetails?: string;
  idCardProvided?: boolean;
  bgvProvided?: boolean;
  previousCompany?: string;
  role: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  loginTime?: string;
  logoutTime?: string;
  totalWorkingHours?: number;
  status: "FULL_DAY" | "HALF_DAY_FIRST" | "HALF_DAY_SECOND" | "ABSENT" | "LEAVE" | "WFH" | "HOLIDAY";
  shift: "FIRST_HALF" | "SECOND_HALF" | "NONE";
  isManual: boolean;
  remarks?: string;
}

interface Holiday {
  id: string;
  date: string;
  name: string;
}

interface AttendanceSummary {
  totalPresent: number;
  totalLeaves: number;
  totalWFH: number;
  totalWorkingDays: number;
  daysWithIncompletHours: Array<{ date: string; hours: number }>;
}

export default function AllEmployeeManagement() {
  const [activeTab, setActiveTab] = useState<"employees" | "attendance">("employees");

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("employees")}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === "employees"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Employees
          </div>
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === "attendance"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Attendance Management
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "employees" && <EmployeeSection />}
      {activeTab === "attendance" && <AttendanceSection />}
    </div>
  );
}

// ============================================
// EMPLOYEE SECTION
// ============================================

function EmployeeSection() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/employees", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.statusText}`);
      }

      const data = await response.json();
      setEmployees(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees:", error);
      alert("Failed to fetch employees. Please try again.");
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          <p className="text-gray-600 mt-4">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => {
            setEditingEmployee(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        <p>
          Total Employees: <span className="font-semibold">{employees.length}</span> | Showing:{" "}
          <span className="font-semibold">{filteredEmployees.length}</span>
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Designation</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{emp.employeeId || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{emp.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{emp.designation || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{emp.location || "-"}</td>
                <td className="px-6 py-4 text-center flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setShowDetailsModal(true);
                    }}
                    className="text-green-600 hover:text-green-900 transition-colors inline-flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => {
                      setEditingEmployee(emp);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 transition-colors inline-flex items-center gap-1"
                  >
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
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
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
                className={`px-3 py-1 border rounded ${
                  currentPage === page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No employees found</p>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <EmployeeFormModal
          employee={editingEmployee}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
          onSave={() => {
            fetchEmployees();
            setShowModal(false);
            setEditingEmployee(null);
          }}
        />
      )}

      {showDetailsModal && selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// EMPLOYEE FORM MODAL
// ============================================

interface EmployeeFormModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSave: () => void;
}

function EmployeeFormModal({ employee, onClose, onSave }: EmployeeFormModalProps) {
  const [formData, setFormData] = useState<Partial<Employee>>(
    employee || {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      designation: "",
      location: "",
      dateOfBirth: "",
      gender: "",
      bloodGroup: "",
      maritalStatus: "",
      dateOfMarriage: "",
      fatherName: "",
      motherName: "",
      alternateContact: "",
      emergencyContact: "",
      personalEmail: "",
      currentAddress: "",
      permanentAddress: "",
      projectClient: "",
      designationAtCompany: "",
      dateOfJoining: "",
      dateOfDeployment: "",
      totalExperience: 0,
      dateOfExit: "",
      masterDegree: "",
      masterYOP: undefined,
      masterPercentage: undefined,
      secondaryDegree: "",
      secondaryYOP: undefined,
      secondaryPercentage: undefined,
      twelfthDegree: "",
      twelfthYOP: undefined,
      twelfthPercentage: undefined,
      tenthDegree: "",
      tenthYOP: undefined,
      tenthPercentage: undefined,
      aadharNumber: "",
      panCard: "",
      citizenship: "",
      bankHolderName: "",
      bankName: "",
      bankAccountNumber: "",
      ifscCode: "",
      bankBranch: "",
      uanNumber: "",
      pfNumber: "",
      laptopProvider: "",
      assetDetails: "",
      idCardProvided: false,
      bgvProvided: false,
      previousCompany: "",
      role: "employee",
      password: "",
    }
  );

  const [activeTab, setActiveTab] = useState<
    "personal" | "contact" | "employment" | "education" | "banking" | "documents" | "security" | "photo"
  >("personal");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof Employee, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Combine first, middle, last name for name field
      const fullName = `${formData.firstName || ""} ${formData.middleName || ""} ${formData.lastName || ""}`
        .trim()
        .replace(/\s+/g, " ");

      const payload = {
        ...formData,
        name: fullName,
      };

      const method = employee ? "PUT" : "POST";
      const url = employee ? `/api/employees/${employee.id}` : "/api/employees";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save employee");
      }

      alert(employee ? "Employee updated successfully!" : "Employee created successfully!");
      onSave();
    } catch (error) {
      console.error("Error saving employee:", error);
      alert(error instanceof Error ? error.message : "Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={employee ? "Edit Employee" : "Add New Employee"}
      maxWidth="lg"
      actions={
        <>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      {/* Tab Navigation */}
      <div className="flex gap-0 border-b border-gray-200 bg-gray-50 overflow-x-auto -mx-6 mb-6">
        {[
          { id: "photo", label: "Photo", icon: User },
            { id: "personal", label: "Personal", icon: User },
            { id: "contact", label: "Contact", icon: FileText },
            { id: "employment", label: "Employment", icon: Briefcase },
            { id: "education", label: "Education", icon: BookOpen },
            { id: "banking", label: "Banking", icon: DollarSign },
            { id: "documents", label: "Documents", icon: FileText },
            { id: "security", label: "Security", icon: Lock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === id
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "personal" && (
            <PersonalInfoTab formData={formData} handleInputChange={handleInputChange} />
          )}
          {activeTab === "contact" && (
            <ContactInfoTab formData={formData} handleInputChange={handleInputChange} />
          )}
          {activeTab === "personal" && (
            <PersonalInfoTab formData={formData} handleInputChange={handleInputChange} />
          )}
          {activeTab === "contact" && (
            <ContactInfoTab formData={formData} handleInputChange={handleInputChange} />
          )}
          {activeTab === "employment" && (
            <EmploymentInfoTab formData={formData} handleInputChange={handleInputChange} />
          )}
          {activeTab === "education" && (
            <EducationInfoTab formData={formData} handleInputChange={handleInputChange} />
          )}
          {activeTab === "banking" && (
            <BankingInfoTab formData={formData} handleInputChange={handleInputChange} />
          )}
          {activeTab === "documents" && (
            <DocumentsInfoTab formData={formData} handleInputChange={handleInputChange} />
          )}
          {activeTab === "security" && (
            <SecurityInfoTab formData={formData} handleInputChange={handleInputChange} employee={employee} />
          )}
          {activeTab === "photo" && (
            <ProfilePhotoTab formData={formData} handleInputChange={handleInputChange} />
          )}
        </div>
      </Modal>
    );
  }

// ============================================
// TAB COMPONENTS FOR EMPLOYEE FORM
// ============================================

function PersonalInfoTab({
  formData,
  handleInputChange,
}: {
  formData: Partial<Employee>;
  handleInputChange: (field: keyof Employee, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
        <input
          type="text"
          value={formData.firstName || ""}
          onChange={(e) => handleInputChange("firstName", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Name</label>
        <input
          type="text"
          value={formData.middleName || ""}
          onChange={(e) => handleInputChange("middleName", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
        <input
          type="text"
          value={formData.lastName || ""}
          onChange={(e) => handleInputChange("lastName", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
        <input
          type="date"
          value={formData.dateOfBirth || ""}
          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
        <select
          value={formData.gender || ""}
          onChange={(e) => handleInputChange("gender", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group</label>
        <input
          type="text"
          value={formData.bloodGroup || ""}
          onChange={(e) => handleInputChange("bloodGroup", e.target.value)}
          placeholder="e.g., O+, B-, A+, AB"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Marital Status</label>
        <select
          value={formData.maritalStatus || ""}
          onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Status</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
          <option value="Divorced">Divorced</option>
          <option value="Widowed">Widowed</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Marriage</label>
        <input
          type="date"
          value={formData.dateOfMarriage || ""}
          onChange={(e) => handleInputChange("dateOfMarriage", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Father's Name</label>
        <input
          type="text"
          value={formData.fatherName || ""}
          onChange={(e) => handleInputChange("fatherName", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Mother's Name</label>
        <input
          type="text"
          value={formData.motherName || ""}
          onChange={(e) => handleInputChange("motherName", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Citizenship</label>
        <input
          type="text"
          value={formData.citizenship || ""}
          onChange={(e) => handleInputChange("citizenship", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

function ContactInfoTab({
  formData,
  handleInputChange,
}: {
  formData: Partial<Employee>;
  handleInputChange: (field: keyof Employee, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
        <input
          type="email"
          value={formData.email || ""}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
        <input
          type="tel"
          value={formData.phone || ""}
          onChange={(e) => handleInputChange("phone", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Personal Email</label>
        <input
          type="email"
          value={formData.personalEmail || ""}
          onChange={(e) => handleInputChange("personalEmail", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Alternate Contact</label>
        <input
          type="tel"
          value={formData.alternateContact || ""}
          onChange={(e) => handleInputChange("alternateContact", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact</label>
        <input
          type="tel"
          value={formData.emergencyContact || ""}
          onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Current Address</label>
        <textarea
          value={formData.currentAddress || ""}
          onChange={(e) => handleInputChange("currentAddress", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Permanent Address</label>
        <textarea
          value={formData.permanentAddress || ""}
          onChange={(e) => handleInputChange("permanentAddress", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
    </div>
  );
}

function EmploymentInfoTab({
  formData,
  handleInputChange,
}: {
  formData: Partial<Employee>;
  handleInputChange: (field: keyof Employee, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
        <input
          type="text"
          value={formData.employeeId || ""}
          onChange={(e) => handleInputChange("employeeId", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
        <input
          type="text"
          value={formData.designation || ""}
          onChange={(e) => handleInputChange("designation", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Designation at Company</label>
        <input
          type="text"
          value={formData.designationAtCompany || ""}
          onChange={(e) => handleInputChange("designationAtCompany", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
        <input
          type="text"
          value={formData.location || ""}
          onChange={(e) => handleInputChange("location", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Project/Client</label>
        <input
          type="text"
          value={formData.projectClient || ""}
          onChange={(e) => handleInputChange("projectClient", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Joining</label>
        <input
          type="date"
          value={formData.dateOfJoining || ""}
          onChange={(e) => handleInputChange("dateOfJoining", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Deployment</label>
        <input
          type="date"
          value={formData.dateOfDeployment || ""}
          onChange={(e) => handleInputChange("dateOfDeployment", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Total Experience (Years)</label>
        <input
          type="number"
          value={formData.totalExperience || ""}
          onChange={(e) => handleInputChange("totalExperience", parseFloat(e.target.value))}
          step="0.5"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Exit</label>
        <input
          type="date"
          value={formData.dateOfExit || ""}
          onChange={(e) => handleInputChange("dateOfExit", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Previous Company</label>
        <input
          type="text"
          value={formData.previousCompany || ""}
          onChange={(e) => handleInputChange("previousCompany", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

function EducationInfoTab({
  formData,
  handleInputChange,
}: {
  formData: Partial<Employee>;
  handleInputChange: (field: keyof Employee, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Master Degree */}
      <div className="border-l-4 border-blue-600 pl-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Master Degree</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Degree Name</label>
            <input
              type="text"
              value={formData.masterDegree || ""}
              onChange={(e) => handleInputChange("masterDegree", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing</label>
            <input
              type="number"
              value={formData.masterYOP || ""}
              onChange={(e) => handleInputChange("masterYOP", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Percentage</label>
            <input
              type="number"
              value={formData.masterPercentage || ""}
              onChange={(e) => handleInputChange("masterPercentage", parseFloat(e.target.value))}
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Secondary Degree */}
      <div className="border-l-4 border-green-600 pl-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Secondary/Bachelor Degree</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Degree Name</label>
            <input
              type="text"
              value={formData.secondaryDegree || ""}
              onChange={(e) => handleInputChange("secondaryDegree", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing</label>
            <input
              type="number"
              value={formData.secondaryYOP || ""}
              onChange={(e) => handleInputChange("secondaryYOP", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Percentage</label>
            <input
              type="number"
              value={formData.secondaryPercentage || ""}
              onChange={(e) => handleInputChange("secondaryPercentage", parseFloat(e.target.value))}
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 12th Grade */}
      <div className="border-l-4 border-yellow-600 pl-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">12th Grade</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Degree Name</label>
            <input
              type="text"
              value={formData.twelfthDegree || ""}
              onChange={(e) => handleInputChange("twelfthDegree", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing</label>
            <input
              type="number"
              value={formData.twelfthYOP || ""}
              onChange={(e) => handleInputChange("twelfthYOP", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Percentage</label>
            <input
              type="number"
              value={formData.twelfthPercentage || ""}
              onChange={(e) => handleInputChange("twelfthPercentage", parseFloat(e.target.value))}
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 10th Grade */}
      <div className="border-l-4 border-red-600 pl-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">10th Grade</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Degree Name</label>
            <input
              type="text"
              value={formData.tenthDegree || ""}
              onChange={(e) => handleInputChange("tenthDegree", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing</label>
            <input
              type="number"
              value={formData.tenthYOP || ""}
              onChange={(e) => handleInputChange("tenthYOP", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Percentage</label>
            <input
              type="number"
              value={formData.tenthPercentage || ""}
              onChange={(e) => handleInputChange("tenthPercentage", parseFloat(e.target.value))}
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BankingInfoTab({
  formData,
  handleInputChange,
}: {
  formData: Partial<Employee>;
  handleInputChange: (field: keyof Employee, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Holder Name</label>
        <input
          type="text"
          value={formData.bankHolderName || ""}
          onChange={(e) => handleInputChange("bankHolderName", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
        <input
          type="text"
          value={formData.bankName || ""}
          onChange={(e) => handleInputChange("bankName", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
        <input
          type="text"
          value={formData.bankAccountNumber || ""}
          onChange={(e) => handleInputChange("bankAccountNumber", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
        <input
          type="text"
          value={formData.ifscCode || ""}
          onChange={(e) => handleInputChange("ifscCode", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Branch</label>
        <input
          type="text"
          value={formData.bankBranch || ""}
          onChange={(e) => handleInputChange("bankBranch", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">UAN Number</label>
        <input
          type="text"
          value={formData.uanNumber || ""}
          onChange={(e) => handleInputChange("uanNumber", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">PF Number</label>
        <input
          type="text"
          value={formData.pfNumber || ""}
          onChange={(e) => handleInputChange("pfNumber", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

function DocumentsInfoTab({
  formData,
  handleInputChange,
}: {
  formData: Partial<Employee>;
  handleInputChange: (field: keyof Employee, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Aadhar Number</label>
        <input
          type="text"
          value={formData.aadharNumber || ""}
          onChange={(e) => handleInputChange("aadharNumber", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">PAN Card</label>
        <input
          type="text"
          value={formData.panCard || ""}
          onChange={(e) => handleInputChange("panCard", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Laptop Provider</label>
        <select
          value={formData.laptopProvider || ""}
          onChange={(e) => handleInputChange("laptopProvider", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Provider</option>
          <option value="Wizzybox">Wizzybox</option>
          <option value="Client">Client</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">ID Card Provided</label>
        <select
          value={formData.idCardProvided ? "yes" : "no"}
          onChange={(e) => handleInputChange("idCardProvided", e.target.value === "yes")}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">BGV Provided</label>
        <select
          value={formData.bgvProvided ? "yes" : "no"}
          onChange={(e) => handleInputChange("bgvProvided", e.target.value === "yes")}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Asset Details</label>
        <textarea
          value={formData.assetDetails || ""}
          onChange={(e) => handleInputChange("assetDetails", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
    </div>
  );
}

// ============================================
// EMPLOYEE DETAILS MODAL (VIEW ONLY)
// ============================================

function EmployeeDetailsModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "personal" | "contact" | "employment" | "education" | "banking" | "documents"
  >("personal");

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Employee Details - ${employee.name}`}
      maxWidth="lg"
      actions={
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
        >
          Close
        </button>
      }
    >
      {/* Tab Navigation */}
      <div className="flex gap-0 border-b border-gray-200 bg-gray-50 overflow-x-auto -mx-6 mb-6">
          {[
            { id: "personal", label: "Personal", icon: User },
            { id: "contact", label: "Contact", icon: FileText },
            { id: "employment", label: "Employment", icon: Briefcase },
            { id: "education", label: "Education", icon: BookOpen },
            { id: "banking", label: "Banking", icon: DollarSign },
            { id: "documents", label: "Documents", icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === id
                  ? "border-green-600 text-green-600 bg-white"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "personal" && <EmployeeDetailRow employee={employee} type="personal" />}
          {activeTab === "contact" && <EmployeeDetailRow employee={employee} type="contact" />}
          {activeTab === "employment" && <EmployeeDetailRow employee={employee} type="employment" />}
          {activeTab === "education" && <EmployeeDetailRow employee={employee} type="education" />}
          {activeTab === "banking" && <EmployeeDetailRow employee={employee} type="banking" />}
          {activeTab === "documents" && <EmployeeDetailRow employee={employee} type="documents" />}
        </div>
      </Modal>
    );
  }

  function EmployeeDetailRow({
    employee,
  type,
}: {
  employee: Employee;
  type: "personal" | "contact" | "employment" | "education" | "banking" | "documents";
}) {
  const renderField = (label: string, value: any) => {
    if (value === null || value === undefined || value === "") return null;
    return (
      <div key={label} className="grid grid-cols-2 gap-4 py-2 border-b border-gray-200">
        <dt className="font-semibold text-gray-700">{label}</dt>
        <dd className="text-gray-600">{value?.toString()}</dd>
      </div>
    );
  };

  if (type === "personal") {
    return (
      <div className="space-y-2">
        {renderField("First Name", employee.firstName)}
        {renderField("Middle Name", employee.middleName)}
        {renderField("Last Name", employee.lastName)}
        {renderField("Date of Birth", employee.dateOfBirth)}
        {renderField("Gender", employee.gender)}
        {renderField("Blood Group", employee.bloodGroup)}
        {renderField("Marital Status", employee.maritalStatus)}
        {renderField("Date of Marriage", employee.dateOfMarriage)}
        {renderField("Father's Name", employee.fatherName)}
        {renderField("Mother's Name", employee.motherName)}
        {renderField("Citizenship", employee.citizenship)}
      </div>
    );
  }

  if (type === "contact") {
    return (
      <div className="space-y-2">
        {renderField("Email", employee.email)}
        {renderField("Personal Email", employee.personalEmail)}
        {renderField("Phone", employee.phone)}
        {renderField("Alternate Contact", employee.alternateContact)}
        {renderField("Emergency Contact", employee.emergencyContact)}
        {renderField("Current Address", employee.currentAddress)}
        {renderField("Permanent Address", employee.permanentAddress)}
      </div>
    );
  }

  if (type === "employment") {
    return (
      <div className="space-y-2">
        {renderField("Employee ID", employee.employeeId)}
        {renderField("Designation", employee.designation)}
        {renderField("Designation at Company", employee.designationAtCompany)}
        {renderField("Location", employee.location)}
        {renderField("Project/Client", employee.projectClient)}
        {renderField("Date of Joining", employee.dateOfJoining)}
        {renderField("Date of Deployment", employee.dateOfDeployment)}
        {renderField("Total Experience (Years)", employee.totalExperience)}
        {renderField("Date of Exit", employee.dateOfExit)}
        {renderField("Previous Company", employee.previousCompany)}
      </div>
    );
  }

  if (type === "education") {
    return (
      <div className="space-y-4">
        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="font-semibold text-gray-700 mb-2">Master Degree</h3>
          <div className="space-y-2">
            {renderField("Degree", employee.masterDegree)}
            {renderField("Year of Passing", employee.masterYOP)}
            {renderField("Percentage", employee.masterPercentage)}
          </div>
        </div>
        <div className="border-l-4 border-green-600 pl-4">
          <h3 className="font-semibold text-gray-700 mb-2">Secondary Degree</h3>
          <div className="space-y-2">
            {renderField("Degree", employee.secondaryDegree)}
            {renderField("Year of Passing", employee.secondaryYOP)}
            {renderField("Percentage", employee.secondaryPercentage)}
          </div>
        </div>
        <div className="border-l-4 border-yellow-600 pl-4">
          <h3 className="font-semibold text-gray-700 mb-2">12th Grade</h3>
          <div className="space-y-2">
            {renderField("Degree", employee.twelfthDegree)}
            {renderField("Year of Passing", employee.twelfthYOP)}
            {renderField("Percentage", employee.twelfthPercentage)}
          </div>
        </div>
        <div className="border-l-4 border-red-600 pl-4">
          <h3 className="font-semibold text-gray-700 mb-2">10th Grade</h3>
          <div className="space-y-2">
            {renderField("Degree", employee.tenthDegree)}
            {renderField("Year of Passing", employee.tenthYOP)}
            {renderField("Percentage", employee.tenthPercentage)}
          </div>
        </div>
      </div>
    );
  }

  if (type === "banking") {
    return (
      <div className="space-y-2">
        {renderField("Bank Holder Name", employee.bankHolderName)}
        {renderField("Bank Name", employee.bankName)}
        {renderField("Account Number", employee.bankAccountNumber)}
        {renderField("IFSC Code", employee.ifscCode)}
        {renderField("Bank Branch", employee.bankBranch)}
        {renderField("UAN Number", employee.uanNumber)}
        {renderField("PF Number", employee.pfNumber)}
      </div>
    );
  }

  if (type === "documents") {
    return (
      <div className="space-y-2">
        {renderField("Aadhar Number", employee.aadharNumber)}
        {renderField("PAN Card", employee.panCard)}
        {renderField("Laptop Provider", employee.laptopProvider)}
        {renderField("ID Card Provided", employee.idCardProvided ? "Yes" : "No")}
        {renderField("BGV Provided", employee.bgvProvided ? "Yes" : "No")}
        {renderField("Asset Details", employee.assetDetails)}
      </div>
    );
  }

  return null;
}

// ============================================
// SECURITY TAB COMPONENT
// ============================================

function SecurityInfoTab({
  formData,
  handleInputChange,
  employee,
}: {
  formData: Partial<Employee>;
  handleInputChange: (field: keyof Employee, value: any) => void;
  employee: Employee | null;
}) {
  return (
    <div className="space-y-6">
      {/* Password Section */}
      <div className="border-l-4 border-red-600 pl-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Password Management</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password {!employee ? "*" : "(Leave empty to keep current)"}
            </label>
            <input
              type="password"
              value={formData.password || ""}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder={employee ? "Enter new password (optional)" : "Enter password"}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              {employee
                ? "Only enter a password if you want to change it. Leave blank to keep the current password."
                : "Create a strong password for the new employee account."}
            </p>
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">Password Requirements:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ At least 8 characters long</li>
              <li>✓ Should contain uppercase letters (A-Z)</li>
              <li>✓ Should contain lowercase letters (a-z)</li>
              <li>✓ Should contain numbers (0-9)</li>
              <li>✓ Should contain special characters (!@#$%^&*)</li>
            </ul>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">User Role *</label>
            <select
              value={formData.role || "employee"}
              onChange={(e) => handleInputChange("role", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="intern">Intern</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Select the role to determine system access and permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Account Status */}
      {employee && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Account Created:</span>
              <span className="font-medium text-gray-900">
                {employee.createdAt
                  ? new Date(employee.createdAt).toLocaleDateString()
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium text-gray-900">
                {employee.updatedAt
                  ? new Date(employee.updatedAt).toLocaleDateString()
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Role:</span>
              <span className="font-medium text-gray-900 capitalize">{employee.role}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// ATTENDANCE SECTION
// ============================================

function AttendanceSection() {
  return <AttendanceManagement />;
}

// ============================================
// PROFILE PHOTO TAB COMPONENT
// ============================================

function ProfilePhotoTab({
  formData,
  handleInputChange,
}: {
  formData: Partial<Employee>;
  handleInputChange: (field: keyof Employee, value: any) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(formData.profileImageUrl || null);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);

      // Upload to API endpoint
      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      // Handle both Cloudinary response (secure_url) and custom response (url)
      const imageUrl = data.secure_url || data.url;

      // Show preview
      setPreview(imageUrl);

      // Update form data
      handleInputChange("profileImageUrl", imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    handleInputChange("profileImageUrl", null);
  };

  return (
    <div className="space-y-6">
      {/* Photo Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <div className="flex flex-col items-center justify-center">
          {preview ? (
            <>
              <div className="relative mb-4">
                <img
                  src={preview}
                  alt="Profile"
                  className="w-48 h-48 rounded-full object-cover border-4 border-blue-200"
                />
              </div>
              <p className="text-center text-gray-700 font-semibold mb-4">Photo Preview</p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-center text-gray-600 mb-2">No photo uploaded</p>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 w-full bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Upload Input */}
          <label className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <button
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                input?.click();
              }}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Choose Photo"}
            </button>
          </label>

          {/* Remove Button */}
          {preview && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Remove Photo
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700 font-semibold mb-2">📸 Photo Upload Guidelines</p>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Supported formats: JPG, PNG, GIF, WebP</li>
          <li>• Maximum file size: 5MB</li>
          <li>• Recommended size: 400x400 pixels or larger</li>
          <li>• Square images work best for profile photos</li>
        </ul>
      </div>
    </div>
  );
}
