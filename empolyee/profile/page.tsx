"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  profileImageUrl?: string;
  createdAt?: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        setProfile(userData);
        setFormData(userData);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => prev ? { ...prev, [name]: value } : null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (response.ok) {
        const result = await response.json();
        setFormData((prev) =>
          prev ? { ...prev, profileImageUrl: result.secure_url } : null
        );
        setMessage("✅ Image uploaded successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("❌ Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        const userData = updatedData.user || updatedData;
        setProfile(userData);
        setFormData(userData);
        setPreviewImage(null);
        setEditing(false);
        setMessage("✅ Profile updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage("❌ Error updating profile");
    }
  };

  if (loading) {
    return (
      <div className="p-8 w-full">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 w-full">
        <p className="text-red-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes("✅") 
            ? "bg-green-100 text-green-700" 
            : "bg-red-100 text-red-700"
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
        {!editing ? (
          <div className="space-y-6">
            {/* Profile Image Display */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl overflow-hidden flex-shrink-0">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "👤"
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
                <p className="text-gray-600">{profile.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Member since {new Date(profile.createdAt || "").toLocaleDateString()}
                </p>
              </div>
            </div>

            <hr className="my-4" />

            <div className="space-y-4">
              <div>
                <label className="text-gray-600 font-semibold">Name</label>
                <p className="text-lg text-gray-800">{profile.name}</p>
              </div>
              <div>
                <label className="text-gray-600 font-semibold">Email</label>
                <p className="text-lg text-gray-800">{profile.email}</p>
              </div>
              {profile.phone && (
                <div>
                  <label className="text-gray-600 font-semibold">Phone</label>
                  <p className="text-lg text-gray-800">{profile.phone}</p>
                </div>
              )}
              {profile.department && (
                <div>
                  <label className="text-gray-600 font-semibold">Department</label>
                  <p className="text-lg text-gray-800">{profile.department}</p>
                </div>
              )}
              {profile.position && (
                <div>
                  <label className="text-gray-600 font-semibold">Position</label>
                  <p className="text-lg text-gray-800">{profile.position}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div>
              <label className="block text-gray-600 font-semibold mb-3">
                Profile Picture
              </label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl overflow-hidden flex-shrink-0">
                  {previewImage || formData?.profileImageUrl ? (
                    <img
                      src={previewImage || formData?.profileImageUrl}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "👤"
                  )}
                </div>
                <div className="flex-1">
                  <label className="block">
                    <div className="flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                      <Upload size={20} className="text-blue-600" />
                      <span className="text-blue-600 font-medium">
                        {uploading ? "Uploading..." : "Click to upload image"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF up to 10MB
                  </p>
                  {previewImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setFormData((prev) =>
                          prev ? { ...prev, profileImageUrl: undefined } : null
                        );
                      }}
                      className="text-red-600 text-sm mt-2 flex items-center gap-1 hover:text-red-700"
                    >
                      <X size={16} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <hr className="my-4" />

            <div>
              <label className="block text-gray-600 font-semibold mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData?.name || ""}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData?.email || ""}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData?.phone || ""}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Department</label>
              <input
                type="text"
                name="department"
                value={formData?.department || ""}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-2">Position</label>
              <input
                type="text"
                name="position"
                value={formData?.position || ""}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData(profile);
                  setPreviewImage(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
