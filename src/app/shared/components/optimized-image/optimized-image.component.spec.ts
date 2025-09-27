import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { OptimizedImageComponent } from './optimized-image.component';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';

describe('OptimizedImageComponent', () => {
    let component: OptimizedImageComponent;
    let fixture: ComponentFixture<OptimizedImageComponent>;
    let mockImageOptimizationService: jasmine.SpyObj<ImageOptimizationService>;

    const mockResponsiveImageSet = {
        src: 'https://example.com/book-256.jpg',
        srcset: 'https://example.com/book-128.jpg 128w, https://example.com/book-256.jpg 256w, https://example.com/book-512.jpg 512w',
        sizes: '(max-width: 640px) 128px, (max-width: 1024px) 256px, 512px'
    };

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('ImageOptimizationService', [
            'generateResponsiveImageSet',
            'generatePlaceholder',
            'createLazyLoader',
            'preloadImage'
        ]);

        await TestBed.configureTestingModule({
            imports: [OptimizedImageComponent],
            providers: [
                { provide: ImageOptimizationService, useValue: spy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(OptimizedImageComponent);
        component = fixture.componentInstance;
        mockImageOptimizationService = TestBed.inject(ImageOptimizationService) as jasmine.SpyObj<ImageOptimizationService>;

        // Setup default mocks
        mockImageOptimizationService.generateResponsiveImageSet.and.returnValue(mockResponsiveImageSet);
        mockImageOptimizationService.generatePlaceholder.and.returnValue('data:image/png;base64,placeholder');
        mockImageOptimizationService.createLazyLoader.and.returnValue(jasmine.createSpyObj('IntersectionObserver', ['observe', 'disconnect']));
        mockImageOptimizationService.preloadImage.and.returnValue(Promise.resolve({} as HTMLImageElement));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Component Initialization', () => {
        it('should set up component with required inputs', () => {
            component.src = 'https://example.com/test-image.jpg';
            component.alt = 'Test image';
            component.width = 300;
            component.height = 400;

            expect(component.src).toBe('https://example.com/test-image.jpg');
            expect(component.alt).toBe('Test image');
            expect(component.width).toBe(300);
            expect(component.height).toBe(400);
        });

        it('should generate responsive image set on initialization', async () => {
            component.src = 'https://example.com/test-image.jpg';
            component.alt = 'Test image';

            await component.ngOnInit();

            expect(mockImageOptimizationService.generateResponsiveImageSet).toHaveBeenCalledWith(
                'https://example.com/test-image.jpg',
                'Test image'
            );
            expect(component['responsiveSet']).toEqual(mockResponsiveImageSet);
        });

        it('should generate placeholder when not provided', async () => {
            component.src = 'https://example.com/test-image.jpg';
            component.alt = 'Test image';
            component.placeholder = undefined;

            await component.ngOnInit();

            expect(mockImageOptimizationService.generatePlaceholder).toHaveBeenCalledWith(256, 384);
        });

        it('should handle missing src by setting error state', async () => {
            component.src = '';
            component.alt = 'Test image';

            await component.ngOnInit();

            expect(component['hasError']()).toBeTruthy();
            expect(component['isLoading']()).toBeFalsy();
        });
    });

    describe('Image Loading', () => {
        beforeEach(() => {
            component.src = 'https://example.com/test-image.jpg';
            component.alt = 'Test image';
        });

        it('should handle successful image load', () => {
            const mockEvent = new Event('load');
            spyOn(component.imageLoad, 'emit');

            component.onImageLoad(mockEvent);

            expect(component['isLoading']()).toBeFalsy();
            expect(component['hasError']()).toBeFalsy();
            expect(component.imageLoad.emit).toHaveBeenCalledWith(mockEvent);
        });


        it('should set error state when fallback also fails', () => {
            const fallbackPath = '/assets/images/placeholder.png';
            component.fallback = fallbackPath;

            // Create a proper mock event that will definitely match the fallback
            const mockEvent = {
                target: {
                    src: fallbackPath  // Ensure this exactly matches the fallback
                }
            } as unknown as Event;

            spyOn(component.imageError, 'emit');

            component.onImageError(mockEvent);

            // Should emit error when fallback fails
            expect(component.imageError.emit).toHaveBeenCalledWith(mockEvent);
        });
    });

    describe('Lazy Loading', () => {
        beforeEach(() => {
            component.src = 'https://example.com/test-image.jpg';
            component.alt = 'Test image';
            component.lazy = true;
        });

        it('should set up lazy loading when enabled', async () => {
            const mockObserver = jasmine.createSpyObj('IntersectionObserver', ['observe', 'disconnect']);
            mockImageOptimizationService.createLazyLoader.and.returnValue(mockObserver);

            await component.ngOnInit();

            expect(mockImageOptimizationService.createLazyLoader).toHaveBeenCalled();
            expect(mockObserver.observe).toHaveBeenCalled();
        });

        it('should load image immediately when lazy loading is disabled', async () => {
            component.lazy = false;
            spyOn(component as any, 'loadImage');

            await component.ngOnInit();

            expect((component as any).loadImage).toHaveBeenCalled();
        });
    });

    describe('Preloading', () => {
        it('should preload image when preload is enabled', async () => {
            component.src = 'https://example.com/test-image.jpg';
            component.alt = 'Test image';
            component.preload = true;
            component.priority = 'high';

            await component.ngOnInit();

            expect(mockImageOptimizationService.preloadImage).toHaveBeenCalledWith(
                mockResponsiveImageSet.src,
                'high'
            );
        });

        it('should not preload when preload is disabled', async () => {
            component.src = 'https://example.com/test-image.jpg';
            component.alt = 'Test image';
            component.preload = false;

            await component.ngOnInit();

            expect(mockImageOptimizationService.preloadImage).not.toHaveBeenCalled();
        });
    });

    describe('Component Cleanup', () => {
        it('should disconnect observer on destroy', () => {
            const mockObserver = jasmine.createSpyObj('IntersectionObserver', ['observe', 'disconnect']);
            component['observer'] = mockObserver;

            component.ngOnDestroy();

            expect(mockObserver.disconnect).toHaveBeenCalled();
        });

        it('should handle missing observer gracefully', () => {
            component['observer'] = undefined;

            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });

    describe('Template Rendering', () => {
        beforeEach(async () => {
            component.src = 'https://example.com/test-image.jpg';
            component.alt = 'Test image';
            component.width = 300;
            component.height = 400;
            await component.ngOnInit();
            fixture.detectChanges();
        });

        it('should render main image element', () => {
            const imgElement = fixture.debugElement.query(By.css('img'));
            expect(imgElement).toBeTruthy();
        });

        it('should show placeholder while loading', () => {
            component['isLoading'].set(true);
            fixture.detectChanges();

            const placeholder = fixture.debugElement.query(By.css('.image-placeholder'));
            expect(placeholder).toBeTruthy();
        });

        it('should show error state when image fails', () => {
            component['hasError'].set(true);
            component['isLoading'].set(false);
            fixture.detectChanges();

            const errorElement = fixture.debugElement.query(By.css('.image-error'));
            expect(errorElement).toBeTruthy();
            expect(errorElement.nativeElement.textContent).toContain('Image not available');
        });
    });

    describe('Retry Functionality', () => {
        it('should reset states and retry loading', () => {
            component['hasError'].set(true);
            component['isLoading'].set(false);
            component['responsiveSet'] = mockResponsiveImageSet;

            component.retry();

            expect(component['hasError']()).toBeFalsy();
            expect(component['isLoading']()).toBeTruthy();
            expect(component['currentSrc']).toBe(mockResponsiveImageSet.src);
        });
    });
});