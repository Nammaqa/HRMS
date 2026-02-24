"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import { useState, useEffect } from "react";
import { Clock, MapPin, AlertCircle, CheckCircle, LogOut, LogIn, User, Calendar, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface MarkAttendanceModalProps {
  open: boolean;
  onClose: () => void;
}

export function MarkAttendanceModal({
  open,
  onClose,
}: MarkAttendanceModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Check-in state
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkInLocation, setCheckInLocation] = useState<{
    lat: number;
    long: number;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [userName, setUserName] = useState<string>("");
  const [userDesignation, setUserDesignation] = useState<string>("");

  // Fetch attendance status when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchAttendanceStatus = async () => {
      try {
        console.log("=== FETCHING ATTENDANCE STATUS ===");
        console.log("Modal opened at:", new Date().toISOString());
        
        const response = await fetch("/api/attendance/status", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        console.log("=== ATTENDANCE STATUS RESPONSE ===");
        console.log("Full response:", JSON.stringify(result, null, 2));
        console.log("Response status code:", response.status);

        if (result.success && result.data) {
          const { isCheckedIn: checked, loginTime, user } = result.data;
          
          console.log("=== PARSED VALUES ===");
          console.log("isCheckedIn from API:", checked);
          console.log("loginTime from API:", loginTime);
          console.log("user:", user);
          
          if (checked && loginTime) {
            console.log("✓ Setting as CHECKED IN");
            setIsCheckedIn(true);
            setCheckInTime(new Date(loginTime));
            setUserName(user.name);
            setUserDesignation(user.designation);
          } else {
            console.log("✗ Setting as NOT CHECKED IN");
            setIsCheckedIn(false);
            setCheckInTime(null);
            setUserName(user.name);
            setUserDesignation(user.designation);
          }
        } else {
          console.error("API returned success: false");
        }
      } catch (error) {
        console.error("Error fetching attendance status:", error);
      }
    };

    fetchAttendanceStatus();
  }, [open]);

  // Current date and time for display
  const currentDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate elapsed time
  useEffect(() => {
    if (!isCheckedIn || !checkInTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diffMs = now.getTime() - new Date(checkInTime).getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setElapsedTime(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isCheckedIn, checkInTime]);

  const handleGetLocation = async () => {
    return new Promise<{ lat: number; long: number }>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              long: position.coords.longitude,
            });
          },
          (error) => {
            console.error("Error getting location:", error);
            reject(error);
          }
        );
      } else {
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      const location = await handleGetLocation();
      setCheckInLocation(location);

      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.long,
        }),
      });

      const result = await response.json();
      console.log("Check-in response:", result, "Status:", response.status);

      if (result.success) {
        setIsCheckedIn(true);
        setCheckInTime(new Date(result.data.loginTime));
        setUserName(result.data.user.name);
        setUserDesignation(result.data.user.designation);
        setSuccessMessage("✓ Check-in successful!");
        setTimeout(() => setSuccessMessage(""), 3000);
        router.refresh();
      } else {
        alert(`Check-in failed: ${result.message || "Unknown error"}`);
        console.error("Check-in error response:", result);
      }
    } catch (error) {
      console.error("Check-in exception:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unable to get location"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOutClick = async () => {
    if (!isCheckedIn || !checkInTime) return;

    const now = new Date();
    const diffMs = now.getTime() - new Date(checkInTime).getTime();
    const hoursWorked = diffMs / (1000 * 60 * 60);

    // Show warning if less than 9 hours
    if (hoursWorked < 9) {
      const hours = Math.floor(hoursWorked);
      const minutes = Math.round((hoursWorked - hours) * 60);
      setShowWarningDialog(true);
    } else {
      await handleCheckOut();
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    try {
      const location = await handleGetLocation();

      // Check if today is a weekend or holiday
      const todayDate = new Date();
      const dayOfWeek = todayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

      // Check for holiday
      let isHoliday = false;
      let holidayName = "";
      try {
        const holidayResponse = await fetch("/api/holidays", {
          method: "GET",
          credentials: "include",
        });
        if (holidayResponse.ok) {
          const holidayData = await holidayResponse.json();
          const holidays = holidayData.data || [];
          const today = todayDate.toISOString().split("T")[0];
          const holiday = holidays.find(
            (h: any) =>
              new Date(h.date).toISOString().split("T")[0] === today
          );
          if (holiday) {
            isHoliday = true;
            holidayName = holiday.name;
          }
        }
      } catch (error) {
        console.error("Error checking holidays:", error);
      }

      // If weekend or holiday, create approval request instead of regular checkout
      if (isWeekend || isHoliday) {
        const dayName = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][dayOfWeek];

        if (!checkInTime) {
          alert("No check-in time found");
          setIsLoading(false);
          return;
        }

        const diffMs = new Date().getTime() - new Date(checkInTime).getTime();
        const totalWorkingHours = diffMs / (1000 * 60 * 60);

        // Create weekend/holiday attendance approval request
        const approvalResponse = await fetch("/api/weekend-holiday-attendance/create", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: todayDate.toISOString().split("T")[0],
            loginTime: checkInTime.toISOString(),
            logoutTime: new Date().toISOString(),
            loginLatitude: checkInLocation?.lat || location.lat,
            loginLongitude: checkInLocation?.long || location.long,
            logoutLatitude: location.lat,
            logoutLongitude: location.long,
            totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
          }),
        });

        const approvalResult = await approvalResponse.json();

        if (approvalResult.success) {
          setSuccessMessage(
            `✓ Check-out submitted for approval! Working hours: ${Math.floor(totalWorkingHours)}h ${Math.round(
              (totalWorkingHours - Math.floor(totalWorkingHours)) * 60
            )}m`
          );

          setTimeout(() => {
            onClose();
            setIsCheckedIn(false);
            setCheckInTime(null);
            setElapsedTime("00:00:00");
            setUserName("");
            setUserDesignation("");
            router.refresh();
            router.push("/employee/dashboard");
          }, 3000);
        } else {
          alert(
            `Submission failed: ${approvalResult.message || "Unknown error"}`
          );
        }
        setIsLoading(false);
        return;
      }

      // Regular check-out for weekdays
      const response = await fetch("/api/attendance/check-out", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.long,
        }),
      });

      const result = await response.json();
      console.log("Check-out response:", result, "Status:", response.status);

      if (result.success) {
        setSuccessMessage(
          `✓ ${result.data.user.name} checked out successfully! Total working hours: ${result.data.formattedWorkingHours}`
        );
        
        setTimeout(() => {
          onClose();
          setIsCheckedIn(false);
          setCheckInTime(null);
          setElapsedTime("00:00:00");
          setUserName("");
          setUserDesignation("");
          router.refresh();
          router.push("/employee/dashboard");
        }, 3000);
      } else {
        alert(`Check-out failed: ${result.message || "Unknown error"}`);
        console.error("Check-out error response:", result);
      }
    } catch (error) {
      console.error("Check-out exception:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unable to complete check-out"}`
      );
    } finally {
      setIsLoading(false);
      setShowWarningDialog(false);
    }
  };

  const handleConfirmCheckOut = () => {
    setShowWarningDialog(false);
    handleCheckOut();
  };

  return (
    <>
      <Dialog
        fullScreen
        open={open}
        onClose={onClose}
        slots={{
          transition: Transition,
        }}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          }
        }}
      >
        {/* Success Toast */}
        {successMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg font-medium flex items-center gap-3 max-w-md">
              <CheckCircle className="w-5 h-5" />
              {successMessage}
            </div>
          </div>
        )}

        {/* Compact Header */}
        <AppBar 
          sx={{ 
            position: "relative", 
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Toolbar className="px-4 md:px-6 py-3">
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              aria-label="close"
              disabled={isLoading}
              sx={{
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
            
            <div className="flex-1 ml-3">
              <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Attendance
              </Typography>
              {userName && (
                <div className="flex items-center gap-2 mt-0.5">
                  <User className="w-3.5 h-3.5 opacity-80" />
                  <span className="text-xs opacity-90">
                    {userName} • {userDesignation}
                  </span>
                </div>
              )}
            </div>

            {isCheckedIn && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 backdrop-blur-sm rounded-lg border border-green-800/30">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-300">
                  Active • {elapsedTime}
                </span>
              </div>
            )}
          </Toolbar>
        </AppBar>

        {/* Main Content - Compact Layout */}
        <div className="min-h-screen overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Compact Date & Time Header */}
            <div className="mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Today's Date</p>
                      <h1 className="text-lg font-bold text-gray-900">{currentDate}</h1>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-medium">Current Time</p>
                      <div className="text-lg font-bold text-gray-900 font-mono">
                        {currentTime.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Timer & Status */}
              <div className="lg:col-span-1">
                {/* Compact Timer Card */}
                {isCheckedIn && (
                  <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-5 shadow-lg mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-blue-100 mb-0.5">
                          Active Session
                        </h3>
                        <p className="text-xs text-blue-200">
                          Started {checkInTime?.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Compact Timer */}
                    <div className="text-center py-3">
                      <div className="text-4xl font-bold text-white font-mono tracking-tight mb-1">
                        {elapsedTime}
                      </div>
                      <p className="text-xs text-blue-200 font-medium">
                        Hours : Minutes : Seconds
                      </p>
                    </div>

                    {/* Time Breakdown */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {elapsedTime.split(':')[0]}
                        </div>
                        <div className="text-xs text-blue-200 font-medium mt-0.5">HOURS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {elapsedTime.split(':')[1]}
                        </div>
                        <div className="text-xs text-blue-200 font-medium mt-0.5">MINUTES</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {elapsedTime.split(':')[2]}
                        </div>
                        <div className="text-xs text-blue-200 font-medium mt-0.5">SECONDS</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Info */}
                {checkInLocation && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Navigation className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Location Verified</h3>
                        <p className="text-xs text-gray-600">GPS coordinates</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg">
                        <span className="text-xs font-medium text-gray-700">Latitude</span>
                        <span className="font-mono text-xs font-semibold text-gray-900">
                          {checkInLocation.lat.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg">
                        <span className="text-xs font-medium text-gray-700">Longitude</span>
                        <span className="font-mono text-xs font-semibold text-gray-900">
                          {checkInLocation.long.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Actions */}
              <div className="lg:col-span-2">
                {!isCheckedIn ? (
                  /* Compact Check-In Card */
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <LogIn className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Start Your Day</h2>
                          <p className="text-sm text-gray-600">Begin tracking work hours</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Time Information - Compact */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                              Date
                            </label>
                            <div className="h-10 px-3 bg-gray-50 border border-gray-300 rounded-lg flex items-center text-sm text-gray-900 font-medium">
                              <Calendar className="w-3.5 h-3.5 mr-2 text-gray-500" />
                              {currentDate}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                              Time
                            </label>
                            <div className="h-10 px-3 bg-gray-50 border border-gray-300 rounded-lg flex items-center text-sm text-gray-900 font-medium">
                              <Clock className="w-3.5 h-3.5 mr-2 text-gray-500" />
                              {currentTime.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Compact Information Alert */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-blue-900 mb-0.5">
                                Location Services Required
                              </p>
                              <p className="text-xs text-blue-700">
                                Your location will be captured for verification
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Compact Check-In Button */}
                        <button
                          onClick={handleCheckIn}
                          disabled={isLoading}
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                          {isLoading ? (
                            <>
                              <CircularProgress size={18} color="inherit" />
                              <span className="text-sm">Processing...</span>
                            </>
                          ) : (
                            <>
                              <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                              <span className="text-sm">Check In Now</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Checked-In Status & Check-Out */
                  <div className="space-y-6">
                    {/* Compact Check-In Confirmation */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-green-900">
                            Successfully Checked In
                          </h3>
                          <p className="text-sm text-green-700 mt-0.5">
                            Active since {checkInTime?.toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-green-200/50">
                        <div>
                          <p className="text-xs font-medium text-green-800">Current Status</p>
                          <p className="text-sm font-bold text-green-900">Active Session</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-green-700">Live</span>
                        </div>
                      </div>
                    </div>

                    {/* Compact Check-Out Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <LogOut className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-gray-900">End Your Day</h2>
                            <p className="text-sm text-gray-600">Complete work session</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Time Information */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-xs font-medium text-gray-700">
                                Date
                              </label>
                              <div className="h-10 px-3 bg-gray-50 border border-gray-300 rounded-lg flex items-center text-sm text-gray-900 font-medium">
                                <Calendar className="w-3.5 h-3.5 mr-2 text-gray-500" />
                                {currentDate}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-medium text-gray-700">
                                Time
                              </label>
                              <div className="h-10 px-3 bg-gray-50 border border-gray-300 rounded-lg flex items-center text-sm text-gray-900 font-medium">
                                <Clock className="w-3.5 h-3.5 mr-2 text-gray-500" />
                                {currentTime.toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Compact Elapsed Time Progress */}
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-gray-700">Elapsed Time</span>
                              <span className="text-sm font-bold text-gray-900 font-mono">
                                {elapsedTime}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min((parseInt(elapsedTime.split(':')[0]) / 9) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>0h</span>
                              <span>Target: 9h</span>
                            </div>
                          </div>

                          {/* Compact Check-Out Button */}
                          <button
                            onClick={handleCheckOutClick}
                            disabled={isLoading}
                            className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                          >
                            {isLoading ? (
                              <>
                                <CircularProgress size={18} color="inherit" />
                                <span className="text-sm">Processing...</span>
                              </>
                            ) : (
                              <>
                                <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                <span className="text-sm">Check Out Now</span>
                              </>
                            )}
                          </button>

                          <p className="text-center text-xs text-gray-600">
                            Complete 9 hours for full attendance
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Compact Warning Dialog */}
      <Dialog
        open={showWarningDialog}
        onClose={() => setShowWarningDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
          }
        }}
      >
        <div className="bg-white">
          {/* Dialog Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-0.5">
                  Incomplete Work Hours
                </h2>
                <p className="text-sm text-gray-600">
                  You haven't completed required hours
                </p>
              </div>
            </div>
          </div>

          {/* Warning Content */}
          <div className="px-6">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-900">
                  9 hours NOT completed
                </p>
              </div>
              <p className="text-xs text-amber-800">
                Early checkout may affect attendance record
              </p>
            </div>

            <div className="py-4">
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {elapsedTime.split(':')[0]}h {elapsedTime.split(':')[1]}m
                </div>
                <p className="text-sm text-gray-600">Total worked duration</p>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${(parseInt(elapsedTime.split(':')[0]) / 9) * 100}%` }}
                  ></div>
                </div>
                <span className="font-medium">{Math.round((parseInt(elapsedTime.split(':')[0]) / 9) * 100)}% Complete</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setShowWarningDialog(false)}
                className="flex-1 h-10 px-4 font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Continue Working
              </button>
              <button
                onClick={handleConfirmCheckOut}
                disabled={isLoading}
                className="flex-1 h-10 px-4 font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-lg hover:shadow-md hover:shadow-red-500/25 transition-all disabled:opacity-50 text-sm"
              >
                {isLoading ? "Processing..." : "Confirm Check Out"}
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">
              Note: Early checkouts are logged
            </p>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default MarkAttendanceModal;