"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit2, Calendar } from "lucide-react";

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "national" | "company";
  description: string;
}

export default function HolidaysPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    type: "national" as "national" | "company",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = await response.json();
        if (data.user?.role !== "admin") {
          router.push("/employee/dashboard");
          return;
        }

        // Fetch holidays
        await fetchHolidays();
        setLoading(false);
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchHolidays = async () => {
    try {
      const response = await fetch("/api/holidays");
      if (!response.ok) throw new Error("Failed to fetch holidays");
      
      const result = await response.json();
      setHolidays(result.data || []);
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
      setError("Failed to load holidays");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading holidays...</p>
        </div>
      </div>
    );
  }

  const handleAddHoliday = async () => {
    if (!formData.name || !formData.date) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/holidays", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add holiday");
      }

      const result = await response.json();
      setHolidays([...holidays, result.data]);
      setFormData({ name: "", date: "", type: "national", description: "" });
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to add holiday");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;

    try {
      const response = await fetch(`/api/holidays/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete holiday");
      }

      setHolidays(holidays.filter((h) => h.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete holiday");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-xs mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Manage Holidays</h1>
            <p className="text-gray-600 mt-2">Add or remove holidays from the calendar</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Holiday
          </button>
        </div>

        {/* Add Holiday Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Holiday Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Republic Day"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "national" | "company" })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="national">National</option>
                  <option value="company">Company</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddHoliday}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                {submitting ? "Saving..." : "Save Holiday"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                disabled={submitting}
                className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Holidays List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-900">{holiday.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{holiday.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{new Date(holiday.date).toLocaleDateString()}</span>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        holiday.type === "national"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {holiday.type === "national" ? "National" : "Company"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(holiday.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {holidays.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No holidays added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
