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
    GoogleBooksVolumeInfo
} from '../models';
import { PerformanceService } from './performance.service';

@Injectable({
    providedIn: 'root'
})
export class BookService {
    private readonly apiBaseUrl = 'https://www.googleapis.com/books/v1';
    private readonly defaultMaxResults = 20;

    constructor(
        private http: HttpClient,
        private performanceService: PerformanceService
    ) { }

    /**
     * Search for books using Google Books API
     */
    searchBooks(searchParams: BookSearchParams): Observable<BookSearchResult> {
        const params = this.buildSearchParams(searchParams);

        // Start performance monitoring
        this.performanceService.markStart('book-search');

        return this.http.get<GoogleBooksApiResponse>(`${this.apiBaseUrl}/volumes`, { params })
            .pipe(
                tap(() => this.performanceService.markEnd('book-search')),
                map(response => this.transformGoogleBooksResponse(response, searchParams)),
                catchError(error => this.handleError(error, 'Failed to search books'))
            );
    }

    /**
     * Get a specific book by ID
     */
    getBookById(id: string): Observable<Book> {
        this.performanceService.markStart('book-details');

        return this.http.get<GoogleBooksVolumeItem>(`${this.apiBaseUrl}/volumes/${id}`)
            .pipe(
                tap(() => this.performanceService.markEnd('book-details')),
                map(item => this.transformVolumeItem(item)),
                catchError(error => this.handleError(error, 'Book not found'))
            );
    }

    /**
     * Get popular books (trending/featured books)
     */
    getPopularBooks(maxResults: number = this.defaultMaxResults): Observable<BookSearchResult> {
        const searchParams: BookSearchParams = {
            query: 'bestseller',
            maxResults,
            orderBy: 'newest'
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
            'computer science'
        ];

        return suggestions.filter(suggestion =>
            suggestion.toLowerCase().includes(query.toLowerCase())
        );
    }

    /**
     * Build HTTP parameters for search request
     */
    private buildSearchParams(searchParams: BookSearchParams): HttpParams {
        let params = new HttpParams();

        // Build query string based on search type
        let queryString = this.buildQueryString(searchParams.query, searchParams.searchType);
        params = params.set('q', queryString);

        // Set pagination parameters
        params = params.set('maxResults', (searchParams.maxResults || this.defaultMaxResults).toString());

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
        searchParams: BookSearchParams
    ): BookSearchResult {
        const books = response.items ? response.items.map(item => this.transformVolumeItem(item)) : [];
        const maxResults = searchParams.maxResults || this.defaultMaxResults;
        const startIndex = searchParams.startIndex || 0;
        const currentPage = Math.floor(startIndex / maxResults) + 1;

        return {
            query: searchParams.query,
            totalItems: response.totalItems,
            currentPage,
            itemsPerPage: maxResults,
            books,
            hasMoreResults: (startIndex + maxResults) < response.totalItems,
            searchTimestamp: new Date(),
            appliedFilters: {
                searchType: searchParams.searchType,
                filter: searchParams.filter,
                langRestrict: searchParams.langRestrict,
                orderBy: searchParams.orderBy
            }
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
            imageLinks: volumeInfo.imageLinks ? {
                smallThumbnail: volumeInfo.imageLinks.smallThumbnail,
                thumbnail: volumeInfo.imageLinks.thumbnail,
                small: volumeInfo.imageLinks.small,
                medium: volumeInfo.imageLinks.medium,
                large: volumeInfo.imageLinks.large,
                extraLarge: volumeInfo.imageLinks.extraLarge
            } : undefined,
            industryIdentifiers: volumeInfo.industryIdentifiers?.map(id => ({
                type: id.type,
                identifier: id.identifier
            })),
            publisher: volumeInfo.publisher,
            printType: volumeInfo.printType as 'BOOK' | 'MAGAZINE',
            maturityRating: volumeInfo.maturityRating as 'MATURE' | 'NOT_MATURE',
            webReaderLink: volumeInfo.previewLink,
            saleInfo: item.saleInfo ? {
                country: item.saleInfo.country,
                saleability: item.saleInfo.saleability as any,
                retailPrice: item.saleInfo.retailPrice,
                buyLink: item.saleInfo.buyLink
            } : undefined
        };
    }

    /**
     * Handle HTTP errors
     */
    private handleError(error: HttpErrorResponse, context: string): Observable<never> {
        let errorMessage = `${context}: `;

        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage += error.error.message;
        } else {
            // Server-side error
            errorMessage += `Error Code: ${error.status}\nMessage: ${error.message}`;
        }

        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}