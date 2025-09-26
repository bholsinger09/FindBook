import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BookListComponent } from './book-list';
import { Book, BookSearchResult } from '../../../../core/models';

describe('BookListComponent', () => {
  let component: BookListComponent;
  let fixture: ComponentFixture<BookListComponent>;

  // Mock data for testing
  const mockBook: Book = {
    id: '1',
    title: 'Angular Testing Guide',
    authors: ['John Doe', 'Jane Smith'],
    description: 'A comprehensive guide to testing Angular applications',
    publishedDate: '2023-01-01',
    publisher: 'Tech Publishing',
    pageCount: 350,
    categories: ['Programming', 'Web Development'],
    averageRating: 4.5,
    ratingsCount: 125,
    language: 'en',
    webReaderLink: 'https://example.com/preview',
    imageLinks: {
      thumbnail: 'https://example.com/thumbnail.jpg',
      smallThumbnail: 'https://example.com/small.jpg'
    }
  };

  const mockSearchResult: BookSearchResult = {
    query: 'angular testing',
    totalItems: 1,
    currentPage: 1,
    itemsPerPage: 12,
    books: [mockBook],
    hasMoreResults: false,
    searchTimestamp: new Date(),
    appliedFilters: {}
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BookListComponent,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        NoopAnimationsModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should hide loading spinner when isLoading is false', () => {
      component.isLoading = false;
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      expect(spinner).toBeFalsy();
    });

    it('should show loading message when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const loadingMessage = fixture.debugElement.query(By.css('.loading-message'));
      expect(loadingMessage?.nativeElement.textContent.trim()).toBe('Searching for books...');
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no search has been performed', () => {
      component.searchResult = null;
      component.isLoading = false;
      fixture.detectChanges();

      const emptyMessage = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyMessage).toBeTruthy();
    });

    it('should show no results message when search returns empty', () => {
      component.searchResult = { ...mockSearchResult, books: [], totalItems: 0 };
      component.isLoading = false;
      fixture.detectChanges();

      const noResults = fixture.debugElement.query(By.css('.no-results'));
      expect(noResults).toBeTruthy();
    });
  });

  describe('Book Display', () => {
    beforeEach(() => {
      component.searchResult = mockSearchResult;
      component.isLoading = false;
      fixture.detectChanges();
    });

    it('should display books when search result is provided', () => {
      const bookCards = fixture.debugElement.queryAll(By.css('.book-card'));
      expect(bookCards.length).toBe(1);
    });

    it('should display book title', () => {
      const titleElement = fixture.debugElement.query(By.css('.book-title'));
      expect(titleElement.nativeElement.textContent.trim()).toBe('Angular Testing Guide');
    });

    it('should display book authors', () => {
      const authorsElement = fixture.debugElement.query(By.css('.book-authors'));
      expect(authorsElement.nativeElement.textContent.trim()).toBe('John Doe, Jane Smith');
    });

    it('should display book description', () => {
      const descriptionElement = fixture.debugElement.query(By.css('.book-description'));
      expect(descriptionElement.nativeElement.textContent).toContain('A comprehensive guide to testing');
    });

    it('should display book thumbnail', () => {
      const thumbnailElement = fixture.debugElement.query(By.css('.book-thumbnail'));
      expect(thumbnailElement.nativeElement.src).toBe('https://example.com/thumbnail.jpg');
      expect(thumbnailElement.nativeElement.alt).toBe('Angular Testing Guide cover');
    });

    it('should display default image when thumbnail is not available', () => {
      const bookWithoutThumbnail = { ...mockBook, imageLinks: undefined };
      component.searchResult = { ...mockSearchResult, books: [bookWithoutThumbnail] };
      fixture.detectChanges();

      const thumbnailElement = fixture.debugElement.query(By.css('.book-thumbnail'));
      expect(thumbnailElement.nativeElement.src).toContain('assets/images/book-placeholder.png');
    });

    it('should display book rating when available', () => {
      const ratingElement = fixture.debugElement.query(By.css('.book-rating'));
      expect(ratingElement.nativeElement.textContent).toContain('4.5');
      expect(ratingElement.nativeElement.textContent).toContain('125');
    });

    it('should display book categories as chips', () => {
      const chips = fixture.debugElement.queryAll(By.css('mat-chip'));
      expect(chips.length).toBe(2);
      expect(chips[0].nativeElement.textContent.trim()).toBe('Programming');
      expect(chips[1].nativeElement.textContent.trim()).toBe('Web Development');
    });

    it('should display published date', () => {
      const dateElement = fixture.debugElement.query(By.css('.published-date'));
      expect(dateElement.nativeElement.textContent).toContain('2023');
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      component.searchResult = mockSearchResult;
      component.isLoading = false;
      fixture.detectChanges();
    });

    it('should emit bookSelected event when view details is clicked', () => {
      spyOn(component.bookSelected, 'emit');
      
      const viewDetailsButton = fixture.debugElement.query(By.css('.view-details-btn'));
      viewDetailsButton.nativeElement.click();
      
      expect(component.bookSelected.emit).toHaveBeenCalledWith(mockBook);
    });

    it('should emit favoriteToggled event when favorite button is clicked', () => {
      spyOn(component.favoriteToggled, 'emit');
      
      const favoriteButton = fixture.debugElement.query(By.css('.favorite-btn'));
      favoriteButton.nativeElement.click();
      
      expect(component.favoriteToggled.emit).toHaveBeenCalledWith(mockBook);
    });

    it('should show filled heart icon for favorite books', () => {
      component.favoriteBookIds = new Set(['1']);
      fixture.detectChanges();

      const favoriteIcon = fixture.debugElement.query(By.css('.favorite-btn mat-icon'));
      expect(favoriteIcon.nativeElement.textContent.trim()).toBe('favorite');
    });

    it('should show outlined heart icon for non-favorite books', () => {
      component.favoriteBookIds = new Set();
      fixture.detectChanges();

      const favoriteIcon = fixture.debugElement.query(By.css('.favorite-btn mat-icon'));
      expect(favoriteIcon.nativeElement.textContent.trim()).toBe('favorite_border');
    });
  });

  describe('Results Summary', () => {
    it('should display correct results count', () => {
      component.searchResult = mockSearchResult;
      fixture.detectChanges();

      const summaryElement = fixture.debugElement.query(By.css('.results-summary'));
      expect(summaryElement.nativeElement.textContent).toContain('1 of 1 books');
    });

    it('should display search query in summary', () => {
      component.searchResult = mockSearchResult;
      fixture.detectChanges();

      const summaryElement = fixture.debugElement.query(By.css('.results-summary'));
      expect(summaryElement.nativeElement.textContent).toContain('angular testing');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      component.searchResult = mockSearchResult;
      fixture.detectChanges();
    });

    it('should have proper ARIA labels on buttons', () => {
      const viewDetailsBtn = fixture.debugElement.query(By.css('.view-details-btn'));
      const favoriteBtn = fixture.debugElement.query(By.css('.favorite-btn'));
      
      expect(viewDetailsBtn.nativeElement.getAttribute('aria-label')).toContain('View details');
      expect(favoriteBtn.nativeElement.getAttribute('aria-label')).toContain('Add to favorites');
    });

    it('should have proper alt text for book images', () => {
      const thumbnail = fixture.debugElement.query(By.css('.book-thumbnail'));
      expect(thumbnail.nativeElement.alt).toBe('Angular Testing Guide cover');
    });

    it('should have semantic HTML structure', () => {
      const bookList = fixture.debugElement.query(By.css('[role="list"]'));
      const bookItems = fixture.debugElement.queryAll(By.css('[role="listitem"]'));
      
      expect(bookList).toBeTruthy();
      expect(bookItems.length).toBe(1);
    });
  });

  describe('Responsive Design', () => {
    it('should use trackBy function for performance', () => {
      expect(component.trackByBookId).toBeDefined();
      expect(component.trackByBookId(0, mockBook)).toBe('1');
    });

    it('should handle long descriptions with truncation', () => {
      const longDescription = 'A'.repeat(300);
      const bookWithLongDesc = { ...mockBook, description: longDescription };
      component.searchResult = { ...mockSearchResult, books: [bookWithLongDesc] };
      fixture.detectChanges();

      const descriptionElement = fixture.debugElement.query(By.css('.book-description'));
      expect(descriptionElement.nativeElement.textContent.length).toBeLessThan(250);
    });
  });
});
