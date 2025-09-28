import { TestBed } from '@angular/core/testing';
import { SearchFiltersService, SearchFilters } from './search-filters.service';

describe('SearchFiltersService', () => {
  let service: SearchFiltersService;

  const mockBook = {
    id: '1',
    title: 'Test Book',
    authors: ['Test Author'],
    categories: ['Programming'],
    averageRating: 4.0,
    pageCount: 300,
    publishedDate: '2020-01-01',
    language: 'en',
    webReaderLink: 'https://example.com/preview',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchFiltersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Default State', () => {
    it('should start with default filters', () => {
      const filters = service.getCurrentFilters();

      expect(filters.categories).toEqual([]);
      expect(filters.minRating).toBe(0);
      expect(filters.maxRating).toBe(5);
      expect(filters.languages).toEqual([]);
      expect(filters.publishedAfter).toBe('');
      expect(filters.publishedBefore).toBe('');
      expect(filters.minPages).toBe(0);
      expect(filters.maxPages).toBe(10000);
      expect(filters.hasPreview).toBe(false);
      expect(filters.sortBy).toBe('relevance');
    });

    it('should not have active filters initially', () => {
      expect(service.hasActiveFilters()).toBe(false);
      expect(service.getActiveFiltersCount()).toBe(0);
    });
  });

  describe('Filter Updates', () => {
    it('should update filters partially', () => {
      service.updateFilters({ minRating: 3, sortBy: 'newest' });

      const filters = service.getCurrentFilters();
      expect(filters.minRating).toBe(3);
      expect(filters.sortBy).toBe('newest');
      expect(filters.categories).toEqual([]); // Should remain unchanged
    });

    it('should reset filters to default', () => {
      service.updateFilters({ categories: ['Fiction'], minRating: 4 });
      service.resetFilters();

      const filters = service.getCurrentFilters();
      expect(filters.categories).toEqual([]);
      expect(filters.minRating).toBe(0);
    });
  });

  describe('Category Filters', () => {
    it('should toggle category on', () => {
      service.toggleCategory('Fiction');

      const filters = service.getCurrentFilters();
      expect(filters.categories).toContain('Fiction');
    });

    it('should toggle category off', () => {
      service.toggleCategory('Fiction');
      service.toggleCategory('Fiction'); // Toggle off

      const filters = service.getCurrentFilters();
      expect(filters.categories).not.toContain('Fiction');
    });

    it('should handle multiple categories', () => {
      service.toggleCategory('Fiction');
      service.toggleCategory('Non-fiction');

      const filters = service.getCurrentFilters();
      expect(filters.categories).toEqual(['Fiction', 'Non-fiction']);
    });

    it('should provide category options', () => {
      const options = service.getCategoryOptions();

      expect(options.length).toBeGreaterThan(0);
      expect(options[0].value).toBeDefined();
      expect(options[0].label).toBeDefined();
      expect(options.some((opt) => opt.value === 'Fiction')).toBe(true);
    });
  });

  describe('Language Filters', () => {
    it('should toggle language on', () => {
      service.toggleLanguage('en');

      const filters = service.getCurrentFilters();
      expect(filters.languages).toContain('en');
    });

    it('should toggle language off', () => {
      service.toggleLanguage('en');
      service.toggleLanguage('en'); // Toggle off

      const filters = service.getCurrentFilters();
      expect(filters.languages).not.toContain('en');
    });

    it('should provide language options', () => {
      const options = service.getLanguageOptions();

      expect(options.length).toBeGreaterThan(0);
      expect(options.some((opt) => opt.value === 'en' && opt.label === 'English')).toBe(true);
    });
  });

  describe('Rating Filters', () => {
    it('should set rating range', () => {
      service.setRatingRange(2, 4);

      const filters = service.getCurrentFilters();
      expect(filters.minRating).toBe(2);
      expect(filters.maxRating).toBe(4);
    });

    it('should clamp rating values to valid range', () => {
      service.setRatingRange(-1, 6);

      const filters = service.getCurrentFilters();
      expect(filters.minRating).toBe(0);
      expect(filters.maxRating).toBe(5);
    });
  });

  describe('Page Range Filters', () => {
    it('should set page range', () => {
      service.setPageRange(100, 500);

      const filters = service.getCurrentFilters();
      expect(filters.minPages).toBe(100);
      expect(filters.maxPages).toBe(500);
    });

    it('should handle negative minimum pages', () => {
      service.setPageRange(-10, 200);

      const filters = service.getCurrentFilters();
      expect(filters.minPages).toBe(0);
    });

    it('should ensure max is at least min', () => {
      service.setPageRange(300, 100);

      const filters = service.getCurrentFilters();
      expect(filters.maxPages).toBe(300);
    });
  });

  describe('Date Range Filters', () => {
    it('should set date range', () => {
      service.setDateRange('2020', '2023');

      const filters = service.getCurrentFilters();
      expect(filters.publishedAfter).toBe('2020');
      expect(filters.publishedBefore).toBe('2023');
    });
  });

  describe('Sort Filters', () => {
    it('should set sort order', () => {
      service.setSortBy('rating');

      const filters = service.getCurrentFilters();
      expect(filters.sortBy).toBe('rating');
    });

    it('should provide sort options', () => {
      const options = service.getSortOptions();

      expect(options.length).toBe(4);
      expect(options.some((opt) => opt.value === 'relevance')).toBe(true);
      expect(options.some((opt) => opt.value === 'newest')).toBe(true);
      expect(options.some((opt) => opt.value === 'rating')).toBe(true);
      expect(options.some((opt) => opt.value === 'title')).toBe(true);
    });
  });

  describe('Preview Filter', () => {
    it('should toggle preview filter', () => {
      service.togglePreviewFilter();

      const filters = service.getCurrentFilters();
      expect(filters.hasPreview).toBe(true);
    });

    it('should toggle preview filter back off', () => {
      service.togglePreviewFilter();
      service.togglePreviewFilter();

      const filters = service.getCurrentFilters();
      expect(filters.hasPreview).toBe(false);
    });
  });

  describe('Active Filters Detection', () => {
    it('should detect active category filters', () => {
      service.toggleCategory('Fiction');

      expect(service.hasActiveFilters()).toBe(true);
      expect(service.getActiveFiltersCount()).toBe(1);
    });

    it('should detect active rating filters', () => {
      service.setRatingRange(3, 5);

      expect(service.hasActiveFilters()).toBe(true);
      expect(service.getActiveFiltersCount()).toBe(1);
    });

    it('should detect active sort filter', () => {
      service.setSortBy('newest');

      expect(service.hasActiveFilters()).toBe(true);
      expect(service.getActiveFiltersCount()).toBe(1);
    });

    it('should count multiple active filters', () => {
      service.toggleCategory('Fiction');
      service.setRatingRange(3, 5);
      service.setSortBy('newest');

      expect(service.getActiveFiltersCount()).toBe(3);
    });
  });

  describe('API Query Building', () => {
    it('should build basic API query', () => {
      const query = service.buildApiQuery('angular');

      expect(query).toBe('angular');
    });

    it('should build query with category filters', () => {
      service.toggleCategory('Programming');
      service.toggleCategory('Technology');

      const query = service.buildApiQuery('angular');

      expect(query).toContain('subject:Programming OR subject:Technology');
    });

    it('should build query with language filters', () => {
      service.toggleLanguage('en');

      const query = service.buildApiQuery('angular');

      expect(query).toContain('inlanguage:en');
    });

    it('should build order parameter', () => {
      expect(service.buildApiOrderBy()).toBe('relevance');

      service.setSortBy('newest');
      expect(service.buildApiOrderBy()).toBe('newest');
    });
  });

  describe('Client-side Filtering', () => {
    it('should match book with no filters', () => {
      expect(service.matchesFilters(mockBook)).toBe(true);
    });

    it('should filter by rating', () => {
      service.setRatingRange(4.5, 5);

      expect(service.matchesFilters(mockBook)).toBe(false);
      expect(service.matchesFilters({ ...mockBook, averageRating: 4.8 })).toBe(true);
    });

    it('should filter by page count', () => {
      service.setPageRange(400, 600);

      expect(service.matchesFilters(mockBook)).toBe(false);
      expect(service.matchesFilters({ ...mockBook, pageCount: 450 })).toBe(true);
    });

    it('should filter by published date', () => {
      service.setDateRange('2021', '2023');

      expect(service.matchesFilters(mockBook)).toBe(false);
      expect(service.matchesFilters({ ...mockBook, publishedDate: '2022-01-01' })).toBe(true);
    });

    it('should filter by preview availability', () => {
      service.togglePreviewFilter();

      expect(service.matchesFilters(mockBook)).toBe(true);
      expect(service.matchesFilters({ ...mockBook, webReaderLink: undefined })).toBe(false);
    });
  });

  describe('Filter Summary', () => {
    it('should provide empty summary with no filters', () => {
      const summary = service.getFilterSummary();

      expect(summary).toEqual([]);
    });

    it('should provide summary with active filters', () => {
      service.toggleCategory('Fiction');
      service.setRatingRange(3, 5);
      service.toggleLanguage('en');

      const summary = service.getFilterSummary();

      expect(summary.length).toBe(3);
      expect(summary.some((item) => item.includes('Fiction'))).toBe(true);
      expect(summary.some((item) => item.includes('3★'))).toBe(true);
      expect(summary.some((item) => item.includes('English'))).toBe(true);
    });
  });

  describe('Observable Updates', () => {
    it('should emit filter updates', (done) => {
      let updateCount = 0;

      service.filters$.subscribe((filters) => {
        updateCount++;
        if (updateCount === 2) {
          expect(filters.categories).toContain('Fiction');
          done();
        }
      });

      service.toggleCategory('Fiction');
    });
  });
});
