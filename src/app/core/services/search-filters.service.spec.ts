import { TestBed } from '@angular/core/testing';
import { SearchFiltersService, SearchFilters } from './search-filters.service';
import { take } from 'rxjs/operators';

describe('SearchFiltersService', () => {
  let service: SearchFiltersService;

  const DEFAULT_FILTERS: SearchFilters = {
    categories: [],
    minRating: 0,
    maxRating: 5,
    languages: [],
    publishedAfter: '',
    publishedBefore: '',
    minPages: 0,
    maxPages: 10000,
    hasPreview: false,
    sortBy: 'relevance',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchFiltersService],
    });
    service = TestBed.inject(SearchFiltersService);
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with default filters', () => {
      const currentFilters = service.getCurrentFilters();
      expect(currentFilters).toEqual(DEFAULT_FILTERS);
    });

    it('should emit default filters on filters$ observable', (done) => {
      service.filters$.pipe(take(1)).subscribe((filters) => {
        expect(filters).toEqual(DEFAULT_FILTERS);
        done();
      });
    });
  });

  describe('Filter Management', () => {
    it('should update filters partially', () => {
      const updates = {
        minRating: 3,
        categories: ['Fiction'],
        sortBy: 'newest' as const,
      };

      service.updateFilters(updates);
      const currentFilters = service.getCurrentFilters();

      expect(currentFilters.minRating).toBe(3);
      expect(currentFilters.categories).toEqual(['Fiction']);
      expect(currentFilters.sortBy).toBe('newest');
      expect(currentFilters.maxRating).toBe(5);
    });

    it('should reset filters to default', () => {
      service.updateFilters({
        categories: ['Fiction', 'Science'],
        minRating: 3,
        hasPreview: true,
        sortBy: 'rating',
      });

      service.resetFilters();
      const currentFilters = service.getCurrentFilters();

      expect(currentFilters).toEqual(DEFAULT_FILTERS);
    });
  });

  describe('Active Filters Detection', () => {
    it('should return false for hasActiveFilters when all filters are default', () => {
      expect(service.hasActiveFilters()).toBeFalse();
    });

    it('should return true for hasActiveFilters when categories are set', () => {
      service.updateFilters({ categories: ['Fiction'] });
      expect(service.hasActiveFilters()).toBeTrue();
    });

    it('should return true for hasActiveFilters when minRating is changed', () => {
      service.updateFilters({ minRating: 3 });
      expect(service.hasActiveFilters()).toBeTrue();
    });

    it('should return true for hasActiveFilters when sortBy is changed', () => {
      service.updateFilters({ sortBy: 'newest' });
      expect(service.hasActiveFilters()).toBeTrue();
    });
  });

  describe('Active Filters Count', () => {
    it('should return 0 for default filters', () => {
      expect(service.getActiveFiltersCount()).toBe(0);
    });

    it('should count individual filter types', () => {
      service.updateFilters({
        categories: ['Fiction'],
        minRating: 3,
        languages: ['en'],
        hasPreview: true,
        sortBy: 'newest',
      });

      expect(service.getActiveFiltersCount()).toBe(5);
    });
  });

  describe('Category Management', () => {
    it('should toggle category on', () => {
      service.toggleCategory('Fiction');
      const filters = service.getCurrentFilters();
      expect(filters.categories).toContain('Fiction');
    });

    it('should toggle category off', () => {
      service.updateFilters({ categories: ['Fiction', 'Science'] });
      service.toggleCategory('Fiction');
      const filters = service.getCurrentFilters();

      expect(filters.categories).toEqual(['Science']);
      expect(filters.categories).not.toContain('Fiction');
    });
  });

  describe('Language Management', () => {
    it('should toggle language on', () => {
      service.toggleLanguage('en');
      const filters = service.getCurrentFilters();
      expect(filters.languages).toContain('en');
    });

    it('should toggle language off', () => {
      service.updateFilters({ languages: ['en', 'es'] });
      service.toggleLanguage('en');
      const filters = service.getCurrentFilters();

      expect(filters.languages).toEqual(['es']);
      expect(filters.languages).not.toContain('en');
    });
  });

  describe('Rating Range Management', () => {
    it('should set valid rating range', () => {
      service.setRatingRange(2, 4);
      const filters = service.getCurrentFilters();

      expect(filters.minRating).toBe(2);
      expect(filters.maxRating).toBe(4);
    });

    it('should clamp rating values to valid range (0-5)', () => {
      service.setRatingRange(-1, 6);
      const filters = service.getCurrentFilters();

      expect(filters.minRating).toBe(0);
      expect(filters.maxRating).toBe(5);
    });
  });

  describe('Sort Management', () => {
    it('should set sort by newest', () => {
      service.setSortBy('newest');
      const filters = service.getCurrentFilters();
      expect(filters.sortBy).toBe('newest');
    });

    it('should set sort by rating', () => {
      service.setSortBy('rating');
      const filters = service.getCurrentFilters();
      expect(filters.sortBy).toBe('rating');
    });
  });

  describe('Filter Options', () => {
    it('should return category options', () => {
      const categoryOptions = service.getCategoryOptions();
      expect(categoryOptions).toBeInstanceOf(Array);
      expect(categoryOptions.length).toBeGreaterThan(0);
      expect(categoryOptions[0].value).toBeDefined();
      expect(categoryOptions[0].label).toBeDefined();
    });

    it('should return language options', () => {
      const languageOptions = service.getLanguageOptions();
      expect(languageOptions).toBeInstanceOf(Array);
      expect(languageOptions.length).toBeGreaterThan(0);
      expect(languageOptions[0].value).toBeDefined();
      expect(languageOptions[0].label).toBeDefined();
    });

    it('should return sort options', () => {
      const sortOptions = service.getSortOptions();
      expect(sortOptions).toEqual([
        { value: 'relevance', label: 'Relevance' },
        { value: 'newest', label: 'Newest First' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'title', label: 'Title A-Z' },
      ]);
    });
  });

  describe('API Query Building', () => {
    it('should return base query when no filters are active', () => {
      const query = service.buildApiQuery('javascript');
      expect(query).toBe('javascript');
    });

    it('should add category filters to query', () => {
      service.updateFilters({ categories: ['Fiction'] });
      const query = service.buildApiQuery('javascript');
      expect(query).toBe('javascript (subject:Fiction)');
    });

    it('should add language filters to query', () => {
      service.updateFilters({ languages: ['en'] });
      const query = service.buildApiQuery('javascript');
      expect(query).toBe('javascript (inlanguage:en)');
    });
  });

  describe('API Order Building', () => {
    it('should return relevance for default sort', () => {
      const orderBy = service.buildApiOrderBy();
      expect(orderBy).toBe('relevance');
    });

    it('should return newest for newest sort', () => {
      service.setSortBy('newest');
      const orderBy = service.buildApiOrderBy();
      expect(orderBy).toBe('newest');
    });
  });

  describe('Book Filtering', () => {
    const mockBook = {
      id: '1',
      title: 'Test Book',
      averageRating: 4.2,
      pageCount: 300,
      publishedDate: '2022-01-15',
      webReaderLink: 'https://example.com/reader',
    };

    it('should match book with default filters', () => {
      const matches = service.matchesFilters(mockBook);
      expect(matches).toBeTrue();
    });

    it('should filter by minimum rating', () => {
      service.setRatingRange(4.5, 5);
      const matches = service.matchesFilters(mockBook);
      expect(matches).toBeFalse();
    });

    it('should match book within rating range', () => {
      service.setRatingRange(4, 5);
      const matches = service.matchesFilters(mockBook);
      expect(matches).toBeTrue();
    });

    it('should filter by page count', () => {
      service.setPageRange(400, 1000);
      const matches = service.matchesFilters(mockBook);
      expect(matches).toBeFalse();
    });

    it('should filter by published date', () => {
      service.setDateRange('2023', '');
      const matches = service.matchesFilters(mockBook);
      expect(matches).toBeFalse();
    });

    it('should filter by preview availability', () => {
      service.updateFilters({ hasPreview: true });
      const bookWithoutPreview = { ...mockBook, webReaderLink: undefined };
      const matches = service.matchesFilters(bookWithoutPreview);
      expect(matches).toBeFalse();
    });
  });

  describe('Filter Summary', () => {
    it('should return empty array for default filters', () => {
      const summary = service.getFilterSummary();
      expect(summary).toEqual([]);
    });

    it('should include categories in summary', () => {
      service.updateFilters({ categories: ['Fiction', 'Science'] });
      const summary = service.getFilterSummary();
      expect(summary).toContain('Categories: Fiction, Science');
    });

    it('should include minimum rating in summary', () => {
      service.updateFilters({ minRating: 3 });
      const summary = service.getFilterSummary();
      expect(summary).toContain('Min Rating: 3★');
    });

    it('should include languages in summary', () => {
      service.updateFilters({ languages: ['en', 'es'] });
      const summary = service.getFilterSummary();
      expect(summary).toContain('Languages: English, Spanish');
    });
  });
});
