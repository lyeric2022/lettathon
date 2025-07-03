# Contributing to Catfish 🐠

Thank you for your interest in contributing to Catfish! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/catfish.git
   cd catfish
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
5. **Make your changes** and commit them
6. **Push to your fork** and create a Pull Request

## 🏗️ Development Setup

### Prerequisites

- Node.js 18+ and npm 8+
- Git
- Your preferred code editor (VS Code recommended)

### Environment Setup

1. **Clone and install**:
   ```bash
   git clone https://github.com/your-org/catfish.git
   cd catfish
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start development servers**:
   ```bash
   npm run dev  # Starts all services
   ```

### Project Structure

```
catfish/
├── client/           # Electron + React desktop app
├── server/           # Local API server
├── agent/            # Letta agent (AI pipeline)
├── docs/             # Documentation
├── .github/          # CI/CD workflows
```

## 📝 Development Guidelines

### Code Style

- **TypeScript**: All code should be written in TypeScript
- **ESLint + Prettier**: We use automated formatting
- **Naming**: Use camelCase for variables/functions, PascalCase for components
- **Comments**: Document complex logic and public APIs

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(client): add voice activation feature
fix(server): resolve OCR processing timeout
docs(readme): update installation instructions
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Run the test suite**: `npm test`
4. **Check linting**: `npm run lint`
5. **Build successfully**: `npm run build`

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific workspace
npm test --workspace=client
npm test --workspace=server
npm test --workspace=agent

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

- **Unit tests**: Test individual functions/components
- **Integration tests**: Test component interactions
- **E2E tests**: Test full user workflows

Example test structure:
```typescript
describe('OcrTool', () => {
  it('should extract text from screenshots', async () => {
    const result = await ocrTool.run({ image: testImage });
    expect(result.text).toContain('expected text');
  });
});
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Steps to reproduce** the issue
2. **Expected behavior** vs **actual behavior**
3. **Environment details** (OS, Node version, etc.)
4. **Screenshots** if relevant
5. **Console logs** or error messages

Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

## 💡 Feature Requests

For new features, please:

1. **Check existing issues** to avoid duplicates
2. **Describe the problem** you're trying to solve
3. **Propose a solution** with examples
4. **Consider backwards compatibility**

Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).

## 🎯 Areas for Contribution

### High Priority

- **UI/UX improvements** for the desktop app
- **OCR accuracy** enhancements
- **Performance optimizations**
- **Cross-platform compatibility** fixes

### Good First Issues

- **Documentation** improvements
- **Code cleanup** and refactoring
- **Test coverage** expansion
- **Localization** support

### Advanced

- **AI model integration** improvements
- **Security** enhancements
- **Accessibility** features
- **Plugin system** development

## 🔧 Technical Guidelines

### Client (Electron + React)

- Use **functional components** with hooks
- Implement **proper error boundaries**
- Follow **React best practices**
- Use **styled-components** for styling

### Server (Express + TypeScript)

- Use **async/await** for asynchronous operations
- Implement **proper error handling**
- Add **request validation**
- Include **comprehensive logging**

### Agent (Letta SDK)

- Follow **Letta SDK patterns**
- Implement **robust error handling**
- Add **comprehensive logging**
- Test with **mock data**

## 📚 Documentation

### Code Documentation

- **JSDoc comments** for public APIs
- **Inline comments** for complex logic
- **README files** for each workspace
- **Architecture diagrams** for complex systems

### User Documentation

- **Getting started** guides
- **API reference** documentation
- **Troubleshooting** guides
- **Video tutorials** (optional)

## 🤝 Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](CODE_OF_CONDUCT.md).

### Communication

- **Be respectful** and constructive
- **Help others** learn and grow
- **Ask questions** if something is unclear
- **Share knowledge** through discussions

### Getting Help

- **GitHub Discussions** for general questions
- **GitHub Issues** for bugs and features
- **Discord** (link coming soon) for real-time chat

## 🏆 Recognition

Contributors will be:

- **Listed** in our CONTRIBUTORS.md file
- **Mentioned** in release notes for significant contributions
- **Invited** to join our contributor Discord channel

## 📄 License

By contributing to Catfish, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## 🙋‍♂️ Questions?

If you have any questions about contributing, please:

1. Check our [FAQ](docs/faq.md)
2. Search existing [GitHub Issues](https://github.com/your-org/catfish/issues)
3. Open a new [Discussion](https://github.com/your-org/catfish/discussions)
4. Reach out on Discord (coming soon)

Thank you for helping make Catfish better! 🎉 