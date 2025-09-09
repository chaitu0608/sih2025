# 🤝 Contributing to Lethe

Thank you for your interest in contributing to Lethe! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Reporting](#issue-reporting)

## 📜 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. Please:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report inappropriate behavior

## 🚀 Getting Started

### Prerequisites

- **Rust** (latest stable version)
- **Node.js** 18+ and npm
- **Git** for version control
- **Basic knowledge** of Rust and/or JavaScript/React

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/sih2025.git
cd sih2025

# Add upstream remote
git remote add upstream https://github.com/original-owner/sih2025.git
```

## 🛠️ Development Setup

### Quick Start

```bash
# Start development environment
./start-dev.sh
```

### Manual Setup

#### 1. Rust Backend

```bash
cd lethe
cargo build --release
cargo test
```

#### 2. Web Frontend

```bash
cd frontend
npm install
npm run build
npm test
```

#### 3. Development Mode

```bash
# Terminal 1 - Backend
cd frontend
export LETHE_BIN="../lethe/target/release/lethe"
npm run backend

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📝 Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug Fixes**: Fix issues and improve stability
- **Features**: Add new functionality
- **Documentation**: Improve docs and examples
- **Testing**: Add tests and improve coverage
- **Performance**: Optimize code and algorithms
- **Security**: Enhance security features
- **UI/UX**: Improve user interface and experience

### Before You Start

1. **Check existing issues** to avoid duplicates
2. **Create an issue** for significant changes
3. **Discuss major changes** before implementation
4. **Keep changes focused** and atomic

### Development Workflow

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Make your changes
# ... code changes ...

# 3. Test your changes
cargo test          # Rust tests
npm test           # Frontend tests
./start-dev.sh     # Integration test

# 4. Commit your changes
git add .
git commit -m "feat: add your feature description"

# 5. Push to your fork
git push origin feature/your-feature-name

# 6. Create a Pull Request
```

## 🎨 Code Style

### Rust Code Style

Follow Rust community standards:

```rust
// Use rustfmt for formatting
cargo fmt

// Use clippy for linting
cargo clippy

// Example function style
pub fn secure_wipe_device(
    device: &str,
    scheme: WipeScheme,
    options: WipeOptions,
) -> Result<WipeResult, WipeError> {
    // Implementation
}
```

### JavaScript/React Code Style

Follow modern JavaScript/React practices:

```javascript
// Use Prettier for formatting
npm run format

// Use ESLint for linting
npm run lint

// Example component style
const DeviceList = ({ devices, onDeviceSelect, loading }) => {
  const handleDeviceClick = useCallback((device) => {
    onDeviceSelect(device);
  }, [onDeviceSelect]);

  return (
    <div className="device-list">
      {devices.map(device => (
        <DeviceCard
          key={device.id}
          device={device}
          onClick={handleDeviceClick}
        />
      ))}
    </div>
  );
};
```

### Documentation Style

- Use clear, concise language
- Include code examples
- Update README for user-facing changes
- Add JSDoc comments for functions
- Use rustdoc for Rust code

## 🧪 Testing

### Rust Testing

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_wipe_verification

# Run with output
cargo test -- --nocapture

# Run integration tests
cargo test --test integration
```

### Frontend Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- --testNamePattern="DeviceList"

# Run in watch mode
npm run test:watch
```

### Integration Testing

```bash
# Test full system
./start-dev.sh

# Test specific endpoints
curl http://localhost:3001/api/system/check
curl http://localhost:3001/api/devices
```

### Test Guidelines

- **Write tests** for new functionality
- **Test edge cases** and error conditions
- **Mock external dependencies** when appropriate
- **Use descriptive test names**
- **Keep tests fast** and reliable

## 📤 Submitting Changes

### Pull Request Process

1. **Create a Pull Request** from your feature branch
2. **Fill out the PR template** completely
3. **Link related issues** using keywords
4. **Request reviews** from maintainers
5. **Address feedback** promptly
6. **Keep PRs focused** and reasonably sized

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Related Issues
Closes #123
```

### Commit Message Format

Use conventional commits:

```
feat: add new wiping scheme
fix: resolve device detection issue
docs: update installation guide
test: add integration tests
refactor: improve error handling
```

## 🐛 Issue Reporting

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check documentation** for solutions
3. **Try latest version** to see if issue is fixed
4. **Gather information** about your environment

### Issue Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g., macOS 13.0, Ubuntu 22.04]
- Rust version: [e.g., 1.70.0]
- Node.js version: [e.g., 18.17.0]
- Lethe version: [e.g., 0.8.3-dev]

## Additional Context
Any other relevant information
```

### Feature Requests

For feature requests, include:

- **Use case** and motivation
- **Proposed solution** or approach
- **Alternatives considered**
- **Additional context**

## 🔍 Code Review Process

### For Contributors

- **Respond to feedback** promptly
- **Make requested changes** clearly
- **Ask questions** if feedback is unclear
- **Be patient** with the review process

### For Reviewers

- **Be constructive** and helpful
- **Focus on code quality** and correctness
- **Test changes** when possible
- **Approve when ready** to merge

## 📚 Resources

### Documentation

- [Rust Book](https://doc.rust-lang.org/book/)
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Lethe Original Project](https://github.com/Kostassoid/lethe)

### Tools

- **Rust**: `rustfmt`, `clippy`, `cargo test`
- **JavaScript**: `prettier`, `eslint`, `jest`
- **Git**: `git rebase`, `git squash`
- **Development**: `vite`, `concurrently`

## 🎯 Areas for Contribution

### High Priority

- **Security improvements**
- **Performance optimizations**
- **Cross-platform compatibility**
- **Error handling improvements**
- **Test coverage**

### Medium Priority

- **UI/UX enhancements**
- **Documentation improvements**
- **Code refactoring**
- **New wiping schemes**
- **Monitoring and logging**

### Low Priority

- **Code style improvements**
- **Minor bug fixes**
- **Documentation typos**
- **Example updates**

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Code Review**: Ask questions in PR comments
- **Documentation**: Check existing docs first

## 🙏 Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page
- **Project documentation**

Thank you for contributing to Lethe! 🎉
