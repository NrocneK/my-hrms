"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

const COLORS = {
  present: "#22c55e",
  late: "#eab308",
  absent: "#ef4444",
  leave: "#a855f7",
};

interface TrendData {
  label: string;
  present: number; late: number; absent: number; leave: number;
}

interface DeptData {
  name: string; rate: number; absent: number; late: number;
}

interface PieData {
  name: string; value: number; color: string;
}

// ── Trend 6 tháng ─────────────────────────────────────────────────────────────
export function AttendanceTrendChart({ data }: { data: TrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="present" name="Có mặt" fill={COLORS.present} radius={[3, 3, 0, 0]} />
        <Bar dataKey="late" name="Đi trễ" fill={COLORS.late} radius={[3, 3, 0, 0]} />
        <Bar dataKey="absent" name="Vắng" fill={COLORS.absent} radius={[3, 3, 0, 0]} />
        <Bar dataKey="leave" name="Nghỉ phép" fill={COLORS.leave} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Tỷ lệ theo phòng ──────────────────────────────────────────────────────────
export function DepartmentRateChart({ data }: { data: DeptData[] }) {
  const pctFormatter = (v: any) => `${v}%`;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }}
          tickFormatter={pctFormatter} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
        <Tooltip
          formatter={pctFormatter}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
        />
        <Bar dataKey="rate" name="Tỷ lệ có mặt" fill="#3b82f6" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.rate >= 90 ? "#22c55e" : entry.rate >= 75 ? "#eab308" : "#ef4444"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Pie chart ─────────────────────────────────────────────────────────────────
export function AttendancePieChart({ data }: { data: PieData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const pieFormatter = (v: any) =>
    `${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={pieFormatter}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Line chart ────────────────────────────────────────────────────────────────
export function AttendanceLineChart({ data }: { data: TrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="present" name="Có mặt" stroke={COLORS.present} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="late" name="Đi trễ" stroke={COLORS.late} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="absent" name="Vắng" stroke={COLORS.absent} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}