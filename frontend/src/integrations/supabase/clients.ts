import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rzweiogujuwgunuailvc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6d2Vpb2d1anV3Z3VudWFpbHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODQxOTgsImV4cCI6MjA3MDg2MDE5OH0.CjIf5bEDUr2UdWBC2MnxkiscHmt5-g6cwBoePsnHuuk";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);


