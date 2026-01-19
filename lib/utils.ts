
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Generic export to Excel
export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Generic export to PDF
export const exportToPDF = (
  title: string,
  columns: string[],
  rows: any[][],
  fileName: string
) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' }, // Blue secondary color
    alternateRowStyles: { fillColor: [248, 250, 252] }, // Light slate
    theme: 'grid'
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
