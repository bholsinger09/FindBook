import { Injectable } from '@angular/core';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  lazy?: boolean;
  placeholder?: string;
}

export interface ResponsiveImageSet {
  src: string;
  srcset: string;
  sizes: string;
  webpSrcset?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImageOptimizationService {
  private readonly imageCache = new Map<string, HTMLImageElement>();
  private readonly webpSupport = this.checkWebPSupport();

  constructor() {}

  /**
   * Check if the browser supports WebP images
   */
  private checkWebPSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Generate optimized image URL for Google Books API images
   */
  getOptimizedImageUrl(originalUrl: string, options: ImageOptimizationOptions = {}): string {
    if (!originalUrl || !originalUrl.includes('books.google.com')) {
      return originalUrl;
    }

    // Google Books API supports zoom parameter for different sizes
    // zoom=0: small thumbnail
    // zoom=1: medium thumbnail
    // zoom=2: large thumbnail
    const url = new URL(originalUrl);

    if (options.width && options.width <= 128) {
      url.searchParams.set('zoom', '0');
    } else if (options.width && options.width <= 256) {
      url.searchParams.set('zoom', '1');
    } else {
      url.searchParams.set('zoom', '2');
    }

    return url.toString();
  }

  /**
   * Generate responsive image set with multiple sizes
   */
  generateResponsiveImageSet(originalUrl: string, alt: string): ResponsiveImageSet {
    if (!originalUrl || !originalUrl.includes('books.google.com')) {
      return {
        src: originalUrl,
        srcset: originalUrl,
        sizes: '100vw',
      };
    }

    const baseUrl = new URL(originalUrl);

    // Generate different sizes for responsive images
    const sizes = [
      { size: 128, zoom: '0', descriptor: '128w' },
      { size: 256, zoom: '1', descriptor: '256w' },
      { size: 512, zoom: '2', descriptor: '512w' },
    ];

    const srcset = sizes
      .map(({ zoom, descriptor }) => {
        const url = new URL(baseUrl);
        url.searchParams.set('zoom', zoom);
        return `${url.toString()} ${descriptor}`;
      })
      .join(', ');

    return {
      src: this.getOptimizedImageUrl(originalUrl, { width: 256 }),
      srcset,
      sizes: '(max-width: 640px) 128px, (max-width: 1024px) 256px, 512px',
    };
  }

  /**
   * Preload critical images
   */
  async preloadImage(url: string, priority: 'high' | 'low' = 'low'): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();

      // Set priority hint for better loading performance
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = priority;
      }

      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };

      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Preload multiple images in batch
   */
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map((url) =>
      this.preloadImage(url, 'low').catch((err) => {
        console.warn(`Failed to preload image: ${url}`, err);
        return null;
      }),
    );

    await Promise.allSettled(promises);
  }

  /**
   * Create lazy loading intersection observer
   */
  createLazyLoader(callback: (entries: IntersectionObserverEntry[]) => void): IntersectionObserver {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
    };

    return new IntersectionObserver(callback, options);
  }

  /**
   * Generate blur placeholder data URL
   */
  generatePlaceholder(width = 256, height = 384): string {
    // Create a small canvas with a blur effect
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 30;

    const ctx = canvas.getContext('2d')!;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 30);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(1, '#e0e0e0');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 20, 30);

    return canvas.toDataURL('image/png');
  }

  /**
   * Check if image is in viewport
   */
  isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Get optimal image format based on browser support
   */
  async getOptimalFormat(originalUrl: string): Promise<string> {
    const supportsWebP = await this.webpSupport;

    if (supportsWebP && originalUrl.includes('books.google.com')) {
      // Note: Google Books API doesn't support WebP, but we can indicate preference
      return 'webp';
    }

    return 'jpeg';
  }

  /**
   * Calculate image loading priority based on position
   */
  getLoadingPriority(index: number, isVisible = false): 'high' | 'low' {
    // First 4 images or visible images get high priority
    return index < 4 || isVisible ? 'high' : 'low';
  }
}
