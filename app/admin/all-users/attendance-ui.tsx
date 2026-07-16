import { type ReactNode } from "react";
import { AlertCircle, Plus, Save, X } from "lucide-react";

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  loginTime?: string;
  logoutTime?: string;
  loginLatitude?: number;
  loginLongitude?: number;
  logoutLatitude?: number;
  logoutLongitude?: number;
  totalWorkingHours?: number;
  status: "FULL_DAY" | "HALF_DAY_FIRST" | "HALF_DAY_SECOND" | "ABSENT" | "LEAVE" | "WFH" | "HOLIDAY";
  shift: "FIRST_HALF" | "SECOND_HALF" | "NONE";
  isManual: boolean;
  remarks?: string;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
  designation?: string;
}

export function StatCard({
  title,
  value,
  icon,
  bgColor,
  textColor,
  borderColor,
}: {
  title: string;
  value: number | string;
  icon: ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
}) {
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

export function AttendanceEditModal({
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Edit Attendance</h2>
            <p className="text-blue-100">
              {record.userName} - {new Date(record.date).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-600 rounded transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Login Time</label>
              <input
                type="time"
                value={editData.loginTime || ""}
                onChange={(e) => onEditDataChange({ ...editData, loginTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Logout Time</label>
              <input
                type="time"
                value={editData.logoutTime || ""}
                onChange={(e) => onEditDataChange({ ...editData, logoutTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Attendance Status</label>
            <select
              value={editData.status || record.status}
              onChange={(e) => onEditDataChange({ ...editData, status: e.target.value as AttendanceRecord["status"] })}
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks (Required for Manual Edit)</label>
            <textarea
              value={editData.remarks || ""}
              onChange={(e) => onEditDataChange({ ...editData, remarks: e.target.value })}
              placeholder="Add remarks for this attendance change..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold">This edit will be marked as manual.</p>
              <p>An audit log entry will be created for this change.</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
            Cancel
          </button>
          <button onClick={onSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export function AttendanceCreateModal({
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Employee *</label>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
            <input
              type="date"
              value={createData.date || ""}
              onChange={(e) => onCreateDataChange({ ...createData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Shift</label>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Login Time</label>
            <input
              type="time"
              value={createData.loginTime || ""}
              onChange={(e) => onCreateDataChange({ ...createData, loginTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Logout Time</label>
            <input
              type="time"
              value={createData.logoutTime || ""}
              onChange={(e) => onCreateDataChange({ ...createData, logoutTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks * (Mandatory)</label>
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
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
            Cancel
          </button>
          <button onClick={onSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Attendance
          </button>
        </div>
      </div>
    </div>
  );
}
