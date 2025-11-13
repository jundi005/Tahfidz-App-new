import React, { useState, useRef, useMemo, useEffect } from 'react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useSupabaseData } from '../hooks/useSupabaseData';
import type { Santri, Musammi, Person } from '../types';
import { Marhalah } from '../types';
import { KELAS_BY_MARHALAH, ALL_MARHALAH } from '../constants';
import { Plus, Edit, Trash, Upload, Download, Filter } from 'lucide-react';
import { parseCSV } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';


const DataManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'santri' | 'musammi'>('santri');
    const { santri, musammi, fetchData, loading, error } = useSupabaseData();

    // State for modal
    const [isModalOpen, setModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [formData, setFormData] = useState<{nama: string, marhalah: Marhalah, kelas: string}>({
        nama: '',
        marhalah: Marhalah.Mutawassithah,
        kelas: KELAS_BY_MARHALAH[Marhalah.Mutawassithah][0],
    });

    // State for filters
    const [filterMarhalah, setFilterMarhalah] = useState<Marhalah | 'all'>('all');
    const [filterKelas, setFilterKelas] = useState<string | 'all'>('all');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset kelas filter when marhalah changes
    useEffect(() => {
        setFilterKelas('all');
    }, [filterMarhalah]);

    const openModal = (person: Person | null) => {
        setEditingPerson(person);
        if (person) {
            setFormData({ nama: person.nama, marhalah: person.marhalah, kelas: person.kelas });
        } else {
            setFormData({ nama: '', marhalah: Marhalah.Mutawassithah, kelas: KELAS_BY_MARHALAH[Marhalah.Mutawassithah][0] });
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingPerson(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'marhalah') {
            const newMarhalah = value as Marhalah;
            setFormData(prev => ({ ...prev, marhalah: newMarhalah, kelas: KELAS_BY_MARHALAH[newMarhalah][0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const table = activeTab === 'santri' ? 'santri' : 'musammi';
            if (editingPerson) {
                const { error } = await supabase.from(table).update(formData).eq('id', editingPerson.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from(table).insert(formData);
                if (error) throw error;
            }
            await fetchData(); // Refresh data
            closeModal();
        } catch(e: any) {
            alert(`Error: ${e.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            try {
                const table = activeTab === 'santri' ? 'santri' : 'musammi';
                const { error } = await supabase.from(table).delete().eq('id', id);
                if (error) throw error;
                await fetchData();
            } catch(e: any) {
                 alert(`Error: ${e.message}`);
            }
        }
    };
    
    const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const data = await parseCSV(file);
                const formattedData = data.map(row => ({
                    nama: row.nama,
                    marhalah: row.marhalah,
                    kelas: row.kelas
                }));
                const table = activeTab === 'santri' ? 'santri' : 'musammi';
                const { error } = await supabase.from(table).insert(formattedData);
                if (error) throw error;
                
                await fetchData();
                alert(`${data.length} records imported successfully!`);
            } catch (error: any) {
                console.error("Error importing CSV:", error);
                alert(`Failed to import CSV: ${error.message}`);
            }
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ["nama", "marhalah", "kelas"];
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
        let fileName = '';

        if (activeTab === 'santri') {
            csvContent += "Contoh Santri,Mutawassithah,1A\n";
            fileName = 'template_import_santri.csv';
        } else {
            csvContent += "Contoh Musammi,Jamiah,KHS\n";
            fileName = 'template_import_musammi.csv';
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const dataToShow = activeTab === 'santri' ? santri : musammi;

    const filteredData = useMemo(() => {
        return dataToShow.filter(person => {
            if (filterMarhalah !== 'all' && person.marhalah !== filterMarhalah) return false;
            if (filterKelas !== 'all' && person.kelas !== filterKelas) return false;
            return true;
        });
    }, [dataToShow, filterMarhalah, filterKelas]);
    
    const DataTable: React.FC<{ data: Person[] }> = ({ data }) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nama</th>
                        <th scope="col" className="px-6 py-3">Marhalah</th>
                        <th scope="col" className="px-6 py-3">Kelas</th>
                        <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(person => (
                        <tr key={person.id} className="bg-primary border-b border-slate-200 hover:bg-slate-50">
                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{person.nama}</th>
                            <td className="px-6 py-4">{person.marhalah}</td>
                            <td className="px-6 py-4">{person.kelas}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <button onClick={() => openModal(person)} className="font-medium text-secondary hover:text-accent p-1"><Edit size={16}/></button>
                                <button onClick={() => handleDelete(person.id)} className="font-medium text-error hover:text-red-700 p-1"><Trash size={16}/></button>
                            </td>
                        </tr>
                    ))}
                     {data.length === 0 && (
                        <tr className="bg-primary border-b border-slate-200">
                            <td colSpan={4} className="text-center py-6 text-slate-500">Tidak ada data yang sesuai dengan filter.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
    
    if (loading) return <p>Loading data...</p>;
    if (error) return <p className="text-error">Error: {error}</p>;

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 -mt-6 -mx-6 mb-6 p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">Manajemen Data</h2>
                    <div className="flex flex-col sm:flex-row sm:space-x-2 gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center justify-center text-sm">
                            <Upload size={16} className="mr-2" /> Import
                        </button>
                        <button onClick={handleDownloadTemplate} className="bg-white border border-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center justify-center text-sm">
                            <Download size={16} className="mr-2" /> Template
                        </button>
                        <button onClick={() => openModal(null)} className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-accent transition-colors inline-flex items-center justify-center text-sm">
                           <Plus size={16} className="mr-2" /> Tambah {activeTab === 'santri' ? 'Santri' : 'Musammi'}
                        </button>
                    </div>
                </div>
                 <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('santri')} className={`${activeTab === 'santri' ? 'border-secondary text-secondary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm`}>
                            Santri ({santri.length})
                        </button>
                        <button onClick={() => setActiveTab('musammi')} className={`${activeTab === 'musammi' ? 'border-secondary text-secondary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm`}>
                            Musammi' ({musammi.length})
                        </button>
                    </nav>
                </div>
                
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 my-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center font-semibold text-slate-600 flex-shrink-0 text-sm">
                        <Filter size={16} className="mr-2" /> Filter Data:
                    </div>
                    <div className="flex-grow">
                        <label htmlFor="filterMarhalah" className="sr-only">Marhalah</label>
                        <select id="filterMarhalah" value={filterMarhalah} onChange={e => setFilterMarhalah(e.target.value as Marhalah | 'all')} className="block w-full text-sm pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm">
                            <option value="all">Semua Marhalah</option>
                            {ALL_MARHALAH.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="flex-grow">
                        <label htmlFor="filterKelas" className="sr-only">Kelas</label>
                        <select id="filterKelas" disabled={filterMarhalah === 'all'} value={filterKelas} onChange={e => setFilterKelas(e.target.value as string | 'all')} className="block w-full text-sm pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary rounded-md shadow-sm disabled:bg-slate-100">
                            <option value="all">Semua Kelas</option>
                            {filterMarhalah !== 'all' && KELAS_BY_MARHALAH[filterMarhalah].map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                </div>

                <DataTable data={filteredData} />
            </Card>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={`${editingPerson ? 'Edit' : 'Tambah'} Data ${activeTab === 'santri' ? 'Santri' : "Musammi'"}`}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="nama" className="block text-sm font-medium text-slate-700">Nama</label>
                        <input type="text" name="nama" id="nama" value={formData.nama} onChange={handleFormChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="marhalah" className="block text-sm font-medium text-slate-700">Marhalah</label>
                        <select name="marhalah" id="marhalah" value={formData.marhalah} onChange={handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm rounded-md">
                            {ALL_MARHALAH.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="kelas" className="block text-sm font-medium text-slate-700">Kelas</label>
                         <select name="kelas" id="kelas" value={formData.kelas} onChange={handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm rounded-md">
                            {KELAS_BY_MARHALAH[formData.marhalah].map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button onClick={closeModal} className="bg-white border border-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors">Batal</button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-accent transition-colors disabled:bg-slate-400">
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DataManagement;