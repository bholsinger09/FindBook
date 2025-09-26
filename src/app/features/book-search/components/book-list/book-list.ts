import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Book, BookSearchResult } from '../../../../core/models';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './book-list.html',
  styleUrls: ['./book-list.scss']
})
export class BookListComponent {
  @Input() searchResult: BookSearchResult | null = null;
  @Input() isLoading = false;
  @Input() hasError = false;
  @Input() favoriteBookIds: Set<string> = new Set();

  @Output() bookSelected = new EventEmitter<Book>();
  @Output() favoriteToggled = new EventEmitter<Book>();

  onViewDetails(book: Book): void {
    this.bookSelected.emit(book);
  }

  onToggleFavorite(book: Book): void {
    this.favoriteToggled.emit(book);
  }

  isFavorite(bookId: string): boolean {
    return this.favoriteBookIds.has(bookId);
  }

  trackByBookId(index: number, book: Book): string {
    return book.id;
  }

  getBookThumbnail(book: Book): string {
    return book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '/assets/images/book-placeholder.png';
  }

  handleImageError(event: any): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== 'assets/images/book-placeholder.png') {
      img.src = 'assets/images/book-placeholder.png';
    }
  }

  handleImageLoad(event: any): void {
    const img = event.target as HTMLImageElement;
    img.style.opacity = '1';
    img.style.transition = 'opacity 0.3s ease';
  }

  getBookAuthors(book: Book): string {
    return book.authors?.join(', ') || 'Unknown Author';
  }

  truncateDescription(description: string | undefined, maxLength: number = 200): string {
    if (!description) return 'No description available.';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  }

  formatPublishedDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).getFullYear().toString();
  }
}
