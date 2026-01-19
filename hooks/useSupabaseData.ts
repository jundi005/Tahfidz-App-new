
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Santri, Musammi, Halaqah, AttendanceRecord, HalaqahType, Waktu, StudentProgress, ProgressType, WaliKelas } from '../types';
import { Marhalah, Peran, AttendanceStatus } from '../types';

export const useSupabaseData = () => {
    const [santri, setSantri] = useState<Santri[]>([]);
    const [musammi, setMusammi] = useState<Musammi[]>([]);
    const [waliKelas, setWaliKelas] = useState<WaliKelas[]>([]);
    const [halaqah, setHalaqah] = useState<Halaqah[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all data in parallel
            const [
                { data: santriData, error: santriError },
                { data: musammiData, error: musammiError },
                { data: waliKelasData, error: waliKelasError },
                { data: halaqahData, error: halaqahError },
                { data: attendanceData, error: attendanceError },
                { data: halaqahSantriData, error: halaqahSantriError },
                { data: progressData, error: progressError }
            ] = await Promise.all([
                supabase.from('santri').select('*').order('nama', { ascending: true }),
                supabase.from('musammi').select('*').order('nama', { ascending: true }),
                supabase.from('wali_kelas').select('*').order('kelas', { ascending: true }),
                supabase.from('halaqah').select('*').order('nama', { ascending: true }),
                supabase.from('attendance').select('*'),
                supabase.from('halaqah_santri').select('*'),
                supabase.from('student_progress').select('*')
            ]);

            if (santriError) throw santriError;
            if (musammiError) throw musammiError;
            if (halaqahError) throw halaqahError;
            if (attendanceError) throw attendanceError;
            if (halaqahSantriError) throw halaqahSantriError;
            
            // Note: If progress table doesn't exist yet, it might throw 42P01. We handle it gracefully.
            if (progressError && progressError.code !== '42P01') {
                console.error("Error fetching progress:", progressError);
            }
            
            // Handle Wali Kelas Error gracefully (table might not exist yet)
            if (waliKelasError && waliKelasError.code !== '42P01') {
                 console.error("Error fetching wali kelas:", waliKelasError);
            }

            const santriList: Santri[] = (santriData || []).map(s => ({ ...s, marhalah: s.marhalah as Marhalah }));
            const musammiList: Musammi[] = (musammiData || []).map(m => ({ ...m, marhalah: m.marhalah as Marhalah }));
            const waliKelasList: WaliKelas[] = (waliKelasData || []).map(w => ({ ...w, marhalah: w.marhalah as Marhalah }));

            setSantri(santriList);
            setMusammi(musammiList);
            setWaliKelas(waliKelasList);

            // Map santri to their halaqah
            const halaqahWithSantri: Halaqah[] = (halaqahData || []).map(h => {
                const santriIds = (halaqahSantriData || [])
                    .filter(hs => hs.halaqah_id === h.id)
                    .map(hs => hs.santri_id);
                
                const musammiForHalaqah = musammiList.find(m => m.id === h.musammi_id);

                if (!musammiForHalaqah) return null;

                return {
                    id: h.id,
                    nama: h.nama,
                    musammi: musammiForHalaqah,
                    santri: santriList.filter(s => santriIds.includes(s.id)),
                    marhalah: h.marhalah as Marhalah,
                    jenis: h.jenis as HalaqahType,
                    waktu: h.waktu as Waktu[],
                };
            }).filter((h): h is Halaqah => h !== null);
            
            setHalaqah(halaqahWithSantri);
            
            const attendanceWithNames: AttendanceRecord[] = (attendanceData || [])
                .map(a => {
                    const person = a.peran === 'Santri' 
                        ? santriList.find(p => p.id === a.person_id)
                        : musammiList.find(p => p.id === a.person_id);
                    
                    if (!person || a.halaqah_id === null) {
                        return null;
                    }

                    return {
                        id: a.id,
                        date: a.date,
                        waktu: a.waktu as Waktu,
                        personId: a.person_id,
                        nama: person.nama,
                        marhalah: person.marhalah,
                        kelas: person.kelas,
                        peran: a.peran as Peran,
                        status: a.status as AttendanceStatus,
                        halaqahId: a.halaqah_id,
                    };
                })
                .filter((a): a is AttendanceRecord => a !== null);
            setAttendance(attendanceWithNames);

            // Set Student Progress
            const progressList: StudentProgress[] = (progressData || []).map(p => ({
                id: p.id,
                santri_id: p.santri_id,
                month_key: p.month_key,
                progress_type: p.progress_type as ProgressType,
                value: p.value
            }));
            setStudentProgress(progressList);

        } catch (err: any) {
            setError(err.message);
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- MUTATION FUNCTIONS ---
    
    const addSantri = async (santriData: Omit<Santri, 'id'>) => {
        const { data, error } = await supabase.from('santri').insert(santriData).select().single();
        if (error) throw error;
        if (data) setSantri(prev => [...prev, { ...data, marhalah: data.marhalah as Marhalah }]);
        return data;
    }
    
    const addHalaqah = useCallback(async (newHalaqahData: Omit<Halaqah, 'id' | 'musammi'> & { musammi_id: number }) => {
        const { nama, santri: santriList, marhalah, jenis, waktu } = newHalaqahData;
        
        const { data: halaqahResult, error: halaqahError } = await supabase.from('halaqah').insert({
            nama,
            marhalah,
            jenis,
            waktu,
            musammi_id: newHalaqahData.musammi_id
        }).select().single();

        if (halaqahError) throw halaqahError;

        if (halaqahResult && santriList.length > 0) {
            const santriLinks = santriList.map(s => ({
                halaqah_id: halaqahResult.id,
                santri_id: s.id
            }));
            const { error: linkError } = await supabase.from('halaqah_santri').insert(santriLinks);
            if (linkError) throw linkError;
        }
        
        await fetchData();
    }, [fetchData]);

    const updateHalaqah = useCallback(async (id: number, updatedData: {musammi_id: number, jenis: HalaqahType}) => {
         const { error } = await supabase.from('halaqah').update({ 
            musammi_id: updatedData.musammi_id,
            jenis: updatedData.jenis,
         }).eq('id', id);
        if (error) throw error;
        await fetchData();
    }, [fetchData]);

    const deleteHalaqah = useCallback(async (id: number) => {
        const { error: linkError } = await supabase.from('halaqah_santri').delete().eq('halaqah_id', id);
        if (linkError) throw linkError;

        const { error: attError } = await supabase.from('attendance').delete().eq('halaqah_id', id);
        if (attError) throw attError;

        const { error } = await supabase.from('halaqah').delete().eq('id', id);
        if (error) throw error;

        await fetchData();
    }, [fetchData]);

    const removeSantriFromHalaqah = useCallback(async (halaqahId: number, santriId: number) => {
        const { error } = await supabase.from('halaqah_santri').delete()
            .eq('halaqah_id', halaqahId)
            .eq('santri_id', santriId);
        if (error) throw error;
        await fetchData();
    }, [fetchData]);

    const addSantriToHalaqah = useCallback(async (halaqahId: number, newSantri: Santri) => {
         const { error } = await supabase.from('halaqah_santri').insert({
            halaqah_id: halaqahId,
            santri_id: newSantri.id
        });
        if (error) throw error;
        await fetchData();
    }, [fetchData]);
    
    const addAttendanceRecords = async (records: Omit<AttendanceRecord, 'id' | 'nama' | 'marhalah' | 'kelas'>[]) => {
        const recordsToInsert = records.map(r => ({
            date: r.date,
            waktu: r.waktu,
            person_id: r.personId,
            peran: r.peran,
            status: r.status,
            halaqah_id: r.halaqahId,
        }));
        const { error } = await supabase.from('attendance').insert(recordsToInsert);
        if (error) throw error;
        await fetchData();
    }

    const updateAttendanceRecord = useCallback(async (id: number, updates: { status?: AttendanceStatus, date?: string, waktu?: Waktu }) => {
        const { error } = await supabase.from('attendance').update(updates).eq('id', id);
        if (error) throw error;
        await fetchData();
    }, [fetchData]);

    const deleteAttendanceRecord = useCallback(async (id: number) => {
        const { error } = await supabase.from('attendance').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
    }, [fetchData]);
    
    // NEW: Delete Attendance by Time (Batch)
    const deleteAttendanceBatch = useCallback(async (date: string, waktu: string) => {
        const { error } = await supabase.from('attendance').delete()
            .eq('date', date)
            .eq('waktu', waktu);
        if (error) throw error;
        await fetchData();
    }, [fetchData]);

    // Student Progress Mutations
    const addStudentProgressBatch = useCallback(async (progressRecords: Omit<StudentProgress, 'id'>[]) => {
        const { error } = await supabase.from('student_progress').upsert(
            progressRecords, 
            { onConflict: 'santri_id, month_key, progress_type' }
        );
        if (error) throw error;
        await fetchData();
    }, [fetchData]);

    const deleteStudentProgress = useCallback(async (id: number) => {
        const { error } = await supabase.from('student_progress').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
    }, [fetchData]);

    const deleteStudentProgressByMonth = useCallback(async (month: string, type: ProgressType) => {
        const { error } = await supabase.from('student_progress')
            .delete()
            .eq('month_key', month)
            .eq('progress_type', type);
        if (error) throw error;
        await fetchData();
    }, [fetchData]);

    return { 
        santri, musammi, waliKelas, halaqah, attendance, studentProgress, loading, error, fetchData, 
        addHalaqah, updateHalaqah, deleteHalaqah, removeSantriFromHalaqah, 
        addSantriToHalaqah, addAttendanceRecords, updateAttendanceRecord, deleteAttendanceRecord, deleteAttendanceBatch,
        addStudentProgressBatch, deleteStudentProgress, deleteStudentProgressByMonth
    };
};
