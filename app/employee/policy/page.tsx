"use client";

import { useEffect, useMemo, useState } from "react";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/Modal";
import {
  Eye,
  Download,
  FileText,
  Loader2,
  Search,
  FileText as DocumentIcon,
  FileBadge,
  FileVideo,
  Image as ImageIcon,
} from "lucide-react";

interface PolicyRecord {
  id: number;
  title: string;
  description?: string | null;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  downloadEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const fileTypeMeta = {
  pdf: { label: "PDF", color: "bg-red-50 text-red-700", icon: DocumentIcon },
  docx: { label: "DOCX", color: "bg-blue-50 text-blue-700", icon: DocumentIcon },
  doc: { label: "DOC", color: "bg-blue-50 text-blue-700", icon: DocumentIcon },
  xlsx: { label: "XLSX", color: "bg-emerald-50 text-emerald-700", icon: FileBadge },
  xls: { label: "XLS", color: "bg-emerald-50 text-emerald-700", icon: FileBadge },
  pptx: { label: "PPTX", color: "bg-orange-50 text-orange-700", icon: FileVideo },
  ppt: { label: "PPT", color: "bg-orange-50 text-orange-700", icon: FileVideo },
  jpg: { label: "JPG", color: "bg-violet-50 text-violet-700", icon: ImageIcon },
  jpeg: { label: "JPEG", color: "bg-violet-50 text-violet-700", icon: ImageIcon },
  png: { label: "PNG", color: "bg-violet-50 text-violet-700", icon: ImageIcon },
  gif: { label: "GIF", color: "bg-violet-50 text-violet-700", icon: ImageIcon },
};

const getFileExtension = (fileName: string) => {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() : "";
};

const getFileTypeMeta = (fileName: string) => {
  const ext = getFileExtension(fileName);
  return fileTypeMeta[ext as keyof typeof fileTypeMeta] ?? {
    label: ext.toUpperCase() || "FILE",
    color: "bg-slate-50 text-slate-700",
    icon: DocumentIcon,
  };
};

const getPreviewUrl = (policy: PolicyRecord) => {
  const ext = getFileExtension(policy.fileName);

  if (ext === "pdf") {
    return policy.fileUrl;
  }

  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(policy.fileUrl)}`;
  }

  return policy.fileUrl;
};

export default function EmployeePolicyPage() {
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Employee");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyRecord | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userResponse = await fetch("/api/auth/me", { credentials: "include" });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserName(userData.user?.name || "Employee");
        }

        const response = await fetch("/api/policies", { credentials: "include" });
        const result = await response.json();
        if (result.success) {
          setPolicies(result.data || []);
        } else {
          console.error("Policy API error", result.error);
        }
      } catch (error) {
        console.error("Failed to load policies", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredPolicies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return policies;
    return policies.filter((policy) => policy.title.toLowerCase().includes(term));
  }, [policies, searchTerm]);

  const handleViewPolicy = (policy: PolicyRecord) => {
    setViewerError(null);
    setSelectedPolicy(policy);
  };

  const closeViewer = () => {
    setSelectedPolicy(null);
    setViewerError(null);
  };

  const renderViewerContent = (policy: PolicyRecord) => {
    const ext = getFileExtension(policy.fileName);
    const previewUrl = getPreviewUrl(policy);

    if (ext === "pdf") {
      return (
        <iframe
          title={policy.title}
          src={previewUrl}
          className="h-[70vh] w-full rounded-3xl border border-slate-200 bg-white"
          allowFullScreen
          onError={() => setViewerError("Unable to load the PDF preview. Please download to open the file.")}
        />
      );
    }

    if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <img src={previewUrl} alt={policy.title} className="max-h-[70vh] w-full rounded-3xl object-contain" />
        </div>
      );
    }

    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
      return (
        <iframe
          title={policy.title}
          src={previewUrl}
          className="h-[70vh] w-full rounded-3xl border border-slate-200 bg-white"
          allowFullScreen
        />
      );
    }

    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
        <p>Preview is not available for this file type. Please use the download button to open it.</p>
      </div>
    );
  };

  return (
    <EmployeeSidebar userName={userName}>
      <div className="p-6 md:p-8">
        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Policy Center</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Company Policies</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Access all approved company policies, handbooks, and guidelines. View documents inside the app and download only when permitted.
              </p>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search policies by title"
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <div key={index} className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-6 w-3/4 rounded-full bg-slate-200" />
                <div className="mt-4 h-4 w-1/2 rounded-full bg-slate-200" />
                <div className="mt-6 space-y-3">
                  <div className="h-10 rounded-2xl bg-slate-200" />
                  <div className="h-10 rounded-2xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-600">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-900">No policies found</h2>
            <p className="mt-2 max-w-xl mx-auto text-sm leading-6 text-slate-600">
              Try another keyword or check back later when your HR team publishes new policy documents.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPolicies.map((policy) => {
              const meta = getFileTypeMeta(policy.fileName);
              const Icon = meta.icon;
              return (
                <Card key={policy.id}>
                  <div className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{meta.label}</p>
                        <h2 className="mt-3 text-xl font-semibold text-slate-900">{policy.title}</h2>
                      </div>
                      <span className={`${meta.color} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold`}> 
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </div>

                    <p className="min-h-[4.5rem] text-sm leading-6 text-slate-600">{policy.description || "No description provided."}</p>

                    {/* <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <div className="flex items-center justify-between gap-3">
                        <span>Uploaded</span>
                        <span className="font-medium text-slate-900">{new Date(policy.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Last updated</span>
                        <span className="font-medium text-slate-900">{new Date(policy.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div> */}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleViewPolicy(policy)}
                        title="View policy"
                      >
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Button>
                      {policy.downloadEnabled ? (
                        <Button
                          onClick={() => window.open(policy.fileUrl, "_blank", "noopener,noreferrer")}
                          title="Download policy"
                        >
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500"
                          title="Download disabled"
                        >
                          <Download className="mr-2 h-4 w-4" /> Download
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Modal
          open={Boolean(selectedPolicy)}
          onClose={closeViewer}
          title={selectedPolicy?.title ?? "Policy Preview"}
          maxWidth="xl"
          fullWidth={true}
          actions={
            selectedPolicy ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {selectedPolicy.downloadEnabled && (
                  <Button onClick={() => window.open(selectedPolicy.fileUrl, "_blank", "noopener,noreferrer")}>Download</Button>
                )}
                <Button variant="outline" onClick={closeViewer}>Close</Button>
              </div>
            ) : null
          }
        >
          {selectedPolicy ? (
            <div className="space-y-5">
              {/* <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{getFileExtension(selectedPolicy.fileName).toUpperCase()}</p>
                  <p className="mt-1 text-base text-slate-700">Uploaded: {new Date(selectedPolicy.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
                    <FileText className="h-4 w-4 text-slate-400" /> {selectedPolicy.fileName}
                  </span>
                </div>
              </div> */}

              {viewerError ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                  <p className="font-semibold">Unable to load preview.</p>
                  <p className="mt-2 text-sm">{viewerError}</p>
                </div>
              ) : (
                renderViewerContent(selectedPolicy)
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500">Loading preview...</div>
          )}
        </Modal>
      </div>
    </EmployeeSidebar>
  );
}
