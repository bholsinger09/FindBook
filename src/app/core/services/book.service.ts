import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import {
    Book,
    BookSearchResult,
    BookSearchParams,
    GoogleBooksApiResponse,
    GoogleBooksVolumeItem,
    GoogleBooksVolumeInfo,
} from '../models';
import { PerformanceService } from './performance.service';

@Injectable({
    providedIn: 'root',
})
export class BookService {
    private readonly SEARCH_CACHE_STORAGE_KEY = 'findbook-search-cache';
    private readonly BOOK_CACHE_STORAGE_KEY = 'findbook-book-cache';
    private readonly apiBaseUrl = 'https://DISABLED-API.com/books/v1'; // Disabled to prevent console errors
    private readonly defaultMaxResults = 20;

    // Feature flag to disable API calls when external service is unreliable
    private readonly enableExternalApiCalls = false; // Set to false to prevent console errors

    private bookCache = new Map<string, { book: Book; timestamp: number }>();
    private searchCache = new Map<string, { result: BookSearchResult; timestamp: number }>();
    private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    constructor(
        private http: HttpClient,
        private performanceService: PerformanceService,
    ) {
        this.loadPersistentCaches();
    }

    /**
     * Search for books using Google Books API
     */
    searchBooks(searchParams: BookSearchParams): Observable<BookSearchResult> {
        this.performanceService.markStart('book-search');
        // Feature flag to disable external API calls
        if (!this.enableExternalApiCalls) {
            this.performanceService.markEnd('book-search');
            return of({
                books: [],
                totalItems: 0,
                query: searchParams.query,
                currentPage: 1,
                itemsPerPage: 20,
                hasMoreResults: false,
                searchTimestamp: new Date(),
            });
        }

        // Simple cache key based on query and params
        const cacheKey = JSON.stringify(searchParams);
        const cached = this.searchCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
            this.performanceService.markEnd('book-search');
            return of(cached.result);
        } else if (cached) {
            // Expired cache
            this.searchCache.delete(cacheKey);
            this.savePersistentCaches();
        }

        const params = this.buildSearchParams(searchParams);

