import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { switchMap, catchError, of } from 'rxjs';

import { BookDetailsComponent } from '../book-search/components/book-details/book-details';
import { BookService } from '../../core/services/book.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { Book } from '../../core/models';

@Component({
  selector: 'app-book-details-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    BookDetailsComponent
  ],
  template: `
    <div class="book-details-page">
      <!-- Back Navigation -->
      <div class="navigation-header">
        <button mat-icon-button (click)="goBack()" aria-label="Back to search" data-cy="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span class="page-title">Book Details</span>
      </div>

      <!-- Book Details Component -->
      <app-book-details
        [book]="book"
        [isLoading]="isLoading"
        [hasError]="hasError"
        (closed)="goBack()"
        (favoriteToggled)="onFavoriteToggled($event)"
        (previewRequested)="onPreviewRequested($event)"
        (purchaseRequested)="onPurchaseRequested($event)"
        data-cy="book-details">
      </app-book-details>

      <!-- Error State -->
      <div *ngIf="hasError && !isLoading" class="error-container" data-cy="error-message">
        <mat-icon class="error-icon">error_outline</mat-icon>
        <h2>Book Not Found</h2>
        <p>The requested book could not be found or loaded.</p>
        <button mat-raised-button color="primary" (click)="goBack()" data-cy="back-to-search">
          <mat-icon>arrow_back</mat-icon>
          Back to Search
        </button>
      </div>
    </div>
  `,
  styles: [`
    .book-details-page {
      min-height: 100vh;
      background: #fafafa;
    }

    .navigation-header {
      display: flex;
      align-items: center;
      padding: 16px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      gap: 16px;
    }

    .page-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: #333;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      min-height: 400px;
    }

    .error-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .error-container h2 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .error-container p {
      margin: 0 0 24px 0;
      color: #666;
      max-width: 400px;
    }
  `]
})
export class BookDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private favoritesService = inject(FavoritesService);

  book: Book | null = null;
  isLoading = false;
  hasError = false;

  ngOnInit(): void {
    this.loadBookDetails();
  }

  private loadBookDetails(): void {
    this.isLoading = true;
    this.hasError = false;

    this.route.params.pipe(
      switchMap(params => {
        const bookId = params['id'];
        if (!bookId) {
          throw new Error('No book ID provided');
        }
        return this.bookService.getBookById(bookId);
      }),
      catchError(error => {
        console.error('Failed to load book details:', error);
        this.hasError = true;
        return of(null);
      })
    ).subscribe({
      next: (book) => {
        this.book = book;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading book:', error);
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  onFavoriteToggled(book: Book): void {
    this.favoritesService.toggleFavorite(book);
  }

  onPreviewRequested(book: Book): void {
    console.log('Preview requested for:', book.title);
    // Preview handling is done in the book-details component
  }

  onPurchaseRequested(book: Book): void {
    console.log('Purchase requested for:', book.title);
    // Purchase handling is done in the book-details component
  }
}