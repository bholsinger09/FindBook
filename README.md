# 📚 FindBook - Discover Your Next Great Read

![FindBook Banner](https://img.shields.io/badge/Angular-19-red?style=for-the-badge&logo=angular) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript) ![Material Design](https://img.shields.io/badge/Material_Design-20-blue?style=for-the-badge&logo=material-design) ![Bundle Size](https://img.shields.io/badge/Bundle_Size-161KB_gzipped-green?style=for-the-badge) ![Tests](https://img.shields.io/badge/Unit_Tests-88/88_Passing-green?style=for-the-badge)

> A modern, performance-optimized Angular application for discovering and exploring books using the Google Books API. Built with best practices, comprehensive testing, accessibility features, and professional-grade optimizations.

## 🌟 Live Demo

**[🚀 View Live Application](https://bholsinger09.github.io/FindBook)**

*Experience the full-featured book discovery platform with real-time search, favorites management, accessibility features, and performance monitoring.*

---

## ✨ Recent Updates

### **Code Quality Improvements** *(September 2025)*
- ✅ **All 88 unit tests passing** - Complete test suite coverage with Jasmine/Karma
- ✅ **Manual code refinement** - Enhanced formatting, consistency, and maintainability across 40+ files  
- ✅ **Accessibility enhancements** - WCAG 2.1 AA compliance with CDK A11y integration
- ✅ **Production build optimized** - 647KB initial bundle (161KB gzipped) with effective lazy loading
- ✅ **Platform compatibility fixes** - Resolved service injection issues for cross-browser support

---

## 🎯 Project Overview

FindBook is a sophisticated single-page application that demonstrates modern Angular development practices, performance optimization techniques, and comprehensive testing strategies. Built as a portfolio showcase, it combines elegant UI/UX design with robust functionality and professional-grade engineering.

### 🔍 Key Features

- **📖 Smart Book Search**: Advanced search with filters, suggestions, and real-time results
- **❤️ Favorites Management**: Persistent favorites with local storage and advanced filtering  
- **📱 Responsive Design**: Mobile-first approach with Material Design components
- **⚡ Performance Optimized**: Lazy loading, virtual scrolling, and optimized bundle sizes
- **📊 Performance Monitoring**: Real-time Core Web Vitals tracking and dashboard
- **🧪 Comprehensive Testing**: 88 passing unit tests with Jasmine/Karma and E2E tests with Cypress
- **♿ Accessibility Ready**: WCAG 2.1 AA compliance, ARIA labels, keyboard navigation, and screen reader support

---

## 🏗️ Architecture & Tech Stack

### **Frontend Framework**
- **Angular 19** - Latest standalone components architecture with dependency injection
- **TypeScript 5.9** - Strong typing and modern JavaScript features
- **RxJS 7.8** - Reactive programming and state management

### **UI/UX & Accessibility** 
- **Angular Material 20** - Modern Material Design components
- **Angular CDK A11y** - Comprehensive accessibility features and focus management
- **Responsive Design** - Mobile-first CSS Grid and Flexbox

### **Performance & Optimization**
- **Lazy Loading** - Route-based code splitting (161KB initial gzipped)
- **Virtual Scrolling** - Efficient large list rendering
- **Bundle Analysis** - Production build optimization with webpack analysis  
- **Core Web Vitals** - Real-time performance monitoring

### **Testing & Quality Assurance**
- **Jasmine/Karma** - 88 passing unit tests with comprehensive coverage
- **Cypress** - End-to-end testing with comprehensive scenarios
- **Test-Driven Development** - TDD methodology throughout

### **Development Tools**
- **Angular CLI 20** - Modern build system and development server
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **Husky** - Git hooks for quality assurance

---

## 🚀 Performance Metrics

### Bundle Size Optimization
- **Before Optimization**: 748KB (❌ Exceeded budget)
- **After Optimization**: 391KB (✅ 47% reduction)
- **Transfer Size**: 108KB (Excellent compression)
- **Bundle Budget**: ✅ Under 500KB target

### Lazy Loading Implementation
- **Search Page**: 66KB lazy chunk
- **Book Details**: 3.5KB lazy chunk  
- **Performance Dashboard**: 44KB lazy chunk
- **Route-based Code Splitting**: ✅ Implemented

### Core Web Vitals
- **First Contentful Paint (FCP)**: <1.8s (Good)
- **Largest Contentful Paint (LCP)**: <2.5s (Good)
- **Cumulative Layout Shift (CLS)**: <0.1 (Good)

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js** 18+ and npm 9+
- **Angular CLI** 20+
- Modern browser with ES2022 support

### Quick Start

```bash
# Clone the repository
git clone https://github.com/bholsinger09/FindBook.git
cd FindBook

# Install dependencies
npm install

# Start development server
npm start

# Open browser to http://localhost:4200
```

### Development Commands

```bash
# Development server
npm start                    # Start dev server on port 4200

# Building
npm run build               # Production build
npm run build:prod          # Optimized production build  
npm run build:analyze       # Build with bundle analysis

# Testing
npm test                    # Unit tests (watch mode)
npm run test:unit           # Unit tests (single run)
npm run e2e                 # E2E tests (headless)
npm run e2e:open            # E2E tests (interactive)
npm run test:all            # Run all tests

# Code Quality
npm run lint                # Lint TypeScript and templates
npm run format              # Format code with Prettier
```

---

## 🧪 Testing Strategy

### Unit Testing with Jasmine/Karma
- **Coverage Target**: 85%+ code coverage
- **Test Categories**: Components, Services, Pipes, Guards
- **Mocking Strategy**: Comprehensive service mocks and fixtures
- **CI Integration**: Automated testing on every commit

```bash
# Run unit tests
npm run test:unit

# Generate coverage report
npm test -- --code-coverage
```

### E2E Testing with Cypress
- **Scenarios Covered**: 100+ test scenarios
- **User Workflows**: Search, navigation, favorites, responsive design
- **Cross-browser**: Chrome, Firefox, Edge testing
- **Visual Testing**: Screenshot comparisons and UI validation

```bash
# Run E2E tests (headless)
npm run e2e

# Run E2E tests (interactive)
npm run e2e:open

# Run both test suites
npm run test:all
```

### Test Files Structure
```
cypress/
├── e2e/                    # E2E test specifications
├── fixtures/               # Test data and mocks
├── support/                # Custom commands and utilities
└── cypress.config.ts       # Cypress configuration

src/
├── app/
│   ├── **/*.spec.ts       # Unit test files
│   └── testing/           # Test utilities and mocks
└── karma.conf.js          # Karma configuration
```

---

## 📊 Performance Dashboard

Access the integrated performance monitoring dashboard at `/performance` to view:

- **Core Web Vitals**: Real-time FCP, LCP, and CLS metrics
- **API Performance**: Book search and details loading times
- **Bundle Analysis**: Component-wise size breakdown
- **User Experience**: Interactive performance insights

---

## 🔧 Configuration

### Environment Variables
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  googleBooksApiUrl: 'https://www.googleapis.com/books/v1',
  enablePerformanceLogging: true,
  version: '1.0.0'
};
```

### Angular Configuration
```json
// angular.json - Key configurations
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    }
  ],
  "optimization": true,
  "sourceMap": false,
  "namedChunks": false
}
```

---

## 🌐 Deployment

### GitHub Pages (Recommended)
```bash
# Install Angular CLI GitHub Pages support
npm install -g angular-cli-ghpages

