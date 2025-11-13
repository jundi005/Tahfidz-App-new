import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// User-provided Supabase URL and Anon Key
const supabaseUrl = 'https://ugucmvrgwulqvregntfr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVndWNtdnJnd3VscXZyZWdudGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTg0OTEsImV4cCI6MjA3ODE5NDQ5MX0.LPpxS10vKibcySVHMx0C8bZL2jWNjb4Qlzo5FtYcgQ0';

if (!supabaseUrl || !supabaseAnonKey) {
    // This check is kept for robustness, although the values are hardcoded now.
    throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
