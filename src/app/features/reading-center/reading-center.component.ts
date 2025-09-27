import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { Router, RouterModule } from '@angular/router';

import { BookService } from '../../core/services/book.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { Book, BookSearchParams } from '../../core/models';
import { Observable, combineLatest, map } from 'rxjs';

interface SearchHistoryItem {
    id: string;
    query: string;
    timestamp: Date;
    resultCount: number;
    category?: string;
}

interface ReadingListItem {
    id: string;
    book: Book;
    status: 'want-to-read' | 'currently-reading' | 'completed';
    dateAdded: Date;
    notes?: string;
    progress?: number;
}

@Component({
    selector: 'app-reading-center',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatExpansionModule,
        MatChipsModule,
        MatListModule,
        MatDividerModule,
        MatBadgeModule
    ],
    template: `
    <div class="reading-center" role="main" aria-labelledby="reading-center-title">
      <div class="center-header">
        <h1 id="reading-center-title">
          <mat-icon>menu_book</mat-icon>
          Reading Center
        </h1>
        <p class="center-subtitle">Manage your reading journey and discover new books</p>
      </div>

      <div class="center-content">
        <!-- Quick Stats -->
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-item">
                <mat-icon>favorite</mat-icon>
                <div class="stat-content">
                  <span class="stat-number">{{ favoriteCount() }}</span>
                  <span class="stat-label">Favorites</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-item">
                <mat-icon>history</mat-icon>
                <div class="stat-content">
                  <span class="stat-number">{{ searchHistoryCount() }}</span>
                  <span class="stat-label">Recent Searches</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-item">
                <mat-icon>library_books</mat-icon>
                <div class="stat-content">
                  <span class="stat-number">{{ readingListCount() }}</span>
                  <span class="stat-label">Reading List</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Search History -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>history</mat-icon>
              Recent Searches
            </mat-card-title>
            <mat-card-subtitle>Quick access to your search history</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <mat-expansion-panel class="history-panel">
              <mat-expansion-panel-header>
                <mat-panel-title>Search History</mat-panel-title>
                <mat-panel-description>
                  <span matBadge="{{searchHistory().length}}" matBadgeColor="accent">
                    View recent searches
                  </span>
                </mat-panel-description>
              </mat-expansion-panel-header>
              
              <div class="history-content">
                <mat-list *ngIf="searchHistory().length > 0; else noHistory">
                  <mat-list-item 
                    *ngFor="let item of searchHistory(); trackBy: trackByHistoryId" 
                    class="history-item">
                    <mat-icon matListItemIcon>search</mat-icon>
                    <div matListItemTitle class="history-query">{{ item.query }}</div>
                    <div matListItemLine class="history-meta">
                      {{ formatDate(item.timestamp) }} • {{ item.resultCount }} results
                      <mat-chip *ngIf="item.category" size="small">{{ item.category }}</mat-chip>
                    </div>
                    <button 
                      mat-icon-button 
                      matListItemMeta 
                      (click)="repeatSearch(item)"
                      [attr.aria-label]="'Repeat search for ' + item.query">
                      <mat-icon>refresh</mat-icon>
                    </button>
                  </mat-list-item>
                </mat-list>
                
                <ng-template #noHistory>
                  <div class="empty-state">
                    <mat-icon class="empty-icon">search_off</mat-icon>
                    <p>No search history yet</p>
                    <button mat-button routerLink="/search" color="primary">
                      Start Searching
                    </button>
                  </div>
                </ng-template>
              </div>
              
              <mat-card-actions *ngIf="searchHistory().length > 0">
                <button mat-button (click)="clearSearchHistory()">
                  <mat-icon>clear_all</mat-icon>
                  Clear History
                </button>
              </mat-card-actions>
            </mat-expansion-panel>
          </mat-card-content>
        </mat-card>

        <!-- Reading List -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>library_books</mat-icon>
              Reading List
            </mat-card-title>
            <mat-card-subtitle>Track your reading progress</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="reading-list-tabs">
              <button 
                mat-button 
                *ngFor="let status of readingStatuses" 
                [class.active]="selectedStatus() === status.value"
                (click)="selectedStatus.set(status.value)"
                [attr.aria-label]="'Show ' + status.label + ' books'"
                [matBadge]="getStatusCount(status.value)"
                [matBadgeHidden]="getStatusCount(status.value) === 0"
                matBadgeColor="primary">
                {{ status.label }}
              </button>
            </div>

            <div class="reading-list-content">
              <mat-list *ngIf="filteredReadingList().length > 0; else noBooks">
                <mat-list-item 
                  *ngFor="let item of filteredReadingList(); trackBy: trackByReadingId" 
                  class="reading-item">
                  <img 
                    matListItemAvatar 
                    [src]="getBookThumbnail(item.book)" 
                    [alt]="item.book.title + ' cover'"
                    class="book-avatar">
                  <div matListItemTitle>{{ item.book.title }}</div>
                  <div matListItemLine>
                    {{ getBookAuthors(item.book) }}
                    <span class="reading-meta">
                      • Added {{ formatDate(item.dateAdded) }}
                      <span *ngIf="item.progress"> • {{ item.progress }}% complete</span>
                    </span>
                  </div>
                  <div matListItemMeta class="reading-actions">
                    <mat-chip [color]="getStatusChipColor(item.status)" size="small">
                      {{ getStatusLabel(item.status) }}
                    </mat-chip>
                    <button 
                      mat-icon-button 
                      (click)="viewBookDetails(item.book)"
                      [attr.aria-label]="'View details for ' + item.book.title">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </div>
                </mat-list-item>
              </mat-list>
              
              <ng-template #noBooks>
                <div class="empty-state">
                  <mat-icon class="empty-icon">book</mat-icon>
                  <p>No books in your {{ getSelectedStatusLabel() }} list yet</p>
                  <button mat-button routerLink="/search" color="primary">
                    Find Books to Add
                  </button>
                </div>
              </ng-template>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Personalized Recommendations -->
        <mat-card class="section-card" *ngIf="recommendations().length > 0">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>recommend</mat-icon>
              Recommended for You
            </mat-card-title>
            <mat-card-subtitle>Based on your favorites and reading history</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="recommendations-grid">
              <div 
                *ngFor="let book of recommendations(); trackBy: trackByBookId" 
                class="recommendation-item">
                <img 
                  [src]="getBookThumbnail(book)" 
                  [alt]="book.title + ' cover'"
                  class="recommendation-cover">
                <div class="recommendation-content">
                  <h4 class="recommendation-title">{{ book.title }}</h4>
                  <p class="recommendation-authors">{{ getBookAuthors(book) }}</p>
                  <div class="recommendation-actions">
                    <button 
                      mat-button 
                      size="small" 
                      (click)="viewBookDetails(book)"
                      [attr.aria-label]="'View details for ' + book.title">
                      View Details
                    </button>
                    <button 
                      mat-icon-button 
                      (click)="toggleFavorite(book)"
                      [attr.aria-label]="(isFavorite(book.id) ? 'Remove from' : 'Add to') + ' favorites'">
                      <mat-icon>{{ isFavorite(book.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Quick Actions -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>dashboard</mat-icon>
              Quick Actions
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="actions-grid">
              <button 
                mat-raised-button 
                color="primary" 
                routerLink="/search"
                aria-label="Search for new books">
                <mat-icon>search</mat-icon>
                Search Books
              </button>
              
              <button 
                mat-button 
                routerLink="/search"
                [queryParams]="{ category: 'bestsellers' }"
                aria-label="Browse bestseller books">
                <mat-icon>trending_up</mat-icon>
                Browse Bestsellers
              </button>
              
              <button 
                mat-button 
                (click)="exportData()"
                aria-label="Export your reading data">
                <mat-icon>file_download</mat-icon>
                Export Data
              </button>
              
              <button 
                mat-button 
                routerLink="/performance"
                aria-label="View app performance metrics">
                <mat-icon>speed</mat-icon>
                Performance
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
    styles: [`
    .reading-center {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .center-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .center-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 0 0 8px 0;
      color: #333;
      font-size: 2rem;
    }

    .center-subtitle {
      color: #666;
      font-size: 1.1rem;
      margin: 0;
    }

    .center-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .stat-card .mat-mdc-card-content {
      padding: 16px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
    }

    /* Section Cards */
    .section-card {
      margin-bottom: 16px;
    }

    .section-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* History */
    .history-panel {
      box-shadow: none;
      border: 1px solid #e0e0e0;
    }

    .history-content {
      padding: 0;
    }

    .history-item {
      border-bottom: 1px solid #f5f5f5;
    }

    .history-item:last-child {
      border-bottom: none;
    }

    .history-query {
      font-weight: 500;
    }

    .history-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 0.875rem;
    }

    /* Reading List */
    .reading-list-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
    }

    .reading-list-tabs button {
      border-radius: 16px;
    }

    .reading-list-tabs button.active {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .reading-item {
      border-bottom: 1px solid #f5f5f5;
    }

    .reading-item:last-child {
      border-bottom: none;
    }

    .book-avatar {
      width: 48px;
      height: 72px;
      object-fit: cover;
      border-radius: 4px;
    }

    .reading-meta {
      color: #666;
      font-size: 0.875rem;
    }

    .reading-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Recommendations */
    .recommendations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .recommendation-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: box-shadow 0.2s;
    }

    .recommendation-item:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .recommendation-cover {
      width: 80px;
      height: 120px;
      object-fit: cover;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .recommendation-title {
      margin: 0 0 4px 0;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .recommendation-authors {
      margin: 0 0 12px 0;
      font-size: 0.75rem;
      color: #666;
    }

    .recommendation-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Actions Grid */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .actions-grid button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
    }

    /* Empty States */
    .empty-state {
      text-align: center;
      padding: 32px;
      color: #666;
    }

    .empty-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .reading-center {
        padding: 16px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .reading-list-tabs {
        flex-wrap: wrap;
      }

      .recommendations-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ReadingCenterComponent implements OnInit {
    private bookService = inject(BookService);
    private favoritesService = inject(FavoritesService);
    private router = inject(Router);

    // Signals for reactive state
    favoriteCount = signal(0);
    searchHistoryCount = signal(0);
    readingListCount = signal(0);
    searchHistory = signal<SearchHistoryItem[]>([]);
    readingList = signal<ReadingListItem[]>([]);
    recommendations = signal<Book[]>([]);
    selectedStatus = signal<'want-to-read' | 'currently-reading' | 'completed'>('want-to-read');

    readonly readingStatuses = [
        { value: 'want-to-read' as const, label: 'Want to Read' },
        { value: 'currently-reading' as const, label: 'Currently Reading' },
        { value: 'completed' as const, label: 'Completed' }
    ];

    constructor() {
        // Load initial data
        this.loadData();
    }

    ngOnInit(): void {
        this.loadFavoriteCount();
        this.loadSearchHistory();
        this.loadReadingList();
        this.loadRecommendations();
    }

    private loadData(): void {
        // Load data from localStorage or API
    }

    private loadFavoriteCount(): void {
        const favorites = this.favoritesService.getFavorites();
        this.favoriteCount.set(favorites.length);
    }

    private loadSearchHistory(): void {
        const history = this.getStoredData<SearchHistoryItem[]>('search-history', []);
        this.searchHistory.set(history.slice(0, 10)); // Show last 10 searches
        this.searchHistoryCount.set(history.length);
    }

    private loadReadingList(): void {
        const readingList = this.getStoredData<ReadingListItem[]>('reading-list', []);
        this.readingList.set(readingList);
        this.readingListCount.set(readingList.length);
    }

    private loadRecommendations(): void {
        // Generate recommendations based on favorites and search history
        const favorites = this.favoritesService.getFavorites();
        if (favorites.length > 0) {
            // Get categories from favorite books - use localStorage favorites which have full book data
            const fullFavorites = this.getStoredData<Book[]>('favorites', []);
            const categories = fullFavorites.flatMap(book => book.categories || []);
            const uniqueCategories = [...new Set(categories)];

            if (uniqueCategories.length > 0) {
                // Search for books in favorite categories
                const category = uniqueCategories[Math.floor(Math.random() * uniqueCategories.length)];
                this.bookService.searchBooks({ query: category, maxResults: 6 }).subscribe({
                    next: (result) => {
                        // Filter out books already in favorites
                        const newBooks = result.books.filter(book =>
                            !favorites.some(fav => fav.id === book.id)
                        );
                        this.recommendations.set(newBooks.slice(0, 4));
                    },
                    error: () => {
                        // Handle error silently for recommendations
                        this.recommendations.set([]);
                    }
                });
            }
        }
    }

    filteredReadingList(): ReadingListItem[] {
        return this.readingList().filter(item => item.status === this.selectedStatus());
    }

    getStatusCount(status: ReadingListItem['status']): number {
        return this.readingList().filter(item => item.status === status).length;
    }

    getSelectedStatusLabel(): string {
        const status = this.readingStatuses.find(s => s.value === this.selectedStatus());
        return status?.label.toLowerCase() || '';
    }

    getStatusLabel(status: ReadingListItem['status']): string {
        const statusObj = this.readingStatuses.find(s => s.value === status);
        return statusObj?.label || status;
    }

    getStatusChipColor(status: ReadingListItem['status']): 'primary' | 'accent' | 'warn' {
        switch (status) {
            case 'completed': return 'primary';
            case 'currently-reading': return 'accent';
            default: return 'warn';
        }
    }

    repeatSearch(item: SearchHistoryItem): void {
        this.router.navigate(['/search'], { queryParams: { q: item.query } });
    }

    clearSearchHistory(): void {
        this.searchHistory.set([]);
        this.searchHistoryCount.set(0);
        localStorage.removeItem('search-history');
    }

    viewBookDetails(book: Book): void {
        this.router.navigate(['/book', book.id]);
    }

    toggleFavorite(book: Book): void {
        this.favoritesService.toggleFavorite(book);
    }

    isFavorite(bookId: string): boolean {
        // This would typically be implemented with a signal or observable
        return false; // Simplified for now
    }

    exportData(): void {
        const data = {
            favorites: this.getStoredData('favorites', []),
            searchHistory: this.getStoredData('search-history', []),
            readingList: this.getStoredData('reading-list', [])
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'findbook-data.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    getBookThumbnail(book: Book): string {
        return book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '/assets/book-placeholder.svg';
    }

    getBookAuthors(book: Book): string {
        return book.authors?.join(', ') || 'Unknown Author';
    }

    formatDate(date: Date): string {
        return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
            Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            'day'
        );
    }

    trackByHistoryId(index: number, item: SearchHistoryItem): string {
        return item.id;
    }

    trackByReadingId(index: number, item: ReadingListItem): string {
        return item.id;
    }

    trackByBookId(index: number, book: Book): string {
        return book.id;
    }

    private getStoredData<T>(key: string, defaultValue: T): T {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    }
}