# Build and deploy
npm run build:prod
npx angular-cli-ghpages --dir=dist/findbook-app
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Netlify Deployment
```bash
# Install Netlify CLI  
npm install -g netlify-cli

# Build and deploy
npm run build:prod
netlify deploy --prod --dir=dist/findbook-app
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                   # Core services and models
│   │   ├── models/            # TypeScript interfaces
│   │   └── services/          # Injectable services
│   ├── features/              # Feature modules
│   │   ├── book-search/       # Search functionality
│   │   └── book-details/      # Book details pages
│   ├── shared/                # Shared components
│   │   └── components/        # Reusable UI components
│   └── testing/               # Test utilities
├── assets/                    # Static assets
├── environments/              # Environment configurations
└── styles/                    # Global styles and themes
```

### Key Components
- **SearchPage**: Main book search interface with filters
- **BookList**: Optimized book grid with virtual scrolling
- **BookDetails**: Comprehensive book information display
- **PerformanceDashboard**: Real-time metrics and analytics

---

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Implement** changes with tests
4. **Run** the test suite (`npm run test:all`)
5. **Commit** changes (`git commit -m 'feat: add amazing feature'`)
6. **Push** to branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Angular recommended rules
- **Prettier**: Consistent code formatting
- **Commit Convention**: Conventional Commits specification

