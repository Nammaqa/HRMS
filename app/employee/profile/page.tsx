"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import {
  User,Mail,Phone,MapPin,Briefcase,Droplet,Calendar,Clock,
  ArrowLeft,GraduationCap,CreditCard,DollarSign,FileText,Users,Edit2,
  Save,X,Upload,Eye,EyeOff,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  personalEmail?: string;
  phone?: string;
  alternateContact?: string;
  emergencyContact?: string;
  designation?: string;
  designationAtCompany?: string;
  bloodGroup?: string;
  gender?: string;
  location?: string;
  profileImageUrl?: string;
  lastLoginAt?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  dateOfMarriage?: string;
  fatherName?: string;
  motherName?: string;
  role?: string;
  
  // Company
  employeeId?: string;
  projectClient?: string;
  dateOfJoining?: string;
  dateOfDeployment?: string;
  totalExperience?: number;
  dateOfExit?: string;
  
  // Contact Details
  currentAddress?: string;
  permanentAddress?: string;
  
  // Education
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
  
  // IDs
  aadharNumber?: string;
  panCard?: string;
  citizenship?: string;
  
  // Bank
  bankHolderName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankBranch?: string;
  
  // Government
  uanNumber?: string;
  pfNumber?: string;
  
  // Assets
  laptopProvider?: string;
  assetDetails?: string;
  idCardProvided?: boolean;
  bgvProvided?: boolean;
  
  // Previous
  previousCompany?: string;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  fields: Array<{
    label: string;
    key: string;
    value: string | number | boolean | undefined;
    format?: "date" | "text" | "currency" | "boolean" | "select";
    options?: Array<{ label: string; value: string }>;
  }>;
  isEditing?: boolean;
  editData?: any;
  onEditChange?: (key: string, value: any) => void;
  validationErrors?: Record<string, string>;
}

const getDisplayName = (user: Partial<UserProfile> | null | undefined) => {
  const parts = [user?.firstName, user?.middleName, user?.lastName]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return user?.name?.trim() || "User";
};

const formatDateInputValue = (value: string | number | boolean | undefined) => {
  if (!value) return "";
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
};

