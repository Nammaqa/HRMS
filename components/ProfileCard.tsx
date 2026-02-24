"use client";

import {
  User,
  Mail,
  Phone,
  LogOut,
  Calendar,
  Home,
  Clock,
  Droplet,
  MapPin,
  LogIn,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    designation?: string;
    profileImageUrl?: string;
    bloodGroup?: string;
    location?: string;
    lastLoginAt?: string;
  } | null;
  onLogout?: () => void;
  onApplyLeave?: () => void;
  onApplyWFH?: () => void;
  onMarkAttendance?: () => void;
}

export function ProfileCard({
  user,
  onLogout,
  onApplyLeave,
  onApplyWFH,
  onMarkAttendance,
}: ProfileCardProps) {
  const router = useRouter();

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl bg-white shadow-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500" />
          <p className="text-sm text-gray-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const formatLoginTime = (timestamp?: string) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = async () => {
    if (onLogout) return onLogout();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="relative max-w-sm rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
      {/* ✅ Logo Header with Bottom Border */}
      <div className="relative h-28 flex items-center justify-center bg-white border-b border-gray-200">
        <img
          src="/logo.png"
          alt="Company Logo"
          className="h-20 w-auto object-contain blur-[3px] opacity-90"
        />
      </div>

      {/* Avatar */}
      <div className="relative -mt-12 px-6">
        <div className="relative mx-auto w-28">
          <div className="rounded-full p-1 bg-gradient-to-tr from-emerald-400 to-indigo-500 shadow-lg">
            <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center overflow-hidden text-2xl font-bold text-indigo-600">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
          </div>
          <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        {/* Name & Role */}
        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
          <p className="mt-1 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            {user.role}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="mt-6 px-6 space-y-3">
        <InfoRow icon={<Mail />} value={user.email} />
        {user.phone && <InfoRow icon={<Phone />} value={user.phone} />}
        {user.designation && <InfoRow icon={<User />} value={user.designation} />}
        {user.bloodGroup && <InfoRow icon={<Droplet />} value={user.bloodGroup} />}
        {user.location && <InfoRow icon={<MapPin />} value={user.location} />}
        {user.lastLoginAt && (
          <InfoRow
            icon={<LogIn />}
            value={`Last login: ${formatLoginTime(user.lastLoginAt)}`}
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 px-6 pb-6 space-y-2">
        <PrimaryAction icon={<Calendar />} label="Apply Leave" onClick={onApplyLeave} />
        <PrimaryAction icon={<Home />} label="Work From Home" onClick={onApplyWFH} />
        <PrimaryAction icon={<Clock />} label="Mark Attendance" onClick={onMarkAttendance} />

        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ---------- Sub Components ---------- */

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
      <span className="text-gray-400">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function PrimaryAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:scale-[1.02]"
    >
      {icon}
      {label}
    </button>
  );
}
