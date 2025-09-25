import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR');
}

export function generatePixPayload(pixKey: string, amount: number, description?: string) {
  // Simplified PIX payload generation (in production, use proper PIX library)
  const merchantName = "DIVVY";
  const merchantCity = "SAO PAULO";
  const pixCode = `00020126360014BR.GOV.BCB.PIX0114${pixKey}5204000053039865802BR5913${merchantName}6009${merchantCity}62${description ? String(description.length + 4).padStart(2, '0') + '05' + String(description.length).padStart(2, '0') + description : '05'}6304`;
  
  // Calculate CRC16 checksum (simplified)
  return pixCode + "0000";
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    } finally {
      document.body.removeChild(textArea);
    }
  }
}