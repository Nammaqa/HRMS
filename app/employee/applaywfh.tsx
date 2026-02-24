"use client";

import * as React from "react";
import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import Button from "@mui/material/Button";
import { TransitionProps } from "@mui/material/transitions";
import { useRouter } from "next/navigation";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ApplyWFHModalProps {
  open: boolean;
  onClose: () => void;
}

export function ApplyWFHModal({ open, onClose }: ApplyWFHModalProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    from: "",
    to: "",
    inTime: "",
    outTime: "",
    description: "",
    file: null as File | null,
  });

  const [filePreview, setFilePreview] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState("-");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const calculateDays = (from: string, to: string) => {
    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      const diff =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
      setDays(diff > 0 ? diff : 0);
    }
  };

  const calculateHours = (inTime: string, outTime: string) => {
    if (inTime && outTime) {
      const start = new Date(`2000-01-01 ${inTime}`);
      const end = new Date(`2000-01-01 ${outTime}`);
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      setHours(diff > 0 ? diff.toFixed(1) : "-");
    }
  };

  const handleSubmit = async () => {
    if (!formData.from || !formData.to || !formData.inTime || !formData.outTime || !formData.description) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let attachmentUrl = null;
      if (formData.file) {
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
        }
      }

      const response = await fetch("/api/wfh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: formData.from,
          endDate: formData.to,
          inTime: formData.inTime,
          outTime: formData.outTime,
          description: formData.description,
          attachmentUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit WFH application");
      }

      alert("WFH Application Submitted Successfully!");

      setFormData({
        from: "",
        to: "",
        inTime: "",
        outTime: "",
        description: "",
        file: null,
      });

      setFilePreview(null);
      setDays(0);
      setHours("-");

      onClose();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit application";
      setError(message);
      alert(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose} slots={{ transition: Transition }}>
      <AppBar sx={{ position: "relative", background: "#2c3e50" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
            Work From Home Application
          </Typography>
          <Button color="inherit" onClick={handleSubmit}>
            Submit
          </Button>
        </Toolbar>
      </AppBar>

      <div className="bg-gray-100 min-h-screen pt-20">
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow">

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Row 1: Dates + Days */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">From *</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                onChange={(e) => {
                  setFormData({ ...formData, from: e.target.value });
                  calculateDays(e.target.value, formData.to);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">To *</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                onChange={(e) => {
                  setFormData({ ...formData, to: e.target.value });
                  calculateDays(formData.from, e.target.value);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Day(s)</label>
              <input
                type="text"
                value={days}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100"
              />
            </div>
          </div>

          {/* Row 2: Time + Hours */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">In Time *</label>
              <input
                type="time"
                className="w-full border rounded px-3 py-2"
                onChange={(e) => {
                  setFormData({ ...formData, inTime: e.target.value });
                  calculateHours(e.target.value, formData.outTime);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Out Time *</label>
              <input
                type="time"
                className="w-full border rounded px-3 py-2"
                onChange={(e) => {
                  setFormData({ ...formData, outTime: e.target.value });
                  calculateHours(formData.inTime, e.target.value);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hour(s)</label>
              <input
                type="text"
                value={hours}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100"
              />
            </div>
          </div>

          {/* Row 3: Description + Upload */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                maxLength={500}
                placeholder="Enter your message here"
                className="w-full border rounded px-3 py-2 h-32"
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Upload Supporting Document</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 hover:bg-emerald-50 transition">
                <input
                  type="file"
                  id="file-upload"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const file = e.target.files ? e.target.files[0] : null;
                    setFormData({
                      ...formData,
                      file,
                    });
                    if (file) {
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
                <label htmlFor="file-upload" className="cursor-pointer">
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
                      <p className="text-sm text-gray-500">PNG, JPG or PDF (Max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>

        </div>
      </div>
    </Dialog>
  );
}

export default ApplyWFHModal;
