import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SearchFormComponent } from '../../components/search-form/search-form';
import { BookListComponent } from '../../components/book-list/book-list';
import { BookService } from '../../../../core/services/book.service';
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
    SearchFormComponent,
    BookListComponent
  ],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss'
})
export class SearchPage implements OnInit {
  searchResult: BookSearchResult | null = null;
  isLoading = false;
  currentSearchTerm = '';
  favoriteBookIds: Set<string> = new Set();

  constructor(private bookService: BookService) { }

  ngOnInit(): void {
    console.log('SearchPage component initialized');
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
    // TODO: Navigate to book details page
  }

  onFavoriteToggled(book: Book): void {
    if (this.favoriteBookIds.has(book.id)) {
      this.favoriteBookIds.delete(book.id);
    } else {
      this.favoriteBookIds.add(book.id);
    }
    // TODO: Persist favorites to local storage
    console.log('Favorites updated:', Array.from(this.favoriteBookIds));
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
