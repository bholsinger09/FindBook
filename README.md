# FindBook 📚

> A modern, test-driven Angular application for discovering and exploring books using the Google Books API.

[![Angular](https://img.shields.io/badge/Angular-19%2B-red.svg)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue.svg)](https://www.typescriptlang.org/)
[![Material Design](https://img.shields.io/badge/Material%20Design-Latest-green.svg)](https://material.angular.io/)
[![Test Coverage](https://img.shields.io/badge/Test%20Coverage-High-brightgreen.svg)](#testing)

## 🚀 Features

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
