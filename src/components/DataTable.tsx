"use client";

import { motion } from "framer-motion";

export interface Column<T> {
  key:       string;
  header:    string;
  width?:    string;
  render?:   (row: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  columns:      Column<T>[];
  data:         T[];
  onRowClick?:  (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data yet.",
}: DataTableProps<T>) {
  return (
    <div
      style={{
        background:           "rgba(255,255,255,0.5)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:               "1px solid rgba(255,255,255,0.65)",
        borderRadius:         18,
        boxShadow:            "0 4px 24px rgba(0,0,0,0.03)",
        overflow:             "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {/* Header */}
          <thead>
            <tr
              style={{
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                background:   "rgba(248,250,255,0.6)",
              }}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding:       "12px 16px",
                    textAlign:     "left",
                    fontSize:      10.5,
                    fontWeight:    700,
                    color:         "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                    whiteSpace:    "nowrap",
                    width:         col.width,
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding:   "40px 20px",
                    textAlign: "center",
                    color:     "#94a3b8",
                    fontSize:  13,
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: i * 0.04 }}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    borderBottom: "1px solid rgba(0,0,0,0.035)",
                    cursor:       onRowClick ? "pointer" : "default",
                    transition:   "background 0.2s cubic-bezier(.4,0,.2,1)",
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick)
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        "rgba(59,130,246,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding:  "13px 16px",
                        fontSize: 13.5,
                        color:    "#1e293b",
                        verticalAlign: "middle",
                      }}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
