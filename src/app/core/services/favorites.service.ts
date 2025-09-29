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
  private readonly DB_NAME = 'FindBookDB';
  private readonly DB_STORE = 'favorites';
  private favoritesSubject = new BehaviorSubject<FavoriteBook[]>([]);
  private offlineQueue: FavoriteBook[] = [];
  private useIndexedDB = false;

  public favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    // Detect if IndexedDB is available and use it for large lists
    this.useIndexedDB = typeof window !== 'undefined' && 'indexedDB' in window;
    this.loadFavorites();
    window.addEventListener('online', () => this.syncOfflineQueue());
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
    // If offline, queue the change for sync
    if (!navigator.onLine) {
      this.offlineQueue.push(favoriteBook);
    } else {
      this.saveFavoriteToDB(favoriteBook);
    }
  }

  /**
   * Remove a book from favorites
   */
  removeFromFavorites(bookId: string): void {
    const currentFavorites = this.getFavorites();
    const updatedFavorites = currentFavorites.filter((fav) => fav.id !== bookId);
    this.updateFavorites(updatedFavorites);
    if (navigator.onLine) {
      this.removeFavoriteFromDB(bookId);
    } else {
      // Queue removal for offline sync
      this.offlineQueue.push({ id: bookId, title: '', authors: [], addedDate: new Date() });
    }
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
    if (navigator.onLine) {
      this.clearFavoritesFromDB();
    }
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
    if (this.useIndexedDB) {
      this.saveFavoritesToDB(favorites);
    } else {
      this.saveFavoritesToStorage(favorites);
    }
  }

  private loadFavoritesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const favorites = JSON.parse(stored) as FavoriteBook[];
        const processedFavorites = favorites.map((fav) => ({
          ...fav,
          addedDate: new Date(fav.addedDate),
        }));
        this.favoritesSubject.next(processedFavorites);
      }
    } catch (error) {
      console.error('Failed to load favorites from storage:', error);
      this.favoritesSubject.next([]);
    }

  }

  private loadFavorites(): void {
    if (this.useIndexedDB) {
      this.loadFavoritesFromDB();
    } else {
      this.loadFavoritesFromStorage();
    }
  }

  // IndexedDB support
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.DB_STORE)) {
          db.createObjectStore(this.DB_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async loadFavoritesFromDB(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.DB_STORE, 'readonly');
      const store = tx.objectStore(this.DB_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const favorites = request.result as FavoriteBook[];
        this.favoritesSubject.next(favorites);
      };
      request.onerror = () => {
        console.error('Failed to load favorites from IndexedDB:', request.error);
        this.favoritesSubject.next([]);
      };
    } catch (error) {
      console.error('IndexedDB error:', error);
      this.favoritesSubject.next([]);
    }
  }

  private async saveFavoritesToDB(favorites: FavoriteBook[]): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.DB_STORE, 'readwrite');
      const store = tx.objectStore(this.DB_STORE);
      // Clear store first
      store.clear();
      for (const fav of favorites) {
        store.put(fav);
      }
    } catch (error) {
      console.error('Failed to save favorites to IndexedDB:', error);
    }
  }

  private async saveFavoriteToDB(fav: FavoriteBook): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.DB_STORE, 'readwrite');
      const store = tx.objectStore(this.DB_STORE);
      store.put(fav);
    } catch (error) {
      console.error('Failed to save favorite to IndexedDB:', error);
    }
  }

  private async removeFavoriteFromDB(bookId: string): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.DB_STORE, 'readwrite');
      const store = tx.objectStore(this.DB_STORE);
      store.delete(bookId);
    } catch (error) {
      console.error('Failed to remove favorite from IndexedDB:', error);
    }
  }

  private async clearFavoritesFromDB(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.DB_STORE, 'readwrite');
      const store = tx.objectStore(this.DB_STORE);
      store.clear();
    } catch (error) {
      console.error('Failed to clear favorites from IndexedDB:', error);
    }
  }

  private async syncOfflineQueue(): Promise<void> {
    if (!this.offlineQueue.length) return;
    for (const fav of this.offlineQueue) {
      if (fav.title) {
        await this.saveFavoriteToDB(fav);
      } else {
        await this.removeFavoriteFromDB(fav.id);
      }
    }
    this.offlineQueue = [];
    this.loadFavorites();
  }

  private saveFavoritesToStorage(favorites: FavoriteBook[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorites to storage:', error);
    }
  }
}
