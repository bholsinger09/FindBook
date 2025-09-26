import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';

import { BookSearchParams } from '../../../../core/models';
import { AccessibilityService } from '../../../../services/accessibility.service';

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule
  ],
  templateUrl: './search-form.html',
  styleUrls: ['./search-form.scss']
})
export class SearchFormComponent {
  @Input() isLoading = false;
  @Output() searchSubmitted = new EventEmitter<BookSearchParams>();
  @Output() searchCleared = new EventEmitter<void>();

  searchForm: FormGroup;
  private accessibilityService = inject(AccessibilityService);

  constructor(private formBuilder: FormBuilder) {
    this.searchForm = this.formBuilder.group({
      searchTerm: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  get searchTermControl() {
    return this.searchForm.get('searchTerm');
  }

  get hasSearchTerm(): boolean {
    return this.searchTermControl?.value?.trim().length > 0;
  }

  onSubmit(): void {
    if (this.searchForm.valid && !this.isLoading) {
      const searchQuery = this.searchTermControl?.value.trim();
      const searchParams: BookSearchParams = {
        query: searchQuery,
        startIndex: 0,
        maxResults: 12
      };

      // Announce search action to screen readers
      this.accessibilityService.announce(
        `Searching for books with query: ${searchQuery}`,
        'assertive'
      );

      this.searchSubmitted.emit(searchParams);
    } else if (this.searchForm.invalid) {
      // Announce validation errors
      this.accessibilityService.announce(
        this.getErrorMessage(),
        'assertive'
      );
    }
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.accessibilityService.announce('Search cleared', 'polite');
    this.searchCleared.emit();
  }

  getErrorMessage(): string {
    if (this.searchTermControl?.hasError('required')) {
      return 'Search term is required';
    }
    if (this.searchTermControl?.hasError('minlength')) {
      return 'Search term must be at least 3 characters';
    }
    return '';
  }
}
