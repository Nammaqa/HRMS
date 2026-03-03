"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@mui/material";
import { Edit2 } from "lucide-react";

interface LeaveRecord {
  id: number;
  userId: number;
  employeeName: string;
  sickLeave: number;
  specialLeave: number;
  bereavementLeave: number;
  paternityLeave: number;
  earnedLeave: number;
  lossOfPayDays: number;
  compact: number;
  currentYear: number;
}

export default function LeaveSection() {
  const [balances, setBalances] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LeaveRecord | null>(null);

  useEffect(() => {
    fetchBalances();
  }, []);

  // make extra sure balances never becomes something else
  useEffect(() => {
    if (!Array.isArray(balances)) {
      console.error("LeaveSection: balances is not an array", balances);
      setBalances([]);
    }
  }, [balances]);

  async function fetchBalances() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leave-balance", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        if (Array.isArray(data.data)) {
          setBalances(data.data);
        } else {
          console.warn("Leave API returned non-array, normalising to []", data.data);
          setBalances([]);
        }
      } else {
        console.error("Failed to load leave balances", data);
      }
    } catch (e) {
      console.error("Error fetching balances", e);
    } finally {
      setLoading(false);
    }
  }

  function openEditor(record: LeaveRecord) {
    setEditing(record);
    setShowModal(true);
  }

  function closeEditor() {
    setEditing(null);
    setShowModal(false);
  }

  async function saveChanges(updated: Partial<LeaveRecord> & { userId: number }) {
    try {
      const res = await fetch("/api/admin/leave-balance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        fetchBalances();
        closeEditor();
      } else {
        alert(data.error || "Unable to update leave balance");
      }
    } catch (e) {
      console.error("Update request failed", e);
      alert("Update failed");
    }
  }

  // early-guard: if state ever becomes non-array, avoid crashing
  if (!Array.isArray(balances)) {
    console.error("LeaveSection render guard triggered, balances:", balances);
    return (
      <div className="p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Leave Balances</h2>
      {loading && <p>Loading...</p>}
      {!loading && (!Array.isArray(balances) || balances.length === 0) && <p>No leave balances found.</p>}
      {!loading && Array.isArray(balances) && balances.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Employee</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Earned</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Sick</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Special</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Bereavement</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Paternity</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">LOP</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Compact</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Year</th>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(Array.isArray(balances) ? balances : []).map((b) => (
                <tr key={b.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-sm text-gray-800">{b.employeeName || "Unknown"}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{b.earnedLeave}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{b.sickLeave}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{b.specialLeave}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{b.bereavementLeave}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{b.paternityLeave}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{b.lossOfPayDays}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{b.compact}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{b.currentYear}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => openEditor(b)}
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
      )}

      {showModal && editing && (
        <EditLeaveModal
          record={editing}
          onClose={closeEditor}
          onSave={saveChanges}
        />
      )}
    </div>
  );
}

interface EditLeaveModalProps {
  record: LeaveRecord;
  onClose: () => void;
  onSave: (updated: Partial<LeaveRecord> & { userId: number }) => void;
}

function EditLeaveModal({ record, onClose, onSave }: EditLeaveModalProps) {
  const [form, setForm] = useState<Partial<LeaveRecord>>({ ...record });

  function handleChange(
    field: keyof LeaveRecord,
    value: string | number
  ) {
    const num = typeof value === "string" ? parseFloat(value) : value;
    setForm((prev) => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
  }

  return (
    <Modal open={true} onClose={onClose} title="Edit Leave Balance">
      <div className="space-y-4">
        <p className="font-semibold">{record.employeeName}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Earned</label>
            <input
              type="number"
              step="0.25"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={form.earnedLeave ?? 0}
              onChange={(e) => handleChange("earnedLeave", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sick</label>
            <input
              type="number"
              step="0.25"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={form.sickLeave ?? 0}
              onChange={(e) => handleChange("sickLeave", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Special</label>
            <input
              type="number"
              step="0.25"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={form.specialLeave ?? 0}
              onChange={(e) => handleChange("specialLeave", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bereavement</label>
            <input
              type="number"
              step="0.25"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={form.bereavementLeave ?? 0}
              onChange={(e) => handleChange("bereavementLeave", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Paternity</label>
            <input
              type="number"
              step="0.25"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={form.paternityLeave ?? 0}
              onChange={(e) => handleChange("paternityLeave", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">LOP</label>
            <input
              type="number"
              step="0.25"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={form.lossOfPayDays ?? 0}
              onChange={(e) => handleChange("lossOfPayDays", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Compact</label>
            <input
              type="number"
              step="0.25"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={form.compact ?? 0}
              onChange={(e) => handleChange("compact", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Year</label>
            <input
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={form.currentYear ?? new Date().getFullYear()}
              onChange={(e) => handleChange("currentYear", e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outlined" onClick={onClose} size="small">
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() =>
            onSave({ userId: record.userId, ...(form as Partial<LeaveRecord>) })
          }
        >
          Save
        </Button>
      </div>
    </Modal>
  );
}
