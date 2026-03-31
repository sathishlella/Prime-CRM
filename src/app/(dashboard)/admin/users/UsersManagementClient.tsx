"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/Avatar";
import { useUIStore } from "@/lib/stores/uiStore";
import type { AdminProfile, AdminStudent } from "../page";

interface Counselor {
  id: string;
  full_name: string;
  email: string;
}

interface UsersManagementClientProps {
  allProfiles: AdminProfile[];
  allStudents: (AdminStudent & { assigned_counselor_id?: string | null })[];
  counselors: Counselor[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: "#8b5cf6",
  counselor: "#3b82f6",
  student: "#10b981",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  counselor: "Counselor",
  student: "Student",
};

export default function UsersManagementClient({
  allProfiles,
  allStudents,
  counselors,
}: UsersManagementClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | "students" | "counselors" | "admins">("all");
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [selectedCounselor, setSelectedCounselor] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { addToast } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredProfiles = useMemo(() => {
    if (activeTab === "all") return allProfiles;
    return allProfiles.filter((p) => p.role === activeTab.slice(0, -1)); // remove 's'
  }, [allProfiles, activeTab]);

  const studentsWithCounselor = useMemo(() => {
    return allStudents.map((s) => ({
      ...s,
      counselorName: s.counselor?.full_name || "Unassigned",
    }));
  }, [allStudents]);

  async function handleUpdateCounselor(studentId: string) {
    if (!selectedCounselor) return;
    
    setSaving(true);
    try {
      const response = await fetch("/api/students/update-counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          counselorId: selectedCounselor === "__unassign__" ? null : selectedCounselor,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");
      
      addToast("Counselor assigned successfully", "success");
      setEditingStudent(null);
      // Reload to show updated data
      window.location.reload();
    } catch {
      addToast("Failed to update counselor", "error");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(student: AdminStudent & { assigned_counselor_id?: string | null }) {
    setEditingStudent(student.id);
    setSelectedCounselor(student.assigned_counselor_id || "__unassign__");
  }

  async function handleDeleteUser() {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      const response = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: deletingUser.id,
          role: deletingUser.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      addToast(`${deletingUser.name} has been deleted successfully`, "success");
      setDeletingUser(null);
      // Reload to show updated data
      window.location.reload();
    } catch (error: any) {
      addToast(error.message || "Failed to delete user", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  function confirmDelete(user: AdminProfile | AdminStudent, role: string) {
    // AdminProfile has full_name directly, AdminStudent has it in profile.full_name
    const name = "profile" in user ? user.profile.full_name : user.full_name;
    setDeletingUser({
      id: user.id,
      name: name,
      role: role,
    });
  }

  return (
    <div>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
            onClick={() => !deleteLoading && setDeletingUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "28px 32px",
                maxWidth: 420,
                width: "100%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "rgba(239,68,68,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    fontSize: 28,
                  }}
                >
                  🗑️
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>
                  Delete Account?
                </h3>
                <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  Are you sure you want to delete <strong>{deletingUser.name}</strong>? This action cannot be undone and all associated data will be permanently removed.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setDeletingUser(null)}
                  disabled={deleteLoading}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "1.5px solid rgba(0,0,0,0.1)",
                    background: "transparent",
                    color: "#64748b",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: deleteLoading ? "not-allowed" : "pointer",
                    opacity: deleteLoading ? 0.6 : 1,
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deleteLoading}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: deleteLoading ? "not-allowed" : "pointer",
                    opacity: deleteLoading ? 0.7 : 1,
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {deleteLoading ? (
                    <>
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                          animation: "spin 0.8s linear infinite",
                          display: "inline-block",
                        }}
                      />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 6px" }}>
          User Management
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          Manage all users, assign counselors to students, and delete accounts
        </p>
      </motion.div>

      {/* Stats */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Users", value: allProfiles.length, color: "#64748b" },
          { label: "Students", value: allProfiles.filter((p) => p.role === "student").length, color: "#10b981" },
          { label: "Counselors", value: allProfiles.filter((p) => p.role === "counselor").length, color: "#3b82f6" },
          { label: "Admins", value: allProfiles.filter((p) => p.role === "admin").length, color: "#8b5cf6" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.65)",
              borderRadius: 14,
              padding: "16px 20px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: 12, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {[
          { key: "all", label: "All Users" },
          { key: "students", label: "Students" },
          { key: "counselors", label: "Counselors" },
          { key: "admins", label: "Admins" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === tab.key ? "rgba(59,130,246,0.1)" : "transparent",
              color: activeTab === tab.key ? "#3b82f6" : "#64748b",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Skeleton loader to prevent hydration mismatch */}
      {!mounted && (
        <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 18, padding: 40, textAlign: "center", color: "#94a3b8" }}>
          Loading...
        </div>
      )}

      {/* Students Table with Counselor Assignment and Delete */}
      {mounted && activeTab === "students" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.65)",
            borderRadius: 18,
            boxShadow: "0 4px 24px rgba(0,0,0,0.03)",
            overflow: "auto",
          }}
        >
          <table className="responsive-table students-page-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "rgba(248,250,255,0.6)" }}>
                {["Student", "University", "Assigned Counselor", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: 0.7,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentsWithCounselor.map((student) => (
                <tr key={student.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.035)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar
                        initials={student.profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        size={36}
                        color="#10b981"
                      />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 650, color: "#1e293b" }}>
                          {student.profile.full_name}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{student.profile.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569" }}>
                    {student.university || "—"}
                    {student.major && <div style={{ fontSize: 11, color: "#94a3b8" }}>{student.major}</div>}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {editingStudent === student.id ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <select
                          value={selectedCounselor}
                          onChange={(e) => setSelectedCounselor(e.target.value)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1.5px solid rgba(59,130,246,0.3)",
                            background: "rgba(255,255,255,0.8)",
                            fontSize: 13,
                            fontFamily: "inherit",
                            minWidth: 160,
                          }}
                        >
                          <option value="__unassign__">— Unassigned —</option>
                          {counselors.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.full_name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleUpdateCounselor(student.id)}
                          disabled={saving}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "none",
                            background: "linear-gradient(135deg, #3b82f6, #10b981)",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.7 : 1,
                          }}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingStudent(null)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1px solid rgba(0,0,0,0.1)",
                            background: "transparent",
                            color: "#64748b",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: student.counselor ? "rgba(59,130,246,0.1)" : "rgba(148,163,184,0.1)",
                            color: student.counselor ? "#3b82f6" : "#94a3b8",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {student.counselorName}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: student.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                        color: student.status === "active" ? "#10b981" : "#f59e0b",
                        fontSize: 12,
                        fontWeight: 500,
                        textTransform: "capitalize",
                      }}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {editingStudent !== student.id && (
                        <button
                          onClick={() => startEditing(student)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "1px solid rgba(59,130,246,0.2)",
                            background: "transparent",
                            color: "#3b82f6",
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          Assign Counselor
                        </button>
                      )}
                      <button
                        onClick={() => confirmDelete(student, "student")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid rgba(239,68,68,0.2)",
                          background: "transparent",
                          color: "#ef4444",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* All Users / Counselors / Admins Table with Delete */}
      {mounted && activeTab !== "students" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.65)",
            borderRadius: 18,
            boxShadow: "0 4px 24px rgba(0,0,0,0.03)",
            overflow: "auto",
          }}
        >
          <table className="responsive-table users-page-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "rgba(248,250,255,0.6)" }}>
                {["User", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: 0.7,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.035)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div className="user-cell" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar
                        initials={profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        size={36}
                        color={ROLE_COLORS[profile.role]}
                      />
                      <div className="user-info">
                        <div className="user-name" style={{ fontSize: 13.5, fontWeight: 650, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                          {profile.full_name}
                        </div>
                        <div className="user-email" style={{ fontSize: 12, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                          {profile.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569" }} className="email-cell">{profile.email}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        background: `${ROLE_COLORS[profile.role]}20`,
                        color: ROLE_COLORS[profile.role],
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {ROLE_LABELS[profile.role]}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: profile.is_active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: profile.is_active ? "#10b981" : "#ef4444",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {profile.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#94a3b8" }}>
                    {(() => {
  const date = new Date(profile.created_at);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
})()}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {profile.role !== "admin" && (
                      <button
                        onClick={() => confirmDelete(profile, profile.role)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid rgba(239,68,68,0.2)",
                          background: "transparent",
                          color: "#ef4444",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProfiles.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              No users found in this category.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
