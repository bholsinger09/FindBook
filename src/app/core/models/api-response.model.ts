import { Book } from './book.model';

/**
 * Google Books API response structure
 */
export interface GoogleBooksApiResponse {
  /** API response kind identifier */
  kind: 'books#volumes';

  /** Total number of items available */
  totalItems: number;

  /** Array of volume items */
  items?: GoogleBooksVolumeItem[];
}

/**
 * Individual book volume item from Google Books API
 */
export interface GoogleBooksVolumeItem {
  /** Volume kind identifier */
  kind: 'books#volume';

  /** Unique volume ID */
  id: string;

  /** ETag for caching */
  etag?: string;

  /** Self link to this resource */
  selfLink?: string;

  /** Volume information */
  volumeInfo: GoogleBooksVolumeInfo;

  /** Sale information */
  saleInfo?: GoogleBooksSaleInfo;

  /** Access information */
  accessInfo?: GoogleBooksAccessInfo;

  /** Search information */
  searchInfo?: GoogleBooksSearchInfo;
}

/**
 * Volume information from Google Books API
 */
export interface GoogleBooksVolumeInfo {
  /** Book title */
  title: string;

  /** Book subtitle */
  subtitle?: string;

  /** Array of author names */
  authors?: string[];

  /** Publisher name */
  publisher?: string;

  /** Published date string */
  publishedDate?: string;

  /** Book description */
  description?: string;

  /** Industry identifiers (ISBN, etc.) */
  industryIdentifiers?: {
    type: string;
    identifier: string;
  }[];

  /** Reading modes */
  readingModes?: {
    text: boolean;
    image: boolean;
  };

  /** Page count */
  pageCount?: number;

  /** Print type */
  printType?: string;

  /** Categories */
  categories?: string[];

  /** Maturity rating */
  maturityRating?: string;

  /** Allow anonymous logging */
  allowAnonLogging?: boolean;

  /** Content version */
  contentVersion?: string;

  /** Panel layout */
  panelizationSummary?: {
    containsEpubBubbles: boolean;
    containsImageBubbles: boolean;
  };

  /** Image links */
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };

  /** Language */
  language?: string;

  /** Preview link */
  previewLink?: string;

  /** Info link */
  infoLink?: string;

  /** Canonical volume link */
  canonicalVolumeLink?: string;

  /** Average rating */
  averageRating?: number;

  /** Ratings count */
  ratingsCount?: number;
}

/**
 * Sale information from Google Books API
 */
export interface GoogleBooksSaleInfo {
  /** Country */
  country: string;

  /** Saleability */
  saleability: string;

  /** Is ebook */
  isEbook?: boolean;

  /** List price */
  listPrice?: {
    amount: number;
    currencyCode: string;
  };

  /** Retail price */
  retailPrice?: {
    amount: number;
    currencyCode: string;
  };

  /** Buy link */
  buyLink?: string;

  /** Offers */
  offers?: {
    finskyOfferType: number;
    listPrice: {
      amountInMicros: number;
      currencyCode: string;
    };
    retailPrice: {
      amountInMicros: number;
      currencyCode: string;
    };
    giftable?: boolean;
  }[];
}

/**
 * Access information from Google Books API
 */
export interface GoogleBooksAccessInfo {
  /** Country */
  country: string;

  /** Viewability */
  viewability: string;

  /** Embeddable */
  embeddable: boolean;

  /** Public domain */
  publicDomain: boolean;

  /** Text to speech permission */
  textToSpeechPermission: string;

  /** Epub availability */
  epub: {
    isAvailable: boolean;
    acsTokenLink?: string;
  };

  /** PDF availability */
  pdf: {
    isAvailable: boolean;
    acsTokenLink?: string;
  };

  /** Web reader link */
  webReaderLink?: string;

  /** Access view status */
  accessViewStatus: string;

  /** Quote sharing allowed */
  quoteSharingAllowed?: boolean;
}

/**
 * Search information from Google Books API
 */
export interface GoogleBooksSearchInfo {
  /** Text snippet */
  textSnippet?: string;
}

/**
 * Processed search result for application use
 */
export interface BookSearchResult {
  /** Search query that generated this result */
  query: string;

  /** Total number of books found */
  totalItems: number;

  /** Current page/offset */
  currentPage: number;

  /** Number of items per page */
  itemsPerPage: number;

  /** Array of books */
  books: Book[];

  /** Whether there are more results available */
  hasMoreResults: boolean;

  /** Time when search was performed */
  searchTimestamp: Date;

  /** Applied filters */
  appliedFilters?: any;
}

/**
 * Search history item for caching and user experience
 */
export interface SearchHistoryItem {
  /** Unique identifier */
  id: string;

  /** Search query */
  query: string;

  /** Search parameters used */
  searchParams: any;

  /** Number of results found */
  totalResults: number;

  /** Timestamp when search was performed */
  timestamp: Date;

  /** Preview of first few results */
  preview: Book[];
}

/**
 * Error response structure
 */
export interface ApiErrorResponse {
  /** Error occurred */
  error: {
    /** Error code */
    code: number;

    /** Error message */
    message: string;

    /** Detailed errors */
    errors?: {
      domain: string;
      reason: string;
      message: string;
      locationType?: string;
      location?: string;
    }[];
  };
}

/**
 * Loading states for UI
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Search request options
 */
export interface SearchRequestOptions {
  /** Whether to include cached results */
  useCache?: boolean;

  /** Timeout in milliseconds */
  timeout?: number;

  /** Whether to debounce the request */
  debounce?: boolean;

  /** Debounce delay in milliseconds */
  debounceDelay?: number;
}
