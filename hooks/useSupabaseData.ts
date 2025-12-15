
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Santri, Musammi, Halaqah, AttendanceRecord, HalaqahType, Waktu } from '../types';
// FIX: Add missing enum imports for type casting and validation.
import { Marhalah, Peran, AttendanceStatus } from '../types';

export const useSupabaseData = () => {
    const [santri, setSantri] = useState<Santri[]>([]);
    const [musammi, setMusammi] = useState<Musammi[]>([]);
    const [halaqah, setHalaqah] = useState<Halaqah[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
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
                { data: halaqahData, error: halaqahError },
                { data: attendanceData, error: attendanceError },
                { data: halaqahSantriData, error: halaqahSantriError }
            ] = await Promise.all([
                supabase.from('santri').select('*').order('nama', { ascending: true }),
                supabase.from('musammi').select('*').order('nama', { ascending: true }),
                supabase.from('halaqah').select('*').order('nama', { ascending: true }),
                supabase.from('attendance').select('*'),
                supabase.from('halaqah_santri').select('*')
            ]);

            if (santriError) throw santriError;
            if (musammiError) throw musammiError;
            if (halaqahError) throw halaqahError;
            if (attendanceError) throw attendanceError;
            if (halaqahSantriError) throw halaqahSantriError;

            // FIX: Explicitly map data from Supabase to match local TypeScript types.
            // This resolves type mismatches between string literal unions from Supabase and enums in the app.
            const santriList: Santri[] = (santriData || []).map(s => ({ ...s, marhalah: s.marhalah as Marhalah }));
            const musammiList: Musammi[] = (musammiData || []).map(m => ({ ...m, marhalah: m.marhalah as Marhalah }));

            setSantri(santriList);
            setMusammi(musammiList);

            // Map santri to their halaqah
            const halaqahWithSantri: Halaqah[] = (halaqahData || []).map(h => {
                const santriIds = (halaqahSantriData || [])
                    .filter(hs => hs.halaqah_id === h.id)
                    .map(hs => hs.santri_id);
                
                const musammiForHalaqah = musammiList.find(m => m.id === h.musammi_id);

                if (!musammiForHalaqah) return null;

                // FIX: Explicitly construct the Halaqah object to match the type definition and resolve the type predicate error.
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
            
            // FIX: Map attendance data to include names and correctly map snake_case (e.g., person_id) to camelCase (e.g., personId).
            // Also, filter out records with missing persons or halaqah to ensure data integrity and type safety.
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
    
    // Example: addSantri
    const addSantri = async (santriData: Omit<Santri, 'id'>) => {
        const { data, error } = await supabase.from('santri').insert(santriData).select().single();
        if (error) throw error;
        // FIX: Ensure the returned data is correctly typed before updating state to prevent type errors.
        if (data) setSantri(prev => [...prev, { ...data, marhalah: data.marhalah as Marhalah }]);
        return data;
    }
    
    // Add other mutation functions here (addHalaqah, updateHalaqah, etc.) following the pattern above
    // ...
    // FIX: Updated the parameter type to correctly include `musammi_id`, which is required for insertion but not present on the base `Halaqah` type.
    const addHalaqah = useCallback(async (newHalaqahData: Omit<Halaqah, 'id' | 'musammi'> & { musammi_id: number }) => {
        const { nama, santri: santriList, marhalah, jenis, waktu } = newHalaqahData;
        
        // Step 1: Insert the new halaqah
        const { data: halaqahResult, error: halaqahError } = await supabase.from('halaqah').insert({
            nama,
            marhalah,
            jenis,
            waktu,
            musammi_id: newHalaqahData.musammi_id
        }).select().single();

        if (halaqahError) throw halaqahError;

        // Step 2: Insert into halaqah_santri junction table
        if (halaqahResult && santriList.length > 0) {
            const santriLinks = santriList.map(s => ({
                halaqah_id: halaqahResult.id,
                santri_id: s.id
            }));
            const { error: linkError } = await supabase.from('halaqah_santri').insert(santriLinks);
            if (linkError) throw linkError;
        }
        
        // Refetch all data to ensure consistency
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
        // 1. Delete relations in halaqah_santri
        const { error: linkError } = await supabase.from('halaqah_santri').delete().eq('halaqah_id', id);
        if (linkError) throw linkError;

        // 2. Delete attendance records for this halaqah to maintain integrity
        const { error: attError } = await supabase.from('attendance').delete().eq('halaqah_id', id);
        if (attError) throw attError;

        // 3. Delete the halaqah
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
    
    // FIX: Map camelCase properties from the app (e.g., personId) to snake_case for the Supabase database insert.
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


    return { santri, musammi, halaqah, attendance, loading, error, fetchData, addHalaqah, updateHalaqah, deleteHalaqah, removeSantriFromHalaqah, addSantriToHalaqah, addAttendanceRecords };
};
