import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SearchFormComponent } from '../../components/search-form/search-form';
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
    SearchFormComponent
  ],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss'
})
export class SearchPage implements OnInit {
  searchResult$: Observable<BookSearchResult> | null = null;
  isLoading = false;
  currentSearchTerm = '';

  constructor(private bookService: BookService) { }

  ngOnInit(): void {
    console.log('SearchPage component initialized');
    // Load some popular books initially
    this.loadPopularBooks();
  }

  onSearchSubmitted(searchParams: BookSearchParams): void {
    this.isLoading = true;
    this.currentSearchTerm = searchParams.query;

    this.searchResult$ = this.bookService.searchBooks(searchParams);

    // For now, we'll handle loading state manually
    // TODO: Implement proper loading state management
    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }

  onSearchCleared(): void {
    this.currentSearchTerm = '';
    this.loadPopularBooks();
  }

  private loadPopularBooks(): void {
    this.isLoading = true;
    this.searchResult$ = this.bookService.getPopularBooks();

    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  trackByBookId(index: number, book: Book): string {
    return book.id;
  }
}
