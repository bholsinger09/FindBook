import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { Book } from '../../../../core/models';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './book-details.html',
  styleUrl: './book-details.scss'
})
export class BookDetailsComponent implements OnInit {
  @Input() book: Book | null = null;
  @Input() isLoading: boolean = false;
  @Output() favoriteToggled = new EventEmitter<Book>();
  @Output() previewRequested = new EventEmitter<Book>();
  @Output() closed = new EventEmitter<void>();

  isFavorite: boolean = false;

  ngOnInit(): void {
    console.log('BookDetails component initialized');
    this.checkIfFavorite();
  }

  toggleFavorite(): void {
    if (this.book) {
      this.isFavorite = !this.isFavorite;
      this.favoriteToggled.emit(this.book);
    }
  }

  requestPreview(): void {
    if (this.book?.webReaderLink) {
      this.previewRequested.emit(this.book);
    }
  }

  close(): void {
    this.closed.emit();
  }

  formatAuthors(authors: string[] | undefined): string {
    if (!authors || authors.length === 0) {
      return 'Unknown Author';
    }
    return authors.join(', ');
  }

  formatPageCount(pageCount: number | undefined): string {
    if (!pageCount) {
      return 'Not specified';
    }
    return `${pageCount} pages`;
  }

  formatRating(rating: number | undefined, ratingsCount: number | undefined): string {
    if (!rating) {
      return 'No ratings available';
    }
    const count = ratingsCount ? ` (${ratingsCount} reviews)` : '';
    return `${rating}/5${count}`;
  }

  getImageUrl(): string {
    if (this.book?.imageLinks?.thumbnail) {
      return this.book.imageLinks.thumbnail.replace('http:', 'https:');
    }
    return 'assets/images/book-placeholder.png';
  }

  private checkIfFavorite(): void {
    // TODO: Check localStorage or service for favorite status
    // For now, just set to false
    this.isFavorite = false;
  }
}