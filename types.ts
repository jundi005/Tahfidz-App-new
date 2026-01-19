
export enum Marhalah {
  Mutawassithah = 'Mutawassithah',
  Aliyah = 'Aliyah',
  Jamiah = 'Jamiah',
}

export enum Waktu {
  Shubuh = 'Shubuh',
  Dhuha = 'Dhuha',
  Ashar = 'Ashar',
  Isya = 'Isya',
}

// Mengubah enum menjadi konstanta objek dan tipe string
// agar fleksibel menerima input custom dari user
export const HalaqahType = {
  Utama: 'Halaqah Utama',
  Pagi: 'Halaqah Pagi',
} as const;

export type HalaqahType = string;

export enum AttendanceStatus {
  Hadir = 'Hadir',
  Izin = 'Izin',
  Sakit = 'Sakit',
  Alpa = 'Alpa',
  Terlambat = 'Terlambat',
}

export enum Peran {
    Santri = 'Santri',
    Musammi = 'Musammi'
}

export interface Person {
  id: number;
  kode?: string; // New Unique Code Field
  nama: string;
  marhalah: Marhalah;
  kelas: string;
}

export interface Santri extends Person {}
export interface Musammi extends Person {}

export interface WaliKelas {
    id: number;
    nama: string;
    marhalah: Marhalah;
    kelas: string;
    no_hp?: string;
}

export interface Halaqah {
  id: number;
  nama: string;
  musammi: Musammi;
  santri: Santri[];
  marhalah: Marhalah;
  jenis: HalaqahType;
  waktu: Waktu[];
}

export interface AttendanceRecord {
  id: number;
  date: string; // YYYY-MM-DD
  waktu: Waktu;
  personId: number;
  nama: string;
  marhalah: Marhalah;
  kelas: string;
  peran: Peran;
  status: AttendanceStatus;
  halaqahId: number;
}

export type ProgressType = 'Hafalan' | 'Murojaah' | 'Ziyadah';

export interface StudentProgress {
    id: number;
    santri_id: number;
    month_key: string; // YYYY-MM
    progress_type: ProgressType;
    value: string;
}

// Updated Order to match Sidebar
export type Page = 'Dashboard' | 'Absensi' | 'Buku Absensi' | 'Manajemen Data' | 'Perkembangan Santri' | 'Pusat Informasi' | 'Laporan' | 'Users';
