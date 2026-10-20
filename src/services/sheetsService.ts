/**
 * sheetsService.ts
 * Conector bidireccional entre la aplicación web de Colores Pizza y Google Sheets
 * mediante Google Apps Script Web App.
 */

const STORAGE_KEY = 'colores_pizzeria_sheets_url';

const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxKdeDaT28ilE-MQzkJEJAtxYLFUaGz7QGTpShutietIiCHU7jeH7eRHPmSuJzBPypr/exec';

export const getSheetsApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.startsWith('https://script.google.com/')) {
      return saved.trim();
    }
  }
  const env = (import.meta as any).env || {};
  return (env.VITE_GOOGLE_SHEETS_API_URL || env.GOOGLE_SHEETS_API_URL || DEFAULT_SHEETS_URL).trim();
};

export const setSheetsApiUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    if (url) {
      localStorage.setItem(STORAGE_KEY, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  availableSheetsCache = null;
};

let availableSheetsCache: string[] | null = null;

async function resolveSheetName(requested: string, url: string): Promise<string> {
  if (!availableSheetsCache) {
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.available_sheets)) {
        availableSheetsCache = json.available_sheets;
      }
    } catch {}
  }

  if (availableSheetsCache) {
    // Exact case-insensitive match
    const match = availableSheetsCache.find(
      s => s.trim().toLowerCase() === requested.trim().toLowerCase()
    );
    if (match) return match;

    // Plural/singular flexible match (e.g. registro_asistencia -> registro_asistencias)
    const reqClean = requested.trim().toLowerCase();
    const matchPlural = availableSheetsCache.find(s => {
      const sClean = s.trim().toLowerCase();
      return sClean === reqClean + 's' || sClean + 's' === reqClean;
    });
    if (matchPlural) return matchPlural;
  }

  return requested;
}

export const sheetsService = {
  isConfigured(): boolean {
    return Boolean(getSheetsApiUrl());
  },

  async getRows<T = any>(sheetName: string): Promise<T[] | null> {
    const url = getSheetsApiUrl();
    if (!url) return null;

    try {
      const actualSheet = await resolveSheetName(sheetName, url);
      const target = `${url}${url.includes('?') ? '&' : '?'}sheet=${encodeURIComponent(actualSheet)}`;
      const res = await fetch(target);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data as T[];
      }
      return null;
    } catch (err) {
      console.warn(`[sheetsService] Error fetching sheet ${sheetName}:`, err);
      return null;
    }
  },

  async append(sheetName: string, data: any | any[]): Promise<boolean> {
    const url = getSheetsApiUrl();
    if (!url) return false;

    try {
      const actualSheet = await resolveSheetName(sheetName, url);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ sheet: actualSheet, action: 'insert', data })
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch (err) {
      console.warn(`[sheetsService] Error appending to sheet ${sheetName}:`, err);
      return false;
    }
  },

  async upsert(sheetName: string, data: any | any[], keyCol?: string): Promise<boolean> {
    const url = getSheetsApiUrl();
    if (!url) return false;

    try {
      const actualSheet = await resolveSheetName(sheetName, url);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ sheet: actualSheet, action: 'upsert', key: keyCol, data })
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch (err) {
      console.warn(`[sheetsService] Error upserting to sheet ${sheetName}:`, err);
      return false;
    }
  },

  async deleteRow(sheetName: string, id: string, keyCol?: string): Promise<boolean> {
    const url = getSheetsApiUrl();
    if (!url) return false;

    try {
      const actualSheet = await resolveSheetName(sheetName, url);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ sheet: actualSheet, action: 'delete', key: keyCol, id })
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch (err) {
      console.warn(`[sheetsService] Error deleting row from sheet ${sheetName}:`, err);
      return false;
    }
  }
};
