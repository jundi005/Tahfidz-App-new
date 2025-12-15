import React from 'react';
import Card, { WidgetCard } from '../components/Card';
import { AttendanceColumnChart, SimplePieChart } from '../components/Chart';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { AttendanceStatus, Marhalah } from '../types';
import { Users, BookOpen, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
    const { santri, musammi, halaqah, attendance, loading, error } = useSupabaseData();

    // --- Data Calculations ---
    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                 <div className="text-center p-8">Memuat data dashboard...</div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center p-8 text-error">Error: {error}</div>;
    }

    // 1. Summary Cards Data
    const santriByMarhalah = santri.reduce((acc, s) => {
        acc[s.marhalah] = (acc[s.marhalah] || 0) + 1;
        return acc;
    }, {} as Record<Marhalah, number>);

    // 2. Today's Attendance Pie Chart Data
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const todaysAttendance = attendance.filter(a => a.date === todayString);
    const todaysSummary = todaysAttendance.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
    }, {} as Record<AttendanceStatus, number>);

    const pieChartData = Object.entries(todaysSummary)
      .map(([name, value]) => ({ name, value: value as number }))
      .filter(item => item.value > 0);

    // 3. Weekly Attendance Stacked Bar Chart Data
    const weeklyAttendanceData = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = format(date, 'yyyy-MM-dd');
        const dayName = format(date, 'eee');
        const recordsOnDate = attendance.filter(a => a.date === dateString);
        
        const stats: Record<string, string | number> = { name: dayName };
        Object.values(AttendanceStatus).forEach(status => {
            stats[status] = recordsOnDate.filter(a => a.status === status).length;
        });

        return stats;
    }).reverse();


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <WidgetCard className="flex flex-col justify-between">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Total Santri</p>
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="text-secondary" size={20}/>
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold mt-2">{santri.length}</p>
                 <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                    <p>Mutawassithah: <span className="font-semibold text-slate-600">{santriByMarhalah[Marhalah.Mutawassithah] || 0}</span></p>
                    <p>Aliyah: <span className="font-semibold text-slate-600">{santriByMarhalah[Marhalah.Aliyah] || 0}</span></p>
                    <p>Jamiah: <span className="font-semibold text-slate-600">{santriByMarhalah[Marhalah.Jamiah] || 0}</span></p>
                </div>
            </div>
        </WidgetCard>
        <WidgetCard className="flex flex-col justify-between">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Total Musammi'</p>
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <Users className="text-indigo-500" size={20}/>
                </div>
            </div>
             <div>
                <p className="text-3xl font-bold mt-2">{musammi.length}</p>
                <p className="text-xs text-slate-400 mt-2">Pengajar aktif</p>
             </div>
        </WidgetCard>
        <WidgetCard className="flex flex-col justify-between">
             <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Total Halaqah</p>
                 <div className="p-2 bg-amber-100 rounded-lg">
                    <BookOpen className="text-amber-600" size={20}/>
                 </div>
            </div>
             <div>
                <p className="text-3xl font-bold mt-2">{halaqah.length}</p>
                <p className="text-xs text-slate-400 mt-2">Kelompok belajar</p>
             </div>
        </WidgetCard>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
          <Card title="Statistik Kehadiran Seminggu Terakhir">
            <AttendanceColumnChart data={weeklyAttendanceData} />
          </Card>
          <Card title="Absensi Hari Ini">
            {pieChartData.length > 0 ? (
                 <SimplePieChart data={pieChartData} />
            ) : (
                <div className="flex items-center justify-center min-h-[300px]">
                    <p className="text-sm text-slate-500">Belum ada data absensi untuk hari ini.</p>
                </div>
            )}
          </Card>
      </div>
    </div>
  );
};

export default Dashboard;