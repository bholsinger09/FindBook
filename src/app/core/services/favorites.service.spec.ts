import { TestBed } from '@angular/core/testing';
import { FavoritesService, FavoriteBook } from './favorites.service';
import { Book } from '../models';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let localStorageSpy: jasmine.SpyObj<Storage>;
  let consoleErrorSpy: jasmine.Spy;

  const mockBook: Book = {
    id: 'test-book-1',
    title: 'Test Book Title',
    authors: ['Test Author 1', 'Test Author 2'],
    description: 'Test description',
    publishedDate: '2023',
    pageCount: 300,
    language: 'en',
    categories: ['Fiction'],
    averageRating: 4.5,
    ratingsCount: 100,
    maturityRating: 'NOT_MATURE',
    imageLinks: {
      thumbnail: 'http://example.com/thumbnail.jpg',
      smallThumbnail: 'http://example.com/small.jpg'
    },
    industryIdentifiers: []
  };

  const mockBook2: Book = {
    id: 'test-book-2',
    title: 'Another Test Book',
    authors: ['Another Author'],
    description: 'Another description',
    publishedDate: '2022',
    pageCount: 250,
    language: 'en',
    categories: ['Science'],
    averageRating: 4.0,
    ratingsCount: 50,
    maturityRating: 'NOT_MATURE',
    imageLinks: {
      thumbnail: 'https://example.com/thumbnail2.jpg'
    },
    industryIdentifiers: []
  };

  const mockFavorite: FavoriteBook = {
    id: 'test-book-1',
    title: 'Test Book Title',
    authors: ['Test Author 1', 'Test Author 2'],
    imageUrl: 'https://example.com/thumbnail.jpg',
    addedDate: new Date('2023-01-01')
  };

  beforeEach(() => {
    // Mock localStorage
    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem', 'removeItem']);
    Object.defineProperty(window, 'localStorage', { value: localStorageSpy, writable: true });

    // Mock console.error
    consoleErrorSpy = spyOn(console, 'error');

    TestBed.configureTestingModule({
      providers: [FavoritesService]
    });

    service = TestBed.inject(FavoritesService);
  });

  afterEach(() => {
    // Clean up mocks - localStorage will be restored by TestBed
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load favorites from localStorage on creation', () => {
      const storedFavorites = [mockFavorite];
      localStorageSpy.getItem.and.returnValue(JSON.stringify(storedFavorites));

      // Create new service instance to test initialization
      const newService = new FavoritesService();

      expect(localStorageSpy.getItem).toHaveBeenCalledWith('findbook-favorites');
      expect(newService.getFavorites().length).toBe(1);
      expect(newService.getFavorites()[0].title).toBe('Test Book Title');
    });

    it('should handle missing localStorage data gracefully', () => {
      localStorageSpy.getItem.and.returnValue(null);

      const newService = new FavoritesService();

      expect(newService.getFavorites()).toEqual([]);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageSpy.getItem.and.returnValue('invalid json');

      const newService = new FavoritesService();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load favorites from storage:', jasmine.any(Error));
      expect(newService.getFavorites()).toEqual([]);
    });

    it('should convert stored date strings back to Date objects', () => {
      const storedData = [{
        ...mockFavorite,
        addedDate: '2023-01-01T00:00:00.000Z'
      }];
      localStorageSpy.getItem.and.returnValue(JSON.stringify(storedData));

      const newService = new FavoritesService();
      const favorites = newService.getFavorites();

      expect(favorites[0].addedDate).toBeInstanceOf(Date);
    });
  });

  describe('Basic Favorites Management', () => {
    it('should get empty favorites initially', () => {
      expect(service.getFavorites()).toEqual([]);
      expect(service.getFavoritesCount()).toBe(0);
    });

    it('should add a book to favorites', () => {
      service.addToFavorites(mockBook);

      const favorites = service.getFavorites();
      expect(favorites.length).toBe(1);
      expect(favorites[0].id).toBe('test-book-1');
      expect(favorites[0].title).toBe('Test Book Title');
      expect(favorites[0].authors).toEqual(['Test Author 1', 'Test Author 2']);
      expect(favorites[0].imageUrl).toBe('https://example.com/thumbnail.jpg'); // HTTP converted to HTTPS
      expect(favorites[0].addedDate).toBeInstanceOf(Date);
    });

    it('should not add duplicate favorites', () => {
      service.addToFavorites(mockBook);
      service.addToFavorites(mockBook); // Add same book again

      expect(service.getFavorites().length).toBe(1);
    });

    it('should handle books without authors', () => {
      const bookWithoutAuthors = { ...mockBook, authors: undefined };
      service.addToFavorites(bookWithoutAuthors);

      const favorites = service.getFavorites();
      expect(favorites[0].authors).toEqual([]);
    });

    it('should handle books without image links', () => {
      const bookWithoutImage = { ...mockBook, imageLinks: undefined };
      service.addToFavorites(bookWithoutImage);

      const favorites = service.getFavorites();
      expect(favorites[0].imageUrl).toBeUndefined();
    });

    it('should add new favorites at the beginning of the list', () => {
      service.addToFavorites(mockBook);
      service.addToFavorites(mockBook2);

      const favorites = service.getFavorites();
      expect(favorites[0].id).toBe('test-book-2'); // Most recently added
      expect(favorites[1].id).toBe('test-book-1');
    });
  });

  describe('Favorites Removal', () => {
    beforeEach(() => {
      service.addToFavorites(mockBook);
      service.addToFavorites(mockBook2);
    });

    it('should remove a book from favorites', () => {
      service.removeFromFavorites('test-book-1');

      const favorites = service.getFavorites();
      expect(favorites.length).toBe(1);
      expect(favorites[0].id).toBe('test-book-2');
    });

    it('should handle removing non-existent favorite', () => {
      service.removeFromFavorites('non-existent-id');

      const favorites = service.getFavorites();
      expect(favorites.length).toBe(2); // No change
    });

    it('should clear all favorites', () => {
      service.clearAllFavorites();

      expect(service.getFavorites()).toEqual([]);
      expect(service.getFavoritesCount()).toBe(0);
    });
  });

  describe('Favorite Status Checking', () => {
    beforeEach(() => {
      service.addToFavorites(mockBook);
    });

    it('should check if book is favorite', () => {
      expect(service.isFavorite('test-book-1')).toBeTrue();
      expect(service.isFavorite('test-book-2')).toBeFalse();
    });

    it('should get favorite IDs as Set', () => {
      service.addToFavorites(mockBook2);

      const favoriteIds = service.getFavoriteIds();
      expect(favoriteIds).toBeInstanceOf(Set);
      expect(favoriteIds.has('test-book-1')).toBeTrue();
      expect(favoriteIds.has('test-book-2')).toBeTrue();
      expect(favoriteIds.has('non-existent')).toBeFalse();
    });
  });

  describe('Toggle Functionality', () => {
    it('should toggle favorite status - add when not favorite', () => {
      const newStatus = service.toggleFavorite(mockBook);

      expect(newStatus).toBeTrue();
      expect(service.isFavorite('test-book-1')).toBeTrue();
      expect(service.getFavoritesCount()).toBe(1);
    });

    it('should toggle favorite status - remove when already favorite', () => {
      service.addToFavorites(mockBook);

      const newStatus = service.toggleFavorite(mockBook);

      expect(newStatus).toBeFalse();
      expect(service.isFavorite('test-book-1')).toBeFalse();
      expect(service.getFavoritesCount()).toBe(0);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      service.addToFavorites(mockBook);
      service.addToFavorites(mockBook2);
    });

    it('should return all favorites for empty query', () => {
      const results = service.searchFavorites('');
      expect(results.length).toBe(2);
    });

    it('should return all favorites for whitespace query', () => {
      const results = service.searchFavorites('   ');
      expect(results.length).toBe(2);
    });

    it('should search by title', () => {
      const results = service.searchFavorites('Test Book Title');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('test-book-1');
    });

    it('should search by title case-insensitive', () => {
      const results = service.searchFavorites('test book');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('test-book-1');
    });

    it('should search by author', () => {
      const results = service.searchFavorites('Test Author 1');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('test-book-1');
    });

    it('should search by author case-insensitive', () => {
      const results = service.searchFavorites('another author');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('test-book-2');
    });

    it('should search by partial matches', () => {
      const results = service.searchFavorites('Another');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('test-book-2');
    });

    it('should return empty results for non-matching query', () => {
      const results = service.searchFavorites('non-matching-search');
      expect(results).toEqual([]);
    });
  });

  describe('Recent Favorites', () => {
    it('should get recent favorites with default limit', () => {
      // Add favorites with different dates
      service.addToFavorites(mockBook);
      service.addToFavorites(mockBook2);

      const recent = service.getRecentFavorites();
      expect(recent.length).toBe(2);
      expect(recent[0].id).toBe('test-book-2'); // Most recent first
    });

    it('should get recent favorites with custom limit', () => {
      service.addToFavorites(mockBook);
      service.addToFavorites(mockBook2);

      const recent = service.getRecentFavorites(1);
      expect(recent.length).toBe(1);
      expect(recent[0].id).toBe('test-book-2'); // Most recent
    });

    it('should handle limit larger than favorites count', () => {
      service.addToFavorites(mockBook);

      const recent = service.getRecentFavorites(10);
      expect(recent.length).toBe(1);
    });

    it('should return empty array when no favorites', () => {
      const recent = service.getRecentFavorites();
      expect(recent).toEqual([]);
    });
  });

  describe('Import/Export Functionality', () => {
    beforeEach(() => {
      service.addToFavorites(mockBook);
      service.addToFavorites(mockBook2);
    });

    it('should export favorites as JSON', () => {
      const exportedData = service.exportFavorites();
      const parsed = JSON.parse(exportedData);

      expect(Array.isArray(parsed)).toBeTrue();
      expect(parsed.length).toBe(2);
      expect(parsed[0].title).toBe('Another Test Book'); // Most recent first
    });

    it('should import valid favorites JSON', () => {
      const favoritesToImport = [mockFavorite];
      const jsonData = JSON.stringify(favoritesToImport);

      service.clearAllFavorites();
      const success = service.importFavorites(jsonData);

      expect(success).toBeTrue();
      expect(service.getFavoritesCount()).toBe(1);
      expect(service.getFavorites()[0].title).toBe('Test Book Title');
    });

    it('should handle invalid JSON during import', () => {
      const success = service.importFavorites('invalid json');

      expect(success).toBeFalse();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to import favorites:', jasmine.any(Error));
    });

    it('should handle non-array data during import', () => {
      const invalidData = JSON.stringify({ notAnArray: true });

      const success = service.importFavorites(invalidData);

      expect(success).toBeFalse();
    });

    it('should validate favorite structure during import', () => {
      const invalidFavorites = [
        { id: 'valid', title: 'Valid', authors: [] },
        { id: 123, title: 'Invalid ID' }, // Missing authors, invalid ID type
        { title: 'Missing ID', authors: [] }
      ];

      const success = service.importFavorites(JSON.stringify(invalidFavorites));

      expect(success).toBeFalse();
    });

    it('should convert imported date strings to Date objects', () => {
      const favoritesToImport = [{
        ...mockFavorite,
        addedDate: '2023-01-01T00:00:00.000Z'
      }];

      service.clearAllFavorites();
      service.importFavorites(JSON.stringify(favoritesToImport));

      const favorites = service.getFavorites();
      expect(favorites[0].addedDate).toBeInstanceOf(Date);
    });
  });

  describe('LocalStorage Integration', () => {
    it('should save favorites to localStorage when updated', () => {
      service.addToFavorites(mockBook);

      expect(localStorageSpy.setItem).toHaveBeenCalledWith(
        'findbook-favorites',
        jasmine.any(String)
      );

      const savedData = JSON.parse(localStorageSpy.setItem.calls.mostRecent().args[1]);
      expect(savedData.length).toBe(1);
      expect(savedData[0].id).toBe('test-book-1');
    });

    it('should handle localStorage save errors', () => {
      localStorageSpy.setItem.and.throwError('Storage quota exceeded');

      service.addToFavorites(mockBook);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save favorites to storage:', jasmine.any(Error));
    });

    it('should save to localStorage when removing favorites', () => {
      service.addToFavorites(mockBook);
      localStorageSpy.setItem.calls.reset();

      service.removeFromFavorites('test-book-1');

      expect(localStorageSpy.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageSpy.setItem.calls.mostRecent().args[1]);
      expect(savedData.length).toBe(0);
    });

    it('should save to localStorage when clearing all favorites', () => {
      service.addToFavorites(mockBook);
      localStorageSpy.setItem.calls.reset();

      service.clearAllFavorites();

      expect(localStorageSpy.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageSpy.setItem.calls.mostRecent().args[1]);
      expect(savedData.length).toBe(0);
    });
  });

  describe('Reactive State', () => {
    it('should emit favorites updates through Observable', (done) => {
      let emissionCount = 0;
      const expectedValues = [[], [jasmine.objectContaining({ id: 'test-book-1' })]];

      service.favorites$.subscribe(favorites => {
        expect(favorites).toEqual(expectedValues[emissionCount]);
        emissionCount++;

        if (emissionCount === 2) {
          done();
        }
      });

      // Trigger update
      service.addToFavorites(mockBook);
    });

    it('should emit updates when removing favorites', (done) => {
      service.addToFavorites(mockBook);

      let emissionCount = 0;
      service.favorites$.subscribe(favorites => {
        if (emissionCount === 1) { // Skip initial emission
          expect(favorites.length).toBe(0);
          done();
        }
        emissionCount++;
      });

      service.removeFromFavorites('test-book-1');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined book gracefully', () => {
      expect(() => service.addToFavorites(null as any)).not.toThrow();
    });

    it('should handle empty string book ID', () => {
      const bookWithEmptyId = { ...mockBook, id: '' };
      service.addToFavorites(bookWithEmptyId);

      expect(service.isFavorite('')).toBeTrue();
    });

    it('should handle books with null/undefined properties', () => {
      const problematicBook = {
        id: 'problematic',
        title: null,
        authors: null,
        imageLinks: null
      } as any;

      expect(() => service.addToFavorites(problematicBook)).not.toThrow();
    });

    it('should handle search with special characters', () => {
      const bookWithSpecialChars = {
        ...mockBook,
        title: 'C++ Programming & JavaScript!',
        authors: ['John "The Coder" Doe']
      };
      service.addToFavorites(bookWithSpecialChars);

      const results = service.searchFavorites('C++');
      expect(results.length).toBe(1);
    });

    it('should handle very large favorites lists', () => {
      // Add many favorites
      for (let i = 0; i < 1000; i++) {
        const book = { ...mockBook, id: `book-${i}`, title: `Book ${i}` };
        service.addToFavorites(book);
      }

      expect(service.getFavoritesCount()).toBe(1000);
      expect(service.getRecentFavorites(10).length).toBe(10);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow: add, search, remove', () => {
      // Add multiple books
      service.addToFavorites(mockBook);
      service.addToFavorites(mockBook2);

      // Verify initial state
      expect(service.getFavoritesCount()).toBe(2);

      // Search
      const searchResults = service.searchFavorites('Test Book');
      expect(searchResults.length).toBe(1);

      // Toggle off and on
      service.toggleFavorite(mockBook);
      expect(service.isFavorite('test-book-1')).toBeFalse();

      service.toggleFavorite(mockBook);
      expect(service.isFavorite('test-book-1')).toBeTrue();

      // Export and clear
      const exported = service.exportFavorites();
      service.clearAllFavorites();
      expect(service.getFavoritesCount()).toBe(0);

      // Import back
      const success = service.importFavorites(exported);
      expect(success).toBeTrue();
      expect(service.getFavoritesCount()).toBe(2);
    });
  });
});
