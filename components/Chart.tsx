

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AttendanceStatus } from '../types';

// Consistent colors for attendance statuses across all charts
const STATUS_COLORS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.Hadir]: '#22C55E',    // success
  [AttendanceStatus.Sakit]: '#F59E0B',    // warning
  [AttendanceStatus.Izin]: '#0EA5E9',     // info
  [AttendanceStatus.Alpa]: '#EF4444',     // error
  [AttendanceStatus.Terlambat]: '#FBBF24', // yellow-ish
};
const OTHER_COLORS = ['#6B7280', '#9CA3AF'];


interface BarChartProps {
  data: any[];
  barKey: string;
  xAxisKey: string;
}

export const SimpleBarChart: React.FC<BarChartProps> = ({ data, barKey, xAxisKey }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xAxisKey} />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey={barKey} fill="#3B82F6" />
    </BarChart>
  </ResponsiveContainer>
);

interface PieChartProps {
    data: { name: string; value: number }[];
    height?: number;
    showLabel?: boolean;
}

export const SimplePieChart: React.FC<PieChartProps> = ({ data, height = 300, showLabel = true }) => (
    <ResponsiveContainer width="100%" height={height}>
        <PieChart>
            <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={height < 200 ? 50 : 80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={showLabel ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
            >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as AttendanceStatus] || OTHER_COLORS[index % OTHER_COLORS.length]} />
                ))}
            </Pie>
            <Tooltip />
            <Legend />
        </PieChart>
    </ResponsiveContainer>
);

interface StackedBarChartProps {
  data: any[];
}
export const StackedBarChart: React.FC<StackedBarChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey={AttendanceStatus.Hadir} stackId="a" fill={STATUS_COLORS[AttendanceStatus.Hadir]} name="Hadir" />
      <Bar dataKey={AttendanceStatus.Sakit} stackId="a" fill={STATUS_COLORS[AttendanceStatus.Sakit]} name="Sakit" />
      <Bar dataKey={AttendanceStatus.Izin} stackId="a" fill={STATUS_COLORS[AttendanceStatus.Izin]} name="Izin" />
      <Bar dataKey={AttendanceStatus.Alpa} stackId="a" fill={STATUS_COLORS[AttendanceStatus.Alpa]} name="Alpa" />
      <Bar dataKey={AttendanceStatus.Terlambat} stackId="a" fill={STATUS_COLORS[AttendanceStatus.Terlambat]} name="Terlambat" />
    </BarChart>
  </ResponsiveContainer>
);

export const AttendanceColumnChart: React.FC<StackedBarChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey={AttendanceStatus.Hadir} fill={STATUS_COLORS[AttendanceStatus.Hadir]} name="Hadir" />
      <Bar dataKey={AttendanceStatus.Sakit} fill={STATUS_COLORS[AttendanceStatus.Sakit]} name="Sakit" />
      <Bar dataKey={AttendanceStatus.Izin} fill={STATUS_COLORS[AttendanceStatus.Izin]} name="Izin" />
      <Bar dataKey={AttendanceStatus.Alpa} fill={STATUS_COLORS[AttendanceStatus.Alpa]} name="Alpa" />
      <Bar dataKey={AttendanceStatus.Terlambat} fill={STATUS_COLORS[AttendanceStatus.Terlambat]} name="Terlambat" />
    </BarChart>
  </ResponsiveContainer>
);