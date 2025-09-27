import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SearchFormComponent } from '../../components/search-form/search-form';
import { BookListComponent } from '../../components/book-list/book-list';
import { BookDetailsComponent } from '../../components/book-details/book-details';
import { BookService } from '../../../../core/services/book.service';
import { FavoritesService } from '../../../../core/services/favorites.service';
import { Book, BookSearchParams, BookSearchResult } from '../../../../core/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-search-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    SearchFormComponent,
    BookListComponent,
    BookDetailsComponent
  ],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss'
})
export class SearchPage implements OnInit {
  searchResult: BookSearchResult | null = null;
  isLoading = false;
  hasSearchError = false;
  hasDetailsError = false;
  currentSearchTerm = '';
  favoriteBookIds: Set<string> = new Set();
  selectedBook: Book | null = null;
  showBookDetails = false;

  // Favorites functionality
  isShowingFavorites = false;
  favorites: Book[] = [];
  favoritesSearchTerm = '';
  filteredFavorites: Book[] = [];
  favoritesCount = 0;

  // Filters functionality
  showFilters = false;
  activeFilters: any = {};

  constructor(
    private bookService: BookService,
    private dialog: MatDialog,
    private favoritesService: FavoritesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('SearchPage component initialized');
    // Initialize favorites from service
    this.loadFavorites();

    // Subscribe to favorites changes
    this.favoritesService.favorites$.subscribe(() => {
      this.loadFavorites();
    });

    // Don't auto-load popular books to prevent API errors on page load
    // User can manually search or browse when ready
    this.initializeEmptyState();
  }

  // Favorites functionality
  get favoritesAsSearchResult(): BookSearchResult {
    return {
      books: this.filteredFavorites,
      totalItems: this.filteredFavorites.length,
      query: this.favoritesSearchTerm,
      hasMoreResults: false,
      currentPage: 1,
      itemsPerPage: this.filteredFavorites.length,
      searchTimestamp: new Date()
    };
  }

  toggleFavoritesView(): void {
    this.isShowingFavorites = !this.isShowingFavorites;
    if (this.isShowingFavorites) {
      this.favoritesSearchTerm = '';
      this.updateFilteredFavorites();
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onFiltersChanged(filters: any): void {
    this.activeFilters = filters;
    // Re-run search with filters if there's a current search
    if (this.currentSearchTerm) {
      const searchParams: BookSearchParams = {
        query: this.currentSearchTerm,
        ...filters
      };
      this.onSearchSubmitted(searchParams);
    }
  }

  private loadFavorites(): void {
    this.favorites = this.favoritesService.getFavorites();
    this.favoritesCount = this.favorites.length;
    this.favoriteBookIds = this.favoritesService.getFavoriteIds();
    this.updateFilteredFavorites();
  }

  updateFilteredFavorites(): void {
    if (!this.favoritesSearchTerm.trim()) {
      this.filteredFavorites = this.favorites;
    } else {
      const searchTerm = this.favoritesSearchTerm.toLowerCase();
      this.filteredFavorites = this.favorites.filter(book =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.authors?.some(author => author.toLowerCase().includes(searchTerm)) ||
        book.description?.toLowerCase().includes(searchTerm)
      );
    }
  }

  // Watch for changes in favorites search
  set favoritesSearchValue(value: string) {
    this.favoritesSearchTerm = value;
    this.updateFilteredFavorites();
  }

  onSearchSubmitted(searchParams: BookSearchParams): void {
    this.isLoading = true;
    this.hasSearchError = false;
    this.currentSearchTerm = searchParams.query;
    this.isShowingFavorites = false; // Exit favorites view when searching

    // Combine with active filters
    const finalParams = { ...searchParams, ...this.activeFilters };

    this.bookService.searchBooks(finalParams).subscribe({
      next: (result) => {
        this.searchResult = result;
        this.isLoading = false;
        this.hasSearchError = false;
      },
      error: (error) => {
        console.error('Search failed:', error);
        this.isLoading = false;
        this.hasSearchError = true;
        this.searchResult = null;
      }
    });
  }

  onSearchCleared(): void {
    this.currentSearchTerm = '';
    this.searchResult = null;
    this.hasSearchError = false;
    this.loadPopularBooks();
  }

  onBookSelected(book: Book): void {
    console.log('Book selected:', book);
    // Navigate to dedicated book details page
    this.router.navigate(['/book', book.id]);
  }

  onFavoriteToggled(book: Book): void {
    this.favoritesService.toggleFavorite(book);
    console.log('Favorites updated. Total count:', this.favoritesService.getFavoritesCount());

    // Update filtered favorites if we're in favorites view
    if (this.isShowingFavorites) {
      this.updateFilteredFavorites();
    }
  }

  onBookDetailsClose(): void {
    this.showBookDetails = false;
    this.selectedBook = null;
    this.hasDetailsError = false;
  }

  onBookDetailsFavoriteToggled(book: Book): void {
    this.onFavoriteToggled(book);
  }

  onBookPreviewRequested(book: Book): void {
    console.log('Preview requested for book:', book.title);
    // The book details component handles opening the link
  }

  onBookPurchaseRequested(book: Book): void {
    console.log('Purchase requested for book:', book.title);
    // The book details component handles opening the link
  }

  private loadPopularBooks(): void {
    this.isLoading = true;
    this.hasSearchError = false;

    this.bookService.getPopularBooks().subscribe({
      next: (result) => {
        this.searchResult = result;
        this.isLoading = false;
        this.hasSearchError = false;
      },
      error: (error) => {
        // Only log non-503 errors to avoid console spam
        if (!error.message.includes('503') && !error.message.includes('temporarily unavailable')) {
          console.error('Failed to load popular books:', error);
        }
        this.isLoading = false;
        this.hasSearchError = true;
        // Set a friendly error state
        this.searchResult = {
          books: [],
          totalItems: 0,
          query: 'popular books',
          currentPage: 1,
          itemsPerPage: 20,
          hasMoreResults: false,
          searchTimestamp: new Date()
        };
      }
    });
  }

  private initializeEmptyState(): void {
    this.isLoading = false;
    this.hasSearchError = false;
    this.searchResult = {
      books: [],
      totalItems: 0,
      query: '',
      currentPage: 1,
      itemsPerPage: 20,
      hasMoreResults: false,
      searchTimestamp: new Date()
    };
  }

  trackByBookId(index: number, book: Book): string {
    return book.id;
  }
}
