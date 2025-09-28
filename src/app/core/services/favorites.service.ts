import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Book } from '../models';

export interface FavoriteBook {
  id: string;
  title: string;
  authors: string[];
  imageUrl?: string;
  addedDate: Date;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'findbook-favorites';
  private favoritesSubject = new BehaviorSubject<FavoriteBook[]>([]);

  public favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    this.loadFavoritesFromStorage();
  }

  /**
   * Get all favorite books
   */
  getFavorites(): FavoriteBook[] {
    return this.favoritesSubject.value;
  }

  /**
   * Get favorite book IDs as a Set for quick lookup
   */
  getFavoriteIds(): Set<string> {
    return new Set(this.favoritesSubject.value.map((fav) => fav.id));
  }

  /**
   * Check if a book is favorited
   */
  isFavorite(bookId: string): boolean {
    return this.getFavoriteIds().has(bookId);
  }

  /**
   * Add a book to favorites
   */
  addToFavorites(book: Book): void {
    const currentFavorites = this.getFavorites();

    // Check if already favorited
    if (this.isFavorite(book.id)) {
      return;
    }

    const favoriteBook: FavoriteBook = {
      id: book.id,
      title: book.title,
      authors: book.authors || [],
      imageUrl: book.imageLinks?.thumbnail?.replace('http:', 'https:'),
      addedDate: new Date(),
    };

    const updatedFavorites = [favoriteBook, ...currentFavorites];
    this.updateFavorites(updatedFavorites);
  }

  /**
   * Remove a book from favorites
   */
  removeFromFavorites(bookId: string): void {
    const currentFavorites = this.getFavorites();
    const updatedFavorites = currentFavorites.filter((fav) => fav.id !== bookId);
    this.updateFavorites(updatedFavorites);
  }

  /**
   * Toggle favorite status of a book
   */
  toggleFavorite(book: Book): boolean {
    const isCurrentlyFavorite = this.isFavorite(book.id);

    if (isCurrentlyFavorite) {
      this.removeFromFavorites(book.id);
    } else {
      this.addToFavorites(book);
    }

    return !isCurrentlyFavorite; // Return new favorite status
  }

  /**
   * Clear all favorites
   */
  clearAllFavorites(): void {
    this.updateFavorites([]);
  }

  /**
   * Get favorites count
   */
  getFavoritesCount(): number {
    return this.getFavorites().length;
  }

  /**
   * Search within favorites
   */
  searchFavorites(query: string): FavoriteBook[] {
    if (!query.trim()) {
      return this.getFavorites();
    }

    const searchTerm = query.toLowerCase();
    return this.getFavorites().filter(
      (fav) =>
        fav.title.toLowerCase().includes(searchTerm) ||
        fav.authors.some((author) => author.toLowerCase().includes(searchTerm)),
    );
  }

  /**
   * Get recently added favorites (last N items)
   */
  getRecentFavorites(limit = 5): FavoriteBook[] {
    return this.getFavorites()
      .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
      .slice(0, limit);
  }

  /**
   * Export favorites as JSON
   */
  exportFavorites(): string {
    return JSON.stringify(this.getFavorites(), null, 2);
  }

  /**
   * Import favorites from JSON
   */
  importFavorites(jsonData: string): boolean {
    try {
      const favorites = JSON.parse(jsonData) as FavoriteBook[];

      // Validate the data structure
      if (!Array.isArray(favorites)) {
        return false;
      }

      // Basic validation of each favorite
      const isValidData = favorites.every(
        (fav) =>
          fav &&
          typeof fav.id === 'string' &&
          typeof fav.title === 'string' &&
          Array.isArray(fav.authors),
      );

      if (!isValidData) {
        return false;
      }

      // Convert addedDate strings back to Date objects
      const processedFavorites = favorites.map((fav) => ({
        ...fav,
        addedDate: new Date(fav.addedDate),
      }));

      this.updateFavorites(processedFavorites);
      return true;
    } catch (error) {
      console.error('Failed to import favorites:', error);
      return false;
    }
  }

  private updateFavorites(favorites: FavoriteBook[]): void {
    this.favoritesSubject.next(favorites);
    this.saveFavoritesToStorage(favorites);
  }

  private loadFavoritesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const favorites = JSON.parse(stored) as FavoriteBook[];
        // Convert addedDate strings back to Date objects
        const processedFavorites = favorites.map((fav) => ({
          ...fav,
          addedDate: new Date(fav.addedDate),
        }));
        this.favoritesSubject.next(processedFavorites);
      }
    } catch (error) {
      console.error('Failed to load favorites from storage:', error);
      // Continue with empty favorites if storage fails
      this.favoritesSubject.next([]);
    }
  }

  private saveFavoritesToStorage(favorites: FavoriteBook[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorites to storage:', error);
    }
  }
}
