import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { BookService } from './book.service';
import {
  Book,
  BookSearchResult,
  BookSearchParams,
  GoogleBooksApiResponse,
  GoogleBooksVolumeItem,
} from '../models';

describe('BookService', () => {
  let service: BookService;
  let httpMock: HttpTestingController;

  // Mock data
  const mockGoogleBooksResponse: GoogleBooksApiResponse = {
    kind: 'books#volumes',
    totalItems: 2,
    items: [
      {
        kind: 'books#volume',
        id: 'test-book-1',
        volumeInfo: {
          title: 'Test Book 1',
          authors: ['Test Author 1'],
          description: 'A test book description',
          publishedDate: '2023-01-01',
          pageCount: 200,
          categories: ['Fiction'],
          averageRating: 4.5,
          ratingsCount: 100,
          imageLinks: {
            thumbnail: 'https://example.com/thumbnail1.jpg',
          },
          language: 'en',
          publisher: 'Test Publisher',
        },
      },
      {
        kind: 'books#volume',
        id: 'test-book-2',
        volumeInfo: {
          title: 'Test Book 2',
          authors: ['Test Author 2', 'Test Author 3'],
          description: 'Another test book',
          publishedDate: '2023-02-01',
          pageCount: 150,
          categories: ['Non-Fiction'],
          averageRating: 3.8,
          ratingsCount: 50,
          imageLinks: {
            thumbnail: 'https://example.com/thumbnail2.jpg',
          },
          language: 'en',
        },
      },
    ],
  };

  const expectedBooks: Book[] = [
    {
      id: 'test-book-1',
      title: 'Test Book 1',
      authors: ['Test Author 1'],
      description: 'A test book description',
      publishedDate: '2023-01-01',
      pageCount: 200,
      categories: ['Fiction'],
      averageRating: 4.5,
      ratingsCount: 100,
      imageLinks: {
        thumbnail: 'https://example.com/thumbnail1.jpg',
      },
      language: 'en',
      publisher: 'Test Publisher',
    },
    {
      id: 'test-book-2',
      title: 'Test Book 2',
      authors: ['Test Author 2', 'Test Author 3'],
      description: 'Another test book',
      publishedDate: '2023-02-01',
      pageCount: 150,
      categories: ['Non-Fiction'],
      averageRating: 3.8,
      ratingsCount: 50,
      imageLinks: {
        thumbnail: 'https://example.com/thumbnail2.jpg',
      },
      language: 'en',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchBooks', () => {
    it('should search books with basic query', () => {
      const searchParams: BookSearchParams = {
        query: 'javascript',
        maxResults: 10,
      };

      service.searchBooks(searchParams).subscribe((result: BookSearchResult) => {
        expect(result.books).toEqual(expectedBooks);
        expect(result.totalItems).toBe(2);
        expect(result.query).toBe('javascript');
        expect(result.hasMoreResults).toBeFalsy();
      });

      const req = httpMock.expectOne(
        (req) =>
          req.url.includes('/volumes') &&
          req.url.includes('q=javascript') &&
          req.url.includes('maxResults=10'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockGoogleBooksResponse);
    });

    it('should handle empty search results', () => {
      const emptyResponse: GoogleBooksApiResponse = {
        kind: 'books#volumes',
        totalItems: 0,
      };

      service.searchBooks({ query: 'nonexistent' }).subscribe((result: BookSearchResult) => {
        expect(result.books).toEqual([]);
        expect(result.totalItems).toBe(0);
        expect(result.hasMoreResults).toBeFalsy();
      });

      const req = httpMock.expectOne((req) => req.url.includes('q=nonexistent'));
      req.flush(emptyResponse);
    });

    it('should handle search with pagination', () => {
      const searchParams: BookSearchParams = {
        query: 'angular',
        maxResults: 10,
        startIndex: 10,
      };

      service.searchBooks(searchParams).subscribe((result: BookSearchResult) => {
        expect(result.currentPage).toBe(2);
        expect(result.itemsPerPage).toBe(10);
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes('startIndex=10') && req.url.includes('maxResults=10'),
      );
      req.flush(mockGoogleBooksResponse);
    });

    it('should handle different search types', () => {
      const searchParams: BookSearchParams = {
        query: 'Hemingway',
        searchType: 'author',
      };

      service.searchBooks(searchParams).subscribe();

      const req = httpMock.expectOne((req) => req.url.includes('inauthor:Hemingway'));
      req.flush(mockGoogleBooksResponse);
    });

    it('should handle search by ISBN', () => {
      const searchParams: BookSearchParams = {
        query: '9781234567890',
        searchType: 'isbn',
      };

      service.searchBooks(searchParams).subscribe();

      const req = httpMock.expectOne((req) => req.url.includes('isbn:9781234567890'));
      req.flush(mockGoogleBooksResponse);
    });

    it('should handle search by title', () => {
      const searchParams: BookSearchParams = {
        query: 'The Great Gatsby',
        searchType: 'title',
      };

      service.searchBooks(searchParams).subscribe();

      const req = httpMock.expectOne((req) => req.url.includes('intitle:The%20Great%20Gatsby'));
      req.flush(mockGoogleBooksResponse);
    });

    it('should handle HTTP errors gracefully', () => {
      service.searchBooks({ query: 'test' }).subscribe({
        next: () => fail('Should have failed'),
        error: (error: Error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('Failed to search books');
        },
      });

      const req = httpMock.expectOne((req) => req.url.includes('/volumes'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should apply filters correctly', () => {
      const searchParams: BookSearchParams = {
        query: 'programming',
        filter: 'free-ebooks',
        langRestrict: 'en',
      };

      service.searchBooks(searchParams).subscribe();

      const req = httpMock.expectOne(
        (req) => req.url.includes('filter=free-ebooks') && req.url.includes('langRestrict=en'),
      );
      req.flush(mockGoogleBooksResponse);
    });
  });

  describe('getBookById', () => {
    it('should get book by ID', () => {
      const bookId = 'test-book-1';
      const mockVolumeItem: GoogleBooksVolumeItem = mockGoogleBooksResponse.items![0];

      service.getBookById(bookId).subscribe((book: Book) => {
        expect(book).toEqual(expectedBooks[0]);
      });

      const req = httpMock.expectOne(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockVolumeItem);
    });

    it('should handle book not found', () => {
      const bookId = 'nonexistent-book';

      service.getBookById(bookId).subscribe({
        next: () => fail('Should have failed'),
        error: (error: Error) => {
          expect(error.message).toContain('Book not found');
        },
      });

      const req = httpMock.expectOne(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getPopularBooks', () => {
    it('should get popular books by searching for trending topics', () => {
      service.getPopularBooks().subscribe((result: BookSearchResult) => {
        expect(result.books).toEqual(expectedBooks);
        expect(result.totalItems).toBe(2);
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes('/volumes') && req.url.includes('orderBy=newest'),
      );
      req.flush(mockGoogleBooksResponse);
    });
  });

  describe('getSuggestions', () => {
    it('should return search suggestions', () => {
      const query = 'java';
      const suggestions = service.getSuggestions(query);

      expect(suggestions).toContain('javascript');
      expect(suggestions).toContain('java programming');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty array for very short queries', () => {
      const suggestions = service.getSuggestions('a');
      expect(suggestions).toEqual([]);
    });
  });

  describe('transformGoogleBooksResponse', () => {
    it('should transform Google Books API response correctly', () => {
      // This tests the private method indirectly through searchBooks
      service.searchBooks({ query: 'test' }).subscribe((result: BookSearchResult) => {
        expect(result.books[0]).toEqual(
          jasmine.objectContaining({
            id: 'test-book-1',
            title: 'Test Book 1',
            authors: ['Test Author 1'],
          }),
        );
      });

      const req = httpMock.expectOne((req) => req.url.includes('/volumes'));
      req.flush(mockGoogleBooksResponse);
    });
  });

  describe('edge cases', () => {
    it('should handle malformed API response', () => {
      const malformedResponse = { invalid: 'data' };

      service.searchBooks({ query: 'test' }).subscribe({
        next: () => fail('Should have failed'),
        error: (error: Error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne((req) => req.url.includes('/volumes'));
      req.flush(malformedResponse);
    });

    it('should handle missing volume info', () => {
      const responseWithMissingInfo: GoogleBooksApiResponse = {
        kind: 'books#volumes',
        totalItems: 1,
        items: [
          {
            kind: 'books#volume',
            id: 'incomplete-book',
            volumeInfo: {
              title: 'Incomplete Book',
              // Missing other fields
            },
          },
        ],
      };

      service.searchBooks({ query: 'test' }).subscribe((result: BookSearchResult) => {
        expect(result.books[0].title).toBe('Incomplete Book');
        expect(result.books[0].authors).toBeUndefined();
      });

      const req = httpMock.expectOne((req) => req.url.includes('/volumes'));
      req.flush(responseWithMissingInfo);
    });
  });
});
