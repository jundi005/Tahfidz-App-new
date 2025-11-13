import React, { useMemo, useRef, useState, useEffect } from 'react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { HalaqahType, Waktu, Marhalah } from '../types';
import type { Santri, Musammi, Halaqah } from '../types';
import { Upload, Download, Plus, Edit, Trash } from 'lucide-react';
import { parseCSV } from '../lib/utils';
import { ALL_HALAQAH_TYPE, ALL_MARHALAH } from '../constants';
import { supabase } from '../lib/supabaseClient';


type FlatHalaqahData = {
    halaqahId: number;
    santriId: number;
    halaqahNama: string;
    noUrutHalaqah: number;
    namaSantri: string;
    marhalahSantri: string;
    kelasSantri: string;
    namaMusammi: string;
    musammiId: number;
    kelasMusammi: string;
    jenisHalaqah: HalaqahType;
    marhalahHalaqah: Marhalah;
};

const HalaqahData: React.FC = () => {
    const { 
        halaqah, musammi, santri, 
        addHalaqah, updateHalaqah, removeSantriFromHalaqah, addSantriToHalaqah,
        loading, error, fetchData
    } = useSupabaseData();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [editingData, setEditingData] = useState<FlatHalaqahData | null>(null);
    const [formData, setFormData] = useState({
        santriId: '',
        halaqahId: '',
        musammiId: '',
        jenisHalaqah: HalaqahType.Utama,
        newHalaqahName: '',
    });

    // Filters
    const [filterJenis, setFilterJenis] = useState<HalaqahType | 'all'>('all');
    const [filterMarhalah, setFilterMarhalah] = useState<Marhalah | 'all'>('all');
    const [filterNama, setFilterNama] = useState('');

    const flatHalaqahData = useMemo((): FlatHalaqahData[] => {
        const data: Omit<FlatHalaqahData, 'noUrutHalaqah'>[] = [];
        halaqah.forEach(h => {
            h.santri.forEach(s => {
                data.push({
                    halaqahId: h.id,
                    santriId: s.id,
                    halaqahNama: h.nama,
                    namaSantri: s.nama,
                    marhalahSantri: s.marhalah,
                    kelasSantri: s.kelas,
                    namaMusammi: h.musammi.nama,
                    musammiId: h.musammi.id,
                    kelasMusammi: h.musammi.kelas,
                    jenisHalaqah: h.jenis,
                    marhalahHalaqah: h.marhalah,
                });
            });
        });

        const uniqueHalaqahNames = [...new Set(data.map(item => item.halaqahNama))].sort();
        const nameToUrutMap = new Map(uniqueHalaqahNames.map((name, index) => [name, index + 1]));
        
        return data.map(item => ({
            ...item,
            noUrutHalaqah: nameToUrutMap.get(item.halaqahNama) ?? 0,
        })).sort((a,b) => a.noUrutHalaqah - b.noUrutHalaqah || a.namaSantri.localeCompare(b.namaSantri));

    }, [halaqah]);

    const filteredFlatHalaqahData = useMemo(() => {
        return flatHalaqahData.filter(item => {
            if (filterJenis !== 'all' && item.jenisHalaqah !== filterJenis) return false;
            if (filterMarhalah !== 'all' && item.marhalahHalaqah !== filterMarhalah) return false;
            if (filterNama && !item.halaqahNama.toLowerCase().includes(filterNama.toLowerCase())) return false;
            return true;
        });
    }, [flatHalaqahData, filterJenis, filterMarhalah, filterNama]);
    
    useEffect(() => {
        if (isModalOpen && editingData) {
            setFormData({
                santriId: String(editingData.santriId),
                halaqahId: String(editingData.halaqahId),
                musammiId: String(editingData.musammiId),
                jenisHalaqah: editingData.jenisHalaqah,
                newHalaqahName: '',
            });
        } else {
            setFormData({ santriId: '', halaqahId: '', musammiId: '', jenisHalaqah: HalaqahType.Utama, newHalaqahName: '' });
        }
    }, [isModalOpen, editingData]);

    const openModal = (data: FlatHalaqahData | null = null) => {
        setEditingData(data);
        setModalOpen(true);
    };
    
    const closeModal = () => {
        setModalOpen(false);
        setEditingData(null);
    };

    const handleDelete = async (item: FlatHalaqahData) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus ${item.namaSantri} dari ${item.halaqahNama}?`)) {
             try {
                await removeSantriFromHalaqah(item.halaqahId, item.santriId);
            } catch (e: any) {
                alert(`Gagal menghapus: ${e.message}`);
            }
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const selectedSantri = santri.find(s => s.id === parseInt(formData.santriId));
            if (!selectedSantri) throw new Error("Santri tidak valid.");

            if (editingData) { // Update logic
                const originalHalaqahId = editingData.halaqahId;
                const newHalaqahId = parseInt(formData.halaqahId);
                const newMusammiId = parseInt(formData.musammiId);

                if (isNaN(newMusammiId)) throw new Error("Musammi' tidak valid.");

                const currentHalaqah = halaqah.find(h => h.id === newHalaqahId);
                if (currentHalaqah && (currentHalaqah.musammi.id !== newMusammiId || currentHalaqah.jenis !== formData.jenisHalaqah)) {
                    if (window.confirm("Mengubah Musammi' atau Jenis akan berlaku untuk semua santri di halaqah ini. Lanjutkan?")) {
                        await updateHalaqah(newHalaqahId, { musammi_id: newMusammiId, jenis: formData.jenisHalaqah });
                    }
                }
                
                if (originalHalaqahId !== newHalaqahId || editingData.santriId !== selectedSantri.id) {
                    await removeSantriFromHalaqah(originalHalaqahId, editingData.santriId);
                    await addSantriToHalaqah(newHalaqahId, selectedSantri);
                }

            } else { // Add logic
                const { halaqahId, newHalaqahName, musammiId, jenisHalaqah } = formData;
                if (halaqahId === 'new' && !newHalaqahName.trim()) throw new Error("Nama halaqah baru tidak boleh kosong.");
                
                const selectedMusammiId = parseInt(musammiId);
                if(isNaN(selectedMusammiId)) throw new Error("Pilih Musammi'.");

                if(halaqahId === 'new') { 
                    const waktu = jenisHalaqah === HalaqahType.Pagi ? [Waktu.Dhuha] : [Waktu.Shubuh, Waktu.Ashar, Waktu.Isya];
                    await addHalaqah({
                        nama: newHalaqahName,
                        musammi_id: selectedMusammiId,
                        santri: [selectedSantri],
                        marhalah: selectedSantri.marhalah,
                        jenis: jenisHalaqah,
                        waktu
                    });
                } else {
                    await addSantriToHalaqah(parseInt(halaqahId), selectedSantri);
                }
            }
            closeModal();
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDownloadTemplate = () => {
        const headers = ["nama_halaqah", "jenis_halaqah", "nama_musammi", "nama_santri"];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" +
            "Contoh Halaqah A,Halaqah Utama,Ustadz Abdullah,Ahmad Yusuf\n" +
            "Contoh Halaqah A,Halaqah Utama,Ustadz Abdullah,Budi Santoso\n" +
            "Contoh Halaqah Pagi B,Halaqah Pagi,Ustadz Ibrahim,Citra Lestari\n";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_import_halaqah.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);

        try {
            const csvData = await parseCSV(file);
            if (!csvData || csvData.length === 0) {
                throw new Error("File CSV kosong atau format tidak valid.");
            }

            const santriMapByName = new Map<string, Santri>(santri.map(s => [s.nama.toLowerCase(), s]));
            const musammiMapByName = new Map<string, Musammi>(musammi.map(m => [m.nama.toLowerCase(), m]));
            const halaqahMapByName = new Map<string, Halaqah>(halaqah.map(h => [h.nama.toLowerCase(), h]));

            const errors: string[] = [];
            const requiredHeaders = ["nama_halaqah", "jenis_halaqah", "nama_musammi", "nama_santri"];
            const actualHeaders = Object.keys(csvData[0] || {});
            
            if (!requiredHeaders.every(h => actualHeaders.includes(h))) {
                throw new Error(`Header CSV tidak valid. Harap gunakan template. Header yang dibutuhkan: ${requiredHeaders.join(', ')}`);
            }
            
            const groupedByHalaqah = new Map<string, {
                originalName: string;
                jenis: HalaqahType;
                musammiName: string;
                santriNames: Set<string>;
            }>();

            csvData.forEach((row, index) => {
                const namaHalaqah = row.nama_halaqah?.trim();
                const jenisHalaqah = row.jenis_halaqah?.trim();
                const namaMusammi = row.nama_musammi?.trim();
                const namaSantri = row.nama_santri?.trim();
                const rowIndex = index + 2;
                
                if (!namaHalaqah || !jenisHalaqah || !namaMusammi || !namaSantri) {
                    errors.push(`Baris ${rowIndex}: Data tidak lengkap.`);
                    return;
                }

                if (!ALL_HALAQAH_TYPE.includes(jenisHalaqah)) {
                    errors.push(`Baris ${rowIndex}: Jenis Halaqah "${jenisHalaqah}" tidak valid. Gunakan "Halaqah Utama" atau "Halaqah Pagi".`);
                    return;
                }
                
                const halaqahKey = namaHalaqah.toLowerCase();
                if (!groupedByHalaqah.has(halaqahKey)) {
                    groupedByHalaqah.set(halaqahKey, {
                        originalName: namaHalaqah,
                        jenis: jenisHalaqah as HalaqahType,
                        musammiName: namaMusammi,
                        santriNames: new Set(),
                    });
                }
                const group = groupedByHalaqah.get(halaqahKey)!;
                if (group.musammiName.toLowerCase() !== namaMusammi.toLowerCase()) {
                     errors.push(`Musammi' tidak konsisten untuk halaqah "${namaHalaqah}" (baris ${rowIndex}). Ditemukan "${namaMusammi}" dan "${group.musammiName}".`);
                }
                if (group.jenis !== jenisHalaqah) {
                     errors.push(`Jenis halaqah tidak konsisten untuk halaqah "${namaHalaqah}" (baris ${rowIndex}).`);
                }
                group.santriNames.add(namaSantri);
            });
            
            if (errors.length > 0) {
                throw new Error(`Error validasi CSV:\n- ${errors.join('\n- ')}`);
            }

            const newHalaqahToCreate: any[] = [];
            const linksForExistingHalaqah: { halaqah_id: number; santri_id: number }[] = [];
            const linksForNewHalaqah: { halaqah_key: string; santri_id: number }[] = [];

            for (const [halaqahKey, groupData] of groupedByHalaqah.entries()) {
                const musammiEntry = musammiMapByName.get(groupData.musammiName.toLowerCase());
                if (!musammiEntry) {
                    errors.push(`Musammi' "${groupData.musammiName}" untuk halaqah "${groupData.originalName}" tidak ditemukan.`);
                    continue;
                }

                const santriEntries = Array.from(groupData.santriNames).map(name => {
                    const santriEntry = santriMapByName.get(name.toLowerCase());
                    if (!santriEntry) {
                        errors.push(`Santri "${name}" untuk halaqah "${groupData.originalName}" tidak ditemukan.`);
                    }
                    return santriEntry;
                }).filter((s): s is Santri => !!s);
                
                if (santriEntries.length !== groupData.santriNames.size) {
                    continue; 
                }

                const existingHalaqah = halaqahMapByName.get(halaqahKey);
                if (existingHalaqah) {
                    if (existingHalaqah.musammi.id !== musammiEntry.id) {
                         errors.push(`Halaqah "${groupData.originalName}" sudah ada dengan musammi' yang berbeda (${existingHalaqah.musammi.nama}).`);
                         continue;
                    }
                    santriEntries.forEach(s => linksForExistingHalaqah.push({ halaqah_id: existingHalaqah.id, santri_id: s.id }));
                } else {
                    if (santriEntries.length === 0) continue;
                    
                    const firstSantri = santriEntries[0];
                    const waktu = groupData.jenis === HalaqahType.Pagi ? [Waktu.Dhuha] : [Waktu.Shubuh, Waktu.Ashar, Waktu.Isya];

                    newHalaqahToCreate.push({
                        nama: groupData.originalName,
                        musammi_id: musammiEntry.id,
                        marhalah: firstSantri.marhalah,
                        jenis: groupData.jenis,
                        waktu: waktu,
                    });
                    
                    santriEntries.forEach(s => linksForNewHalaqah.push({ halaqah_key: halaqahKey, santri_id: s.id }));
                }
            }
            
            if (errors.length > 0) {
                throw new Error(`Error data tidak ditemukan:\n- ${errors.join('\n- ')}`);
            }

            let createdCount = 0;
            let membersAddedCount = 0;
            
            let allLinksToAdd = [...linksForExistingHalaqah];

            if (newHalaqahToCreate.length > 0) {
                const { data: insertedHalaqah, error: insertHalaqahError } = await supabase.from('halaqah').insert(newHalaqahToCreate).select();
                if (insertHalaqahError) throw insertHalaqahError;

                createdCount = insertedHalaqah?.length || 0;
                const newHalaqahMap = new Map(((insertedHalaqah as any[]) || []).map(h => [h.nama.toLowerCase(), h]));
                
                linksForNewHalaqah.forEach(link => {
                    const newHalaqah = newHalaqahMap.get(link.halaqah_key);
                    if (newHalaqah) {
                        allLinksToAdd.push({ halaqah_id: newHalaqah.id, santri_id: link.santri_id });
                    }
                });
            }

            if (allLinksToAdd.length > 0) {
                const { data: existingLinksData, error: fetchLinksError } = await supabase.from('halaqah_santri').select('halaqah_id, santri_id');
                if (fetchLinksError) throw fetchLinksError;

                const existingLinksSet = new Set(((existingLinksData as any[]) || []).map(l => `${l.halaqah_id}-${l.santri_id}`));
                const uniqueNewLinks = allLinksToAdd.filter(l => !existingLinksSet.has(`${l.halaqah_id}-${l.santri_id}`));
                
                if (uniqueNewLinks.length > 0) {
                    const { error: insertLinksError } = await supabase.from('halaqah_santri').insert(uniqueNewLinks);
                    if (insertLinksError) throw insertLinksError;
                    membersAddedCount = uniqueNewLinks.length;
                }
            }
            
            await fetchData();
            alert(`Import berhasil! ${createdCount} halaqah baru ditambahkan dan ${membersAddedCount} keanggotaan baru ditambahkan.`);

        } catch (e: any) {
            console.error("Import CSV gagal:", e);
            alert(`Import CSV gagal: ${e.message}`);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
            setIsImporting(false);
        }
    };


    if (loading) return <p>Loading data...</p>;
    if (error) return <p className="text-error">Error: {error}</p>;

    return (
        <Card>
             <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 -mt-6 -mx-6 mb-6 p-6 border-b border-slate-200">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">Data Keanggotaan Halaqah</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Kelola keanggotaan santri dalam setiap halaqah.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2 w-full sm:w-auto">
                    <button onClick={() => openModal(null)} disabled={isImporting} className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-accent transition-colors inline-flex items-center justify-center text-sm disabled:bg-slate-400">
                        <Plus size={16} className="mr-2" /> Tambah
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-white border border-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center justify-center text-sm disabled:bg-slate-400">
                        <Upload size={16} className="mr-2" /> {isImporting ? 'Mengimpor...' : 'Import'}
                    </button>
                    <button onClick={handleDownloadTemplate} className="bg-white border border-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center justify-center text-sm">
                        <Download size={16} className="mr-2" /> Template
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                 <div>
                    <label htmlFor="filterJenis" className="block text-sm font-medium text-slate-700 mb-1">Jenis Halaqah</label>
                    <select id="filterJenis" value={filterJenis} onChange={e => setFilterJenis(e.target.value as HalaqahType | 'all')} className="block w-full text-sm pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm">
                        <option value="all">Semua Jenis</option>
                        {ALL_HALAQAH_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="filterMarhalah" className="block text-sm font-medium text-slate-700 mb-1">Marhalah</label>
                    <select id="filterMarhalah" value={filterMarhalah} onChange={e => setFilterMarhalah(e.target.value as Marhalah | 'all')} className="block w-full text-sm pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm">
                        <option value="all">Semua Marhalah</option>
                        {ALL_MARHALAH.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="filterNama" className="block text-sm font-medium text-slate-700 mb-1">Cari Nama Halaqah</label>
                    <input type="text" id="filterNama" value={filterNama} onChange={e => setFilterNama(e.target.value)} placeholder="Ketik nama halaqah..." className="block w-full text-sm border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary" />
                </div>
            </div>

             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">No. Urut Halaqah</th>
                            <th scope="col" className="px-6 py-3">Nama Santri</th>
                            <th scope="col" className="px-6 py-3">Marhalah</th>
                            <th scope="col" className="px-6 py-3">Nama Musammi'</th>
                            <th scope="col" className="px-6 py-3">Jenis Halaqah</th>
                            <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFlatHalaqahData.map((item) => (
                            <tr key={`${item.halaqahId}-${item.santriId}`} className="bg-primary border-b border-slate-200 hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{item.noUrutHalaqah} - {item.halaqahNama}</td>
                                <td className="px-6 py-4">{item.namaSantri}</td>
                                <td className="px-6 py-4">{item.marhalahSantri} ({item.kelasSantri})</td>
                                <td className="px-6 py-4">{item.namaMusammi}</td>
                                <td className="px-6 py-4">{item.jenisHalaqah}</td>
                                <td className="px-6 py-4 text-right flex justify-end space-x-2">
                                    <button onClick={() => openModal(item)} className="p-1 text-secondary hover:text-accent"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(item)} className="p-1 text-error hover:text-red-700"><Trash size={16}/></button>
                                </td>
                            </tr>
                        ))}
                         {filteredFlatHalaqahData.length === 0 && (
                            <tr className="bg-primary border-b border-slate-200">
                                <td colSpan={6} className="px-6 py-4 text-center text-slate-500">
                                    Tidak ada data keanggotaan yang sesuai dengan filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingData ? 'Edit Keanggotaan' : 'Tambah Keanggotaan'}>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Santri</label>
                        <select name="santriId" value={formData.santriId} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm">
                            <option value="" disabled>Pilih Santri</option>
                            {santri.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.marhalah} - {s.kelas})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Halaqah</label>
                        <select name="halaqahId" value={formData.halaqahId} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm">
                            <option value="" disabled>Pilih Halaqah</option>
                            {!editingData && <option value="new">-- BUAT BARU --</option>}
                            {halaqah.map(h => <option key={h.id} value={h.id}>{h.nama}</option>)}
                        </select>
                    </div>

                    {formData.halaqahId === 'new' && !editingData && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Nama Halaqah Baru</label>
                                <input type="text" name="newHalaqahName" value={formData.newHalaqahName} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm" />
                            </div>
                        </>
                    )}

                    {(editingData || formData.halaqahId === 'new') && (
                        <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Musammi'</label>
                            <select name="musammiId" value={formData.musammiId} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm">
                                <option value="" disabled>Pilih Musammi'</option>
                                {musammi.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Jenis Halaqah</label>
                            <select name="jenisHalaqah" value={formData.jenisHalaqah} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm">
                                {ALL_HALAQAH_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        </>
                    )}
                    
                    <div className="pt-4 flex justify-end space-x-2">
                        <button onClick={closeModal} className="bg-white border border-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors">Batal</button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-accent transition-colors disabled:bg-slate-400">
                            {isSubmitting ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

export default HalaqahData;