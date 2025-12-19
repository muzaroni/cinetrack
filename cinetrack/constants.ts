
import { ShowStatus } from './types';

export const STATUS_COLORS: Record<ShowStatus, string> = {
  [ShowStatus.COMPLETED]: 'bg-green-500/10 text-green-400 border-green-500/20',
  [ShowStatus.WATCHING]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [ShowStatus.RECOMMENDED]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [ShowStatus.ON_HOLD]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  [ShowStatus.DROPPED]: 'bg-red-500/10 text-red-400 border-red-500/20',
};

// Text color versions for select/text only
export const STATUS_TEXT_COLORS: Record<ShowStatus, string> = {
  [ShowStatus.COMPLETED]: 'text-green-400',
  [ShowStatus.WATCHING]: 'text-blue-400',
  [ShowStatus.RECOMMENDED]: 'text-purple-400',
  [ShowStatus.ON_HOLD]: 'text-amber-400',
  [ShowStatus.DROPPED]: 'text-red-400',
};

export const NETWORK_COLORS: Record<string, string> = {
  'netflix': 'text-[#E50914]',
  'hbo': 'text-[#5822b4]',
  'hbo max': 'text-[#5822b4]',
  'max': 'text-[#5822b4]',
  'disney+': 'text-[#0063e5]',
  'disney plus': 'text-[#0063e5]',
  'amazon': 'text-[#00A8E1]',
  'amazon prime': 'text-[#00A8E1]',
  'prime video': 'text-[#00A8E1]',
  'apple tv+': 'text-white',
  'apple tv': 'text-white',
  'hulu': 'text-[#1ce783]',
  'crunchyroll': 'text-[#f47521]',
  'paramount+': 'text-[#0064ff]',
  'amc': 'text-[#d71920]',
  'fx': 'text-white',
  'bbc': 'text-white',
  'showtime': 'text-red-600',
};

export const getNetworkColorClass = (network: string): string => {
  const normalized = network.toLowerCase().trim();
  for (const [key, color] of Object.entries(NETWORK_COLORS)) {
    if (normalized.includes(key)) return color;
  }
  return 'text-slate-300'; // Default
};

export const getRatingColor = (rating: number) => {
  if (rating <= 1) return '#ef4444';
  if (rating >= 5) return '#22c55e';
  
  if (rating < 3) {
    const t = (rating - 1) / 2;
    const r = Math.round(239 + t * (245 - 239)); 
    const g = Math.round(68 + t * (158 - 68));   
    const b = Math.round(68 + t * (11 - 68));    
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (rating - 3) / 2;
    const r = Math.round(245 + t * (34 - 245));  
    const g = Math.round(158 + t * (197 - 158)); 
    const b = Math.round(11 + t * (94 - 11));    
    return `rgb(${r}, ${g}, ${b})`;
  }
};
