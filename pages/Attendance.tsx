
import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { AttendanceStatus, Marhalah, HalaqahType, Waktu, Peran } from '../types';
import type { Halaqah as HalaqahData, Person } from '../types';
import { ALL_MARHALAH, ALL_WAKTU, ALL_HALAQAH_TYPE } from '../constants';
import { format } from 'date-fns';

const AttendanceRow: React.FC<{
    person: Person;
    halaqahId: number;
    status: AttendanceStatus;
    onStatusChange: (personId: number, halaqahId: number, status: AttendanceStatus) => void;
}> = React.memo(({ person, halaqahId, status, onStatusChange }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg space-y-2 sm:space-y-0">
        <div className="flex items-center">
            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold">
                {person.nama.charAt(0)}
            </div>
            <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">{person.nama}</p>
                <p className="text-xs text-slate-500">{person.marhalah} - {person.kelas}</p>
            </div>
        </div>
        <select
            value={status}
            onChange={(e) => onStatusChange(person.id, halaqahId, e.target.value as AttendanceStatus)}
            className="block w-full sm:w-36 pl-3 pr-8 py-2 text-sm border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm"
        >
            {Object.values(AttendanceStatus).map(s => (
                <option key={s} value={s}>{s}</option>
            ))}
        </select>
    </div>
));

const HalaqahCard: React.FC<{
    halaqah: HalaqahData;
    attendanceData: Record<string, { status: AttendanceStatus; halaqahId: number }>;
    onStatusChange: (personId: number, halaqahId: number, status: AttendanceStatus) => void;
}> = React.memo(({ halaqah, attendanceData, onStatusChange }) => (
    <Card>
        <div className="border-b border-slate-200 -mt-6 -mx-6 px-6 pb-4 mb-4">
            <h3 className="text-lg font-bold text-slate-800">{halaqah.nama}</h3>
            <p className="text-sm text-slate-500">{halaqah.marhalah} - {halaqah.jenis}</p>
        </div>
        <div className="space-y-2">
            <div>
                <p className="text-xs uppercase text-slate-500 font-semibold mb-2 px-2.5">Musammi'</p>
                <AttendanceRow
                    person={halaqah.musammi}
                    halaqahId={halaqah.id}
                    status={attendanceData[halaqah.musammi.id]?.status || AttendanceStatus.Hadir}
                    onStatusChange={onStatusChange}
                />
            </div>
            <div className="pt-2">
                <p className="text-xs uppercase text-slate-500 font-semibold mt-4 mb-2 px-2.5">Santri ({halaqah.santri.length})</p>
                <div className="space-y-1">
                    {halaqah.santri.map(s => (
                        <AttendanceRow
                            key={s.id}
                            person={s}
                            halaqahId={halaqah.id}
                            status={attendanceData[s.id]?.status || AttendanceStatus.Hadir}
                            onStatusChange={onStatusChange}
                        />
                    ))}
                </div>
            </div>
        </div>
    </Card>
));


