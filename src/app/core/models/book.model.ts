/**
 * Core book model representing a book entity
 */
export interface Book {
    /** Unique identifier from the API (Google Books ID) */
    id: string;

    /** Book title */
    title: string;

    /** Array of author names */
    authors?: string[];

    /** Book description/summary */
    description?: string;

    /** Publication date in ISO format */
    publishedDate?: string;

    /** Number of pages */
    pageCount?: number;

    /** Language code (e.g., 'en', 'es') */
    language?: string;

    /** Book categories/genres */
    categories?: string[];

    /** Average rating (0-5) */
    averageRating?: number;

    /** Number of ratings */
    ratingsCount?: number;

    /** Book cover image URLs */
    imageLinks?: BookImageLinks;

    /** ISBN identifiers */
    industryIdentifiers?: BookIdentifier[];

    /** Publisher information */
    publisher?: string;

    /** Book format information */
    printType?: 'BOOK' | 'MAGAZINE';

    /** Maturity rating */
    maturityRating?: 'MATURE' | 'NOT_MATURE';

    /** Preview/buy links */
    accessViewStatus?: 'FULL_AVAILABLE' | 'PARTIAL' | 'NONE';

    /** Web reader link */
    webReaderLink?: string;

    /** Additional metadata */
    subtitle?: string;

    /** Sale information */
    saleInfo?: BookSaleInfo;
}

/**
 * Book cover image URLs in different sizes
 */
export interface BookImageLinks {
    /** Small thumbnail (usually 128x128) */
    smallThumbnail?: string;

    /** Standard thumbnail (usually 128x192) */
    thumbnail?: string;

    /** Small image */
    small?: string;

    /** Medium image */
    medium?: string;

    /** Large image */
    large?: string;

    /** Extra large image */
    extraLarge?: string;
}

/**
 * Book identifier (ISBN, etc.)
 */
export interface BookIdentifier {
    /** Identifier type (ISBN_10, ISBN_13, etc.) */
    type: string;

    /** Identifier value */
    identifier: string;
}

/**
 * Book sale/price information
 */
export interface BookSaleInfo {
    /** Country where pricing applies */
    country?: string;

    /** Whether the book is for sale */
    saleability?: 'FOR_SALE' | 'NOT_FOR_SALE' | 'FOR_SALE_AND_RENTAL';

    /** Pricing information */
    retailPrice?: {
        amount: number;
        currencyCode: string;
    };

    /** Buy link */
    buyLink?: string;
}

/**
 * Simplified book model for display in lists
 */
export interface BookListItem {
    id: string;
    title: string;
    authors?: string[];
    thumbnail?: string;
    averageRating?: number;
    publishedDate?: string;
    categories?: string[];
}

/**
 * Book search parameters
 */
export interface BookSearchParams {
    /** Search query string */
    query: string;

    /** Maximum results to return (1-40) */
    maxResults?: number;

    /** Starting index for pagination */
    startIndex?: number;

    /** Search field to target */
    searchType?: 'general' | 'title' | 'author' | 'isbn' | 'subject';

    /** Language restriction */
    langRestrict?: string;

    /** Filter options */
    filter?: 'partial' | 'full' | 'free-ebooks' | 'paid-ebooks' | 'ebooks';

    /** Sort order */
    orderBy?: 'relevance' | 'newest';
}

/**
 * Book search filters for UI
 */
export interface BookFilters {
    /** Filter by language */
    language?: string;

    /** Filter by publication year range */
    yearFrom?: number;
    yearTo?: number;

    /** Filter by minimum rating */
    minRating?: number;

    /** Filter by categories */
    categories?: string[];

    /** Show only books with preview */
    hasPreview?: boolean;

    /** Show only free books */
    freeOnly?: boolean;
}