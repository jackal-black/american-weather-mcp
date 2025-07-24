# Contributing to Weather Report Extension

Thank you for your interest in contributing to the Weather Report VS Code extension! This document provides guidelines for contributing to this project.

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- VS Code
- Git

### Setup Development Environment

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/weather-report.git
cd weather-report
```

2. Install dependencies:
```bash
npm install
```

3. Open in VS Code:
```bash
code .
```

4. Press `F5` to run the extension in a new Extension Development Host window.

## Development Workflow

### Building the Project
```bash
npm run compile
```

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Watch Mode (for development)
```bash
npm run watch
```

## Code Style Guidelines

- Follow TypeScript best practices
- Use ESLint configuration provided in the project
- Write meaningful commit messages
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Code Formatting
The project uses ESLint for code formatting. Run `npm run lint` before committing.

## Contributing Process

### 1. Create an Issue
Before starting work, create an issue describing:
- The problem you're solving
- Your proposed solution
- Any breaking changes

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make Changes
- Write clean, well-documented code
- Add tests for new functionality
- Update documentation if needed

### 4. Test Your Changes
- Run `npm test` to ensure all tests pass
- Test the extension manually in VS Code
- Verify no ESLint errors: `npm run lint`

### 5. Submit a Pull Request
- Push your branch to your fork
- Create a pull request with:
  - Clear title and description
  - Reference to related issues
  - Screenshots/GIFs for UI changes

## Project Structure

```
weather-report/
├── src/
│   ├── extension.ts          # Main extension entry point
│   └── test/                 # Test files
├── package.json              # Extension manifest
├── tsconfig.json            # TypeScript configuration
├── eslint.config.mjs        # ESLint configuration
└── .vscode/                 # VS Code settings
```

## API Integration Guidelines

When working with the National Weather Service API:
- Respect rate limits
- Handle errors gracefully
- Cache responses when appropriate
- Follow MCP protocol specifications

## Testing

### Unit Tests
- Write tests for all new functions
- Use the existing test framework
- Aim for good test coverage

### Integration Tests
- Test VS Code command integration
- Test API interactions
- Test error handling scenarios

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new APIs
- Update CHANGELOG.md for releases

## Reporting Issues

When reporting bugs, please include:
- VS Code version
- Extension version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages/logs

## Feature Requests

For new features:
- Check existing issues first
- Provide clear use case
- Consider implementation complexity
- Discuss breaking changes

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow GitHub's community guidelines

## Questions?

- Open an issue for questions
- Check existing documentation
- Review closed issues for similar problems

Thank you for contributing to Weather Report! 🌤️
