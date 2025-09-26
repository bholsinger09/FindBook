import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SearchFormComponent } from './search-form';
import { BookSearchParams } from '../../../../core/models';

describe('SearchFormComponent', () => {
  let component: SearchFormComponent;
  let fixture: ComponentFixture<SearchFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SearchFormComponent,
        ReactiveFormsModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        NoopAnimationsModule
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SearchFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty search term', () => {
      expect(component.searchForm.get('searchTerm')?.value).toBe('');
    });

    it('should have search term as required field', () => {
      const searchTermControl = component.searchForm.get('searchTerm');
      expect(searchTermControl?.hasError('required')).toBe(true);
    });

    it('should have minimum length validation', () => {
      const searchTermControl = component.searchForm.get('searchTerm');
      searchTermControl?.setValue('ab');
      expect(searchTermControl?.hasError('minlength')).toBe(true);
    });

    it('should not have validation errors with valid input', () => {
      const searchTermControl = component.searchForm.get('searchTerm');
      searchTermControl?.setValue('angular programming');
      expect(searchTermControl?.valid).toBe(true);
    });
  });

  describe('Form Validation UI', () => {
    it('should show required error message', async () => {
      const searchTermControl = component.searchForm.get('searchTerm');
      searchTermControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.error-message'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Search term is required');
    });

    it('should show minimum length error message', async () => {
      const searchTermControl = component.searchForm.get('searchTerm');
      searchTermControl?.setValue('ab');
      searchTermControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.error-message'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Search term must be at least 3 characters');
    });

    it('should hide error messages when form is valid', async () => {
      const searchTermControl = component.searchForm.get('searchTerm');
      searchTermControl?.setValue('valid search term');
      searchTermControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.error-message'));
      expect(errorElement).toBeFalsy();
    });
  });

  describe('Search Functionality', () => {
    it('should disable search button when form is invalid', () => {
      const searchButton = fixture.debugElement.query(By.css('.search-button'));
      expect(searchButton.nativeElement.disabled).toBe(true);
    });

    it('should enable search button when form is valid and not loading', () => {
      component.searchForm.get('searchTerm')?.setValue('valid search term');
      fixture.detectChanges();

      const searchButton = fixture.debugElement.query(By.css('.search-button'));
      expect(searchButton.nativeElement.disabled).toBe(false);
    });

    it('should disable search button when loading', () => {
      component.searchForm.get('searchTerm')?.setValue('valid search term');
      component.isLoading = true;
      fixture.detectChanges();

      const searchButton = fixture.debugElement.query(By.css('.search-button'));
      expect(searchButton.nativeElement.disabled).toBe(true);
    });

    it('should emit search event with correct parameters on form submission', () => {
      spyOn(component.searchSubmitted, 'emit');

      const searchTerm = 'test search query';
      component.searchForm.get('searchTerm')?.setValue(searchTerm);

      const expectedParams: BookSearchParams = {
        query: searchTerm,
        startIndex: 0,
        maxResults: 12
      };

      component.onSubmit();

      expect(component.searchSubmitted.emit).toHaveBeenCalledWith(expectedParams);
    });

    it('should not emit search event when form is invalid', () => {
      spyOn(component.searchSubmitted, 'emit');

      component.searchForm.get('searchTerm')?.setValue('');
      component.onSubmit();

      expect(component.searchSubmitted.emit).not.toHaveBeenCalled();
    });

    it('should trigger search on Enter key press', () => {
      spyOn(component, 'onSubmit');

      const searchInput = fixture.debugElement.query(By.css('.search-input'));
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      searchInput.nativeElement.dispatchEvent(enterEvent);

      expect(component.onSubmit).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show progress bar when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const progressBar = fixture.debugElement.query(By.css('mat-progress-bar'));
      expect(progressBar).toBeTruthy();
    });

    it('should hide progress bar when not loading', () => {
      component.isLoading = false;
      fixture.detectChanges();

      const progressBar = fixture.debugElement.query(By.css('mat-progress-bar'));
      expect(progressBar).toBeFalsy();
    });

    it('should show loading text on button when loading', () => {
      component.isLoading = true;
      component.searchForm.get('searchTerm')?.setValue('valid search');
      fixture.detectChanges();

      const buttonText = fixture.debugElement.query(By.css('.search-button')).nativeElement.textContent.trim();
      expect(buttonText).toContain('Searching...');
    });

    it('should show search text on button when not loading', () => {
      component.isLoading = false;
      component.searchForm.get('searchTerm')?.setValue('valid search');
      fixture.detectChanges();

      const buttonText = fixture.debugElement.query(By.css('.search-button')).nativeElement.textContent.trim();
      expect(buttonText).toContain('Search Books');
    });
  });

  describe('Clear Functionality', () => {
    it('should clear search form', () => {
      component.searchForm.get('searchTerm')?.setValue('test search');
      component.clearSearch();

      const value = component.searchForm.get('searchTerm')?.value;
      expect(value === '' || value === null).toBe(true);
    });

    it('should emit clear event', () => {
      spyOn(component.searchCleared, 'emit');

      component.clearSearch();

      expect(component.searchCleared.emit).toHaveBeenCalled();
    });

    it('should show clear button when search term exists', () => {
      component.searchForm.get('searchTerm')?.setValue('test');
      fixture.detectChanges();

      const clearButton = fixture.debugElement.query(By.css('.clear-button'));
      expect(clearButton).toBeTruthy();
    });

    it('should hide clear button when search term is empty', () => {
      component.searchForm.get('searchTerm')?.setValue('');
      fixture.detectChanges();

      const clearButton = fixture.debugElement.query(By.css('.clear-button'));
      expect(clearButton).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const searchInput = fixture.debugElement.query(By.css('.search-input'));
      const searchButton = fixture.debugElement.query(By.css('.search-button'));

      expect(searchInput.nativeElement.getAttribute('aria-labelledby')).toBe('search-label');
      expect(searchButton.nativeElement.getAttribute('aria-label')).toBe('Search for books');
    });

    it('should have proper form structure', () => {
      const form = fixture.debugElement.query(By.css('form'));
      expect(form).toBeTruthy();
    });

    it('should associate error messages with input', () => {
      const searchTermControl = component.searchForm.get('searchTerm');
      searchTermControl?.markAsTouched();
      fixture.detectChanges();

      const searchInput = fixture.debugElement.query(By.css('.search-input'));
      const errorElement = fixture.debugElement.query(By.css('.error-message'));

      if (errorElement) {
        expect(searchInput.nativeElement.getAttribute('aria-describedby')).toContain('search-error');
      }
    });
  });
});
