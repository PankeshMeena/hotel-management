import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencySymbol: string = '₹'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${currencySymbol}0`;
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return amount < 0 ? `-${currencySymbol}${formatted}` : `${currencySymbol}${formatted}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateTimeString: string): string {
  if (!dateTimeString) return '-';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateTimeString;
  }
}

export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diffTime = outDate.getTime() - inDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Check if two date ranges overlap.
 * Hotel nightly logic: check-out day is exclusive!
 * [startA, endA) and [startB, endB) overlap iff startA < endB && startB < endA
 */
export function areDatesOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aIn = new Date(startA).getTime();
  const aOut = new Date(endA).getTime();
  const bIn = new Date(startB).getTime();
  const bOut = new Date(endB).getTime();

  return aIn < bOut && bIn < aOut;
}

export function maskPhoneNumber(phone: string): string {
  if (!phone) return '-';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 8) return phone;
  // Keep first 3 digits and last 3 digits
  const start = clean.slice(0, 3);
  const end = clean.slice(-3);
  return `${start} •••• ${end}`;
}

export function maskAadhaarNumber(doc: string): string {
  if (!doc) return '-';
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 12) {
    return `•••• •••• ${clean.slice(-4)}`;
  }
  // Generic doc masking
  if (doc.length > 4) {
    return `•••• ${doc.slice(-4)}`;
  }
  return '••••';
}

/**
 * Export data array to an authentic .xlsx file using SheetJS (with CSV fallback).
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  fileName: string,
  sheetName: string = 'Report'
): boolean {
  try {
    if (!data || data.length === 0) {
      alert('No records available to export.');
      return false;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-fit column widths
    const maxCols = Object.keys(data[0] || {}).map(key => {
      let maxLen = key.length;
      data.forEach(row => {
        const val = row[key];
        const len = val !== null && val !== undefined ? String(val).length : 0;
        if (len > maxLen) maxLen = len;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
    });
    worksheet['!cols'] = maxCols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
    
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    return true;
  } catch (error) {
    console.error('Failed to export to Excel, falling back to CSV:', error);
    exportToCsv(data, fileName);
    return true;
  }
}

export function exportToCsv<T extends Record<string, any>>(data: T[], fileName: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers
      .map(fieldName => {
        const value = row[fieldName];
        const stringValue = value === null || value === undefined ? '' : String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Compress an uploaded image file into a lightweight base64 JPEG string
 * for reliable browser localStorage persistence without exceeding quota.
 */
export function compressImageToBase64(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file (JPG, PNG, WebP)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fill background white for transparent PNGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Realistic Sample Government of India Aadhaar Card SVG Data URL
 * for 1-click test simulation without needing a local device file.
 */
export const SAMPLE_AADHAAR_CARD = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
  <defs>
    <linearGradient id="flag" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%23FF9933" />
      <stop offset="50%" stop-color="%23FFFFFF" />
      <stop offset="100%" stop-color="%23138808" />
    </linearGradient>
  </defs>
  <!-- Background Card -->
  <rect width="600" height="380" rx="16" fill="%23FFFFFF" stroke="%23CBD5E1" stroke-width="2"/>
  
  <!-- Header Stripes -->
  <rect x="0" y="0" width="600" height="10" rx="16" fill="%23FF9933"/>
  <rect x="0" y="370" width="600" height="10" rx="16" fill="%23138808"/>

  <!-- Top Emblem & Gov Header -->
  <circle cx="50" cy="46" r="22" fill="%23F8FAFC" stroke="%23E2E8F0"/>
  <text x="50" y="52" font-family="sans-serif" font-size="18" font-weight="bold" fill="%230F172A" text-anchor="middle">🏛️</text>
  
  <text x="85" y="42" font-family="sans-serif" font-size="15" font-weight="bold" fill="%230F172A">भारत सरकार</text>
  <text x="85" y="58" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23334155">Government of India</text>

  <!-- UIDAI Logo Text -->
  <rect x="440" y="26" width="130" height="34" rx="6" fill="%23FEF2F2" stroke="%23FCA5A5"/>
  <text x="505" y="48" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23B91C1C" text-anchor="middle">UIDAI • आधार</text>

  <line x1="25" y1="76" x2="575" y2="76" stroke="%23E2E8F0" stroke-width="1.5"/>

  <!-- Photo Box -->
  <rect x="35" y="95" width="115" height="145" rx="8" fill="%23F1F5F9" stroke="%23CBD5E1" stroke-width="1.5"/>
  <circle cx="92" cy="145" r="28" fill="%2394A3B8"/>
  <path d="M 55 220 Q 92 185 130 220 Z" fill="%2394A3B8"/>
  <rect x="35" y="248" width="115" height="22" rx="4" fill="%23ECFDF5" stroke="%23A7F3D0"/>
  <text x="92" y="263" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23065F46" text-anchor="middle">✓ VERIFIED ID</text>

  <!-- Guest Details -->
  <text x="175" y="115" font-family="sans-serif" font-size="12" fill="%2364748B">नाम / Name:</text>
  <text x="175" y="136" font-family="sans-serif" font-size="17" font-weight="bold" fill="%230F172A">Rahul Sharma (राहुल शर्मा)</text>

  <text x="175" y="165" font-family="sans-serif" font-size="12" fill="%2364748B">जन्म तिथि / DOB:</text>
  <text x="175" y="184" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231E293B">15/08/1990</text>

  <text x="175" y="212" font-family="sans-serif" font-size="12" fill="%2364748B">लिंग / Gender:</text>
  <text x="175" y="231" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231E293B">पुरुष / Male</text>

  <!-- QR Code Mockup -->
  <rect x="445" y="95" width="120" height="120" rx="8" fill="%23F8FAFC" stroke="%23CBD5E1"/>
  <rect x="460" y="110" width="30" height="30" fill="%230F172A"/>
  <rect x="520" y="110" width="30" height="30" fill="%230F172A"/>
  <rect x="460" y="170" width="30" height="30" fill="%230F172A"/>
  <rect x="500" y="150" width="20" height="20" fill="%230F172A"/>
  <rect x="525" y="175" width="25" height="15" fill="%230F172A"/>
  <text x="505" y="230" font-family="sans-serif" font-size="10" fill="%2364748B" text-anchor="middle">Secure QR Scan</text>

  <!-- Separator Line -->
  <line x1="25" y1="285" x2="575" y2="285" stroke="%23E2E8F0" stroke-width="1.5"/>

  <!-- Aadhaar Number (Masked) -->
  <rect x="120" y="295" width="360" height="42" rx="8" fill="%23FFFBEB" stroke="%23FDE68A"/>
  <text x="300" y="324" font-family="monospace" font-size="22" font-weight="bold" fill="%2392400E" text-anchor="middle" letter-spacing="3">••••  ••••  7182</text>

  <!-- Slogan -->
  <text x="300" y="356" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23B45309" text-anchor="middle">मेरा आधार, मेरी पहचान (Govt of India)</text>
</svg>`;

