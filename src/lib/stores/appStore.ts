"use client";

import { create } from "zustand";
import type { ApplicationStatus } from "@/lib/supabase/database.types";

export interface AppRecord {
  id:              string;
  student_id:      string;
  company_name:    string;
  job_role:        string;
  job_description: string | null;
  job_link:        string | null;
  resume_used:     string | null;
  status:          ApplicationStatus;
  applied_at:      string;
  updated_at:      string;
  notes:           string | null;
  applied_by_profile?: { id: string; full_name: string } | null;
}

type FilterState = {
  status:  ApplicationStatus | "all";
  search:  string;
};

interface AppState {
  applications: AppRecord[];
  filters:      FilterState;
  isLoading:    boolean;

  setApplications:  (apps: AppRecord[])                            => void;
  addApplication:   (app: AppRecord)                               => void;
  updateStatus:     (id: string, status: ApplicationStatus)        => void;
  removeApplication:(id: string)                                   => void;
  setFilter:        (filter: Partial<FilterState>)                 => void;
  setLoading:       (v: boolean)                                   => void;

  // Derived selector — call inside component
  filtered: (apps?: AppRecord[]) => AppRecord[];
}

export const useAppStore = create<AppState>((set, get) => ({
  applications: [],
  filters:      { status: "all", search: "" },
  isLoading:    true,

  setApplications:   (apps)            => set({ applications: apps, isLoading: false }),
  addApplication:    (app)             => set((s) => ({ applications: [app, ...s.applications] })),
  updateStatus:      (id, status)      => set((s) => ({
    applications: s.applications.map((a) => a.id === id ? { ...a, status } : a),
  })),
  removeApplication: (id)              => set((s) => ({
    applications: s.applications.filter((a) => a.id !== id),
  })),
  setFilter:         (filter)          => set((s) => ({ filters: { ...s.filters, ...filter } })),
  setLoading:        (v)               => set({ isLoading: v }),

  filtered: (overrideApps) => {
    const { applications, filters } = get();
    const pool = overrideApps ?? applications;
    const q    = filters.search.toLowerCase();
    return pool.filter((a) => {
      const matchStatus = filters.status === "all" || a.status === filters.status;
      const matchSearch = !q
        || a.company_name.toLowerCase().includes(q)
        || a.job_role.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  },
}));
