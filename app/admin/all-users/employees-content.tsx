"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@mui/material";
import {
  Search,
  Download,
  Edit2,
  Eye,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  designation?: string;
  location?: string;
  dateOfJoining?: string;
  phone?: string;
  role: string;
  profileImageUrl?: string;
//   firstName?: string;
  middleName?: string;
//   lastName?: string;
  bloodGroup?: string;
  gender?: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  alternateContact?: string;
  emergencyContact?: string;
  personalEmail?: string;
  currentAddress?: string;
  permanentAddress?: string;
  projectClient?: string;
  designationAtCompany?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Employee>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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

  const filteredEmployees = employees
    .filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc"
        ? (aValue as any) - (bValue as any)
        : (bValue as any) - (aValue as any);
    });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToCSV = () => {
    if (filteredEmployees.length === 0) return;

    const headers = [
      "Employee ID",
      "Name",
      "Email",
      "Designation",
      "Location",
      "Join Date",
      "Role",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredEmployees.map((emp) =>
        [
          emp.employeeId || "",
          emp.name,
          emp.email,
          emp.designation || "",
          emp.location || "",
          emp.dateOfJoining || "",
          emp.role,
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `employees-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

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
    <div className="p-6">
      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
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

          {/* Export */}
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Summary */}
        <div className="text-sm text-gray-600">
          <p>
            Total Employees:{" "}
            <span className="font-semibold">{employees.length}</span> | Showing:{" "}
            <span className="font-semibold">{filteredEmployees.length}</span>
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Emp. ID
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Designation
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Location
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Join Date
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {employee.employeeId || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {employee.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{employee.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {employee.designation || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {employee.location || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {employee.dateOfJoining
                    ? new Date(employee.dateOfJoining).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setShowDetailsModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
          ))}
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

      {/* Details Modal */}
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

function EmployeeDetailsModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`${employee.name} - ${employee.email}`}
      maxWidth="lg"
      actions={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold">
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </>
      }
    >
      {/* Details */}
      <div className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">First Name:</span>{" "}
                  {employee.firstName || "-"}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Last Name:</span>{" "}
                  {employee.lastName || "-"}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Phone:</span>{" "}
                  {employee.phone || "-"}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">DOB:</span>{" "}
                  {employee.dateOfBirth
                    ? new Date(employee.dateOfBirth).toLocaleDateString()
                    : "-"}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Gender:</span>{" "}
                  {employee.gender || "-"}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Blood Group:</span>{" "}
                  {employee.bloodGroup || "-"}
                </div>
              </div>
            </div>  

            {/* Company Information */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Company Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Employee ID:</span>{" "}
                  {employee.employeeId || "-"}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Designation:</span>{" "}
                  {employee.designation || "-"}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Location:</span>{" "}
                  {employee.location || "-"}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Join Date:</span>{" "}
                  {employee.dateOfJoining
                    ? new Date(employee.dateOfJoining).toLocaleDateString()
                    : "-"}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Project/Client:</span>{" "}
                  {employee.projectClient || "-"}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Experience:</span>{" "}
                  {employee.totalExperience ? `${employee.totalExperience} years` : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Education Information */}
          {employee.masterDegree && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Education</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">
                      Master Degree:
                    </span>{" "}
                    {employee.masterDegree}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Year:</span>{" "}
                    {employee.masterYOP || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Percentage:</span>{" "}
                    {employee.masterPercentage || "-"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bank Information */}
          {employee.bankName && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Bank Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Bank Name:</span>{" "}
                    {employee.bankName || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      Account Holder:
                    </span>{" "}
                    {employee.bankHolderName || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">IFSC Code:</span>{" "}
                    {employee.ifscCode || "-"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ID Information */}
          {(employee.panCard || employee.uanNumber) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Identification</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">PAN Card:</span>{" "}
                    {employee.panCard || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">UAN Number:</span>{" "}
                    {employee.uanNumber || "-"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  }
