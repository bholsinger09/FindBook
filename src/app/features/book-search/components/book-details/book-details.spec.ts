import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BookDetailsComponent } from './book-details';
import { Book } from '../../../../core/models';

describe('BookDetailsComponent', () => {
  let component: BookDetailsComponent;
  let fixture: ComponentFixture<BookDetailsComponent>;

  // Mock book data for testing
  const mockBook: Book = {
    id: '1',
    title: 'The Complete Guide to Angular Testing',
    authors: ['John Doe', 'Jane Smith'],
    description:
      '<p>A comprehensive guide to testing Angular applications with detailed examples and best practices. This book covers unit testing, integration testing, and end-to-end testing strategies.</p>',
    publishedDate: '2023-06-15',
    publisher: 'Tech Publishing House',
    pageCount: 450,
    categories: ['Programming', 'Web Development', 'Testing'],
    averageRating: 4.7,
    ratingsCount: 298,
    language: 'en',
    webReaderLink: 'https://example.com/preview/angular-testing',
    imageLinks: {
      thumbnail: 'https://example.com/covers/angular-testing-thumb.jpg',
      smallThumbnail: 'https://example.com/covers/angular-testing-small.jpg',
    },
  };

  const mockBookMinimal: Book = {
    id: '2',
    title: 'Minimal Book Example',
    authors: [],
    description: '',
    publishedDate: '',
    publisher: '',
    pageCount: 0,
    categories: [],
    averageRating: 0,
    ratingsCount: 0,
    language: '',
    webReaderLink: '',
    imageLinks: undefined,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BookDetailsComponent,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatDividerModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.book).toBeNull();
      expect(component.isLoading).toBe(false);
      expect(component.isFavorite).toBe(false);
    });

    it('should call checkIfFavorite on init', () => {
      spyOn(component as any, 'checkIfFavorite');
      component.ngOnInit();
      expect((component as any).checkIfFavorite).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      component.isLoading = true;
      component.book = mockBook;
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      const loadingMessage = fixture.debugElement.query(By.css('.loading-message'));

      expect(spinner).toBeTruthy();
      expect(loadingMessage.nativeElement.textContent.trim()).toBe('Loading book details...');
    });

    it('should hide loading spinner when isLoading is false', () => {
      component.isLoading = false;
      component.book = mockBook;
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      expect(spinner).toBeFalsy();
    });

    it('should hide book content when loading', () => {
      component.isLoading = true;
      component.book = mockBook;
      fixture.detectChanges();

      const bookContent = fixture.debugElement.query(By.css('.book-details-content'));
      expect(bookContent).toBeFalsy();
    });
  });

  describe('Empty State', () => {
    it('should show no book message when book is null', () => {
      component.book = null;
      component.isLoading = false;
      fixture.detectChanges();

      const noBookMessage = fixture.debugElement.query(By.css('.no-book-message'));
      expect(noBookMessage).toBeTruthy();
      expect(noBookMessage.nativeElement.textContent).toContain('Book not found');
    });

    it('should hide no book message when book exists', () => {
      component.book = mockBook;
      component.isLoading = false;
      fixture.detectChanges();

      const noBookMessage = fixture.debugElement.query(By.css('.no-book-message'));
      expect(noBookMessage).toBeFalsy();
    });
  });

  describe('Book Information Display', () => {
    beforeEach(() => {
      component.book = mockBook;
      component.isLoading = false;
      fixture.detectChanges();
    });

    it('should display book title', () => {
      const titleElement = fixture.debugElement.query(By.css('.book-title'));
      expect(titleElement.nativeElement.textContent.trim()).toBe(
        'The Complete Guide to Angular Testing',
      );
    });

    it('should display formatted authors', () => {
      const authorsElement = fixture.debugElement.query(By.css('.book-authors'));
      expect(authorsElement.nativeElement.textContent).toContain('John Doe, Jane Smith');
    });

    it('should display publisher', () => {
      const publisherElement = fixture.debugElement.query(By.css('.book-publisher'));
      expect(publisherElement.nativeElement.textContent).toContain('Tech Publishing House');
    });

    it('should display published date', () => {
      const dateElement = fixture.debugElement.query(By.css('.book-published-date'));
      expect(dateElement.nativeElement.textContent).toContain('2023-06-15');
    });

    it('should display page count', () => {
      const pageCountElement = fixture.debugElement.query(By.css('.book-page-count'));
      expect(pageCountElement.nativeElement.textContent).toContain('450 pages');
    });

    it('should display language', () => {
      const languageElement = fixture.debugElement.query(By.css('.book-language'));
      expect(languageElement.nativeElement.textContent).toContain('EN');
    });

    it('should display book cover image', () => {
      const coverImage = fixture.debugElement.query(By.css('.cover-image'));
      expect(coverImage.nativeElement.src).toContain(
        'https://example.com/covers/angular-testing-thumb.jpg',
      );
      expect(coverImage.nativeElement.alt).toBe('The Complete Guide to Angular Testing cover');
    });

    it('should display rating when available', () => {
      const ratingElement = fixture.debugElement.query(By.css('.book-rating'));
      expect(ratingElement.nativeElement.textContent).toContain('4.7/5');
      expect(ratingElement.nativeElement.textContent).toContain('298 reviews');
    });

    it('should display categories as chips', () => {
      const chips = fixture.debugElement.queryAll(By.css('mat-chip'));
      expect(chips.length).toBe(3);
      expect(chips[0].nativeElement.textContent.trim()).toBe('Programming');
      expect(chips[1].nativeElement.textContent.trim()).toBe('Web Development');
      expect(chips[2].nativeElement.textContent.trim()).toBe('Testing');
    });

    it('should display description with HTML content', () => {
      const descriptionElement = fixture.debugElement.query(By.css('.description-text'));
      expect(descriptionElement.nativeElement.innerHTML).toContain(
        '<p>A comprehensive guide to testing',
      );
    });
  });

  describe('Minimal Book Data Display', () => {
    beforeEach(() => {
      component.book = mockBookMinimal;
      component.isLoading = false;
      fixture.detectChanges();
    });

    it('should show unknown author when authors array is empty', () => {
      const authorsElement = fixture.debugElement.query(By.css('.book-authors'));
      expect(authorsElement.nativeElement.textContent).toContain('Unknown Author');
    });

    it('should show not specified for page count when zero', () => {
      const pageCountElement = fixture.debugElement.query(By.css('.book-page-count'));
      expect(pageCountElement.nativeElement.textContent).toContain('Not specified');
    });

    it('should use placeholder image when imageLinks is undefined', () => {
      const coverImage = fixture.debugElement.query(By.css('.cover-image'));
      expect(coverImage.nativeElement.src).toContain('assets/images/book-placeholder.png');
    });

    it('should not display rating section when no rating available', () => {
      const ratingElement = fixture.debugElement.query(By.css('.book-rating'));
      expect(ratingElement).toBeFalsy();
    });

    it('should not display categories section when no categories', () => {
      const categoriesElement = fixture.debugElement.query(By.css('.book-categories'));
      expect(categoriesElement).toBeFalsy();
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      component.book = mockBook;
      component.isLoading = false;
      fixture.detectChanges();
    });

    it('should emit closed event when close button is clicked', () => {
      spyOn(component.closed, 'emit');

      const closeButton = fixture.debugElement.query(By.css('.back-button'));
      closeButton.nativeElement.click();

      expect(component.closed.emit).toHaveBeenCalled();
    });

    it('should emit favoriteToggled event when favorite button is clicked', () => {
      spyOn(component.favoriteToggled, 'emit');

      const favoriteButton = fixture.debugElement.query(By.css('.favorite-button'));
      favoriteButton.nativeElement.click();

      expect(component.favoriteToggled.emit).toHaveBeenCalledWith(mockBook);
    });

    it('should toggle favorite state when favorite button is clicked', () => {
      expect(component.isFavorite).toBe(false);

      const favoriteButton = fixture.debugElement.query(By.css('.favorite-button'));
      favoriteButton.nativeElement.click();

      expect(component.isFavorite).toBe(true);
    });

    it('should emit previewRequested event when preview button is clicked', () => {
      spyOn(component.previewRequested, 'emit');

      const previewButton = fixture.debugElement.query(By.css('.preview-button'));
      previewButton.nativeElement.click();

      expect(component.previewRequested.emit).toHaveBeenCalledWith(mockBook);
    });

    it('should disable preview button when webReaderLink is not available', () => {
      component.book = { ...mockBook, webReaderLink: '' };
      fixture.detectChanges();

      const previewButton = fixture.debugElement.query(By.css('.preview-button'));
      expect(previewButton.nativeElement.disabled).toBe(true);
    });

    it('should update favorite button text when favorite state changes', () => {
      let favoriteButton = fixture.debugElement.query(By.css('.favorite-button'));
      expect(favoriteButton.nativeElement.textContent).toContain('Add to Favorites');

      component.isFavorite = true;
      fixture.detectChanges();

      favoriteButton = fixture.debugElement.query(By.css('.favorite-button'));
      expect(favoriteButton.nativeElement.textContent).toContain('Remove from Favorites');
    });

    it('should update favorite button icon when favorite state changes', () => {
      let favoriteIcon = fixture.debugElement.query(By.css('.favorite-button mat-icon'));
      expect(favoriteIcon.nativeElement.textContent.trim()).toBe('favorite_border');

      component.isFavorite = true;
      fixture.detectChanges();

      favoriteIcon = fixture.debugElement.query(By.css('.favorite-button mat-icon'));
      expect(favoriteIcon.nativeElement.textContent.trim()).toBe('favorite');
    });
  });

  describe('Helper Methods', () => {
    it('should format authors correctly', () => {
      expect(component.formatAuthors(['John Doe', 'Jane Smith'])).toBe('John Doe, Jane Smith');
      expect(component.formatAuthors(['Single Author'])).toBe('Single Author');
      expect(component.formatAuthors([])).toBe('Unknown Author');
      expect(component.formatAuthors(undefined)).toBe('Unknown Author');
    });

    it('should format page count correctly', () => {
      expect(component.formatPageCount(450)).toBe('450 pages');
      expect(component.formatPageCount(1)).toBe('1 pages');
      expect(component.formatPageCount(0)).toBe('Not specified');
      expect(component.formatPageCount(undefined)).toBe('Not specified');
    });

    it('should format rating correctly', () => {
      expect(component.formatRating(4.7, 298)).toBe('4.7/5 (298 reviews)');
      expect(component.formatRating(3.5, undefined)).toBe('3.5/5');
      expect(component.formatRating(undefined, 100)).toBe('No ratings available');
      expect(component.formatRating(undefined, undefined)).toBe('No ratings available');
    });

    it('should get correct image URL', () => {
      component.book = mockBook;
      expect(component.getImageUrl()).toBe('https://example.com/covers/angular-testing-thumb.jpg');

      component.book = { ...mockBook, imageLinks: { thumbnail: 'http://example.com/cover.jpg' } };
      expect(component.getImageUrl()).toBe('https://example.com/cover.jpg');

      component.book = mockBookMinimal;
      expect(component.getImageUrl()).toBe('assets/images/book-placeholder.png');
    });
  });
});
