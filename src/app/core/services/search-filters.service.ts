import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SearchFilters {
  categories: string[];
  minRating: number;
  maxRating: number;
  languages: string[];
  publishedAfter: string;
  publishedBefore: string;
  minPages: number;
  maxPages: number;
  hasPreview: boolean;
  sortBy: 'relevance' | 'newest' | 'rating' | 'title';
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchFiltersService {
  private readonly DEFAULT_FILTERS: SearchFilters = {
    categories: [],
    minRating: 0,
    maxRating: 5,
    languages: [],
    publishedAfter: '',
    publishedBefore: '',
    minPages: 0,
    maxPages: 10000,
    hasPreview: false,
    sortBy: 'relevance'
  };

  private filtersSubject = new BehaviorSubject<SearchFilters>(this.DEFAULT_FILTERS);
  public filters$ = this.filtersSubject.asObservable();

  private readonly POPULAR_CATEGORIES = [
    'Fiction',
    'Non-fiction',
    'Biography',
    'History',
    'Science',
    'Technology',
    'Programming',
    'Business',
    'Self-help',
    'Romance',
    'Mystery',
    'Fantasy',
    'Children',
    'Education'
  ];

  private readonly SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ko', name: 'Korean' }
  ];

  constructor() {}

  /**
   * Get current filters
   */
  getCurrentFilters(): SearchFilters {
    return this.filtersSubject.value;
  }

  /**
   * Update filters
   */
  updateFilters(filters: Partial<SearchFilters>): void {
    const currentFilters = this.getCurrentFilters();
    const updatedFilters = { ...currentFilters, ...filters };
    this.filtersSubject.next(updatedFilters);
  }

  /**
   * Reset filters to default
   */
  resetFilters(): void {
    this.filtersSubject.next({ ...this.DEFAULT_FILTERS });
  }

  /**
   * Check if any filters are active (different from default)
   */
  hasActiveFilters(): boolean {
    const current = this.getCurrentFilters();
    const defaults = this.DEFAULT_FILTERS;

    return (
      current.categories.length > 0 ||
      current.minRating > defaults.minRating ||
      current.maxRating < defaults.maxRating ||
      current.languages.length > 0 ||
      current.publishedAfter !== defaults.publishedAfter ||
      current.publishedBefore !== defaults.publishedBefore ||
      current.minPages > defaults.minPages ||
      current.maxPages < defaults.maxPages ||
      current.hasPreview !== defaults.hasPreview ||
      current.sortBy !== defaults.sortBy
    );
  }

  /**
   * Get count of active filters
   */
  getActiveFiltersCount(): number {
    const current = this.getCurrentFilters();
    let count = 0;

    if (current.categories.length > 0) count++;
    if (current.minRating > 0) count++;
    if (current.maxRating < 5) count++;
    if (current.languages.length > 0) count++;
    if (current.publishedAfter) count++;
    if (current.publishedBefore) count++;
    if (current.minPages > 0) count++;
    if (current.maxPages < 10000) count++;
    if (current.hasPreview) count++;
    if (current.sortBy !== 'relevance') count++;

    return count;
  }

  /**
   * Toggle category filter
   */
  toggleCategory(category: string): void {
    const current = this.getCurrentFilters();
    const categories = [...current.categories];
    
    const index = categories.indexOf(category);
    if (index > -1) {
      categories.splice(index, 1);
    } else {
      categories.push(category);
    }
    
    this.updateFilters({ categories });
  }

  /**
   * Toggle language filter
   */
  toggleLanguage(languageCode: string): void {
    const current = this.getCurrentFilters();
    const languages = [...current.languages];
    
    const index = languages.indexOf(languageCode);
    if (index > -1) {
      languages.splice(index, 1);
    } else {
      languages.push(languageCode);
    }
    
    this.updateFilters({ languages });
  }

  /**
   * Set rating range
   */
  setRatingRange(min: number, max: number): void {
    this.updateFilters({
      minRating: Math.max(0, Math.min(min, 5)),
      maxRating: Math.max(0, Math.min(max, 5))
    });
  }

  /**
   * Set page count range
   */
  setPageRange(min: number, max: number): void {
    this.updateFilters({
      minPages: Math.max(0, min),
      maxPages: Math.max(min, max)
    });
  }

  /**
   * Set date range
   */
  setDateRange(after: string, before: string): void {
    this.updateFilters({
      publishedAfter: after,
      publishedBefore: before
    });
  }

  /**
   * Set sort order
   */
  setSortBy(sortBy: SearchFilters['sortBy']): void {
    this.updateFilters({ sortBy });
  }

  /**
   * Toggle preview availability filter
   */
  togglePreviewFilter(): void {
    const current = this.getCurrentFilters();
    this.updateFilters({ hasPreview: !current.hasPreview });
  }

  /**
   * Get popular category options
   */
  getCategoryOptions(): FilterOption[] {
    return this.POPULAR_CATEGORIES.map(category => ({
      value: category,
      label: category
    }));
  }

  /**
   * Get language options
   */
  getLanguageOptions(): FilterOption[] {
    return this.SUPPORTED_LANGUAGES.map(lang => ({
      value: lang.code,
      label: lang.name
    }));
  }

  /**
   * Get sort options
   */
  getSortOptions(): FilterOption[] {
    return [
      { value: 'relevance', label: 'Relevance' },
      { value: 'newest', label: 'Newest First' },
      { value: 'rating', label: 'Highest Rated' },
      { value: 'title', label: 'Title A-Z' }
    ];
  }

  /**
   * Build Google Books API query parameters from filters
   */
  buildApiQuery(baseQuery: string): string {
    const filters = this.getCurrentFilters();
    let query = baseQuery;

    // Add category filters
    if (filters.categories.length > 0) {
      const categoryQuery = filters.categories.map(cat => `subject:${cat}`).join(' OR ');
      query += ` (${categoryQuery})`;
    }

    // Add language filter
    if (filters.languages.length > 0) {
      const langQuery = filters.languages.map(lang => `inlanguage:${lang}`).join(' OR ');
      query += ` (${langQuery})`;
    }

    return query;
  }

  /**
   * Build API order parameter
   */
  buildApiOrderBy(): string {
    const sortBy = this.getCurrentFilters().sortBy;
    
    switch (sortBy) {
      case 'newest':
        return 'newest';
      case 'relevance':
      default:
        return 'relevance';
    }
  }

  /**
   * Check if book matches current filters (for client-side filtering)
   */
  matchesFilters(book: any): boolean {
    const filters = this.getCurrentFilters();

    // Rating filter
    if (book.averageRating) {
      if (book.averageRating < filters.minRating || book.averageRating > filters.maxRating) {
        return false;
      }
    }

    // Page count filter
    if (book.pageCount) {
      if (book.pageCount < filters.minPages || book.pageCount > filters.maxPages) {
        return false;
      }
    }

    // Published date filter
    if (book.publishedDate) {
      const publishedYear = parseInt(book.publishedDate.substring(0, 4));
      
      if (filters.publishedAfter) {
        const afterYear = parseInt(filters.publishedAfter);
        if (publishedYear < afterYear) {
          return false;
        }
      }
      
      if (filters.publishedBefore) {
        const beforeYear = parseInt(filters.publishedBefore);
        if (publishedYear > beforeYear) {
          return false;
        }
      }
    }

    // Preview availability filter
    if (filters.hasPreview && !book.webReaderLink) {
      return false;
    }

    return true;
  }

  /**
   * Get filter summary for display
   */
  getFilterSummary(): string[] {
    const filters = this.getCurrentFilters();
    const summary: string[] = [];

    if (filters.categories.length > 0) {
      summary.push(`Categories: ${filters.categories.join(', ')}`);
    }

    if (filters.minRating > 0) {
      summary.push(`Min Rating: ${filters.minRating}★`);
    }

    if (filters.languages.length > 0) {
      const langNames = filters.languages.map(code => 
        this.SUPPORTED_LANGUAGES.find(lang => lang.code === code)?.name || code
      );
      summary.push(`Languages: ${langNames.join(', ')}`);
    }

    if (filters.publishedAfter) {
      summary.push(`Published after: ${filters.publishedAfter}`);
    }

    if (filters.publishedBefore) {
      summary.push(`Published before: ${filters.publishedBefore}`);
    }

    if (filters.minPages > 0) {
      summary.push(`Min Pages: ${filters.minPages}`);
    }

    if (filters.hasPreview) {
      summary.push('Has Preview');
    }

    if (filters.sortBy !== 'relevance') {
      const sortLabel = this.getSortOptions().find(opt => opt.value === filters.sortBy)?.label;
      summary.push(`Sort: ${sortLabel}`);
    }

    return summary;
  }
}