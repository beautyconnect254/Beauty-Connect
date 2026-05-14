"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface BookingActivityPoint {
  label: string;
  bookings: number;
  confirmed: number;
  paid: number;
}

export interface SpecialtyPerformancePoint {
  specialty: string;
  bookings: number;
}

export interface AvailabilityPoint {
  name: string;
  value: number;
  color: string;
}

export interface UserActivityPoint {
  label: string;
  activeUsers: number;
  signups: number;
}

interface AdminDashboardChartsProps {
  bookingActivity: BookingActivityPoint[];
  specialtyPerformance: SpecialtyPerformancePoint[];
  availability: AvailabilityPoint[];
  userActivity: UserActivityPoint[];
}

const axisStyle = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
  fontWeight: 700,
};

const tooltipStyle = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  boxShadow: "0 12px 28px rgba(23, 18, 37, 0.12)",
  fontSize: 12,
};

export function AdminDashboardCharts({
  bookingActivity,
  specialtyPerformance,
  availability,
  userActivity,
}: AdminDashboardChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="bg-white/90">
        <CardHeader className="border-b border-[color:var(--border)] pb-3">
          <CardTitle className="text-base">Booking Activity</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bookingActivity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="bookingFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="#6d28d9" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="paidFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(48, 36, 82, 0.08)" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Area
                type="monotone"
                dataKey="bookings"
                name="Daily bookings"
                stroke="#6d28d9"
                strokeWidth={2}
                fill="url(#bookingFill)"
              />
              <Area
                type="monotone"
                dataKey="confirmed"
                name="Confirmed"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="transparent"
              />
              <Area
                type="monotone"
                dataKey="paid"
                name="Paid hires"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#paidFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardHeader className="border-b border-[color:var(--border)] pb-3">
          <CardTitle className="text-base">Specialty Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={specialtyPerformance}
              layout="vertical"
              margin={{ top: 8, right: 12, left: 28, bottom: 0 }}
            >
              <CartesianGrid stroke="rgba(48, 36, 82, 0.08)" horizontal={false} />
              <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="specialty"
                tick={axisStyle}
                tickLine={false}
                axisLine={false}
                width={92}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="bookings" name="Booking volume" radius={[0, 8, 8, 0]}>
                {specialtyPerformance.map((entry, index) => (
                  <Cell
                    key={entry.specialty}
                    fill={index < 3 ? "#6d28d9" : index < 6 ? "#059669" : "#94a3b8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardHeader className="border-b border-[color:var(--border)] pb-3">
          <CardTitle className="text-base">Worker Availability</CardTitle>
        </CardHeader>
        <CardContent className="grid h-72 grid-cols-[minmax(0,1fr)_150px] items-center gap-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={availability}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="84%"
                paddingAngle={3}
              >
                {availability.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {availability.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-[color:var(--foreground)]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="text-sm font-extrabold text-[color:var(--foreground)]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardHeader className="border-b border-[color:var(--border)] pb-3">
          <CardTitle className="text-base">User Activity</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userActivity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(48, 36, 82, 0.08)" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Line
                type="monotone"
                dataKey="activeUsers"
                name="Daily active users"
                stroke="#6d28d9"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="signups"
                name="Signups"
                stroke="#059669"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
