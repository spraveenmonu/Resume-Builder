/**
 * Supabase Configuration & Initialization
 * ResumeCraft AI — Powered by Supabase (Auth & Database)
 * 
 * INSTRUCTIONS:
 * Replace the placeholder values below with your actual Supabase project
 * credentials from your Supabase Dashboard (Project Settings → API):
 * https://app.supabase.com
 * 
 * SUPABASE SQL SCHEMA:
 * Run the following in your Supabase SQL Editor to enable tables & Row Level Security:
 * 
 * -- 1. Resumes Table
 * create table if not exists public.resumes (
 *   id text primary key,
 *   user_id uuid references auth.users(id) on delete cascade not null,
 *   title text not null default 'My Resume',
 *   template text not null default 'michael',
 *   color text,
 *   font text,
 *   font_size int default 100,
 *   layout text default 'single',
 *   data jsonb not null default '{}'::jsonb,
 *   created_at timestamptz default now(),
 *   updated_at timestamptz default now()
 * );
 * 
 * -- 2. Cover Letters Table
 * create table if not exists public.cover_letters (
 *   id text primary key,
 *   user_id uuid references auth.users(id) on delete cascade not null,
 *   title text not null default 'My Cover Letter',
 *   template text not null default 'cl-emerald',
 *   color text,
 *   font text,
 *   data jsonb not null default '{}'::jsonb,
 *   created_at timestamptz default now(),
 *   updated_at timestamptz default now()
 * );
 * 
 * -- 3. Row Level Security (Users can only access their own documents)
 * alter table public.resumes enable row level security;
 * alter table public.cover_letters enable row level security;
 * 
 * create policy "Users can read own resumes" on public.resumes for select using (auth.uid() = user_id);
 * create policy "Users can insert own resumes" on public.resumes for insert with check (auth.uid() = user_id);
 * create policy "Users can update own resumes" on public.resumes for update using (auth.uid() = user_id);
 * create policy "Users can delete own resumes" on public.resumes for delete using (auth.uid() = user_id);
 * 
 * create policy "Users can read own cover letters" on public.cover_letters for select using (auth.uid() = user_id);
 * create policy "Users can insert own cover letters" on public.cover_letters for insert with check (auth.uid() = user_id);
 * create policy "Users can update own cover letters" on public.cover_letters for update using (auth.uid() = user_id);
 * create policy "Users can delete own cover letters" on public.cover_letters for delete using (auth.uid() = user_id);
 */

const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key";

// Check whether actual Supabase credentials have been configured
const isSupabaseConfigured = !!(
  SUPABASE_URL &&
  !SUPABASE_URL.includes("your-project-ref") &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.includes("your-anon-key")
);

let supabaseClient = null;

if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
  try {
    if (isSupabaseConfigured) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      console.log('⚡ Supabase Client initialized in Cloud Mode.');
    } else {
      console.info('⚡ Supabase running in Local/Demo Mode. Configure credentials in js/supabase-config.js for cloud database sync.');
    }
  } catch (err) {
    console.warn('Supabase initialization note:', err.message);
  }
} else {
  console.warn('Supabase JS library not loaded or waiting for CDN.');
}

window.supabaseClient = supabaseClient;
window.isSupabaseConfigured = isSupabaseConfigured;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
