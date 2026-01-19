
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string | null
          date: string
          halaqah_id: number | null
          id: number
          peran: Database["public"]["Enums"]["peran_enum"]
          person_id: number
          status: Database["public"]["Enums"]["attendance_status_enum"]
          waktu: Database["public"]["Enums"]["waktu_enum"]
        }
        Insert: {
          created_at?: string | null
          date: string
          halaqah_id?: number | null
          id?: number
          peran: Database["public"]["Enums"]["peran_enum"]
          person_id: number
          status: Database["public"]["Enums"]["attendance_status_enum"]
          waktu: Database["public"]["Enums"]["waktu_enum"]
        }
        Update: {
          created_at?: string | null
          date?: string
          halaqah_id?: number | null
          id?: number
          peran?: Database["public"]["Enums"]["peran_enum"]
          person_id?: number
          status?: Database["public"]["Enums"]["attendance_status_enum"]
          waktu?: Database["public"]["Enums"]["waktu_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_halaqah_id_fkey"
            columns: ["halaqah_id"]
            isOneToOne: false
            referencedRelation: "halaqah"
            referencedColumns: ["id"]
          },
        ]
      }
      chat: {
        Row: {
          id: number
          created_at: string
          content: string
          sender_email: string
          is_deleted: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          content: string
          sender_email: string
          is_deleted?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          content?: string
          sender_email?: string
          is_deleted?: boolean
        }
        Relationships: []
      }
      halaqah: {
        Row: {
          created_at: string | null
          id: number
          jenis: string
          marhalah: Database["public"]["Enums"]["marhalah_enum"]
          musammi_id: number | null
          nama: string
          waktu: Database["public"]["Enums"]["waktu_enum"][]
        }
        Insert: {
          created_at?: string | null
          id?: number
          jenis: string
          marhalah: Database["public"]["Enums"]["marhalah_enum"]
          musammi_id?: number | null
          nama: string
          waktu: Database["public"]["Enums"]["waktu_enum"][]
        }
        Update: {
          created_at?: string | null
          id?: number
          jenis?: string
          marhalah?: Database["public"]["Enums"]["marhalah_enum"]
          musammi_id?: number | null
          nama?: string
          waktu?: Database["public"]["Enums"]["waktu_enum"][]
        }
        Relationships: [
          {
            foreignKeyName: "halaqah_musammi_id_fkey"
            columns: ["musammi_id"]
            isOneToOne: false
            referencedRelation: "musammi"
            referencedColumns: ["id"]
          },
        ]
      }
      halaqah_santri: {
        Row: {
          halaqah_id: number
          santri_id: number
        }
        Insert: {
          halaqah_id: number
          santri_id: number
        }
        Update: {
          halaqah_id?: number
          santri_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "halaqah_santri_halaqah_id_fkey"
            columns: ["halaqah_id"]
            isOneToOne: false
            referencedRelation: "halaqah"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "halaqah_santri_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      informasi: {
        Row: {
          id: number
          created_at: string
          title: string
          content: string
          author_email: string | null
          is_pinned: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          title: string
          content: string
          author_email?: string | null
          is_pinned?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          title?: string
          content?: string
          author_email?: string | null
          is_pinned?: boolean
        }
        Relationships: []
      }
      musammi: {
        Row: {
          created_at: string | null
          id: number
          kode: string | null
          kelas: string
          marhalah: Database["public"]["Enums"]["marhalah_enum"]
          nama: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          kode?: string | null
          kelas: string
          marhalah: Database["public"]["Enums"]["marhalah_enum"]
          nama: string
        }
        Update: {
          created_at?: string | null
          id?: number
          kode?: string | null
          kelas?: string
          marhalah?: Database["public"]["Enums"]["marhalah_enum"]
          nama?: string
        }
        Relationships: []
      }
      santri: {
        Row: {
          created_at: string | null
          id: number
          kode: string | null
          kelas: string
          marhalah: Database["public"]["Enums"]["marhalah_enum"]
          nama: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          kode?: string | null
          kelas: string
          marhalah: Database["public"]["Enums"]["marhalah_enum"]
          nama: string
        }
        Update: {
          created_at?: string | null
          id?: number
          kode?: string | null
          kelas?: string
          marhalah?: Database["public"]["Enums"]["marhalah_enum"]
          nama?: string
        }
        Relationships: []
      }
      student_progress: {
        Row: {
            id: number
            created_at: string
            santri_id: number
            month_key: string 
            progress_type: string
            value: string
        }
        Insert: {
            id?: number
            created_at?: string
            santri_id: number
            month_key: string
            progress_type: string
            value: string
        }
        Update: {
            id?: number
            created_at?: string
            santri_id?: number
            month_key?: string
            progress_type?: string
            value?: string
        }
        Relationships: [
            {
                foreignKeyName: "student_progress_santri_id_fkey"
                columns: ["santri_id"]
                isOneToOne: false
                referencedRelation: "santri"
                referencedColumns: ["id"]
            }
        ]
      }
      wali_kelas: {
        Row: {
          id: number
          created_at: string
          nama: string
          marhalah: string
          kelas: string
          no_hp: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          nama: string
          marhalah: string
          kelas: string
          no_hp?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          nama?: string
          marhalah?: string
          kelas?: string
          no_hp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attendance_status_enum:
        | "Hadir"
        | "Izin"
        | "Sakit"
        | "Alpa"
        | "Terlambat"
      halaqah_type_enum: "Halaqah Utama" | "Halaqah Pagi" 
      marhalah_enum: "Mutawassithah" | "Aliyah" | "Jamiah"
      peran_enum: "Santri" | "Musammi"
      waktu_enum: "Shubuh" | "Dhuha" | "Ashar" | "Isya"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
