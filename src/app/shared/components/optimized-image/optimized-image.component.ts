import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ImageOptimizationService,
  ResponsiveImageSet,
} from '../../../core/services/image-optimization.service';

@Component({
  selector: 'app-optimized-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-container" [class.loading]="isLoading()" [class.error]="hasError()">
      <!-- Placeholder while loading -->
      <div
        *ngIf="isLoading() && placeholder"
        class="image-placeholder"
        [style.background-image]="'url(' + placeholder + ')'"
        [style.width.px]="width"
        [style.height.px]="height"
      ></div>

      <!-- Main image -->
      <img
        #imageElement
        [src]="currentSrc"
        [srcset]="responsiveSet?.srcset"
        [sizes]="responsiveSet?.sizes"
        [alt]="alt"
        [width]="width"
        [height]="height"
        [loading]="lazy ? 'lazy' : 'eager'"
        [class.fade-in]="!isLoading()"
        (load)="onImageLoad($event)"
        (error)="onImageError($event)"
        [style.opacity]="isLoading() ? '0' : '1'"
      />

      <!-- WebP source if supported -->
      <picture *ngIf="responsiveSet?.webpSrcset">
        <source
          [srcset]="responsiveSet?.webpSrcset"
          [sizes]="responsiveSet?.sizes"
          type="image/webp"
        />
        <img
          [src]="currentSrc"
          [srcset]="responsiveSet?.srcset"
          [sizes]="responsiveSet?.sizes"
          [alt]="alt"
          [loading]="lazy ? 'lazy' : 'eager'"
          (load)="onImageLoad($event)"
          (error)="onImageError($event)"
        />
      </picture>

      <!-- Error state -->
      <div
        *ngIf="hasError()"
        class="image-error"
        [style.width.px]="width"
        [style.height.px]="height"
      >
        <div class="error-content">
          <span class="error-icon">📚</span>
          <span class="error-text">Image not available</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .image-container {
        position: relative;
        display: inline-block;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .image-container img {
        display: block;
        width: 100%;
        height: auto;
        transition: opacity 0.3s ease;
      }

      .image-placeholder {
        position: absolute;
        top: 0;
        left: 0;
        background-color: #f5f5f5;
        background-size: cover;
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      }

      .fade-in {
        animation: fadeIn 0.3s ease-in;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      .loading {
        background-color: #f5f5f5;
      }

      .image-error {
        background-color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px dashed #ddd;
        border-radius: 4px;
      }

      .error-content {
        text-align: center;
        color: #666;
        padding: 1rem;
      }

      .error-icon {
        display: block;
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      .error-text {
        font-size: 0.875rem;
      }
    `,
  ],
})
export class OptimizedImageComponent implements OnInit, OnDestroy {
  @Input() src!: string;
  @Input() alt!: string;
  @Input() width = 256;
  @Input() height = 384;
  @Input() lazy = true;
  @Input() placeholder?: string;
  @Input() fallback = '/assets/images/book-placeholder.png';
  @Input() preload = false;
  @Input() priority: 'high' | 'low' = 'low';

  @Output() imageLoad = new EventEmitter<Event>();
  @Output() imageError = new EventEmitter<Event>();

  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;

  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  protected currentSrc = '';
  protected responsiveSet?: ResponsiveImageSet;

  private observer?: IntersectionObserver;

  constructor(
    private imageOptimizationService: ImageOptimizationService,
    private elementRef: ElementRef,
  ) {}

  async ngOnInit() {
    if (!this.src) {
      this.hasError.set(true);
      this.isLoading.set(false);
      return;
    }

    // Generate placeholder if not provided
    if (!this.placeholder) {
      this.placeholder = this.imageOptimizationService.generatePlaceholder(this.width, this.height);
    }

    // Generate responsive image set
    this.responsiveSet = this.imageOptimizationService.generateResponsiveImageSet(
      this.src,
      this.alt,
    );
    this.currentSrc = this.responsiveSet.src;

    // Set up lazy loading if enabled
    if (this.lazy && !this.preload) {
      this.setupLazyLoading();
    } else {
      this.loadImage();
    }

    // Preload image if requested
    if (this.preload) {
      this.preloadImage();
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupLazyLoading(): void {
    this.observer = this.imageOptimizationService.createLazyLoader(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry: IntersectionObserverEntry) => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.observer?.unobserve(entry.target);
          }
        });
      },
    );

    if (this.observer) {
      this.observer.observe(this.elementRef.nativeElement);
    }
  }

  private async preloadImage(): Promise<void> {
    try {
      await this.imageOptimizationService.preloadImage(this.currentSrc, this.priority);
    } catch (error) {
      console.warn('Failed to preload image:', this.currentSrc, error);
    }
  }

  private loadImage(): void {
    if (!this.currentSrc) {
      this.onImageError(new Event('error'));
      return;
    }

    // Reset states
    this.hasError.set(false);
    this.isLoading.set(true);
  }

  onImageLoad(event: Event): void {
    this.isLoading.set(false);
    this.hasError.set(false);
    this.imageLoad.emit(event);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;

    // Try fallback image if current src is not the fallback
    if (img.src !== this.fallback && this.fallback) {
      this.currentSrc = this.fallback;
      return;
    }

    this.isLoading.set(false);
    this.hasError.set(true);
    this.imageError.emit(event);
  }

  /**
   * Retry loading the image
   */
  retry(): void {
    this.hasError.set(false);
    this.isLoading.set(true);
    this.currentSrc = this.responsiveSet?.src || this.src;
  }
}
