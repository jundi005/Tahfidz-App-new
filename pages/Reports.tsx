import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { SimplePieChart } from '../components/Chart';
import { exportToExcel, exportToPDF } from '../lib/utils';
import { ALL_MARHALAH, KELAS_BY_MARHALAH, ALL_PERAN, ALL_ATTENDANCE_STATUS } from '../constants';
import { Marhalah, Peran, AttendanceStatus } from '../types';
import { Download } from 'lucide-react';

const Reports: React.FC = () => {
    const { attendance, loading, error } = useSupabaseData();
    
    // Filters
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedMarhalah, setSelectedMarhalah] = useState<Marhalah | 'all'>('all');
    const [selectedKelas, setSelectedKelas] = useState<string | 'all'>('all');
    const [selectedPeran, setSelectedPeran] = useState<Peran | 'all'>('all');
    const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | 'all'>('all');
    const [searchName, setSearchName] = useState('');

    const filteredData = useMemo(() => {
        return attendance.filter(record => {
            if (dateRange.start && record.date < dateRange.start) return false;
            if (dateRange.end && record.date > dateRange.end) return false;
            if (selectedMarhalah !== 'all' && record.marhalah !== selectedMarhalah) return false;
            if (selectedKelas !== 'all' && record.kelas !== selectedKelas) return false;
            if (selectedPeran !== 'all' && record.peran !== selectedPeran) return false;
            if (selectedStatus !== 'all' && record.status !== selectedStatus) return false;
            if (searchName && !record.nama.toLowerCase().includes(searchName.toLowerCase())) return false;
            return true;
        });
    }, [attendance, dateRange, selectedMarhalah, selectedKelas, selectedPeran, selectedStatus, searchName]);

    const pieChartData = useMemo(() => {
        const statusCounts = filteredData.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {} as Record<AttendanceStatus, number>);

        return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    }, [filteredData]);
    
    const handleExportExcel = () => {
        exportToExcel(filteredData, 'laporan_absensi');
    };
    
    const handleExportPDF = () => {
        exportToPDF(filteredData, 'laporan_absensi');
    };
    
    if (loading) return <p>Loading report data...</p>;
    if (error) return <p className="text-error">Error: {error}</p>;

    return (
        <div className="space-y-6">
            <Card title="Filter Laporan">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-slate-700">Rentang Tanggal</label>
                        <div className="flex items-center space-x-2 mt-1">
                            <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="w-full border-slate-300 rounded-md shadow-sm text-sm"/>
                            <span className="text-slate-500">-</span>
                            <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="w-full border-slate-300 rounded-md shadow-sm text-sm"/>
                        </div>
                    </div>
                    <div>
                         <label htmlFor="marhalah" className="block text-sm font-medium text-slate-700">Marhalah</label>
                        <select id="marhalah" value={selectedMarhalah} onChange={e => { setSelectedMarhalah(e.target.value as Marhalah | 'all'); setSelectedKelas('all');}} className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm">
                            <option value="all">Semua Marhalah</option>
                            {ALL_MARHALAH.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor="kelas" className="block text-sm font-medium text-slate-700">Kelas</label>
                        <select id="kelas" disabled={selectedMarhalah === 'all'} value={selectedKelas} onChange={e => setSelectedKelas(e.target.value as string | 'all')} className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm disabled:bg-slate-100">
                            <option value="all">Semua Kelas</option>
                            {selectedMarhalah !== 'all' && KELAS_BY_MARHALAH[selectedMarhalah].map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                     <div>
                         <label htmlFor="peran" className="block text-sm font-medium text-slate-700">Peran</label>
                        <select id="peran" value={selectedPeran} onChange={e => setSelectedPeran(e.target.value as Peran | 'all')} className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm">
                            <option value="all">Semua Peran</option>
                            {ALL_PERAN.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status Kehadiran</label>
                        <select id="status" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value as AttendanceStatus | 'all')} className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm">
                            <option value="all">Semua Status</option>
                            {ALL_ATTENDANCE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="nama" className="block text-sm font-medium text-slate-700">Cari Nama</label>
                        <input type="text" id="nama" placeholder="Ketik nama..." value={searchName} onChange={e => setSearchName(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm"/>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 -mt-6 -mx-6 mb-6 p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">Hasil Laporan <span className="text-sm font-normal text-slate-500">({filteredData.length} data)</span></h3>
                    <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto">
                         <button onClick={handleExportExcel} className="bg-white border border-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center justify-center text-sm">
                            <Download size={16} className="mr-2"/> Export Excel
                        </button>
                        <button onClick={handleExportPDF} className="bg-white border border-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center justify-center text-sm">
                            <Download size={16} className="mr-2"/> Export PDF
                        </button>
                    </div>
                </div>
                 <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Tanggal</th><th className="px-6 py-3">Waktu</th><th className="px-6 py-3">Nama</th>
                                <th className="px-6 py-3">Marhalah</th><th className="px-6 py-3">Kelas</th><th className="px-6 py-3">Peran</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {filteredData.map(record => (
                                <tr key={record.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">{record.date}</td><td className="px-6 py-4">{record.waktu}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{record.nama}</td><td className="px-6 py-4">{record.marhalah}</td>
                                    <td className="px-6 py-4">{record.kelas}</td><td className="px-6 py-4">{record.peran}</td>
                                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${record.status === 'Hadir' ? 'bg-green-100 text-green-800' :
                                          record.status === 'Izin' ? 'bg-blue-100 text-blue-800' :
                                          record.status === 'Sakit' ? 'bg-yellow-100 text-yellow-800' :
                                          record.status === 'Terlambat' ? 'bg-amber-100 text-amber-800' :
                                          'bg-red-100 text-red-800'}`}>{record.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            <Card title="Grafik Statistik Kehadiran">
                 <SimplePieChart data={pieChartData} />
            </Card>

        </div>
    );
};

export default Reports;