const Attendance: React.FC = () => {
    const { halaqah, musammi, addAttendanceRecords, loading, error } = useSupabaseData();
    const [attendanceData, setAttendanceData] = useState<Record<string, {status: AttendanceStatus, halaqahId: number}>>({});
    const [isSaving, setIsSaving] = useState(false);
    
    // Filters
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedMarhalah, setSelectedMarhalah] = useState<Marhalah | 'all'>('all');
    const [selectedType, setSelectedType] = useState<HalaqahType | 'all'>('all');
    const [selectedWaktu, setSelectedWaktu] = useState<Waktu | 'all'>('all');

    const filteredHalaqah = useMemo(() => {
        return halaqah
            .filter(h => {
                if (selectedMarhalah !== 'all' && h.marhalah !== selectedMarhalah) return false;
                if (selectedType !== 'all' && h.jenis !== selectedType) return false;
                if (selectedWaktu !== 'all' && !h.waktu.includes(selectedWaktu)) return false;
                return true;
            })
            .sort((a, b) => a.nama.localeCompare(b.nama));
    }, [halaqah, selectedMarhalah, selectedType, selectedWaktu]);
    
    const musammiIds = useMemo(() => new Set(musammi.map(m => m.id)), [musammi]);

    const handleStatusChange = (personId: number, halaqahId: number, status: AttendanceStatus) => {
        setAttendanceData(prev => ({ ...prev, [personId]: { status, halaqahId } }));
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        
        const allPeopleToRecord: { person: Person; halaqahId: number }[] = [];
        filteredHalaqah.forEach(h => {
            allPeopleToRecord.push({ person: h.musammi, halaqahId: h.id });
            h.santri.forEach(s => {
                allPeopleToRecord.push({ person: s, halaqahId: h.id });
            });
        });

        const recordsToSave = allPeopleToRecord.map(({ person, halaqahId }) => {
            const status = attendanceData[person.id]?.status || AttendanceStatus.Hadir;
            const personIsMusammi = musammiIds.has(person.id);

            return {
                date: selectedDate,
                waktu: selectedWaktu as Waktu,
                personId: person.id,
                peran: personIsMusammi ? Peran.Musammi : Peran.Santri,
                status: status,
                halaqahId: halaqahId
            }
        });

        if (recordsToSave.length === 0) {
            alert('Tidak ada data absensi untuk disimpan.');
            setIsSaving(false);
            return;
        }

        if (selectedWaktu === 'all') {
            alert('Silakan pilih waktu absensi yang spesifik.');
            setIsSaving(false);
            return;
        }

        try {
            await addAttendanceRecords(recordsToSave);
            alert('Absensi berhasil disimpan!');
            setAttendanceData({});
        } catch(e: any) {
            console.error("Failed to save attendance:", e);
            alert(`Gagal menyimpan absensi: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <p>Loading Halaqah data...</p>;
    if (error) return <p className="text-error">Error: {error}</p>;

    return (
        <div className="space-y-6">
            <Card title="Filter Absensi">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700">Tanggal</label>
                        <input type="date" id="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="mt-1 block w-full text-sm border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label htmlFor="marhalah" className="block text-sm font-medium text-slate-700">Marhalah</label>
                        <select id="marhalah" value={selectedMarhalah} onChange={e => setSelectedMarhalah(e.target.value as Marhalah | 'all')} className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm">
                            <option value="all">Semua</option>
                            {ALL_MARHALAH.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-slate-700">Jenis Halaqah</label>
                        <select id="type" value={selectedType} onChange={e => setSelectedType(e.target.value as HalaqahType | 'all')} className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm">
                            <option value="all">Semua</option>
                            {ALL_HALAQAH_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="waktu" className="block text-sm font-medium text-slate-700">Waktu</label>
                        <select id="waktu" value={selectedWaktu} onChange={e => setSelectedWaktu(e.target.value as Waktu | 'all')} className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm">
                            <option value="all">Semua</option>
                            {ALL_WAKTU.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-center md:justify-end">
                    <button onClick={handleSaveAll} disabled={isSaving} className="w-full md:w-auto bg-secondary text-white font-bold py-2.5 px-6 rounded-lg hover:bg-accent transition-colors disabled:bg-slate-400 shadow-sm">
                        {isSaving ? 'Menyimpan...' : 'Simpan Semua Absensi'}
                    </button>
                </div>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredHalaqah.map(h => 
                    <HalaqahCard 
                        key={h.id} 
                        halaqah={h} 
                        attendanceData={attendanceData} 
                        onStatusChange={handleStatusChange} 
                    />
                )}
                 {filteredHalaqah.length === 0 && (
                    <div className="text-center py-8 text-slate-500 xl:col-span-2">
                        Tidak ada data halaqah yang sesuai dengan filter.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;
