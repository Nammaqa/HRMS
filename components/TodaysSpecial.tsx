"use client";

import React, { useMemo, useRef, useState } from "react";

interface SpecialOccasion {
  id: string;
  name: string;
  designation: string;
  // joining is used for work anniversaries (date of joining)
  type: "birthday" | "anniversary" | "joining";
  displayDate: string;
  profileImageUrl?: string;
}

interface TodaysSpecialProps {
  occasions?: {
    yesterday: SpecialOccasion[];
    today: SpecialOccasion[];
    tomorrow: SpecialOccasion[];
  };
}

export const TodaysSpecial: React.FC<TodaysSpecialProps> = ({
  occasions = { yesterday: [], today: [], tomorrow: [] },
}) => {
  const [activeTab, setActiveTab] =
    useState<"yesterday" | "today" | "tomorrow">("today");

  const data = useMemo(() => occasions[activeTab] || [], [occasions, activeTab]);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  return (
    <div className="mx-auto max-w-full px-4 py-6">
      <div className="rounded-xl border bg-white shadow-sm p-2 sm:p-0">
        
        {/* Header */}
        <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {["yesterday", "today", "tomorrow"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                aria-pressed={activeTab === tab}
                className={`rounded-lg px-3 py-2 text-sm font-medium capitalize w-full sm:w-auto text-center ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <span className="text-sm text-gray-600 hidden sm:inline-block">
            Total: <strong>{data.length}</strong>
          </span>
          {/* show total on small screens below buttons */}
          <div className="sm:hidden text-sm text-gray-600 pt-2">
            Total: <strong>{data.length}</strong>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold capitalize">
              {activeTab}'s Celebrations
            </h3>

            <div className="flex gap-2 items-center">
              <div className="hidden sm:flex gap-2">
                <button
                  onClick={() => scroll("left")}
                  aria-label="Scroll left"
                  className="h-9 w-9 rounded-lg border bg-white hover:bg-gray-50"
                >
                  ←
                </button>
                <button
                  onClick={() => scroll("right")}
                  aria-label="Scroll right"
                  className="h-9 w-9 rounded-lg border bg-white hover:bg-gray-50"
                >
                  →
                </button>
              </div>
              {/* mobile hint */}
              <div className="sm:hidden text-xs text-gray-500">Swipe to browse</div>
            </div>
          </div>

          {data.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg bg-gray-50 text-gray-500">
              <span className="text-3xl">🎉</span>
              <p>No celebrations for {activeTab}</p>
            </div>
          ) : (
            <div className="relative">
              <div
                ref={sliderRef}
                role="list"
                className="flex gap-4 overflow-x-auto pb-4 scroll-pl-4 touch-pan-x"
              >
                {data.map((o) => (
                  <div key={`${o.id}-${o.type}`} role="listitem" className="min-w-[200px] sm:min-w-[260px]">
                    <SimpleCard occasion={o} />
                  </div>
                ))}
              </div>

              {/* overlay controls for larger screens */}
              <button
                onClick={() => scroll("left")}
                aria-label="Scroll left"
                className="hidden sm:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 rounded-full shadow mx-2"
              >
                ←
              </button>
              <button
                onClick={() => scroll("right")}
                aria-label="Scroll right"
                className="hidden sm:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 rounded-full shadow mx-2"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Simple Card ---------- */

const SimpleCard = ({ occasion }: { occasion: SpecialOccasion }) => {
  const initials = occasion.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // compute label and style based on type
  let labelText = "";
  let labelClass = "";
  switch (occasion.type) {
    case "birthday":
      labelText = "🎂 Birthday";
      labelClass = "bg-amber-100 text-amber-800";
      break;
    case "anniversary":
      labelText = "💍 Anniversary";
      labelClass = "bg-rose-100 text-rose-800";
      break;
    case "joining":
      labelText = "🎊 Work Anniversary";
      labelClass = "bg-green-100 text-green-800";
      break;
    default:
      labelText = occasion.displayDate;
      labelClass = "bg-gray-100 text-gray-800";
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
          {occasion.profileImageUrl ? (
            <img
              src={occasion.profileImageUrl}
              alt={occasion.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0">
          <h4 className="truncate font-semibold text-gray-900">
            {occasion.name}
          </h4>
          <p className="truncate text-sm text-gray-600">
            {occasion.designation || "Team Member"}
          </p>
          <p className="text-xs text-gray-500">{occasion.displayDate}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${labelClass}`}>
          {labelText}
        </span>

        <button className="h-8 w-8 rounded-full border bg-white hover:bg-gray-50">
          🎉
        </button>
      </div>
    </div>
  );
};
