/**
 * Supabase storage layer.
 * Dùng env `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
 *
 * Lưu ý bảo mật: nếu dùng anon key trên frontend thì cần cấu hình RLS/policies phù hợp.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { User, Voter, VotingArea } from '../types';

type Db = any;

const STORAGE_KEYS = {
  users: 'users',
  voters: 'voters',
  voting_areas: 'voting_areas',
  election_end_time: 'election_end_time',
  app_initialized: 'app_initialized',
} as const;

function getEnv(name: string): string | null {
  const env = typeof import.meta !== 'undefined' && (import.meta as any).env?.[name];
  if (typeof env === 'string' && env.trim()) return env.trim();
  return null;
}

function hasSupabaseConfig(): boolean {
  return !!(getEnv('VITE_SUPABASE_URL') && getEnv('VITE_SUPABASE_ANON_KEY'));
}

let _client: SupabaseClient<Db> | null = null;
function client(): SupabaseClient<Db> {
  if (_client) return _client;
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Thiếu cấu hình Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  _client = createClient(url, key);
  return _client;
}

function useLocalStorage(): boolean {
  return !hasSupabaseConfig();
}

function getLocal<T>(key: string, parse = true): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return [] as T;
    return parse ? JSON.parse(raw) : (raw as T);
  } catch {
    return [] as T;
  }
}

function setLocal(key: string, value: unknown): void {
  if (typeof value === 'string') localStorage.setItem(key, value);
  else localStorage.setItem(key, JSON.stringify(value));
}

export interface AppData {
  users: User[];
  voters: Voter[];
  votingAreas: VotingArea[];
  election_end_time: string;
}

export async function getAll(): Promise<AppData> {
  if (useLocalStorage()) {
    return {
      users: getLocal<User[]>(STORAGE_KEYS.users),
      voters: getLocal<Voter[]>(STORAGE_KEYS.voters),
      votingAreas: getLocal<VotingArea[]>(STORAGE_KEYS.voting_areas),
      election_end_time: getLocal<string>(STORAGE_KEYS.election_end_time, false) || '',
    };
  }

  const c = client();
  const [usersRes, votersRes, areasRes, settingsRes] = await Promise.all([
    c.from('users').select('*').order('created_at', { ascending: true }),
    c.from('voters').select('*').order('created_at', { ascending: true }),
    c.from('voting_areas').select('*').order('created_at', { ascending: true }),
    c.from('election_settings').select('*').eq('key', 'election_end_time').maybeSingle(),
  ]);

  if (usersRes.error) throw new Error(usersRes.error.message);
  if (votersRes.error) throw new Error(votersRes.error.message);
  if (areasRes.error) throw new Error(areasRes.error.message);
  if (settingsRes.error) throw new Error(settingsRes.error.message);

  return {
    users: (usersRes.data || []).map(mapUserRow),
    voters: (votersRes.data || []).map(mapVoterRow),
    votingAreas: (areasRes.data || []).map(mapAreaRow),
    election_end_time: (settingsRes.data?.value as string) || '',
  };
}

function mapUserRow(r: any): User {
  return {
    id: String(r.id ?? ''),
    fullName: String(r.full_name ?? r.fullName ?? ''),
    position: String(r.position ?? ''),
    email: String(r.email ?? ''),
    phone: String(r.phone ?? ''),
    username: String(r.username ?? ''),
    password: r.password ? String(r.password) : undefined,
    role: r.role,
    votingArea: r.voting_area ? String(r.voting_area) : (r.votingArea ? String(r.votingArea) : undefined),
  };
}

function mapAreaRow(r: any): VotingArea {
  return { id: String(r.id ?? ''), name: String(r.name ?? '') };
}

function mapVoterRow(r: any): Voter {
  return {
    id: String(r.id ?? ''),
    fullName: String(r.full_name ?? r.fullName ?? ''),
    idCard: String(r.id_card ?? r.idCard ?? ''),
    address: r.address ? String(r.address) : '',
    neighborhood: r.neighborhood ? String(r.neighborhood) : '',
    constituency: r.constituency ? String(r.constituency) : '',
    votingGroup: r.voting_group ? String(r.voting_group) : (r.votingGroup ? String(r.votingGroup) : ''),
    votingArea: r.voting_area ? String(r.voting_area) : (r.votingArea ? String(r.votingArea) : ''),
    hasVoted: !!r.has_voted || r.hasVoted === true,
    votedAt: r.voted_at ? new Date(r.voted_at).toISOString() : (r.votedAt ? String(r.votedAt) : undefined),
  };
}

export async function getUsers(): Promise<User[]> {
  if (useLocalStorage()) return getLocal<User[]>(STORAGE_KEYS.users);
  const { users } = await getAll();
  return users;
}

export async function saveUsers(users: User[]): Promise<void> {
  if (useLocalStorage()) return void setLocal(STORAGE_KEYS.users, users);
  const c = client();
  // upsert theo id
  const payload = (users || []).map(u => ({
    id: u.id,
    full_name: u.fullName,
    position: u.position,
    email: u.email,
    phone: u.phone,
    username: u.username,
    password: u.password ?? null,
    role: u.role,
    voting_area: u.votingArea ?? null,
  }));
  const res = await c.from('users').upsert(payload, { onConflict: 'id' });
  if (res.error) throw new Error(res.error.message);
}

export async function getVotingAreas(): Promise<VotingArea[]> {
  if (useLocalStorage()) return getLocal<VotingArea[]>(STORAGE_KEYS.voting_areas);
  const { votingAreas } = await getAll();
  return votingAreas;
}

export async function saveVotingAreas(areas: VotingArea[]): Promise<void> {
  if (useLocalStorage()) return void setLocal(STORAGE_KEYS.voting_areas, areas);
  const c = client();
  const payload = (areas || []).map(a => ({ id: a.id, name: a.name }));
  const res = await c.from('voting_areas').upsert(payload, { onConflict: 'id' });
  if (res.error) throw new Error(res.error.message);
}

export async function getVoters(): Promise<Voter[]> {
  if (useLocalStorage()) return getLocal<Voter[]>(STORAGE_KEYS.voters);
  const { voters } = await getAll();
  return voters;
}

export async function saveVoters(voters: Voter[]): Promise<void> {
  if (useLocalStorage()) return void setLocal(STORAGE_KEYS.voters, voters);
  const c = client();
  const payload = (voters || []).map(v => ({
    id: v.id,
    full_name: v.fullName,
    id_card: v.idCard,
    address: v.address ?? null,
    neighborhood: v.neighborhood ?? null,
    constituency: v.constituency ?? null,
    voting_group: v.votingGroup ?? null,
    voting_area: v.votingArea ?? null,
    has_voted: !!v.hasVoted,
    voted_at: v.votedAt ? new Date(v.votedAt).toISOString() : null,
  }));
  const res = await c.from('voters').upsert(payload, { onConflict: 'id' });
  if (res.error) throw new Error(res.error.message);
}

export async function appendVoters(voters: Voter[], chunkSize = 1000): Promise<void> {
  if (useLocalStorage()) {
    const existing = getLocal<Voter[]>(STORAGE_KEYS.voters);
    setLocal(STORAGE_KEYS.voters, [...(existing || []), ...(voters || [])]);
    return;
  }
  const c = client();
  const list = voters || [];
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    const payload = chunk.map(v => ({
      id: v.id,
      full_name: v.fullName,
      id_card: v.idCard,
      address: v.address ?? null,
      neighborhood: v.neighborhood ?? null,
      constituency: v.constituency ?? null,
      voting_group: v.votingGroup ?? null,
      voting_area: v.votingArea ?? null,
      has_voted: !!v.hasVoted,
      voted_at: v.votedAt ? new Date(v.votedAt).toISOString() : null,
    }));
    const res = await c.from('voters').insert(payload);
    if (res.error) throw new Error(res.error.message);
  }
}

export async function getElectionEndTime(): Promise<string> {
  if (useLocalStorage()) return getLocal<string>(STORAGE_KEYS.election_end_time, false) || '';
  const { election_end_time } = await getAll();
  return election_end_time || '';
}

export async function saveElectionEndTime(value: string): Promise<void> {
  if (useLocalStorage()) return void setLocal(STORAGE_KEYS.election_end_time, value);
  const c = client();
  const res = await c.from('election_settings').upsert([{ key: 'election_end_time', value }], { onConflict: 'key' });
  if (res.error) throw new Error(res.error.message);
}

export function setAppInitialized(): void {
  localStorage.setItem(STORAGE_KEYS.app_initialized, 'true');
}

export function getAppInitialized(): boolean {
  return localStorage.getItem(STORAGE_KEYS.app_initialized) === 'true';
}

