/**
 * Utility types for the FindBook application
 */

/**
 * Makes all properties of T optional recursively
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Makes specified keys K of type T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specified keys K of type T required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Pagination information
 */
export interface PaginationInfo {
    /** Current page number (1-based) */
    currentPage: number;

    /** Number of items per page */
    itemsPerPage: number;

    /** Total number of items */
    totalItems: number;

    /** Total number of pages */
    totalPages: number;

    /** Whether there is a previous page */
    hasPreviousPage: boolean;

    /** Whether there is a next page */
    hasNextPage: boolean;

    /** Starting item index (0-based) */
    startIndex: number;

    /** Ending item index (0-based) */
    endIndex: number;
}

/**
 * Sort options for book lists
 */
export interface SortOption {
    /** Display label */
    label: string;

    /** Sort field */
    field: string;

    /** Sort direction */
    direction: 'asc' | 'desc';

    /** Whether this is the default sort */
    default?: boolean;
}

/**
 * User preferences
 */
export interface UserPreferences {
    /** Preferred language */
    language?: string;

    /** Items per page */
    itemsPerPage?: number;

    /** Default search type */
    defaultSearchType?: string;

    /** Theme preference */
    theme?: 'light' | 'dark' | 'auto';

    /** Whether to save search history */
    saveSearchHistory?: boolean;

    /** Maximum search history items */
    maxSearchHistoryItems?: number;
}

/**
 * Application configuration
 */
export interface AppConfig {
    /** Google Books API configuration */
    googleBooksApi: {
        /** Base URL */
        baseUrl: string;

        /** API key (if required) */
        apiKey?: string;

        /** Default max results */
        defaultMaxResults: number;

        /** Request timeout */
        timeout: number;
    };

    /** Feature flags */
    features: {
        /** Enable favorites functionality */
        enableFavorites: boolean;

        /** Enable search history */
        enableSearchHistory: boolean;

        /** Enable advanced filters */
        enableAdvancedFilters: boolean;

        /** Enable book preview */
        enableBookPreview: boolean;
    };

    /** UI configuration */
    ui: {
        /** Default items per page */
        defaultItemsPerPage: number;

        /** Maximum items per page */
        maxItemsPerPage: number;

        /** Enable infinite scroll */
        enableInfiniteScroll: boolean;

        /** Debounce delay for search input */
        searchDebounceDelay: number;
    };
}

/**
 * Component state for loading, error handling
 */
export interface ComponentState<T = any> {
    /** Loading state */
    isLoading: boolean;

    /** Error state */
    error: string | null;

    /** Data */
    data: T | null;

    /** Whether data has been loaded at least once */
    hasLoaded: boolean;
}

/**
 * HTTP request states
 */
export type RequestState = 'idle' | 'pending' | 'success' | 'error';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
    /** Whether the request was successful */
    success: boolean;

    /** Response data */
    data?: T;

    /** Error message if unsuccessful */
    error?: string;

    /** HTTP status code */
    statusCode?: number;

    /** Additional metadata */
    metadata?: {
        /** Request timestamp */
        timestamp: string;

        /** Request ID for tracking */
        requestId?: string;

        /** API version */
        version?: string;
    };
}

/**
 * Favorite book item (local storage)
 */
export interface FavoriteBook {
    /** Book ID */
    bookId: string;

    /** When it was added to favorites */
    addedAt: Date;

    /** User's personal rating (optional) */
    userRating?: number;

    /** User's personal notes (optional) */
    notes?: string;

    /** Book data snapshot */
    bookData: {
        title: string;
        authors?: string[];
        thumbnail?: string;
    };
}

/**
 * Search suggestion item
 */
export interface SearchSuggestion {
    /** Suggestion text */
    text: string;

    /** Suggestion type */
    type: 'query' | 'author' | 'title' | 'category';

    /** Number of results for this suggestion */
    resultCount?: number;

    /** Whether this is from search history */
    fromHistory?: boolean;
}