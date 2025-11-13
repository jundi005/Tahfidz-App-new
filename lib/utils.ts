import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { AttendanceRecord } from '../types';

// Extend jsPDF with autoTable
// FIX: Replaced interface-based extension with a type intersection to correctly add the autoTable method to the jsPDF instance type.
// This resolves errors where methods from jsPDF were not found on the extended type.
type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => jsPDF;
};

export const exportToExcel = (data: AttendanceRecord[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPDF = (data: AttendanceRecord[], fileName:string) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  doc.text('Laporan Absensi Halaqah', 14, 16);
  doc.autoTable({
    head: [['Tanggal', 'Waktu', 'Nama', 'Marhalah', 'Kelas', 'Peran', 'Status']],
    body: data.map(item => [
      item.date,
      item.waktu,
      item.nama,
      item.marhalah,
      item.kelas,
      item.peran,
      item.status,
    ]),
    startY: 20,
  });
  doc.save(`${fileName}.pdf`);
};

export const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const bstr = event.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                // Assuming first row is header
                const headers = data[0] as string[];
                const jsonData = data.slice(1).map(row => {
                    const rowData: {[key: string]: any} = {};
                    headers.forEach((header, index) => {
                        rowData[header] = (row as any[])[index];
                    });
                    return rowData;
                });
                resolve(jsonData);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};