---

## 📈 Performance Optimizations

### Implemented Optimizations
✅ **Route-based lazy loading** - 47% bundle size reduction  
✅ **Virtual scrolling** - Efficient large list rendering  
✅ **Image optimization** - Lazy loading with fallbacks  
✅ **Bundle analysis** - webpack-bundle-analyzer integration  
✅ **Core Web Vitals monitoring** - Real-time performance tracking  
✅ **Tree shaking** - Unused code elimination  
✅ **Compression** - Gzip and Brotli support  

### Performance Monitoring
- **PerformanceService**: Custom monitoring service
- **Core Web Vitals**: FCP, LCP, CLS tracking
- **API Performance**: Request timing and analysis
- **Bundle Monitoring**: Size tracking and alerts

---

## 🛠️ Development Notes

### Design Decisions
- **Standalone Components**: Modern Angular architecture
- **Reactive Forms**: Type-safe form handling
- **OnPush Strategy**: Optimized change detection
- **Smart/Dumb Components**: Clear separation of concerns

### Best Practices Implemented
- **SOLID Principles**: Clean, maintainable code architecture
- **Dependency Injection**: Testable and modular services
- **Error Handling**: Comprehensive error boundaries
- **Loading States**: Smooth user experience indicators

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 About the Developer

**Ben Holsinger** - Full Stack Developer  
📧 [Contact](mailto:your-email@example.com)  
🔗 [LinkedIn](https://linkedin.com/in/yourprofile)  
🐙 [GitHub](https://github.com/bholsinger09)  

---

## 🙏 Acknowledgments

- **Google Books API** - Comprehensive book data source
- **Angular Team** - Outstanding framework and tooling
- **Material Design** - Beautiful, accessible UI components
- **Open Source Community** - Inspiration and best practices

---

<div align="center">

**⭐ Star this repository if it helped you learn modern Angular development! ⭐**

[🚀 View Live Demo](https://bholsinger09.github.io/FindBook) • [📖 Documentation](README.md) • [🐛 Report Bug](https://github.com/bholsinger09/FindBook/issues) • [💡 Request Feature](https://github.com/bholsinger09/FindBook/issues)

</div>

- **📖 Book Search**: Search by title, author, ISBN, or keywords
- **📄 Book Details**: Comprehensive book information with ratings and descriptions
- **⭐ Favorites**: Save and manage favorite books with local storage
- **📱 Responsive Design**: Mobile-first approach with Angular Material
- **🔍 Advanced Filtering**: Filter by genre, publication date, language, and more
- **📊 Search History**: Track and revisit recent searches
- **🎨 Modern UI**: Clean, accessible interface with loading states

## 🛠️ Tech Stack

- **Framework**: Angular 19+ with Standalone Components
- **Language**: TypeScript 5+
- **UI Library**: Angular Material
- **HTTP Client**: Angular HttpClient with RxJS
- **Testing**: Jasmine, Karma, Cypress
- **API**: Google Books API
- **Build Tool**: Angular CLI with Vite

## 🏗️ Architecture

This project follows modern Angular best practices with a clean architecture:

```
src/app/
├── core/                    # Core services and models
│   ├── models/             # TypeScript interfaces
│   │   ├── book.model.ts
│   │   ├── api-response.model.ts
│   │   └── common.model.ts
│   └── services/           # HTTP services
│       └── book.service.ts
├── features/               # Feature modules
│   ├── book-search/       # Search functionality
│   ├── book-details/      # Book detail views
│   └── favorites/         # Favorites management
├── shared/                # Shared components
│   ├── components/        # Reusable UI components
│   └── pipes/            # Custom pipes
└── layout/               # Layout components
    ├── header/
    ├── footer/
    └── navigation/
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 19+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bholsinger09/FindBook.git
   cd FindBook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200/`

### Development Commands

| Command | Description |
|---------|-------------|
| `ng serve` | Start development server |
| `ng build` | Build the project |
| `ng test` | Run unit tests |
| `ng e2e` | Run end-to-end tests |
| `ng lint` | Run linting |

## 🧪 Testing

This project uses **Test-Driven Development (TDD)** approach:

- **Unit Tests**: Jasmine + Karma
- **Integration Tests**: Angular Testing Utilities  
- **E2E Tests**: Cypress
- **Coverage**: High test coverage maintained

```bash
# Run unit tests
npm test

# Run tests with coverage
ng test --code-coverage

# Run E2E tests
npm run e2e
```

## 📁 Project Structure

```
├── ARCHITECTURE.md         # Detailed architecture documentation
├── src/
│   ├── app/
│   │   ├── core/           # Singleton services, guards, models
│   │   ├── features/       # Feature-specific components
│   │   ├── shared/         # Shared components, pipes, directives
│   │   └── layout/         # Layout components
│   ├── assets/             # Static assets
│   └── styles/             # Global styles
├── docs/                   # Documentation
└── e2e/                    # End-to-end tests
```

## 🎯 Development Approach

### Test-Driven Development
1. **Red**: Write failing tests first
2. **Green**: Write minimal code to pass tests  
3. **Refactor**: Improve code while keeping tests green

### Code Quality
- TypeScript strict mode enabled
- ESLint + Prettier configuration
- Husky git hooks for pre-commit checks
- Angular style guide compliance

## 🚀 Deployment

The application can be deployed to various platforms:

### GitHub Pages
```bash
ng build --prod
npx angular-cli-ghpages --dir=dist/findbook
```

### Netlify/Vercel
```bash
ng build --prod
# Upload dist/ folder to your platform
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Integration

This application integrates with the Google Books API:

- **Base URL**: `https://www.googleapis.com/books/v1`
- **Search Endpoint**: `/volumes?q={searchTerms}`
- **Book Details**: `/volumes/{volumeId}`
- **Features**: Full-text search, filtering, sorting

## 🔒 Environment Variables

Create `.env` file for configuration:

```env
GOOGLE_BOOKS_API_KEY=your_api_key_here
API_BASE_URL=https://www.googleapis.com/books/v1
```

## 📊 Performance

- **Lazy Loading**: Route-based code splitting
- **OnPush Change Detection**: Optimized rendering
- **Service Workers**: Offline capability
- **Bundle Analysis**: Regular size monitoring

## 🐛 Known Issues

- Chrome browser required for running tests locally
- API rate limiting may occur with excessive requests

## 📚 Resources

- [Angular Documentation](https://angular.dev/)
- [Angular Material](https://material.angular.io/)
- [Google Books API](https://developers.google.com/books)
- [RxJS Documentation](https://rxjs.dev/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ben Holsinger**
- GitHub: [@bholsinger09](https://github.com/bholsinger09)
- Portfolio: [Your Portfolio URL]

---

⭐ If you found this project helpful, please give it a star!
