"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import Button from "@mui/material/Button";
import { TransitionProps } from "@mui/material/transitions";
import { useState, useCallback, useEffect } from "react";
import { Calendar, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import { EnhancedCalendar } from "../../components/EnhancedCalendar";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ApplyLeaveModalProps {
  open: boolean;
  onClose: () => void;
  employeeData?: {
    email: string;
    mobile: string;
    address: string;
  };
}

interface LeaveBalance {
  [key: string]: number | null;
}

interface LeaveType {
  value: string;
  label: string;
  balance: number | null;
  color: string;
  subtext?: string;
}
export function ApplyLeaveModal({ open, onClose, employeeData }: ApplyLeaveModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [totalDays, setTotalDays] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState({
    earnedLeave: 0,
    sickLeave: 5,
    specialLeave: 1,
    bereavementLeave: 5,
    paternityLeave: 5,
    compact: 0,
  });
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [hasHolidayWork, setHasHolidayWork] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    file: null as File | null,
  });

  const [filePreview, setFilePreview] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Function to fetch balances
  const fetchBalances = useCallback(async () => {
    try {
      setBalanceLoading(true);
      const response = await fetch("/api/leave-balance", {
        credentials: "include",
      });

      if (response.ok) {
        const { data } = await response.json();
        console.log("=== LEAVE BALANCE API RESPONSE ===");
        console.log("Full response:", JSON.stringify(data, null, 2));
        console.log("bereavementLeave:", data.bereavementLeave);
        console.log("paternityLeave:", data.paternityLeave);
        console.log("===================================");
        setLeaveBalances(data);
      } else {
        console.error("Leave balance response error:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching leave balance:", error);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const hasHolidayAttendance = React.useMemo(() => {
    return hasHolidayWork;
  }, [hasHolidayWork]);

  const getLeaveTypes = (): LeaveType[] => {
    const baseLeaves = [
      { value: "earned", label: "Earned Leave", balance: leaveBalances.earnedLeave, color: "from-orange-500 to-orange-600" },
      { value: "sick", label: "Sick Leave", balance: leaveBalances.sickLeave, color: "from-red-500 to-red-600" },
      { value: "special", label: "Special Leave", balance: leaveBalances.specialLeave, color: "from-blue-500 to-blue-600" },
      { value: "bereavement", label: "Bereavement Leave", balance: leaveBalances.bereavementLeave, color: "from-purple-500 to-purple-600" },
      { value: "paternity", label: "Paternity Leave", balance: leaveBalances.paternityLeave, color: "from-green-500 to-green-600" },
      { value: "compact", label: "Comp Off", balance: leaveBalances.compact || 0, color: "from-cyan-500 to-cyan-600" },
      { value: "lop", label: "Loss of Pay", balance: null, color: "from-gray-500 to-gray-600" },
    ];

    return baseLeaves;
  };

  useEffect(() => {
    if (!open) return;

    fetchBalances();

    const fetchHolidayAttendance = async () => {
      try {
        const response = await fetch("/api/weekend-holiday-attendance", {
          credentials: "include",
        });

        if (response.ok) {
          const { data } = await response.json();
          // Check if employee has any approved weekend/holiday attendance
          const hasAttendance = data && Array.isArray(data) && data.some((att: any) => att.status === "approved" || att.status === "APPROVED");
          setHasHolidayWork(hasAttendance || false);
          console.log("Holiday attendance check:", { hasAttendance, data });
        }
      } catch (error) {
        console.error("Error fetching holiday attendance:", error);
      }
    };

    fetchHolidayAttendance();
  }, [open, fetchBalances]);

  const calculateDays = useCallback(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setTotalDays(days);
    return days;
  }, [formData]);

  const handleSubmit = async () => {
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason.trim()) {
      alert("Please fill all required fields marked with *");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert("End date cannot be before start date");
      return;
    }

    // Validate file size if file is selected
    if (formData.file && formData.file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit. Please select a smaller file.");
      return;
    }

    setIsLoading(true);

    try {
      let attachmentUrl = null;

      // Upload file to Cloudinary if present
      if (formData.file) {
        setUploading(true);
        const fileFormData = new FormData();
        fileFormData.append("file", formData.file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: fileFormData,
          credentials: "include",
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          attachmentUrl = uploadData.url;
        } else {
          alert("Failed to upload file. Please try again.");
          setIsLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      const response = await fetch("/api/leave-requests", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          totalDays: calculateDays(),
          attachmentUrl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({
            leaveType: "",
            startDate: "",
            endDate: "",
            reason: "",
            file: null,
          });
          setFilePreview(null);
          setShowCalendar(false);
        }, 2500);
      } else {
        alert("Submission failed: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      alert("Network error: " + (error as Error).message);
    } finally {
      setIsLoading(false);
      setUploading(false);
    }
  };

  useEffect(() => {
    calculateDays();
  }, [formData.startDate, formData.endDate, calculateDays]);

  if (!open) return null;

  const leaveTypes = getLeaveTypes();
  const selectedLeave = leaveTypes.find(type => type.value === formData.leaveType);

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      slots={{
        transition: Transition,
      }}
    >
      <AppBar sx={{ position: "relative", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
        <Toolbar className="py-1">
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
            disabled={isLoading}
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div" className="font-semibold">
            Apply Leave
          </Typography>
          <Button 
            color="inherit" 
            onClick={handleSubmit} 
            disabled={isLoading}
            sx={{ fontWeight: 600 }}
          >
            {isLoading ? "Processing..." : "Submit"}
          </Button>
        </Toolbar>
      </AppBar>

      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen overflow-y-auto">
        {success ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl mb-6 animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Successfully Applied!</h2>
            <p className="text-lg font-semibold text-emerald-600 mb-2">
              {totalDays} {totalDays === 1 ? 'day' : 'days'} requested
            </p>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-4 max-w-md w-full mt-6">
              <p className="text-xs text-emerald-800 leading-relaxed">
                ✓ Your manager will review your request<br/>
                ✓ Check email for status updates
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-4 space-y-5">
            {/* Leave Type Selection - Compact Grid */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900">Choose Leave Type</h3>
                  {/* <button
                    onClick={fetchBalances}
                    disabled={balanceLoading}
                    className="ml-auto text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded transition"
                  >
                    {balanceLoading ? "Refreshing..." : "Refresh Balance"}
                  </button> */}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {getLeaveTypes().map((type: LeaveType) => {
                  const isSelected = formData.leaveType === type.value;
                  const hasInsufficientBalance = type.balance !== null && type.balance <= 0;
                  
                  return (
                    <button
                      key={type.value}
                      onClick={() => !hasInsufficientBalance && setFormData({ ...formData, leaveType: type.value })}
                      disabled={hasInsufficientBalance}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all duration-200
                        ${isSelected 
                          ? `bg-gradient-to-br ${type.color} border-transparent shadow-md text-white` 
                          : hasInsufficientBalance
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm text-gray-900'
                        }
                      `}
                    >
                      <p className="font-bold text-xs leading-tight">{type.label}</p>
                      <p className={`text-[10px] mt-1 ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                        {type.balance === null ? "Unlimited" : `${type.balance.toFixed(1)} days`}
                      </p>
                      {type.subtext && (
                        <p className={`text-[8px] mt-0.5 ${isSelected ? 'text-white/60' : 'text-gray-500'}`}>
                          {type.subtext}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Selection & Reason - Side by Side */}
            {formData.leaveType && (
              <div className="grid md:grid-cols-5 gap-5">
                {/* Date Section - 3 columns */}
                <div className="md:col-span-3 bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                    <h3 className="text-lg font-bold text-gray-900">Select Dates</h3>
                  </div>

                  {showCalendar ? (
                    <div className="space-y-4">
                      <button
                        onClick={() => setShowCalendar(false)}
                        className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
                      >
                        ← Manual Entry
                      </button>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">From Date</p>
                          <EnhancedCalendar
                            onDateSelect={(date) => {
                              const dateStr = date.toISOString().split("T")[0];
                              setFormData({ ...formData, startDate: dateStr });
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">To Date</p>
                          <EnhancedCalendar
                            onDateSelect={(date) => {
                              const dateStr = date.toISOString().split("T")[0];
                              setFormData({ ...formData, endDate: dateStr });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={() => setShowCalendar(true)}
                        className="w-full text-left p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition group"
                      >
                        <p className="text-xs font-semibold text-blue-700 group-hover:text-blue-900 flex items-center justify-between">
                          Open Calendar <ChevronRight className="w-3 h-3" />
                        </p>
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-2">From Date *</label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full h-10 px-3 py-2 text-sm font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-900 mb-2">To Date *</label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            min={formData.startDate || new Date().toISOString().split("T")[0]}
                            className="w-full h-10 px-3 py-2 text-sm font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                          />
                        </div>
                      </div>

                      {/* Total Days - Inline */}
                      {formData.startDate && formData.endDate && (
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-4 rounded-lg shadow-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-xs font-medium">Total Days</p>
                              <p className="text-3xl font-bold">{totalDays}</p>
                            </div>
                            <Calendar className="w-10 h-10 text-white/80" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reason Section - 2 columns */}
                <div className="md:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full" />
                    <h3 className="text-lg font-bold text-gray-900">Reason</h3>
                  </div>
                  
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Provide detailed reason..."
                    className="w-full px-3 py-3 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all resize-none bg-white font-medium"
                    style={{ height: showCalendar ? '350px' : '180px' }}
                  />
                  <p className="text-[10px] text-gray-500 mt-2">Min 10 characters</p>
                </div>

                {/* File Upload Section - Optional */}
                <div className="md:col-span-5 bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full" />
                    <h3 className="text-lg font-bold text-gray-900">Supporting Documents (Optional)</h3>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 hover:bg-emerald-50 transition">
                    <input
                      type="file"
                      id="leave-file-upload"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files ? e.target.files[0] : null;
                        if (file) {
                          // Validate file size (5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            alert("File size exceeds 5MB limit. Please select a smaller file.");
                            return;
                          }
                          setFormData({
                            ...formData,
                            file,
                          });
                          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                          setFilePreview({
                            name: file.name,
                            size: `${sizeMB} MB`,
                            type: file.type.split("/")[1] || "file",
                          });
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="leave-file-upload" className="cursor-pointer">
                      {filePreview ? (
                        <div className="space-y-2">
                          <div className="text-emerald-600 font-semibold text-lg">✓ File Selected</div>
                          <p className="text-gray-700 font-medium">{filePreview.name}</p>
                          <p className="text-sm text-gray-500">{filePreview.size}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, file: null });
                              setFilePreview(null);
                            }}
                            className="text-red-600 text-sm mt-2 hover:underline"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-2xl">📎</div>
                          <div className="text-gray-700 font-medium">Click to upload or drag and drop</div>
                          <p className="text-sm text-gray-500">PDF, Images, or Documents (Max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Info Alert - Compact */}
            {formData.leaveType && (
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-3 flex gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-xs mb-0.5">Approval Process</p>
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Your request will be reviewed by your manager. Once approved, your attendance record will be updated.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons - Compact */}
            <div className="flex gap-3 pt-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 h-10 px-5 text-sm font-bold text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || uploading || !formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason.trim()}
                className="flex-1 h-10 px-5 text-sm font-bold text-white bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg hover:shadow-lg hover:from-gray-800 hover:to-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading || uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {uploading ? "Uploading document..." : "Processing..."}
                  </>
                ) : (
                  "Submit Leave Request"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