const InfoSection = ({ title, icon, fields, isEditing, editData, onEditChange, validationErrors }: SectionProps) => (
  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
      {icon}
      {title}
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fields.map((field, idx) => {
        const hasError = Boolean(validationErrors?.[field.key]);

        return (
          <div key={idx}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {field.label}
            </label>
            {isEditing ? (
              field.format === "boolean" ? (
                <select
                  value={editData?.[field.key] ? "true" : "false"}
                  onChange={(e) => onEditChange?.(field.key, e.target.value === "true")}
                  aria-invalid={hasError}
                  className={`w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent bg-white ${
                    hasError
                      ? "border-red-400 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : field.format === "select" ? (
                <select
                  value={editData?.[field.key] ?? ""}
                  onChange={(e) => onEditChange?.(field.key, e.target.value)}
                  aria-invalid={hasError}
                  className={`w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent bg-white ${
                    hasError
                      ? "border-red-400 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.format === "date" ? (
                <input
                  type="date"
                  value={formatDateInputValue(editData?.[field.key])}
                  onChange={(e) => onEditChange?.(field.key, e.target.value)}
                  aria-invalid={hasError}
                  className={`w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    hasError
                      ? "border-red-400 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
              ) : (
                <input
                  type={field.format === "currency" ? "number" : "text"}
                  value={editData?.[field.key] ?? ""}
                  onChange={(e) => onEditChange?.(field.key, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  aria-invalid={hasError}
                  className={`w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    hasError
                      ? "border-red-400 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
              )
            ) : (
              <p className="text-gray-900 font-medium mt-2">
                {typeof field.value === "boolean" ? (field.value ? "Yes" : "No") : field.value ?? "N/A"}
              </p>
            )}
            {isEditing && hasError && (
              <p className="mt-2 text-sm text-red-600">{validationErrors?.[field.key]}</p>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default function EmployeeProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // image upload state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const validateProfileData = (data: Partial<UserProfile>) => {
    const errors: Record<string, string> = {};
    const today = new Date();
    const cleanText = (value: string | number | boolean | undefined) =>
      typeof value === "string" ? value.trim() : "";
    const validateOptionalText = (value: string | number | boolean | undefined, key: string, label: string) => {
      const text = cleanText(value);
      if (text && text.length < 2) {
        errors[key] = `${label} should be at least 2 characters.`;
      }
    };
    const parseDate = (value?: string) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const firstName = cleanText(data.firstName);
    if (!firstName) {
      errors.firstName = "First name is required.";
    } else if (!/^[A-Za-z][A-Za-z .'-]{1,50}$/.test(firstName)) {
      errors.firstName = "First name can only contain letters and common separators.";
    }

    const middleName = cleanText(data.middleName);
    if (middleName && !/^[A-Za-z .'-]{1,50}$/.test(middleName)) {
      errors.middleName = "Middle name can only contain letters and common separators.";
    }

    const lastName = cleanText(data.lastName);
    if (!lastName) {
      errors.lastName = "Last name is required.";
    } else if (!/^[A-Za-z][A-Za-z .'-]{1,50}$/.test(lastName)) {
      errors.lastName = "Last name can only contain letters and common separators.";
    }

    const email = cleanText(data.email);
    if (!email) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    const personalEmail = cleanText(data.personalEmail);
    if (personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
      errors.personalEmail = "Please enter a valid personal email address.";
    }

    const phone = cleanText(data.phone);
    if (!phone) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(phone)) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }

    const alternateContact = cleanText(data.alternateContact);
    if (alternateContact && !/^\d{10}$/.test(alternateContact)) {
      errors.alternateContact = "Alternate contact must be exactly 10 digits.";
    }

    const emergencyContact = cleanText(data.emergencyContact);
    if (emergencyContact && !/^\d{10}$/.test(emergencyContact)) {
      errors.emergencyContact = "Emergency contact must be exactly 10 digits.";
    }

    const currentAddress = cleanText(data.currentAddress);
    if (!currentAddress) {
      errors.currentAddress = "Current address is required.";
    } else if (currentAddress.length < 5) {
      errors.currentAddress = "Current address should be at least 5 characters.";
    }

    const permanentAddress = cleanText(data.permanentAddress);
    if (!permanentAddress) {
      errors.permanentAddress = "Permanent address is required.";
    } else if (permanentAddress.length < 5) {
      errors.permanentAddress = "Permanent address should be at least 5 characters.";
    }

    const dateOfBirth = parseDate(data.dateOfBirth);
    if (!data.dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required.";
    } else if (!dateOfBirth || dateOfBirth > today) {
      errors.dateOfBirth = "Date of birth cannot be in the future.";
    }

    const dateOfMarriage = parseDate(data.dateOfMarriage);
    if (data.dateOfMarriage && (!dateOfMarriage || dateOfMarriage < (dateOfBirth || new Date(0)))) {
      errors.dateOfMarriage = "Date of marriage must be after the date of birth.";
    }

    const gender = cleanText(data.gender);
    if (gender && !/^(male|female|other|prefer not to say)$/i.test(gender)) {
      errors.gender = "Please choose a valid gender option.";
    }

    const bloodGroup = cleanText(data.bloodGroup);
    if (bloodGroup && !/^(a|b|ab|o)[+-]$/i.test(bloodGroup)) {
      errors.bloodGroup = "Please choose a valid blood group.";
    }

    const maritalStatus = cleanText(data.maritalStatus);
    if (maritalStatus && !/^(single|married)$/i.test(maritalStatus)) {
      errors.maritalStatus = "Please choose Single or Married.";
    }

    const citizenship = cleanText(data.citizenship);
    if (citizenship && citizenship.length < 2) {
      errors.citizenship = "Citizenship should be at least 2 characters.";
    }

    const fatherName = cleanText(data.fatherName);
    if (fatherName && !/^[A-Za-z .'-]{2,50}$/.test(fatherName)) {
      errors.fatherName = "Father name can only contain letters and common separators.";
    }

    const motherName = cleanText(data.motherName);
    if (motherName && !/^[A-Za-z .'-]{2,50}$/.test(motherName)) {
      errors.motherName = "Mother name can only contain letters and common separators.";
    }

    const designationAtCompany = cleanText(data.designationAtCompany);
    if (!designationAtCompany) {
      errors.designationAtCompany = "Designation is required.";
    } else if (designationAtCompany.length < 2) {
      errors.designationAtCompany = "Designation should be at least 2 characters.";
    }

    const employeeId = cleanText(data.employeeId);
    if (!employeeId) {
      errors.employeeId = "Employee ID is required.";
    } else if (employeeId.length < 2) {
      errors.employeeId = "Employee ID should be at least 2 characters.";
    }

    validateOptionalText(data.projectClient, "projectClient", "Project/Client");
    validateOptionalText(data.previousCompany, "previousCompany", "Previous company");
    validateOptionalText(data.bankHolderName, "bankHolderName", "Bank holder name");
    validateOptionalText(data.bankName, "bankName", "Bank name");
    validateOptionalText(data.bankBranch, "bankBranch", "Bank branch");
    validateOptionalText(data.laptopProvider, "laptopProvider", "Laptop provider");
    validateOptionalText(data.assetDetails, "assetDetails", "Asset details");
    validateOptionalText(data.masterDegree, "masterDegree", "Master degree");
    validateOptionalText(data.secondaryDegree, "secondaryDegree", "Secondary degree");
    validateOptionalText(data.twelfthDegree, "twelfthDegree", "12th degree");
    validateOptionalText(data.tenthDegree, "tenthDegree", "10th degree");

    const dateOfJoining = parseDate(data.dateOfJoining);
    if (!data.dateOfJoining) {
      errors.dateOfJoining = "Date of joining is required.";
    } else if (!dateOfJoining || dateOfJoining > today) {
      errors.dateOfJoining = "Date of joining cannot be in the future.";
    }

    const dateOfDeployment = parseDate(data.dateOfDeployment);
    if (data.dateOfDeployment && (!dateOfDeployment || (dateOfJoining && dateOfDeployment < dateOfJoining))) {
      errors.dateOfDeployment = "Date of deployment must be on or after the joining date.";
    }

    const dateOfExit = parseDate(data.dateOfExit);
    if (data.dateOfExit && (!dateOfExit || (dateOfJoining && dateOfExit < dateOfJoining))) {
      errors.dateOfExit = "Date of exit must be on or after the joining date.";
    }

    const totalExperience = data.totalExperience;
    if (totalExperience !== undefined && totalExperience !== null && String(totalExperience).trim() !== "") {
      const experienceValue = Number(totalExperience);
      if (Number.isNaN(experienceValue) || experienceValue < 0 || experienceValue > 60) {
        errors.totalExperience = "Total experience must be between 0 and 60 years.";
      }
    }

    const masterYOP = data.masterYOP;
    if (masterYOP !== undefined && masterYOP !== null && String(masterYOP).trim() !== "") {
      const year = Number(masterYOP);
      if (Number.isNaN(year) || year < 1950 || year > today.getFullYear() + 1) {
        errors.masterYOP = "Master year of passing should be a valid year.";
      }
    }

    const secondaryYOP = data.secondaryYOP;
    if (secondaryYOP !== undefined && secondaryYOP !== null && String(secondaryYOP).trim() !== "") {
      const year = Number(secondaryYOP);
      if (Number.isNaN(year) || year < 1950 || year > today.getFullYear() + 1) {
        errors.secondaryYOP = "Secondary year of passing should be a valid year.";
      }
    }

    const twelfthYOP = data.twelfthYOP;
    if (twelfthYOP !== undefined && twelfthYOP !== null && String(twelfthYOP).trim() !== "") {
      const year = Number(twelfthYOP);
      if (Number.isNaN(year) || year < 1950 || year > today.getFullYear() + 1) {
        errors.twelfthYOP = "12th year of passing should be a valid year.";
      }
    }

    const tenthYOP = data.tenthYOP;
    if (tenthYOP !== undefined && tenthYOP !== null && String(tenthYOP).trim() !== "") {
      const year = Number(tenthYOP);
      if (Number.isNaN(year) || year < 1950 || year > today.getFullYear() + 1) {
        errors.tenthYOP = "10th year of passing should be a valid year.";
      }
    }

    const validatePercentage = (value: string | number | boolean | undefined, key: string) => {
      if (value === undefined || value === null || value === "") return;
      const percentage = Number(value);
      if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
        errors[key] = "Percentage must be between 0 and 100.";
      }
    };

    validatePercentage(data.masterPercentage, "masterPercentage");
    validatePercentage(data.secondaryPercentage, "secondaryPercentage");
    validatePercentage(data.twelfthPercentage, "twelfthPercentage");
    validatePercentage(data.tenthPercentage, "tenthPercentage");

    const aadharNumber = cleanText(data.aadharNumber);
    if (aadharNumber && !/^\d{12}$/.test(aadharNumber)) {
      errors.aadharNumber = "Aadhar number must be 12 digits.";
    }

    const panCard = cleanText(data.panCard);
    if (panCard && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panCard.toUpperCase())) {
      errors.panCard = "PAN should look like ABCDE1234F.";
    }

    const bankAccountNumber = cleanText(data.bankAccountNumber);
    if (bankAccountNumber && !/^[A-Za-z0-9]{8,20}$/.test(bankAccountNumber)) {
      errors.bankAccountNumber = "Account number must be 8 to 20 characters.";
    }

    const ifscCode = cleanText(data.ifscCode);
    if (ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      errors.ifscCode = "IFSC should be 11 characters such as ABCD0123456.";
    }

    const uanNumber = cleanText(data.uanNumber);
    if (uanNumber && !/^\d{10}$/.test(uanNumber)) {
      errors.uanNumber = "UAN must be exactly 10 digits.";
    }

    const pfNumber = cleanText(data.pfNumber);
    if (pfNumber && !/^[A-Za-z0-9]{22}$/.test(pfNumber)) {
      errors.pfNumber = "PF account number must be exactly 22 alphanumeric characters.";
    }

    return errors;
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const normalizedUser = {
          ...data.user,
          name: getDisplayName(data.user),
        };
        setProfile(normalizedUser);
        setEditData(normalizedUser);
      } else {
        if (response.status === 401) {
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImage(ev.target?.result as string);
    reader.readAsDataURL(file);

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
        setEditData((prev) => ({ ...prev, profileImageUrl: result.secure_url }));
        setMessage({ type: "success", text: "✅ Image uploaded successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: " Failed to upload image" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: " Error uploading image" });
    } finally {
      setUploading(false);
    }
  };

  const handleEditChange = (key: string, value: any) => {
    setEditData((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };

      setValidationErrors(validateProfileData(updated));
      return updated;
    });
  };

  const handleSave = async () => {
    // password validation
    if (newPassword || confirmPassword) {
      if (newPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters long.");
        setMessage({ type: "error", text: "Password must be at least 8 characters long." });
        return;
      }

      if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
        setPasswordError("Password must include both letters and numbers.");
        setMessage({ type: "error", text: "Password must include both letters and numbers." });
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError("Passwords do not match.");
        setMessage({ type: "error", text: "Passwords do not match" });
        return;
      }
    } else {
      setPasswordError(null);
    }

    const validationResult = validateProfileData(editData);
    setValidationErrors(validationResult);

    if (Object.keys(validationResult).length > 0) {
      setMessage({ type: "error", text: "Please fix the highlighted fields before saving." });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      // build payload from current editData and possible password
      const payload: any = { ...editData };
      if (newPassword) {
        payload.password = newPassword;
      }

      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updated = await response.json();
        const normalizedUser = {
          ...updated,
          name: getDisplayName(updated),
        };
        setProfile(normalizedUser);
        setIsEditing(false);
        // clear password states
        setNewPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setPasswordError(null);
        setValidationErrors({});
        // clear preview
        setPreviewImage(null);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "Failed to update profile" });
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      setMessage({ type: "error", text: "An error occurred while saving" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile || {});
    setIsEditing(false);
    setMessage(null);
    setValidationErrors({});
    setPreviewImage(null);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordError(null);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <EmployeeSidebar userName={profile?.name}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
          <div className="p-4 md:p-8 w-full max-w-[1800px] mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin inline-block w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
                </div>
                <p className="text-gray-600 mt-6 font-medium">Loading your profile...</p>
              </div>
            </div>
          </div>
        </div>
      </EmployeeSidebar>
    );
  }

  if (!profile) {
    return (
      <EmployeeSidebar userName="User">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
          <div className="p-4 md:p-8 w-full max-w-[1800px] mx-auto">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
              <p className="text-red-900 font-semibold">Profile Not Found</p>
            </div>
          </div>
        </div>
      </EmployeeSidebar>
    );
  }

  return (
    <EmployeeSidebar userName={profile?.name}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="p-4 md:p-8 w-full max-w-[1800px] mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>

          {/* Message Alert */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
                message.type === "success"
                  ? "bg-green-100 border border-green-400 text-green-700"
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}
            >
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)}>
                <X size={18} />
              </button>
            </div>
          )}

          {isEditing && Object.keys(validationErrors).length > 0 && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Please correct the highlighted fields before saving.
            </div>
          )}

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-xl p-8 mb-8 text-white flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold relative">
                {/* show preview if available during edit, otherwise saved image or initial */}
                {previewImage || editData.profileImageUrl || profile.profileImageUrl ? (
                  <img
                    src={previewImage || editData.profileImageUrl || profile.profileImageUrl!}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  profile.name?.charAt(0).toUpperCase()
                )}

                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full cursor-pointer">
                    {uploading ? (
                      <span className="text-white text-sm">Uploading...</span>
                    ) : (
                      <Upload size={20} className="text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold">{profile.name}</h1>
                <p className="text-blue-100 mt-1">{profile.designation || "Employee"}</p>
                <p className="text-blue-100 text-sm mt-1">ID: {profile.employeeId || profile.id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setValidationErrors({});
                  }}
                  className="bg-white/30 hover:bg-white/40 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    Save
                    {isSaving ? "Saving..." : ""}
                  </button>

                  <button
                    onClick={handleCancel}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              )}

              
              {/* Edit Profile button removed for employee view */}
            </div>
          </div>

          {/* Password Change (only visible when editing) */}
          {isEditing && (
            <div className="mb-8 bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-gray-600 font-semibold mb-2">New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (!e.target.value) {
                        setPasswordError(null);
                      } else if (e.target.value.length < 8) {
                        setPasswordError("Password must be at least 8 characters long.");
                      } else if (!/[A-Za-z]/.test(e.target.value) || !/\d/.test(e.target.value)) {
                        setPasswordError("Password must include both letters and numbers.");
                      } else {
                        setPasswordError(null);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-500"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
                </div>
                <div className="relative">
                  <label className="block text-gray-600 font-semibold mb-2">Confirm Password</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-500"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="mb-8">
            <InfoSection
              title="Personal Information"
              icon={<User size={24} className="text-blue-600" />}
              fields={[
                { label: "First Name", key: "firstName", value: profile.firstName },
                { label: "Middle Name", key: "middleName", value: profile.middleName },
                { label: "Last Name", key: "lastName", value: profile.lastName },
                { label: "Date of Birth", key: "dateOfBirth", value: formatDate(profile.dateOfBirth), format: "date" },
                {
                  label: "Gender",
                  key: "gender",
                  value: profile.gender,
                  format: "select",
                  options: [
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                    { label: "Other", value: "Other" },
                  ],
                },
                {
                  label: "Blood Group",
                  key: "bloodGroup",
                  value: profile.bloodGroup,
                  format: "select",
                  options: [
                    { label: "A+", value: "A+" },
                    { label: "A-", value: "A-" },
                    { label: "B+", value: "B+" },
                    { label: "B-", value: "B-" },
                    { label: "AB+", value: "AB+" },
                    { label: "AB-", value: "AB-" },
                    { label: "O+", value: "O+" },
                    { label: "O-", value: "O-" },
                  ],
                },
                {
                  label: "Marital Status",
                  key: "maritalStatus",
                  value: profile.maritalStatus,
                  format: "select",
                  options: [
                    { label: "Single", value: "Single" },
                    { label: "Married", value: "Married" },
                  ],
                },
                { label: "Date of Marriage", key: "dateOfMarriage", value: formatDate(profile.dateOfMarriage), format: "date" },
                { label: "Father Name", key: "fatherName", value: profile.fatherName },
                { label: "Mother Name", key: "motherName", value: profile.motherName },
                { label: "Citizenship", key: "citizenship", value: profile.citizenship },
              ]}
              isEditing={isEditing}
              editData={editData}
              onEditChange={handleEditChange}
              validationErrors={validationErrors}
            />
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <InfoSection
              title="Contact Information"
              icon={<Phone size={24} className="text-blue-600" />}
              fields={[
                { label: "Email", key: "email", value: profile.email },
                { label: "Personal Email", key: "personalEmail", value: profile.personalEmail },
                { label: "Phone", key: "phone", value: profile.phone },
                { label: "Alternate Contact", key: "alternateContact", value: profile.alternateContact },
                { label: "Emergency Contact", key: "emergencyContact", value: profile.emergencyContact },
                { label: "Current Address", key: "currentAddress", value: profile.currentAddress },
                { label: "Permanent Address", key: "permanentAddress", value: profile.permanentAddress },
              ]}
              isEditing={isEditing}
              editData={editData}
              onEditChange={handleEditChange}
              validationErrors={validationErrors}
            />
          </div>

          {/* Company Information */}
          <div className="mb-8">
            <InfoSection
              title="Company Information"
              icon={<Briefcase size={24} className="text-blue-600" />}
              fields={[
                { label: "Employee ID", key: "employeeId", value: profile.employeeId },
                { label: "Project/Client", key: "projectClient", value: profile.projectClient },
                { label: "Designation", key: "designationAtCompany", value: profile.designationAtCompany },
                { label: "Date of Joining", key: "dateOfJoining", value: formatDate(profile.dateOfJoining), format: "date" },
                { label: "Date of Deployment", key: "dateOfDeployment", value: formatDate(profile.dateOfDeployment), format: "date" },
                { label: "Total Experience (Years)", key: "totalExperience", value: profile.totalExperience },
                { label: "Previous Company", key: "previousCompany", value: profile.previousCompany },
                { label: "Date of Exit", key: "dateOfExit", value: formatDate(profile.dateOfExit), format: "date" },
              ]}
              isEditing={isEditing}
              editData={editData}
              onEditChange={handleEditChange}
              validationErrors={validationErrors}
            />
          </div>

          {/* Education */}
          <div className="mb-8">
            <InfoSection
              title="Education"
              icon={<GraduationCap size={24} className="text-blue-600" />}
              fields={[
                { label: "Master Degree", key: "masterDegree", value: profile.masterDegree },
                { label: "Master YOP", key: "masterYOP", value: profile.masterYOP },
                { label: "Master Percentage", key: "masterPercentage", value: profile.masterPercentage },
                { label: "Secondary Degree", key: "secondaryDegree", value: profile.secondaryDegree },
                { label: "Secondary YOP", key: "secondaryYOP", value: profile.secondaryYOP },
                { label: "Secondary Percentage", key: "secondaryPercentage", value: profile.secondaryPercentage },
                { label: "12th/Diploma", key: "twelfthDegree", value: profile.twelfthDegree },
                { label: "12th YOP", key: "twelfthYOP", value: profile.twelfthYOP },
                { label: "12th Percentage", key: "twelfthPercentage", value: profile.twelfthPercentage },
                { label: "10th", key: "tenthDegree", value: profile.tenthDegree },
                { label: "10th YOP", key: "tenthYOP", value: profile.tenthYOP },
                { label: "10th Percentage", key: "tenthPercentage", value: profile.tenthPercentage },
              ]}
              isEditing={isEditing}
              editData={editData}
              onEditChange={handleEditChange}
              validationErrors={validationErrors}
            />
          </div>

          {/* Identification */}
          <div className="mb-8">
            <InfoSection
              title="Identification Details"
              icon={<CreditCard size={24} className="text-blue-600" />}
              fields={[
                { label: "Aadhar Number", key: "aadharNumber", value: profile.aadharNumber },
                { label: "PAN Card", key: "panCard", value: profile.panCard },
              ]}
              isEditing={isEditing}
              editData={editData}
              onEditChange={handleEditChange}
              validationErrors={validationErrors}
            />
          </div>

          {/* Bank Details */}
          <div className="mb-8">
            <InfoSection
              title="Bank Details"
              icon={<DollarSign size={24} className="text-blue-600" />}
              fields={[
                { label: "Bank Holder Name", key: "bankHolderName", value: profile.bankHolderName },
                { label: "Bank Name", key: "bankName", value: profile.bankName },
                { label: "Account Number", key: "bankAccountNumber", value: profile.bankAccountNumber },
                { label: "IFSC Code", key: "ifscCode", value: profile.ifscCode },
                { label: "Bank Branch", key: "bankBranch", value: profile.bankBranch },
                { label: "UAN Number", key: "uanNumber", value: profile.uanNumber },
                { label: "PF Number", key: "pfNumber", value: profile.pfNumber },
              ]}
              isEditing={isEditing}
              editData={editData}
              onEditChange={handleEditChange}
              validationErrors={validationErrors}
            />
          </div>

          {/* Assets & Provisions */}
          <div className="mb-8">
            <InfoSection
              title="Assets & Provisions"
              icon={<FileText size={24} className="text-blue-600" />}
              fields={[
                { label: "Laptop Provider", key: "laptopProvider", value: profile.laptopProvider },
                { label: "Asset Details", key: "assetDetails", value: profile.assetDetails },
                { label: "ID Card Provided", key: "idCardProvided", value: profile.idCardProvided, format: "boolean" },
                { label: "BGV Provided", key: "bgvProvided", value: profile.bgvProvided, format: "boolean" },
              ]}
              isEditing={isEditing}
              editData={editData}
              onEditChange={handleEditChange}
              validationErrors={validationErrors}
            />
          </div>

          {/* Back Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => router.push("/employee/dashboard")}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </EmployeeSidebar>
  );
}
