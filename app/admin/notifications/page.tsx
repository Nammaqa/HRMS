"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Send, Trash2, Eye, EyeOff } from "lucide-react";

interface Notification {
  id: string;
  userId: string;
  userName: string;
  title: string;
  message: string;
  type: "GENERAL" | "ALERT" | "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  icon: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

export default function NotificationManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  
  // Form states
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"GENERAL" | "ALERT" | "INFO" | "SUCCESS" | "WARNING" | "ERROR">("GENERAL");
  const [icon, setIcon] = useState("🔔");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sendToAll, setSendToAll] = useState(false);

  // Load notifications and employees
  useEffect(() => {
    fetchNotifications();
    fetchEmployees();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        console.log("Employees fetched:", data);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const selectAllEmployees = () => {
    if (selectedEmployees.size === employees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(employees.map((emp) => emp.id)));
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let recipientIds: string[] = [];
    
    if (sendToAll) {
      recipientIds = employees.map((emp) => emp.id);
    } else if (selectedEmployees.size > 0) {
      recipientIds = Array.from(selectedEmployees);
    } else if (selectedEmployee) {
      recipientIds = [selectedEmployee];
    }

    if (recipientIds.length === 0 || !title || !message) {
      alert("Please select at least one employee and fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      // Send notification to each selected employee
      const promises = recipientIds.map((userId) =>
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            title,
            message,
            type: notificationType,
            icon,
          }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        alert(`Notification sent successfully to ${recipientIds.length} employee(s)!`);
        setTitle("");
        setMessage("");
        setSelectedEmployee("");
        setSelectedEmployees(new Set());
        setSendToAll(false);
        setNotificationType("GENERAL");
        setIcon("🔔");
        fetchNotifications();
      } else {
        alert("Some notifications failed to send");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Error sending notification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications(notifications.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const filteredNotifications = notifications.filter((notif) =>
    notif.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const typeColors: Record<string, string> = {
    GENERAL: "bg-gray-100 text-gray-800",
    ALERT: "bg-red-100 text-red-800",
    INFO: "bg-blue-100 text-blue-800",
    SUCCESS: "bg-green-100 text-green-800",
    WARNING: "bg-yellow-100 text-yellow-800",
    ERROR: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">Notifications</h1>
          </div>
          <p className="text-gray-600">Send and manage employee notifications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Send Notification Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Send Notification</h2>
              
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipients
                  </label>
                  
                  {/* Send to All Toggle */}
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendToAll}
                        onChange={(e) => {
                          setSendToAll(e.target.checked);
                          if (e.target.checked) {
                            setSelectedEmployee("");
                            setSelectedEmployees(new Set());
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="font-medium text-blue-900">Send to All Employees</span>
                      {sendToAll && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          {employees.length} employees
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Individual Selection (if not send to all) */}
                  {!sendToAll && (
                    <>
                      <div className="mb-3">
                        <select
                          value={selectedEmployee}
                          onChange={(e) => {
                            setSelectedEmployee(e.target.value);
                            if (e.target.value) {
                              setSelectedEmployees(new Set([e.target.value]));
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Quick select employee...</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Or select multiple */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-600 uppercase">Or Select Multiple</span>
                          <button
                            type="button"
                            onClick={selectAllEmployees}
                            className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
                          >
                            {selectedEmployees.size === employees.length ? "Deselect All" : "Select All"}
                          </button>
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2 bg-gray-50">
                          {employees.length === 0 ? (
                            <p className="text-sm text-gray-500 p-2">No employees found</p>
                          ) : (
                            employees.map((emp) => (
                              <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={selectedEmployees.has(emp.id)}
                                  onChange={() => toggleEmployeeSelection(emp.id)}
                                  className="w-4 h-4 rounded border-gray-300"
                                />
                                <span className="text-sm flex-1">
                                  <span className="font-medium">{emp.name}</span>
                                  <span className="text-gray-500 text-xs ml-1">({emp.email})</span>
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                        {selectedEmployees.size > 0 && (
                          <p className="mt-2 text-xs text-indigo-600 font-medium">
                            {selectedEmployees.size} employee(s) selected
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Notification title"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Notification message"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="GENERAL">General</option>
                    <option value="ALERT">Alert</option>
                    <option value="INFO">Info</option>
                    <option value="SUCCESS">Success</option>
                    <option value="WARNING">Warning</option>
                    <option value="ERROR">Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon Emoji
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="🔔"
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Sending..." : "Send Notification"}
                </button>
              </form>
            </div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Notifications</h2>
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin inline-block w-6 h-6 border-3 border-gray-300 border-t-indigo-600 rounded-full"></div>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No notifications found
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{notif.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {notif.title}
                            </h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                typeColors[notif.type]
                              }`}
                            >
                              {notif.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>To: <strong>{notif.userName}</strong></span>
                            <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors duration-200 flex-shrink-0"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
