import { TestBed } from '@angular/core/testing';
import { ServiceWorkerService } from './service-worker.service';

describe('ServiceWorkerService', () => {
    let service: ServiceWorkerService;

    beforeEach(() => {
        // Mock navigator.serviceWorker
        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                register: jasmine.createSpy('register').and.returnValue(Promise.resolve({
                    addEventListener: jasmine.createSpy('addEventListener')
                })),
                getRegistration: jasmine.createSpy('getRegistration').and.returnValue(Promise.resolve({
                    update: jasmine.createSpy('update'),
                    waiting: null
                })),
                ready: Promise.resolve({
                    sync: {
                        register: jasmine.createSpy('syncRegister')
                    }
                })
            },
            writable: true
        });

        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            writable: true
        });

        // Mock caches API
        Object.defineProperty(window, 'caches', {
            value: {
                keys: jasmine.createSpy('keys').and.returnValue(Promise.resolve(['findbook-cache-1', 'other-cache'])),
                delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve(true)),
                open: jasmine.createSpy('open').and.returnValue(Promise.resolve({
                    put: jasmine.createSpy('put').and.returnValue(Promise.resolve())
                }))
            },
            writable: true
        });

        // Mock navigator.storage
        Object.defineProperty(navigator, 'storage', {
            value: {
                estimate: jasmine.createSpy('estimate').and.returnValue(Promise.resolve({
                    usage: 1024000,
                    quota: 50000000
                }))
            },
            writable: true
        });

        TestBed.configureTestingModule({});
        service = TestBed.inject(ServiceWorkerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Service Worker Registration', () => {
        it('should register service worker on initialization', () => {
            expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
        });

        it('should handle registration errors gracefully', async () => {
            const consoleErrorSpy = spyOn(console, 'error');
            const mockError = new Error('Registration failed');

            // Reset the service and make register fail
            (navigator.serviceWorker.register as jasmine.Spy).and.returnValue(Promise.reject(mockError));

            // Create new instance to trigger registration
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({});
            service = TestBed.inject(ServiceWorkerService);

            // Wait for async registration to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(consoleErrorSpy).toHaveBeenCalledWith('Service Worker registration failed:', mockError);
        });
    });

    describe('Online Status Management', () => {
        it('should return correct online status', () => {
            expect(service.online).toBe(true);
        });

        it('should update online status when going offline', () => {
            const offlineEvent = new Event('offline');
            const consoleSpy = spyOn(console, 'log');

            window.dispatchEvent(offlineEvent);

            expect(service.online).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('Application is offline');
        });

        it('should update online status when coming back online', () => {
            const onlineEvent = new Event('online');
            const consoleSpy = spyOn(console, 'log');

            // First go offline
            service['isOnline'] = false;

            // Then come back online
            window.dispatchEvent(onlineEvent);

            expect(service.online).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith('Application is back online');
        });
    });

    describe('Update Management', () => {
        it('should check for updates', async () => {
            const mockRegistration = {
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve())
            };

            (navigator.serviceWorker.getRegistration as jasmine.Spy).and.returnValue(Promise.resolve(mockRegistration));

            await service.checkForUpdate();

            expect(mockRegistration.update).toHaveBeenCalled();
        });

        it('should handle update check errors', async () => {
            const consoleErrorSpy = spyOn(console, 'error');
            const mockError = new Error('Update failed');

            (navigator.serviceWorker.getRegistration as jasmine.Spy).and.returnValue(Promise.reject(mockError));

            await service.checkForUpdate();

            expect(consoleErrorSpy).toHaveBeenCalledWith('Update check failed:', mockError);
        });
    });

    describe('Cache Management', () => {
        it('should clear all FindBook caches', async () => {
            const mockCacheNames = ['findbook-static-v1', 'findbook-api-v1', 'other-app-cache'];
            ((window as any).caches.keys as jasmine.Spy).and.returnValue(Promise.resolve(mockCacheNames));

            await service.clearCache();

            expect((window as any).caches.delete).toHaveBeenCalledWith('findbook-static-v1');
            expect((window as any).caches.delete).toHaveBeenCalledWith('findbook-api-v1');
            expect((window as any).caches.delete).not.toHaveBeenCalledWith('other-app-cache');
        });

        it('should get cache size estimate', async () => {
            const estimate = await service.getCacheSize();

            expect(navigator.storage.estimate).toHaveBeenCalled();
            expect(estimate).toEqual({ usage: 1024000, quota: 50000000 });
        });

        it('should handle storage estimate errors', async () => {
            const consoleErrorSpy = spyOn(console, 'error');
            const mockError = new Error('Estimate failed');

            (navigator.storage.estimate as jasmine.Spy).and.returnValue(Promise.reject(mockError));

            const estimate = await service.getCacheSize();

            expect(estimate).toEqual({ usage: 0, quota: 0 });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get storage estimate:', mockError);
        });
    });

    describe('Resource Preloading', () => {
        it('should preload critical resources', async () => {
            const mockCache = {
                put: jasmine.createSpy('put').and.returnValue(Promise.resolve())
            };
            ((window as any).caches.open as jasmine.Spy).and.returnValue(Promise.resolve(mockCache));

            // Mock fetch
            const mockResponse = new Response('test');
            Object.defineProperty(mockResponse, 'ok', { value: true });
            spyOn(window, 'fetch').and.returnValue(Promise.resolve(mockResponse));

            const urls = ['https://example.com/resource1.js', 'https://example.com/resource2.css'];

            await service.preloadCriticalResources(urls);

            expect((window as any).caches.open).toHaveBeenCalledWith('findbook-preload-v1');
            expect(window.fetch).toHaveBeenCalledTimes(2);
            expect(mockCache.put).toHaveBeenCalledTimes(2);
        });

        it('should handle preload failures gracefully', async () => {
            const mockCache = {
                put: jasmine.createSpy('put').and.returnValue(Promise.resolve())
            };
            ((window as any).caches.open as jasmine.Spy).and.returnValue(Promise.resolve(mockCache));

            const consoleWarnSpy = spyOn(console, 'warn');
            spyOn(window, 'fetch').and.returnValue(Promise.reject(new Error('Fetch failed')));

            const urls = ['https://example.com/failing-resource.js'];

            await service.preloadCriticalResources(urls);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Failed to preload: https://example.com/failing-resource.js',
                jasmine.any(Error)
            );
        });
    });

    describe('Background Sync', () => {
        it('should trigger background sync when available', async () => {
            const mockSyncManager = {
                register: jasmine.createSpy('register').and.returnValue(Promise.resolve())
            };

            Object.defineProperty(navigator.serviceWorker, 'ready', {
                value: Promise.resolve({
                    sync: mockSyncManager
                })
            });

            await service['triggerBackgroundSync']();

            expect(mockSyncManager.register).toHaveBeenCalledWith('background-sync');
        });

        it('should handle sync registration errors', async () => {
            const consoleSpy = spyOn(console, 'log');
            const mockError = new Error('Sync failed');

            Object.defineProperty(navigator.serviceWorker, 'ready', {
                value: Promise.resolve({
                    sync: {
                        register: jasmine.createSpy('register').and.returnValue(Promise.reject(mockError))
                    }
                })
            });

            await service['triggerBackgroundSync']();

            expect(consoleSpy).toHaveBeenCalledWith('Background sync registration failed:', mockError);
        });
    });

    describe('Service Worker Support Detection', () => {
        it('should handle environments without service worker support', () => {
            // Remove service worker support
            Object.defineProperty(navigator, 'serviceWorker', {
                value: undefined,
                writable: true
            });

            // This should not throw an error
            expect(() => {
                TestBed.resetTestingModule();
                TestBed.configureTestingModule({});
                service = TestBed.inject(ServiceWorkerService);
            }).not.toThrow();
        });
    });
});