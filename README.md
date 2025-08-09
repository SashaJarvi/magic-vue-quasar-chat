# Magic Vue Quasar Chat

A modern, real-time chat application built with Vue 3, Quasar Framework, and TypeScript.

## ✨ Features

### 💬 Chat Functionality

- **Real-time messaging** with WebSocket support and auto-reconnection
- **Contact management** with last message preview and unread count
- **Message status** indicators and smooth animations
- **Responsive design** that works seamlessly on desktop and mobile

### 🏗️ Architecture & Development

- **Vue 3 Composition API** with full TypeScript support
- **Pinia state management** for reactive data handling
- **Quasar Framework** for beautiful, Material Design UI components
- **Comprehensive unit testing** with 80%+ coverage using Vitest
- **Type-safe** development with strict TypeScript configuration
- **Pre-commit hooks** for automated code quality checks (ESLint, Prettier, tests)
- **Modern build tools** with Vite for fast development and optimized builds

### 🎨 User Experience

- **WhatsApp-like message transitions** and animations
- **Contact sorting** by last message time
- **Message time tooltips** showing full date and time on hover
- **Connection status** indicators with retry functionality
- **Smooth scrolling** to latest messages

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or 20+ (check with `node --version`)
- **npm** package manager
- **Docker** (for running the backend WebSocket server)

### Backend Server Setup

Before starting the application, you need to run the WebSocket backend server:

```bash
# Start the WebSocket test server (required for real-time messaging)
docker run -p 8181:8181 ravlio/wstest:latest
```

This will start a WebSocket server on port 8181 that the chat application connects to for real-time messaging.

### Frontend Application Setup

#### 1. Install Dependencies

```bash
# Using npm
npm install
```

#### 2. Start Development Server

```bash
# Start the app in development mode (hot-reload, error reporting, etc.)
npm run dev
# or
quasar dev
```

The application will be available at `http://localhost:9009`

#### 3. Start Chatting

1. Open the application in your browser
2. The WebSocket connection should establish automatically
3. Start sending messages and see real-time updates

## 🧪 Testing

This project maintains high test coverage with comprehensive unit tests:

```bash
# Run all tests
npm run test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage Areas

- **Components**: All Vue components including ChatDialog, ContactsList, ChatLayout
- **Stores**: Pinia stores for chat and WebSocket management
- **Utils**: Utility functions for ID generation, color generation, etc.

## 🛠️ Development Tools

### Code Quality

```bash
# Lint the files (ESLint + Vue ESLint)
npm run lint

# Format the files (Prettier)
npm run format

# Both linting and formatting are run automatically on pre-commit
```

### Available Scripts

| Script                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start development server with hot-reload |
| `npm run build`         | Build for production                     |
| `npm run test`          | Run all tests                            |
| `npm run test:coverage` | Run tests with coverage report           |
| `npm run lint`          | Lint code with ESLint                    |
| `npm run format`        | Format code with Prettier                |

## 📁 Project Structure

```
src/
├── components/           # Vue components
│   ├── ChatDialog.vue   # Main chat interface
│   ├── ContactsList.vue # Contacts sidebar
│   └── ...
├── layouts/             # Application layouts
├── pages/               # Route pages
├── stores/              # Pinia stores
│   ├── chat-store.ts    # Chat state management
│   └── websocket-store.ts # WebSocket connection management
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
└── test/                # Unit tests
```

## 🔧 Configuration

### WebSocket Connection

The application connects to a WebSocket server on `localhost:8181` by default. This can be configured in the WebSocket store.

### Environment Variables

- Development server runs on port `9009` by default
- WebSocket server expected on port `8181`

## 🏗️ Build for Production

```bash
# Build the app for production
npm run build
# or
quasar build
```

The built files will be available in the `dist/` directory.

## 🤝 Development Workflow

1. **Start backend**: `docker run -p 8181:8181 ravlio/wstest:latest`
2. **Install dependencies**: `npm install`
3. **Start dev server**: `npm run dev`
4. **Make changes**: Edit files with hot-reload
5. **Run tests**: `npm run test` (runs automatically on commit)
6. **Commit**: Pre-commit hooks will lint, format, and test automatically

## 🧪 Testing Philosophy

This project follows testing best practices:

- **High coverage**: 80%+ test coverage maintained
- **Component testing**: All major components have comprehensive tests
- **User-centric tests**: Tests focus on user interactions and observable behavior
- **Type safety**: All tests are written in TypeScript with proper typing

## 📚 Technologies Used

- **[Vue 3](https://vuejs.org/)** - Progressive JavaScript framework
- **[Quasar Framework](https://quasar.dev/)** - Vue.js based framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Pinia](https://pinia.vuejs.org/)** - State management for Vue
- **[Vitest](https://vitest.dev/)** - Fast unit testing framework
- **[Vite](https://vitejs.dev/)** - Fast build tool
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** - Code quality tools
