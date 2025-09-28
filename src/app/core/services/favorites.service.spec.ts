import { TestBed } from '@angular/core/testing';
import { FavoritesService, FavoriteBook } from './favorites.service';
import { Book } from '../models';

describe('FavoritesService', () => {
  let service: FavoritesService;

  // Mock books for testing
  const mockBook1: Book = {
    id: '1',
    title: 'Angular Testing Guide',
    authors: ['John Doe', 'Jane Smith'],
    description: 'A comprehensive guide to testing',
    publishedDate: '2023-01-01',
    publisher: 'Tech Publishing',
    pageCount: 350,
    categories: ['Programming'],
    averageRating: 4.5,
    ratingsCount: 125,
    language: 'en',
    webReaderLink: 'https://example.com/preview',
    imageLinks: {
      thumbnail: 'http://example.com/thumbnail1.jpg',
      smallThumbnail: 'http://example.com/small1.jpg',
    },
  };

  const mockBook2: Book = {
    id: '2',
    title: 'React Development',
    authors: ['Alice Johnson'],
    description: 'Learn React development',
    publishedDate: '2023-02-01',
    publisher: 'Web Publishing',
    pageCount: 250,
    categories: ['Programming'],
    averageRating: 4.0,
    ratingsCount: 89,
    language: 'en',
    webReaderLink: 'https://example.com/preview2',
    imageLinks: {
      thumbnail: 'https://example.com/thumbnail2.jpg',
      smallThumbnail: 'https://example.com/small2.jpg',
    },
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoritesService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should start with empty favorites', () => {
      expect(service.getFavorites()).toEqual([]);
      expect(service.getFavoritesCount()).toBe(0);
    });

    it('should have empty favorite IDs set', () => {
      expect(service.getFavoriteIds().size).toBe(0);
    });

    it('should not have any books as favorites initially', () => {
      expect(service.isFavorite('any-id')).toBe(false);
    });
  });

  describe('Adding Favorites', () => {
    it('should add a book to favorites', () => {
      service.addToFavorites(mockBook1);

      const favorites = service.getFavorites();
      expect(favorites).toHaveSize(1);
      expect(favorites[0].id).toBe('1');
      expect(favorites[0].title).toBe('Angular Testing Guide');
      expect(favorites[0].authors).toEqual(['John Doe', 'Jane Smith']);
    });

    it('should convert http image URL to https', () => {
      service.addToFavorites(mockBook1);

      const favorites = service.getFavorites();
      expect(favorites[0].imageUrl).toBe('https://example.com/thumbnail1.jpg');
    });

    it('should keep https image URLs unchanged', () => {
      service.addToFavorites(mockBook2);

      const favorites = service.getFavorites();
      expect(favorites[0].imageUrl).toBe('https://example.com/thumbnail2.jpg');
    });

    it('should handle books without image links', () => {
      const bookWithoutImage = { ...mockBook1, imageLinks: undefined };
      service.addToFavorites(bookWithoutImage);

      const favorites = service.getFavorites();
      expect(favorites[0].imageUrl).toBeUndefined();
    });

    it('should handle books without authors', () => {
      const bookWithoutAuthors = { ...mockBook1, authors: undefined };
      service.addToFavorites(bookWithoutAuthors);

      const favorites = service.getFavorites();
      expect(favorites[0].authors).toEqual([]);
    });

    it('should add multiple books to favorites', () => {
      service.addToFavorites(mockBook1);
      service.addToFavorites(mockBook2);

      expect(service.getFavoritesCount()).toBe(2);
      expect(service.isFavorite('1')).toBe(true);
      expect(service.isFavorite('2')).toBe(true);
    });

    it('should not add duplicate favorites', () => {
      service.addToFavorites(mockBook1);
      service.addToFavorites(mockBook1); // Add same book again

      expect(service.getFavoritesCount()).toBe(1);
    });

    it('should add new favorites at the beginning of the list', () => {
      service.addToFavorites(mockBook1);
      service.addToFavorites(mockBook2);

      const favorites = service.getFavorites();
      expect(favorites[0].id).toBe('2'); // Most recent first
      expect(favorites[1].id).toBe('1');
    });

    it('should set addedDate when adding favorites', () => {
      const beforeAdd = new Date();
      service.addToFavorites(mockBook1);
      const afterAdd = new Date();

      const favorites = service.getFavorites();
      const addedDate = favorites[0].addedDate;

      expect(addedDate).toBeInstanceOf(Date);
      expect(addedDate.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
      expect(addedDate.getTime()).toBeLessThanOrEqual(afterAdd.getTime());
    });
  });

  describe('Removing Favorites', () => {
    beforeEach(() => {
      service.addToFavorites(mockBook1);
      service.addToFavorites(mockBook2);
    });

    it('should remove a book from favorites', () => {
      service.removeFromFavorites('1');

      expect(service.getFavoritesCount()).toBe(1);
      expect(service.isFavorite('1')).toBe(false);
      expect(service.isFavorite('2')).toBe(true);
    });

    it('should handle removing non-existent favorite', () => {
      service.removeFromFavorites('non-existent-id');

      expect(service.getFavoritesCount()).toBe(2);
    });

    it('should clear all favorites', () => {
      service.clearAllFavorites();

      expect(service.getFavoritesCount()).toBe(0);
      expect(service.getFavorites()).toEqual([]);
    });
  });

  describe('Toggle Favorites', () => {
    it('should toggle favorite status from false to true', () => {
      const isNowFavorite = service.toggleFavorite(mockBook1);

      expect(isNowFavorite).toBe(true);
      expect(service.isFavorite('1')).toBe(true);
      expect(service.getFavoritesCount()).toBe(1);
    });

    it('should toggle favorite status from true to false', () => {
      service.addToFavorites(mockBook1);

      const isNowFavorite = service.toggleFavorite(mockBook1);

      expect(isNowFavorite).toBe(false);
      expect(service.isFavorite('1')).toBe(false);
      expect(service.getFavoritesCount()).toBe(0);
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      service.addToFavorites(mockBook1); // Angular Testing Guide
      service.addToFavorites(mockBook2); // React Development
    });

    it('should search favorites by title', () => {
      const results = service.searchFavorites('Angular');

      expect(results).toHaveSize(1);
      expect(results[0].id).toBe('1');
    });

    it('should search favorites by author', () => {
      const results = service.searchFavorites('Alice');

      expect(results).toHaveSize(1);
      expect(results[0].id).toBe('2');
    });

    it('should return all favorites for empty search', () => {
      const results = service.searchFavorites('');

      expect(results).toHaveSize(2);
    });

    it('should return empty array for no matches', () => {
      const results = service.searchFavorites('Non-existent');

      expect(results).toHaveSize(0);
    });

    it('should perform case-insensitive search', () => {
      const results = service.searchFavorites('angular');

      expect(results).toHaveSize(1);
      expect(results[0].id).toBe('1');
    });
  });

  describe('Recent Favorites', () => {
    beforeEach(() => {
      // Add favorites with some delay to ensure different timestamps
      service.addToFavorites(mockBook1);
      service.addToFavorites(mockBook2);
    });

    it('should get recent favorites', () => {
      const recent = service.getRecentFavorites();

      expect(recent).toHaveSize(2);
      expect(recent[0].id).toBe('2'); // Most recent first
      expect(recent[1].id).toBe('1');
    });

    it('should limit recent favorites', () => {
      const recent = service.getRecentFavorites(1);

      expect(recent).toHaveSize(1);
      expect(recent[0].id).toBe('2');
    });
  });

  describe('Import/Export', () => {
    beforeEach(() => {
      service.addToFavorites(mockBook1);
      service.addToFavorites(mockBook2);
    });

    it('should export favorites as JSON', () => {
      const exported = service.exportFavorites();

      expect(() => JSON.parse(exported)).not.toThrow();
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveSize(2);
    });

    it('should import valid favorites JSON', () => {
      const exported = service.exportFavorites();
      service.clearAllFavorites();

      const success = service.importFavorites(exported);

      expect(success).toBe(true);
      expect(service.getFavoritesCount()).toBe(2);
    });

    it('should handle invalid JSON during import', () => {
      const success = service.importFavorites('invalid json');

      expect(success).toBe(false);
    });

    it('should handle non-array JSON during import', () => {
      const success = service.importFavorites('{"not": "array"}');

      expect(success).toBe(false);
    });

    it('should handle invalid favorite structure during import', () => {
      const invalidFavorites = JSON.stringify([{ invalid: 'structure' }]);
      const success = service.importFavorites(invalidFavorites);

      expect(success).toBe(false);
    });
  });

  describe('Local Storage Integration', () => {
    it('should persist favorites to localStorage', () => {
      service.addToFavorites(mockBook1);

      const stored = localStorage.getItem('findbook-favorites');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveSize(1);
      expect(parsed[0].id).toBe('1');
    });

    it('should load favorites from localStorage on service creation', () => {
      // Manually set localStorage
      const testFavorites = [
        {
          id: '1',
          title: 'Test Book',
          authors: ['Test Author'],
          addedDate: new Date().toISOString(),
        },
      ];
      localStorage.setItem('findbook-favorites', JSON.stringify(testFavorites));

      // Create new service instance
      const newService = new FavoritesService();

      expect(newService.getFavoritesCount()).toBe(1);
      expect(newService.isFavorite('1')).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('findbook-favorites', 'corrupted data');

      // Should not throw error and start with empty favorites
      const newService = new FavoritesService();
      expect(newService.getFavoritesCount()).toBe(0);
    });
  });

  describe('Observable Updates', () => {
    it('should emit favorites updates via observable', (done) => {
      let updateCount = 0;

      service.favorites$.subscribe((favorites) => {
        updateCount++;
        if (updateCount === 2) {
          expect(favorites).toHaveSize(1);
          expect(favorites[0].id).toBe('1');
          done();
        }
      });

      // First emission is initial empty array
      // Second emission should be after adding a favorite
      service.addToFavorites(mockBook1);
    });
  });
});
