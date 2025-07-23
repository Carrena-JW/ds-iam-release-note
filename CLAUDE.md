# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 20 application for managing and displaying release notes for multiple systems. The app features a three-panel layout:
- Left panel: Systems menu for selecting different systems
- Middle panel: Release list for the selected system
- Right panel: Detailed view of a selected release item

## Core Commands

### Development
- `npm start` or `ng serve` - Start development server (http://localhost:4200)
- `npm run watch` - Build with watch mode in development configuration
- `npm test` or `ng test` - Run unit tests with Karma/Jasmine

### Build
- `npm run build` or `ng build` - Production build
- Build outputs to `dist/` directory

### Code Generation
- `ng generate component component-name` - Generate new component
- `ng generate --help` - List all available schematics

## Architecture

### Application Structure
The app uses Angular's standalone components pattern (no NgModules). Key architectural decisions:

- **Routing**: Uses lazy-loaded components with a layout wrapper
- **State Management**: Centralized through `StateService` using RxJS BehaviorSubjects
- **Styling**: SCSS with theme support (light/dark mode)
- **Data**: Mock data service pattern with Observable interfaces

### Key Components
- `LayoutComponent` (src/app/layout/layout.ts:20) - Main layout wrapper, handles theme switching
- `SystemsMenuComponent` - Left panel for system selection
- `ReleaseListComponent` - Middle panel showing releases for selected system
- `ReleaseDetailComponent` - Right panel with detailed release content
- `HomeComponent` - Default route component

### Services
- `StateService` (src/app/services/state.service.ts:10) - Global state management for:
  - Selected system
  - Selected release item
  - Theme (light/dark)
- `ReleaseDataService` (src/app/services/release-data.service.ts:8) - Mock data provider with hardcoded systems and release notes

### Data Models
Defined in `src/app/models/release.model.ts`:
- `System` - Basic system info (id, name)
- `ReleaseItem` - Individual release with version, date, title, content (HTML)
- `ReleaseNote` - Container linking systemId to release items

## Configuration

### TypeScript
- Strict mode enabled with comprehensive type checking
- Angular-specific compiler options for strict templates and injection
- Target: ES2022, preserves modules for Angular's build system

### Styling
- SCSS preprocessor configured
- Component-level styles with `.scss` files
- Global styles in `src/styles.scss`
- Prettier configured with Angular HTML parser override

### Testing
- Karma + Jasmine test runner
- Configuration in `angular.json` test architect
- Spec files follow `*.spec.ts` pattern

## Development Patterns

### Component Style
- Uses standalone components (imports array instead of NgModules)
- Implements OnInit/OnDestroy lifecycle hooks for subscriptions
- Dependency injection through constructor
- Template/style URLs for separation of concerns

### State Management Pattern
- Services use BehaviorSubject for state streams
- Components subscribe to state changes in ngOnInit
- Proper subscription cleanup in ngOnDestroy
- State mutations through service methods only

### Theme Implementation
- Theme state managed in StateService
- DOM manipulation through Angular Renderer2
- CSS class-based theme switching on document.body