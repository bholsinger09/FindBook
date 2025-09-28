/**
 * Application-wide constants
 */

// Timing constants (in milliseconds)
export const TIMING = {
  SNACKBAR_DURATION: 3000,
  PERFORMANCE_SUMMARY_DELAY: 5000,
  LOADING_SPINNER_MIN_DISPLAY: 300,
  DEBOUNCE_SEARCH: 300,
  TOAST_AUTO_HIDE: 5000
} as const;

// UI constants
export const UI = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_SEARCH_RESULTS: 100,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024
} as const;

// API constants
export const API = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  CACHE_TTL: 300000 // 5 minutes
} as const;

// Performance thresholds
export const PERFORMANCE = {
  GOOD_LCP: 2500,
  NEEDS_IMPROVEMENT_LCP: 4000,
  GOOD_FID: 100,
  NEEDS_IMPROVEMENT_FID: 300,
  GOOD_CLS: 0.1,
  NEEDS_IMPROVEMENT_CLS: 0.25
} as const;

// Storage keys
export const STORAGE_KEYS = {
  FAVORITES: 'findbook_favorites',
  PREFERENCES: 'findbook_preferences',
  READING_LIST: 'findbook_reading_list',
  SEARCH_HISTORY: 'findbook_search_history'
} as const;