        return this.http.get<GoogleBooksApiResponse>(`${this.apiBaseUrl}/volumes`, { params }).pipe(
            tap(() => this.performanceService.markEnd('book-search')),
            map((response) => {
                const result = this.transformGoogleBooksResponse(response, searchParams);
                this.searchCache.set(cacheKey, { result, timestamp: Date.now() });
                this.savePersistentCaches();
                return result;
            }),
            catchError((error, caught) => {
                this.performanceService.markEnd('book-search');
                if (error.status === 0 || error.status === 503) {
                    return caught.pipe();
                }
                return this.handleError(error, 'Failed to search books');
            }),
        );
    }

    /**
     * Get a specific book by ID
     */
    getBookById(id: string): Observable<Book> {
        this.performanceService.markStart('book-details');
        // Return mock book if external API calls are disabled
        if (!this.enableExternalApiCalls) {
            this.performanceService.markEnd('book-details');
            const mockBook: Book = {
                id: id,
                title: 'Book temporarily unavailable',
                authors: ['Unknown'],
                description: 'External book service is temporarily unavailable. Please try again later.',
                publishedDate: new Date().getFullYear().toString(),
                categories: [],
                pageCount: 0,
                language: 'en',
                averageRating: 0,
                ratingsCount: 0,
                maturityRating: 'NOT_MATURE',
                accessViewStatus: 'NONE',
                webReaderLink: undefined,
                imageLinks: {
                    thumbnail: '',
                    smallThumbnail: '',
                },
                industryIdentifiers: [],
            };
            return of(mockBook);
        }

        // In-memory cache for book details
        const cached = this.bookCache.get(id);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
            this.performanceService.markEnd('book-details');
            return of(cached.book);
        } else if (cached) {
            // Expired cache
            this.bookCache.delete(id);
            this.savePersistentCaches();
        }

        return this.http.get<GoogleBooksVolumeItem>(`${this.apiBaseUrl}/volumes/${id}`).pipe(
            tap(() => this.performanceService.markEnd('book-details')),
            map((item) => {
                const book = this.transformVolumeItem(item);
                this.bookCache.set(id, { book, timestamp: Date.now() });
                this.savePersistentCaches();
                return book;
            }),
            catchError((error, caught) => {
                this.performanceService.markEnd('book-details');
                if (error.status === 0 || error.status === 503) {
                    return caught.pipe();
                }
                return this.handleError(error, 'Book not found');
            }),
        );
    }
    /**
     * Invalidate all caches (manual or on demand)
     */
    invalidateCaches(): void {
        this.bookCache.clear();
        this.searchCache.clear();
        this.savePersistentCaches();
        // ...existing code...
    }

    /**
     * Get popular books (trending/featured books)
     */
    getPopularBooks(maxResults: number = this.defaultMaxResults): Observable<BookSearchResult> {
        const searchParams: BookSearchParams = {
            query: 'bestseller',
            maxResults,
            orderBy: 'newest',
        };

        return this.searchBooks(searchParams);
    }

    /**
     * Get search suggestions based on query
     */
    getSuggestions(query: string): string[] {
        if (query.length < 2) {
            return [];
        }

        // Simple suggestion system - in a real app, this would be more sophisticated
        const suggestions = [
            'javascript programming',
            'javascript tutorial',
            'java programming',
            'java spring boot',
            'python programming',
            'python data science',
            'angular development',
            'angular tutorial',
            'react development',
            'node.js programming',
            'web development',
            'mobile development',
            'machine learning',
            'artificial intelligence',
            'data structures',
            'algorithms',
            'software engineering',
            'clean code',
            'design patterns',
            'computer science',
        ];

        return suggestions.filter((suggestion) =>
            suggestion.toLowerCase().includes(query.toLowerCase()),
        );
    }

    /**
     * Build HTTP parameters for search request
     */
    private buildSearchParams(searchParams: BookSearchParams): HttpParams {
        let params = new HttpParams();

        // Build query string based on search type
        const queryString = this.buildQueryString(searchParams.query, searchParams.searchType);
        params = params.set('q', queryString);

        // Set pagination parameters
        params = params.set(
            'maxResults',
            (searchParams.maxResults || this.defaultMaxResults).toString(),
        );

        if (searchParams.startIndex) {
            params = params.set('startIndex', searchParams.startIndex.toString());
        }

        // Set optional parameters
        if (searchParams.langRestrict) {
            params = params.set('langRestrict', searchParams.langRestrict);
        }

        if (searchParams.filter) {
            params = params.set('filter', searchParams.filter);
        }

        if (searchParams.orderBy) {
            params = params.set('orderBy', searchParams.orderBy);
        }

        return params;
    }

    /**
     * Build query string based on search type
     */
    private buildQueryString(query: string, searchType?: string): string {
        if (!searchType || searchType === 'general') {
            return query;
        }

        switch (searchType) {
            case 'title':
                return `intitle:${query}`;
            case 'author':
                return `inauthor:${query}`;
            case 'isbn':
                return `isbn:${query}`;
            case 'subject':
                return `subject:${query}`;
            default:
                return query;
        }
    }

    /**
     * Transform Google Books API response to our internal format
     */
    private transformGoogleBooksResponse(
        response: GoogleBooksApiResponse,
        searchParams: BookSearchParams,
    ): BookSearchResult {
        const books = response.items
            ? response.items.map((item) => this.transformVolumeItem(item))
            : [];
        const maxResults = searchParams.maxResults || this.defaultMaxResults;
        const startIndex = searchParams.startIndex || 0;
        const currentPage = Math.floor(startIndex / maxResults) + 1;

        return {
            query: searchParams.query,
            totalItems: response.totalItems,
            currentPage,
            itemsPerPage: maxResults,
            books,
            hasMoreResults: startIndex + maxResults < response.totalItems,
            searchTimestamp: new Date(),
            appliedFilters: {
                searchType: searchParams.searchType,
                filter: searchParams.filter,
                langRestrict: searchParams.langRestrict,
                orderBy: searchParams.orderBy,
            },
        };
    }

    /**
     * Transform a single Google Books volume item to our Book interface
     */
    private transformVolumeItem(item: GoogleBooksVolumeItem): Book {
        const volumeInfo: GoogleBooksVolumeInfo = item.volumeInfo;

        return {
            id: item.id,
            title: volumeInfo.title,
            authors: volumeInfo.authors,
            subtitle: volumeInfo.subtitle,
            description: volumeInfo.description,
            publishedDate: volumeInfo.publishedDate,
            pageCount: volumeInfo.pageCount,
            language: volumeInfo.language,
            categories: volumeInfo.categories,
            averageRating: volumeInfo.averageRating,
            ratingsCount: volumeInfo.ratingsCount,
            imageLinks: volumeInfo.imageLinks
                ? {
                    smallThumbnail: volumeInfo.imageLinks.smallThumbnail,
                    thumbnail: volumeInfo.imageLinks.thumbnail,
                    small: volumeInfo.imageLinks.small,
                    medium: volumeInfo.imageLinks.medium,
                    large: volumeInfo.imageLinks.large,
                    extraLarge: volumeInfo.imageLinks.extraLarge,
                }
                : undefined,
            industryIdentifiers: volumeInfo.industryIdentifiers?.map((id) => ({
                type: id.type,
                identifier: id.identifier,
            })),
            publisher: volumeInfo.publisher,
            printType: volumeInfo.printType as 'BOOK' | 'MAGAZINE',
            maturityRating: volumeInfo.maturityRating as 'MATURE' | 'NOT_MATURE',
            webReaderLink: volumeInfo.previewLink,
            saleInfo: item.saleInfo
                ? {
                    country: item.saleInfo.country,
                    saleability: item.saleInfo.saleability as any,
                    retailPrice: item.saleInfo.retailPrice,
                    buyLink: item.saleInfo.buyLink,
                }
                : undefined,
        };
    }

    /**
     * Handle HTTP errors
     */
    private handleError(error: HttpErrorResponse, context: string): Observable<never> {
        let errorMessage = `${context}: `;
        let shouldLogToConsole = true;

        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage += error.error.message;
        } else {
            // Server-side error
            errorMessage += `Error Code: ${error.status}\nMessage: ${error.message}`;

            // Don't spam console with 503 errors (service unavailable) - these are temporary
            if (error.status === 503) {
                shouldLogToConsole = false;
                errorMessage = 'Google Books API temporarily unavailable';
            }
            // Friendly message for network errors
            if (error.status === 0) {
                errorMessage = 'Network error: Please check your internet connection.';
            }
        }

        if (shouldLogToConsole) {
            console.error(errorMessage);
        }

        // Optionally, could notify user via a toast/snackbar here

        return throwError(() => new Error(errorMessage));
    }

    /**
     * Load caches from localStorage on service init
     */
    private loadPersistentCaches(): void {
        try {
            const searchCacheRaw = localStorage.getItem(this.SEARCH_CACHE_STORAGE_KEY);
            if (searchCacheRaw) {
                const parsed = JSON.parse(searchCacheRaw);
                Object.entries(parsed).forEach(([key, value]) => {
                    this.searchCache.set(key, value as { result: BookSearchResult; timestamp: number });
                });
            }
            const bookCacheRaw = localStorage.getItem(this.BOOK_CACHE_STORAGE_KEY);
            if (bookCacheRaw) {
                const parsed = JSON.parse(bookCacheRaw);
                Object.entries(parsed).forEach(([key, value]) => {
                    this.bookCache.set(key, value as { book: Book; timestamp: number });
                });
            }
        } catch (e) {
            // Ignore cache load errors
        }
    }

    /**
     * Save caches to localStorage
     */
    private savePersistentCaches(): void {
        try {
            localStorage.setItem(this.SEARCH_CACHE_STORAGE_KEY, JSON.stringify(Object.fromEntries(this.searchCache)));
            localStorage.setItem(this.BOOK_CACHE_STORAGE_KEY, JSON.stringify(Object.fromEntries(this.bookCache)));
        } catch (e) {
            // Ignore cache save errors
        }
    }
}

