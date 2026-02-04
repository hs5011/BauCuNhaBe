/**
 * API đọc/ghi dữ liệu với Google Sheet thông qua Google Apps Script Web App.
 * Nếu chưa cấu hình URL (env hoặc localStorage), sẽ fallback dùng localStorage.
 */

import type { User, Voter, VotingArea } from '../types';

const STORAGE_KEY_URL = 'sheet_app_url';
const STORAGE_KEY_USE_CORS_PROXY = 'sheet_use_cors_proxy';
// Khuyến nghị: dùng proxy riêng (Render/Vercel/Cloudflare) thay vì proxy công cộng.
const STORAGE_KEY_PROXY_URL = 'sheet_proxy_url';
const PUBLIC_CORS_PROXY = 'https://corsproxy.io/?';
const PUBLIC_CORS_PROXY_ALT = 'https://api.allorigins.win/raw?url=';
const MSG_403 =
  '403 Forbidden. Kiểm tra: (1) Google Apps Script → Triển khai → Quản lý triển khai → Chỉnh sửa → Quyền truy cập = "Bất kỳ ai" → Tạo phiên bản mới. (2) Hoặc bấm "Kiểm tra kết nối" trong Cài đặt để mở URL trong tab mới — nếu tab mới cũng 403 thì chưa đúng quyền.';
const STORAGE_KEYS = {
  users: 'users',
  voters: 'voters',
  voting_areas: 'voting_areas',
  election_end_time: 'election_end_time',
  app_initialized: 'app_initialized',
} as const;

export interface SheetData {
  users: User[];
  voters: Voter[];
  votingAreas: VotingArea[];
  election_end_time: string;
}

function getBaseUrl(): string | null {
  const env = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SHEET_APP_URL;
  if (env && typeof env === 'string' && env.trim()) return env.trim();
  try {
    const saved = localStorage.getItem(STORAGE_KEY_URL);
    return saved && saved.trim() ? saved.trim() : null;
  } catch {
    return null;
  }
}

function getProxyUrl(): string | null {
  const env = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SHEET_PROXY_URL;
  if (env && typeof env === 'string' && env.trim()) return env.trim();
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PROXY_URL);
    return saved && saved.trim() ? saved.trim() : null;
  } catch {
    return null;
  }
}

export function setSheetAppUrl(url: string): void {
  const u = url.trim();
  if (u) localStorage.setItem(STORAGE_KEY_URL, u);
  else localStorage.removeItem(STORAGE_KEY_URL);
}

export function getSheetAppUrl(): string | null {
  return getBaseUrl();
}

export function setSheetProxyUrl(url: string): void {
  const u = url.trim();
  if (u) localStorage.setItem(STORAGE_KEY_PROXY_URL, u);
  else localStorage.removeItem(STORAGE_KEY_PROXY_URL);
}

export function getSheetProxyUrl(): string | null {
  return getProxyUrl();
}

export function getUseCorsProxy(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_USE_CORS_PROXY) === 'true';
  } catch {
    return false;
  }
}

export function setUseCorsProxy(use: boolean): void {
  if (use) localStorage.setItem(STORAGE_KEY_USE_CORS_PROXY, 'true');
  else localStorage.removeItem(STORAGE_KEY_USE_CORS_PROXY);
}

function useLocalStorage(): boolean {
  return getBaseUrl() == null;
}

// --- LocalStorage fallback ---
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

// --- Fetch ---
// Ưu tiên proxy riêng (ổn định). Nếu không có, mới dùng proxy công cộng (kém ổn định).
function buildGetUrl(url: string): string {
  const proxy = getProxyUrl();
  if (proxy) {
    // Proxy riêng: GET /api/sheet?url=<encoded>
    const p = proxy.replace(/\/+$/, '');
    return `${p}/api/sheet?url=${encodeURIComponent(url)}`;
  }
  return getUseCorsProxy() ? PUBLIC_CORS_PROXY + encodeURIComponent(url) : url;
}

function buildPostUrl(url: string): string {
  const proxy = getProxyUrl();
  if (proxy) {
    const p = proxy.replace(/\/+$/, '');
    return `${p}/api/sheet`;
  }
  return getUseCorsProxy() ? PUBLIC_CORS_PROXY + encodeURIComponent(url) : url;
}

async function fetchGet<T>(url: string): Promise<T> {
  const tryFetch = async (targetUrl: string): Promise<Response> => fetch(targetUrl, { method: 'GET' });

  let res = await tryFetch(buildGetUrl(url));
  let text = await res.text();

  if (res.status === 403 && getUseCorsProxy() && !getProxyUrl()) {
    const altUrl = PUBLIC_CORS_PROXY_ALT + encodeURIComponent(url);
    res = await tryFetch(altUrl);
    text = await res.text();
  }

  if (!res.ok) {
    if (res.status === 403) throw new Error(MSG_403);
    throw new Error(`Sheet API: ${res.status} ${res.statusText}${text ? ` - ${text.slice(0, 200)}` : ''}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Sheet API: phản hồi không hợp lệ${text ? `: ${text.slice(0, 100)}` : ''}`);
  }
}

