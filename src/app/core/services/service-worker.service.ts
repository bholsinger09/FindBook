import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
    providedIn: 'root'
})
export class ServiceWorkerService {
    private isOnline = navigator.onLine;
    private logger = inject(LoggerService);

    constructor() {
        this.registerServiceWorker();
        this.setupOnlineStatusListener();
    }

    /**
     * Register the service worker
     */
    private async registerServiceWorker(): Promise<void> {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                this.logger.serviceWorker('Service Worker registered successfully', { scope: registration.scope });

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // New content is available
                                    this.notifyUpdate();
                                } else {
                                    // Content is cached for offline use
                                    this.logger.serviceWorker('Content is cached for offline use');
                                }
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Setup online/offline status listener
     */
    private setupOnlineStatusListener(): void {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.logger.serviceWorker('Application is back online');
            this.onOnlineStatusChange(true);
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.logger.serviceWorker('Application is offline');
            this.onOnlineStatusChange(false);
        });
    }

    /**
     * Notify user about available updates
     */
    private notifyUpdate(): void {
        const userResponse = confirm(
            'A new version of FindBook is available. Would you like to update now?'
        );

        if (userResponse) {
            this.applyUpdate();
        }
    }

    /**
     * Apply the available update
     */
    private async applyUpdate(): Promise<void> {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration && registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            window.location.reload();
        }
    }

    /**
     * Handle online status changes
     */
    private onOnlineStatusChange(isOnline: boolean): void {
        if (isOnline) {
            // Trigger background sync when coming back online
            this.triggerBackgroundSync();
        }

        // Notify components about status change
        document.dispatchEvent(new CustomEvent('onlineStatusChange', {
            detail: { isOnline }
        }));
    }

    /**
     * Trigger background sync
     */
    private async triggerBackgroundSync(): Promise<void> {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                // Use type assertion for experimental API
                const syncManager = (registration as any).sync;
                if (syncManager) {
                    await syncManager.register('background-sync');
                    this.logger.serviceWorker('Background sync registered');
                }
            } catch (error) {
                this.logger.serviceWorker('Background sync registration failed', error);
            }
        }
    }

    /**
     * Check if the app is currently online
     */
    public get online(): boolean {
        return this.isOnline;
    }

    /**
     * Force check for updates
     */
    public async checkForUpdate(): Promise<void> {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.update();
                    this.logger.serviceWorker('Update check completed');
                }
            } catch (error) {
                console.error('Update check failed:', error);
            }
        }
    }

    /**
     * Clear all caches
     */
    public async clearCache(): Promise<void> {
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                const deletePromises = cacheNames
                    .filter(name => name.startsWith('findbook-'))
                    .map(name => caches.delete(name));

                await Promise.all(deletePromises);
                this.logger.serviceWorker('All caches cleared');
            } catch (error) {
                console.error('Failed to clear cache:', error);
            }
        }
    }

    /**
     * Get cache storage estimate
     */
    public async getCacheSize(): Promise<{ usage: number, quota: number }> {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage || 0,
                    quota: estimate.quota || 0
                };
            } catch (error) {
                console.error('Failed to get storage estimate:', error);
            }
        }

        return { usage: 0, quota: 0 };
    }

    /**
     * Preload critical resources
     */
    public async preloadCriticalResources(urls: string[]): Promise<void> {
        if ('caches' in window) {
            try {
                const cache = await caches.open('findbook-preload-v1');
                const requests = urls.map(url => new Request(url));

                for (const request of requests) {
                    try {
                        const response = await fetch(request);
                        if (response.ok) {
                            await cache.put(request, response);
                        }
                    } catch (error) {
                        console.warn(`Failed to preload: ${request.url}`, error);
                    }
                }

                this.logger.serviceWorker(`Preloaded ${urls.length} resources`, { count: urls.length });
            } catch (error) {
                console.error('Failed to preload resources:', error);
            }
        }
    }
}