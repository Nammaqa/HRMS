"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Pencil, Trash2, Upload, Eye, Plus, Loader2 } from "lucide-react";

interface PolicyRecord {
  id: number;
  title: string;
  description?: string | null;
  fileName: string;
  fileUrl: string;
  publicId: string;
  mimeType: string;
  fileSize: number;
  downloadEnabled: boolean;
  uploadedById: number;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackState {
  type: "success" | "error" | "idle";
  message: string;
}

export default function AdminPolicyPage() {
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyRecord | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({ type: "idle", message: "" });
  const [form, setForm] = useState({ title: "", description: "", downloadEnabled: true, file: null as File | null });

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/policies", { credentials: "include" });
      const result = await response.json();
      if (result.success) {
        setPolicies(result.data || []);
      } else {
        setFeedback({ type: "error", message: result.error || "Failed to load policies" });
      }
    } catch (error) {
      setFeedback({ type: "error", message: "Unable to load policies" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const resetForm = () => {
    setForm({ title: "", description: "", downloadEnabled: true, file: null });
    setEditingPolicy(null);
    setShowForm(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFeedback({ type: "idle", message: "" });

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("downloadEnabled", String(form.downloadEnabled));
      if (form.file) {
        formData.append("file", form.file);
      }

      const url = editingPolicy ? `/api/policies/${editingPolicy.id}` : "/api/policies";
      const method = editingPolicy ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save policy");
      }

      setFeedback({ type: "success", message: editingPolicy ? "Policy updated successfully" : "Policy uploaded successfully" });
      resetForm();
      await loadPolicies();
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to save policy" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (policy: PolicyRecord) => {
    setEditingPolicy(policy);
    setForm({
      title: policy.title,
      description: policy.description || "",
      downloadEnabled: policy.downloadEnabled,
      file: null,
    });
    setShowForm(true);
  };

  const handleDelete = async (policy: PolicyRecord) => {
    if (!window.confirm(`Delete ${policy.title}?`)) return;

    try {
      const response = await fetch(`/api/policies/${policy.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete policy");
      }

      setFeedback({ type: "success", message: "Policy deleted" });
      await loadPolicies();
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to delete policy" });
    }
  };

  const handleToggleDownload = async (policy: PolicyRecord) => {
    try {
      const formData = new FormData();
      formData.append("downloadEnabled", String(!policy.downloadEnabled));

      const response = await fetch(`/api/policies/${policy.id}`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update download permission");
      }

      setPolicies((current) => current.map((item) => (item.id === policy.id ? { ...item, downloadEnabled: !item.downloadEnabled } : item)));
      setFeedback({ type: "success", message: "Download permission updated" });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to update permission" });
    }
  };

  const totalSize = useMemo(() => policies.reduce((sum, policy) => sum + policy.fileSize, 0), [policies]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policy Management</h1>
          <p className="text-sm text-gray-600">Upload, review, and control employee access to company documents.</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingPolicy(null); setForm({ title: "", description: "", downloadEnabled: true, file: null }); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Policy
        </Button>
      </div>

      {feedback.type !== "idle" && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {feedback.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{policies.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Download Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{policies.filter((policy) => policy.downloadEnabled).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{(totalSize / (1024 * 1024)).toFixed(1)} MB</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPolicy ? "Edit Policy" : "Upload New Policy"}</CardTitle>
            <CardDescription>{editingPolicy ? "Adjust the document details and permissions." : "Add a new policy document to the portal."}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Policy Title</label>
                  <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Employee Handbook" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Allow Employee Download</label>
                  <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                    <input type="checkbox" checked={form.downloadEnabled} onChange={(event) => setForm((current) => ({ ...current, downloadEnabled: event.target.checked }))} />
                    <span className="text-sm">Enable download for employees</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Description</label>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Optional details about the policy" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Upload Document</label>
                <input type="file" accept=".pdf,.docx,.xlsx,.pptx" onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-3" />
                <p className="mt-2 text-xs text-gray-500">Supported formats: PDF, DOCX, XLSX, PPTX. Maximum size: 10MB.</p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} {editingPolicy ? "Save Changes" : "Upload Policy"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Policies</CardTitle>
          <CardDescription>Manage file visibility and employee download access for each document.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading policies...
            </div>
          ) : policies.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-gray-500">
              <FileText className="mx-auto mb-3 h-8 w-8" />
              <p>No policies have been uploaded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-sm text-gray-600">
                    <th className="px-3 py-3 font-medium">Policy Title</th>
                    <th className="px-3 py-3 font-medium">Description</th>
                    <th className="px-3 py-3 font-medium">File Name</th>
                    <th className="px-3 py-3 font-medium">File Type</th>
                    <th className="px-3 py-3 font-medium">Upload Date</th>
                    <th className="px-3 py-3 font-medium">Download Enabled</th>
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {policies.map((policy) => (
                    <tr key={policy.id} className="text-sm text-gray-700">
                      <td className="px-3 py-3 font-medium">{policy.title}</td>
                      <td className="px-3 py-3">{policy.description || "—"}</td>
                      <td className="px-3 py-3">{policy.fileName}</td>
                      <td className="px-3 py-3">{policy.mimeType}</td>
                      <td className="px-3 py-3">{new Date(policy.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-3">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input type="checkbox" checked={policy.downloadEnabled} onChange={() => handleToggleDownload(policy)} />
                          <span>{policy.downloadEnabled ? "ON" : "OFF"}</span>
                        </label>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(policy.fileUrl, "_blank", "noopener,noreferrer")}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(policy)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(policy)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
