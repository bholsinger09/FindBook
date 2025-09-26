import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
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
  currentSearchTerm = '';
  favoriteBookIds: Set<string> = new Set();
  selectedBook: Book | null = null;
  showBookDetails = false;

  constructor(
    private bookService: BookService,
    private dialog: MatDialog,
    private favoritesService: FavoritesService
  ) { }

  ngOnInit(): void {
    console.log('SearchPage component initialized');
    // Initialize favorites from service
    this.favoriteBookIds = this.favoritesService.getFavoriteIds();
    
    // Subscribe to favorites changes
    this.favoritesService.favorites$.subscribe(() => {
      this.favoriteBookIds = this.favoritesService.getFavoriteIds();
    });

    // Load some popular books initially
    this.loadPopularBooks();
  }

  onSearchSubmitted(searchParams: BookSearchParams): void {
    this.isLoading = true;
    this.currentSearchTerm = searchParams.query;

    this.bookService.searchBooks(searchParams).subscribe({
      next: (result) => {
        this.searchResult = result;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Search failed:', error);
        this.isLoading = false;
      }
    });
  }

  onSearchCleared(): void {
    this.currentSearchTerm = '';
    this.searchResult = null;
    this.loadPopularBooks();
  }

  onBookSelected(book: Book): void {
    console.log('Book selected:', book);
    this.selectedBook = book;
    this.showBookDetails = true;
  }

  onFavoriteToggled(book: Book): void {
    this.favoritesService.toggleFavorite(book);
    console.log('Favorites updated. Total count:', this.favoritesService.getFavoritesCount());
  }

  onBookDetailsClose(): void {
    this.showBookDetails = false;
    this.selectedBook = null;
  }

  onBookDetailsFavoriteToggled(book: Book): void {
    this.onFavoriteToggled(book);
  }

  onBookPreviewRequested(book: Book): void {
    if (book.webReaderLink) {
      window.open(book.webReaderLink, '_blank', 'noopener,noreferrer');
    }
  }

  private loadPopularBooks(): void {
    this.isLoading = true;

    this.bookService.getPopularBooks().subscribe({
      next: (result) => {
        this.searchResult = result;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load popular books:', error);
        this.isLoading = false;
      }
    });
  }

  trackByBookId(index: number, book: Book): string {
    return book.id;
  }
}
