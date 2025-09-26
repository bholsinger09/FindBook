# Contributing to FindBook

First off, thank you for considering contributing to FindBook! It's people like you that make FindBook such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps which reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots and animated GIFs if applicable**
- **Include your environment details** (OS, browser, Angular version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior** and explain **which behavior you expected to see instead**
- **Explain why this enhancement would be useful**

### Pull Requests

The process described here has several goals:

- Maintain FindBook's quality
- Fix problems that are important to users
- Engage the community in working toward the best possible FindBook
- Enable a sustainable system for FindBook's maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1. **Fork** the repo and create your branch from `main`
2. **Follow the coding standards** described below
3. **Add tests** for any new functionality
4. **Ensure the test suite passes** (`npm run test:all`)
5. **Update documentation** as needed
6. **Create a pull request** with a clear title and description

## Development Process

### Setup
```bash
git clone https://github.com/bholsinger09/FindBook.git
cd FindBook
npm install
```

### Development Workflow
```bash
# Start development server
npm start

# Run tests
npm run test:all

# Build for production
npm run build:prod

# Lint code
npm run lint
```

### Coding Standards

#### TypeScript
- Use **strict mode** (`strict: true` in tsconfig.json)
- Follow **Angular style guide** conventions
- Use **explicit return types** for public methods
- Prefer **interfaces over classes** for data models
- Use **readonly** for immutable properties

#### Angular
- Use **standalone components** architecture
- Implement **OnPush change detection** where appropriate
- Follow **smart/dumb component** pattern
- Use **reactive forms** over template-driven forms
- Implement proper **error handling** and **loading states**

#### Testing
- Write **unit tests** for all components and services
- Aim for **85%+ code coverage**
- Use **descriptive test names** (`should do something when condition`)
- Mock external dependencies
- Test both **happy paths** and **error scenarios**

#### CSS/SCSS
- Use **Angular Material** components when possible
- Follow **BEM methodology** for custom CSS classes
- Implement **responsive design** (mobile-first)
- Use **CSS Grid** and **Flexbox** for layouts
- Maintain **accessibility standards** (WCAG 2.1)

### Commit Messages

Use **Conventional Commits** format:

```
type(scope): description

[optional body]

[optional footer(s)]
```

Types:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts

Examples:
```
feat(search): add advanced book filtering options

fix(favorites): resolve local storage persistence issue

docs(readme): update installation instructions

perf(book-list): implement virtual scrolling for large datasets
```

### Branch Naming

Use descriptive branch names:
- **feature/feature-name** - for new features
- **fix/bug-description** - for bug fixes
- **docs/documentation-update** - for documentation
- **refactor/component-name** - for refactoring

## Project Structure

```
src/
├── app/
│   ├── core/                   # Singleton services, guards, interceptors
│   ├── features/              # Feature modules (lazy-loaded)
│   ├── shared/                # Shared components, pipes, directives
│   └── testing/               # Test utilities and mocks
├── assets/                    # Static assets
├── environments/              # Environment configurations
└── styles/                    # Global styles
```

### Component Structure
```typescript
// component.ts
@Component({
  selector: 'app-component',
  standalone: true,
  imports: [...],
  templateUrl: './component.html',
  styleUrl: './component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Component implements OnInit, OnDestroy {
  // Public properties (template bindings)
  // Private properties
  // Constructor with dependency injection
  // Lifecycle hooks
  // Public methods (template callbacks)
  // Private methods
}
```

### Service Structure
```typescript
@Injectable({
  providedIn: 'root'
})
export class Service {
  // Private properties
  // Constructor
  // Public methods
  // Private methods
}
```

## Testing Guidelines

### Unit Tests
- Test **public API** of components/services
- Mock **external dependencies**
- Use **TestBed** for component testing
- Use **spies** for method testing
- Test **error scenarios**

```typescript
describe('BookService', () => {
  let service: BookService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(BookService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch books', () => {
    const mockBooks = [/* mock data */];
    
    service.getBooks().subscribe(books => {
      expect(books).toEqual(mockBooks);
    });

    const req = httpMock.expectOne('/api/books');
    expect(req.request.method).toBe('GET');
    req.flush(mockBooks);
  });
});
```

### E2E Tests
- Test **user workflows**, not implementation details
- Use **data-cy attributes** for element selection
- Test **responsive behavior**
- Include **accessibility checks**

```typescript
describe('Book Search', () => {
  it('should search for books and display results', () => {
    cy.visit('/');
    cy.get('[data-cy=search-input]').type('Angular');
    cy.get('[data-cy=search-button]').click();
    cy.get('[data-cy=book-list]').should('be.visible');
    cy.get('[data-cy=book-item]').should('have.length.greaterThan', 0);
  });
});
```

## Performance Guidelines

### Bundle Size
- Keep initial bundle **under 500KB**
- Use **lazy loading** for feature modules
- Implement **tree shaking**
- Minimize **third-party dependencies**

### Runtime Performance
- Use **OnPush change detection**
- Implement **virtual scrolling** for large lists
- **Lazy load images**
- **Debounce user input**
- **Cache API responses**

### Core Web Vitals
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

## Documentation

### Code Documentation
- Use **JSDoc** for public APIs
- Include **examples** for complex functions
- Document **interfaces** and **type definitions**
- Explain **business logic** and **algorithms**

### README Updates
- Keep **installation instructions** current
- Update **feature lists** for new functionality
- Maintain **API documentation**
- Include **screenshots** for UI changes

## Questions?

Feel free to open an issue for any questions about contributing. We're here to help!

## Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **CHANGELOG.md** for significant contributions
- **GitHub releases** for major features

Thank you for contributing to FindBook! 🚀