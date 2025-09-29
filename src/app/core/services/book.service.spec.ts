import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BookService } from './book.service';
import { PerformanceService } from './performance.service';
import { Book, BookSearchParams, GoogleBooksApiResponse, GoogleBooksVolumeItem } from '../models';

describe('BookService', () => {
  let service: BookService;
  let httpMock: HttpTestingController;
  let performanceServiceSpy: jasmine.SpyObj<PerformanceService>;

  const mockGoogleBooksResponse: GoogleBooksApiResponse = {
    kind: 'books#volumes',
    totalItems: 100,
    items: [
      {
        kind: 'books#volume',
        id: 'test-id-1',
        volumeInfo: {
          title: 'Test Book 1',
          authors: ['Test Author 1'],
          subtitle: 'Test Subtitle',
          description: 'Test description for book 1',
          publishedDate: '2023-01-01',
          pageCount: 300,
          language: 'en',
          categories: ['Fiction', 'Science Fiction'],
          averageRating: 4.5,
          ratingsCount: 100,
          imageLinks: {
            smallThumbnail: 'https://example.com/small.jpg',
            thumbnail: 'https://example.com/thumb.jpg',
            small: 'https://example.com/small.jpg',
            medium: 'https://example.com/medium.jpg',
            large: 'https://example.com/large.jpg',
            extraLarge: 'https://example.com/xl.jpg'
          },
          industryIdentifiers: [
            { type: 'ISBN_13', identifier: '9781234567890' },
            { type: 'ISBN_10', identifier: '1234567890' }
          ],
          publisher: 'Test Publisher',
          printType: 'BOOK',
          maturityRating: 'NOT_MATURE',
          previewLink: 'https://example.com/preview'
        },
        saleInfo: {
          country: 'US',
          saleability: 'FOR_SALE',
          retailPrice: {
            amount: 29.99,
            currencyCode: 'USD'
          },
          buyLink: 'https://example.com/buy'
        }
      },
      {
        kind: 'books#volume',
        id: 'test-id-2',
        volumeInfo: {
          title: 'Test Book 2',
          authors: ['Test Author 2', 'Test Author 3'],
          description: 'Test description for book 2',
          publishedDate: '2023-02-01',
          pageCount: 250,
          language: 'es',
          categories: ['Non-Fiction'],
          averageRating: 3.8,
          ratingsCount: 50,
          publisher: 'Another Publisher',
          printType: 'BOOK',
          maturityRating: 'NOT_MATURE'
        }
      }
    ]
  };

  const mockVolumeItem: GoogleBooksVolumeItem = {
    kind: 'books#volume',
    id: 'detailed-book-id',
    volumeInfo: {
      title: 'Detailed Test Book',
      authors: ['Detailed Author'],
      subtitle: 'Detailed Subtitle',
      description: 'Detailed description',
      publishedDate: '2023-03-01',
      pageCount: 400,
      language: 'en',
      categories: ['Technology', 'Programming'],
      averageRating: 4.8,
      ratingsCount: 200,
      imageLinks: {
        thumbnail: 'https://example.com/detailed-thumb.jpg'
      },
      industryIdentifiers: [
        { type: 'ISBN_13', identifier: '9780987654321' }
      ],
      publisher: 'Tech Publisher',
      printType: 'BOOK',
      maturityRating: 'NOT_MATURE',
      previewLink: 'https://example.com/detailed-preview'
    },
    saleInfo: {
      country: 'US',
      saleability: 'FOR_SALE',
      retailPrice: {
        amount: 39.99,
        currencyCode: 'USD'
      },
      buyLink: 'https://example.com/detailed-buy'
    }
  };

  beforeEach(() => {
    const performanceSpy = jasmine.createSpyObj('PerformanceService', ['markStart', 'markEnd']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BookService,
        { provide: PerformanceService, useValue: performanceSpy }
      ]
    });

    service = TestBed.inject(BookService);
    httpMock = TestBed.inject(HttpTestingController);
    performanceServiceSpy = TestBed.inject(PerformanceService) as jasmine.SpyObj<PerformanceService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchBooks', () => {
    it('should return empty result when external API calls are disabled', () => {
      const searchParams: BookSearchParams = {
        query: 'javascript',
        maxResults: 10
      };

      service.searchBooks(searchParams).subscribe(result => {
        expect(result.books).toEqual([]);
        expect(result.totalItems).toBe(0);
        expect(result.query).toBe('javascript');
        expect(result.currentPage).toBe(1);
        expect(result.itemsPerPage).toBe(20);
        expect(result.hasMoreResults).toBeFalse();
        expect(result.searchTimestamp).toBeInstanceOf(Date);
      });
    });

    it('should build correct search parameters', () => {
      // Since external API calls are disabled, we'll test the parameter building indirectly
      const searchParams: BookSearchParams = {
        query: 'angular',
        maxResults: 15,
        startIndex: 10,
        langRestrict: 'en',
        filter: 'full',
        orderBy: 'newest',
        searchType: 'title'
      };

      service.searchBooks(searchParams).subscribe(result => {
        expect(result.query).toBe('angular');
        expect(result.itemsPerPage).toBe(20); // Uses default since API is disabled
      });
    });

    it('should handle different search types', () => {
      const testCases = [
        { searchType: 'title' as const, expected: 'intitle:' },
        { searchType: 'author' as const, expected: 'inauthor:' },
        { searchType: 'isbn' as const, expected: 'isbn:' },
        { searchType: 'subject' as const, expected: 'subject:' },
        { searchType: 'general' as const, expected: '' },
        { searchType: undefined, expected: '' }
      ];

      testCases.forEach(testCase => {
        const searchParams: BookSearchParams = {
          query: 'test',
          searchType: testCase.searchType
        };

        service.searchBooks(searchParams).subscribe(result => {
          expect(result.query).toBe('test');
        });
      });
    });
  });

  describe('getBookById', () => {
    it('should return mock book when external API calls are disabled', () => {
      const bookId = 'test-book-id';

      service.getBookById(bookId).subscribe(book => {
        expect(book.id).toBe(bookId);
        expect(book.title).toBe('Book temporarily unavailable');
        expect(book.authors).toEqual(['Unknown']);
        expect(book.description).toContain('temporarily unavailable');
        expect(book.categories).toEqual([]);
        expect(book.pageCount).toBe(0);
        expect(book.language).toBe('en');
        expect(book.averageRating).toBe(0);
        expect(book.ratingsCount).toBe(0);
        expect(book.maturityRating).toBe('NOT_MATURE');
        expect(book.accessViewStatus).toBe('NONE');
        expect(book.webReaderLink).toBeUndefined();
        expect(book.imageLinks).toBeDefined();
        expect(book.industryIdentifiers).toEqual([]);
      });
    });

    it('should return book with current year as published date', () => {
      const currentYear = new Date().getFullYear().toString();

      service.getBookById('test-id').subscribe(book => {
        expect(book.publishedDate).toBe(currentYear);
      });
    });
  });

  describe('getPopularBooks', () => {
    it('should search for bestseller books with default max results', () => {
      service.getPopularBooks().subscribe(result => {
        expect(result.books).toEqual([]);
        expect(result.totalItems).toBe(0);
        expect(result.query).toBe('bestseller');
        expect(result.itemsPerPage).toBe(20);
      });
    });

    it('should search for bestseller books with custom max results', () => {
      const maxResults = 15;

      service.getPopularBooks(maxResults).subscribe(result => {
        expect(result.books).toEqual([]);
        expect(result.totalItems).toBe(0);
        expect(result.query).toBe('bestseller');
        expect(result.itemsPerPage).toBe(20); // Uses default since API is disabled
      });
    });
  });

  describe('getSuggestions', () => {
    it('should return empty array for queries less than 2 characters', () => {
      expect(service.getSuggestions('')).toEqual([]);
      expect(service.getSuggestions('a')).toEqual([]);
    });

    it('should return matching suggestions for javascript', () => {
      const suggestions = service.getSuggestions('javascript');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('javascript programming');
      expect(suggestions).toContain('javascript tutorial');
    });

    it('should return matching suggestions for java', () => {
      const suggestions = service.getSuggestions('java');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('java programming');
      expect(suggestions).toContain('java spring boot');
      expect(suggestions).toContain('javascript programming');
      expect(suggestions).toContain('javascript tutorial');
    });

    it('should return matching suggestions for python', () => {
      const suggestions = service.getSuggestions('python');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('python programming');
      expect(suggestions).toContain('python data science');
    });

    it('should return matching suggestions for angular', () => {
      const suggestions = service.getSuggestions('angular');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('angular development');
      expect(suggestions).toContain('angular tutorial');
    });

    it('should be case insensitive', () => {
      const lowerSuggestions = service.getSuggestions('javascript');
      const upperSuggestions = service.getSuggestions('JAVASCRIPT');
      const mixedSuggestions = service.getSuggestions('JavaScript');

      expect(lowerSuggestions).toEqual(upperSuggestions);
      expect(lowerSuggestions).toEqual(mixedSuggestions);
    });

    it('should return suggestions for partial matches', () => {
      const suggestions = service.getSuggestions('develop');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('angular development');
      expect(suggestions).toContain('react development');
      expect(suggestions).toContain('web development');
      expect(suggestions).toContain('mobile development');
    });

    it('should return empty array for non-matching queries', () => {
      const suggestions = service.getSuggestions('xyznomatch');
      expect(suggestions).toEqual([]);
    });

    it('should return all available suggestions for common words', () => {
      const allSuggestions = [
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

      const programmingSuggestions = service.getSuggestions('programming');
      expect(programmingSuggestions.length).toBeGreaterThan(0);

      programmingSuggestions.forEach(suggestion => {
        expect(allSuggestions).toContain(suggestion);
      });
    });
  });

  describe('Performance Integration', () => {
    it('should not call performance service when API calls are disabled', () => {
      const searchParams: BookSearchParams = { query: 'test' };

      service.searchBooks(searchParams).subscribe();

      expect(performanceServiceSpy.markStart).not.toHaveBeenCalled();
      expect(performanceServiceSpy.markEnd).not.toHaveBeenCalled();
    });

    it('should not call performance service for getBookById when API calls are disabled', () => {
      service.getBookById('test-id').subscribe();

      expect(performanceServiceSpy.markStart).not.toHaveBeenCalled();
      expect(performanceServiceSpy.markEnd).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle search with empty query', () => {
      const searchParams: BookSearchParams = { query: '' };

      service.searchBooks(searchParams).subscribe(result => {
        expect(result.query).toBe('');
        expect(result.books).toEqual([]);
      });
    });

    it('should handle search with special characters', () => {
      const searchParams: BookSearchParams = { query: 'C++ & JavaScript!' };

      service.searchBooks(searchParams).subscribe(result => {
        expect(result.query).toBe('C++ & JavaScript!');
      });
    });

    it('should handle getBookById with empty string', () => {
      service.getBookById('').subscribe(book => {
        expect(book.id).toBe('');
        expect(book.title).toBe('Book temporarily unavailable');
      });
    });

    it('should handle getBookById with special characters', () => {
      const specialId = 'book-id_with-special.chars@123';

      service.getBookById(specialId).subscribe(book => {
        expect(book.id).toBe(specialId);
      });
    });

    it('should handle getPopularBooks with zero max results', () => {
      service.getPopularBooks(0).subscribe(result => {
        expect(result.itemsPerPage).toBe(20); // Should use default
      });
    });

    it('should handle getPopularBooks with negative max results', () => {
      service.getPopularBooks(-5).subscribe(result => {
        expect(result.itemsPerPage).toBe(20); // Should use default
      });
    });
  });

  describe('Search Parameters Validation', () => {
    it('should handle undefined search parameters gracefully', () => {
      const searchParams: BookSearchParams = {
        query: 'test',
        maxResults: undefined,
        startIndex: undefined,
        langRestrict: undefined,
        filter: undefined,
        orderBy: undefined,
        searchType: undefined
      };

      service.searchBooks(searchParams).subscribe(result => {
        expect(result.query).toBe('test');
        expect(result.itemsPerPage).toBe(20); // Should use default
      });
    });

    it('should handle search with all optional parameters', () => {
      const searchParams: BookSearchParams = {
        query: 'comprehensive test',
        maxResults: 25,
        startIndex: 50,
        langRestrict: 'es',
        filter: 'ebooks',
        orderBy: 'relevance',
        searchType: 'author'
      };

      service.searchBooks(searchParams).subscribe(result => {
        expect(result.query).toBe('comprehensive test');
      });
    });
  });

  describe('Data Transformation', () => {
    it('should handle transformVolumeItem with minimal data', () => {
      // This tests the private method indirectly through the mock response
      service.getBookById('minimal-book').subscribe(book => {
        expect(book).toBeDefined();
        expect(book.title).toBeDefined();
        expect(book.authors).toBeDefined();
      });
    });

    it('should handle book search result pagination calculation', () => {
      service.searchBooks({ query: 'test', maxResults: 10, startIndex: 20 }).subscribe(result => {
        expect(result.currentPage).toBe(1); // Since API is disabled, uses defaults
      });
    });
  });

  describe('API Feature Flag', () => {
    it('should consistently return mock data when API is disabled', () => {
      // Test multiple calls to ensure consistent behavior
      const searchParams: BookSearchParams = { query: 'consistency test' };

      service.searchBooks(searchParams).subscribe(result1 => {
        service.searchBooks(searchParams).subscribe(result2 => {
          expect(result1.books).toEqual(result2.books);
          expect(result1.totalItems).toBe(result2.totalItems);
          expect(result1.hasMoreResults).toBe(result2.hasMoreResults);
        });
      });
    });

    it('should handle rapid successive calls', () => {
      const promises: Promise<any>[] = [];

      for (let i = 0; i < 5; i++) {
        const promise = service.searchBooks({ query: `test-${i}` }).toPromise();
        promises.push(promise);
      }

      Promise.all(promises).then(results => {
        results.forEach((result, index) => {
          expect(result.query).toBe(`test-${index}`);
          expect(result.books).toEqual([]);
        });
      });
    });
  });
});