async function fetchPost(url: string, payload: object): Promise<void> {
  const body = `payload=${encodeURIComponent(JSON.stringify(payload))}`;
  const useProxy = getUseCorsProxy();
  const proxyUrl = getProxyUrl();
  
  const tryPost = async (targetUrl: string, skipProxy: boolean = false): Promise<{ res: Response; text: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
      // Nếu dùng proxy riêng: gửi thêm target URL để proxy forward
      const finalBody = proxyUrl ? `${body}&target=${encodeURIComponent(url)}` : body;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: finalBody,
      });
      const text = await res.text();
      return { res, text };
    } catch (networkErr) {
      if (skipProxy) {
        throw new Error(`Lỗi kết nối: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}. Có thể bị chặn CORS - thử bật proxy CORS trong Cài đặt.`);
      }
      throw networkErr;
    }
  };
  
  let targetUrl = buildPostUrl(url);
  let result = await tryPost(targetUrl);
  
  if (result.res.status === 403 && useProxy && !proxyUrl) {
    console.warn('POST qua proxy bị 403, thử POST trực tiếp (có thể bị CORS)...');
    targetUrl = url;
    result = await tryPost(targetUrl, true);
  }
  
  const { res, text } = result;
  
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(MSG_403 + '\n\nLưu ý: Nếu đã đặt "Bất kỳ ai" mà vẫn 403, có thể do proxy CORS. Thử tắt proxy CORS trong Cài đặt rồi thử lại.');
    }
    const errorDetail = text ? (text.length > 500 ? text.slice(0, 500) + '...' : text) : '';
    throw new Error(`Sheet API POST: ${res.status} ${res.statusText}${errorDetail ? `\nChi tiết: ${errorDetail}` : ''}`);
  }
  
  try {
    const json = JSON.parse(text) as { ok?: boolean; error?: string };
    if (json && json.ok === false && json.error) {
      throw new Error(json.error);
    }
    if (!json || json.ok !== true) {
      console.warn('Sheet API POST response:', json);
    }
  } catch (err) {
    if (err instanceof Error && !err.message.includes('Sheet API')) {
      if (text && text.trim().length > 0 && !text.startsWith('{')) {
        throw new Error(`Sheet API trả về không phải JSON: ${text.slice(0, 200)}`);
      }
      return;
    }
    throw err;
  }
}

// --- Public API ---

/** Lấy toàn bộ dữ liệu (từ Sheet hoặc localStorage). */
export async function getAll(): Promise<SheetData> {
  if (useLocalStorage()) {
    return {
      users: getLocal<User[]>(STORAGE_KEYS.users),
      voters: getLocal<Voter[]>(STORAGE_KEYS.voters),
      votingAreas: getLocal<VotingArea[]>(STORAGE_KEYS.voting_areas),
      election_end_time: getLocal<string>(STORAGE_KEYS.election_end_time, false) || '',
    };
  }
  const base = getBaseUrl()!;
  const q = base.includes('?') ? '&' : '?';
  return fetchGet<SheetData>(`${base}${q}all=1`);
}

/** Lấy danh sách users. */
export async function getUsers(): Promise<User[]> {
  if (useLocalStorage()) return getLocal<User[]>(STORAGE_KEYS.users);
  const data = await getAll();
  return data.users;
}

/** Lấy danh sách voters. */
export async function getVoters(): Promise<Voter[]> {
  if (useLocalStorage()) return getLocal<Voter[]>(STORAGE_KEYS.voters);
  const data = await getAll();
  return data.voters;
}

/** Lấy danh sách khu vực bỏ phiếu. */
export async function getVotingAreas(): Promise<VotingArea[]> {
  if (useLocalStorage()) return getLocal<VotingArea[]>(STORAGE_KEYS.voting_areas);
  const data = await getAll();
  return data.votingAreas;
}

/** Lấy thời gian kết thúc bầu cử. */
export async function getElectionEndTime(): Promise<string> {
  if (useLocalStorage()) return getLocal<string>(STORAGE_KEYS.election_end_time, false) || '';
  const data = await getAll();
  return data.election_end_time || '';
}

/** Lưu users lên Sheet hoặc localStorage. */
export async function saveUsers(users: User[]): Promise<void> {
  if (useLocalStorage()) {
    setLocal(STORAGE_KEYS.users, users);
    return;
  }
  await fetchPost(getBaseUrl()!, { sheet: 'Users', data: users });
}

/** Lưu voters lên Sheet hoặc localStorage. */
export async function saveVoters(voters: Voter[]): Promise<void> {
  if (useLocalStorage()) {
    setLocal(STORAGE_KEYS.voters, voters);
    return;
  }
  await fetchPost(getBaseUrl()!, { sheet: 'Voters', data: voters });
}

/** Append voters theo lô (dùng cho import Excel lớn để tránh timeout). */
export async function appendVoters(voters: Voter[], chunkSize = 300): Promise<void> {
  if (useLocalStorage()) {
    const existing = getLocal<Voter[]>(STORAGE_KEYS.voters);
    setLocal(STORAGE_KEYS.voters, [...(existing || []), ...(voters || [])]);
    return;
  }
  const base = getBaseUrl()!;
  const list = voters || [];
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    await fetchPost(base, { sheet: 'Voters', action: 'append', data: chunk });
  }
}

/** Lưu danh sách khu vực. */
export async function saveVotingAreas(areas: VotingArea[]): Promise<void> {
  if (useLocalStorage()) {
    setLocal(STORAGE_KEYS.voting_areas, areas);
    return;
  }
  await fetchPost(getBaseUrl()!, { sheet: 'VotingAreas', data: areas });
}

/** Lưu thời gian kết thúc bầu cử. */
export async function saveElectionEndTime(value: string): Promise<void> {
  if (useLocalStorage()) {
    setLocal(STORAGE_KEYS.election_end_time, value);
    return;
  }
  await fetchPost(getBaseUrl()!, {
    sheet: 'ElectionSettings',
    data: { election_end_time: value },
  });
}

/** Đánh dấu app đã khởi tạo (localStorage only khi dùng Sheet thì không cần). */
export function setAppInitialized(): void {
  localStorage.setItem(STORAGE_KEYS.app_initialized, 'true');
}

export function getAppInitialized(): boolean {
  return localStorage.getItem(STORAGE_KEYS.app_initialized) === 'true';
}
