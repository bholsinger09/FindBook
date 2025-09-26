import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';

import { SearchFiltersService, SearchFilters, FilterOption } from '../../../../core/services/search-filters.service';

@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSliderModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatBadgeModule
  ],
  templateUrl: './search-filters.html',
  styleUrl: './search-filters.scss'
})
export class SearchFiltersComponent implements OnInit {
  @Input() showFilters: boolean = false;
  @Output() filtersToggled = new EventEmitter<void>();
  @Output() filtersChanged = new EventEmitter<SearchFilters>();
  @Output() filtersReset = new EventEmitter<void>();

  filters: SearchFilters;
  categoryOptions: FilterOption[] = [];
  languageOptions: FilterOption[] = [];
  sortOptions: FilterOption[] = [];
  
  // Slider values for two-way binding
  ratingRange: number[] = [0, 5];
  pageRange: number[] = [0, 1000];
  yearRange: string[] = ['', ''];

  constructor(private filtersService: SearchFiltersService) {
    this.filters = this.filtersService.getCurrentFilters();
  }

  ngOnInit(): void {
    console.log('SearchFilters component initialized');
    
    // Get filter options
    this.categoryOptions = this.filtersService.getCategoryOptions();
    this.languageOptions = this.filtersService.getLanguageOptions();
    this.sortOptions = this.filtersService.getSortOptions();
    
    // Subscribe to filter changes
    this.filtersService.filters$.subscribe(filters => {
      this.filters = filters;
      this.updateSliderValues();
      this.filtersChanged.emit(filters);
    });
    
    // Initialize slider values
    this.updateSliderValues();
  }

  toggleFilters(): void {
    this.filtersToggled.emit();
  }

  onCategoryToggle(category: string): void {
    this.filtersService.toggleCategory(category);
  }

  onLanguageToggle(language: string): void {
    this.filtersService.toggleLanguage(language);
  }

  onRatingChange(): void {
    this.filtersService.setRatingRange(this.ratingRange[0], this.ratingRange[1]);
  }

  onPageRangeChange(): void {
    this.filtersService.setPageRange(this.pageRange[0], this.pageRange[1]);
  }

  onYearRangeChange(): void {
    this.filtersService.setDateRange(this.yearRange[0], this.yearRange[1]);
  }

  onSortChange(): void {
    this.filtersService.setSortBy(this.filters.sortBy);
  }

  onPreviewToggle(): void {
    this.filtersService.togglePreviewFilter();
  }

  resetFilters(): void {
    this.filtersService.resetFilters();
    this.filtersReset.emit();
  }

  isCategorySelected(category: string): boolean {
    return this.filters.categories.includes(category);
  }

  isLanguageSelected(language: string): boolean {
    return this.filters.languages.includes(language);
  }

  getActiveFiltersCount(): number {
    return this.filtersService.getActiveFiltersCount();
  }

  hasActiveFilters(): boolean {
    return this.filtersService.hasActiveFilters();
  }

  getFilterSummary(): string[] {
    return this.filtersService.getFilterSummary();
  }

  formatRating(value: number): string {
    return `${value}★`;
  }

  formatPages(value: number): string {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  }

  private updateSliderValues(): void {
    this.ratingRange = [this.filters.minRating, this.filters.maxRating];
    this.pageRange = [this.filters.minPages, this.filters.maxPages];
    this.yearRange = [this.filters.publishedAfter, this.filters.publishedBefore];
  }
}