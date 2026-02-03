# Contributing to Resend - AI SDK Tools

Thank you for your interest in contributing! We welcome contributions of all kinds, whether it's reporting bugs, suggesting features, improving documentation, or adding new tools.

By contributing, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming and respectful community for all.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Need Help?](#need-help)

## Ways to Contribute

There are many ways to contribute:

- **Report bugs**: Found something broken? Let us know!
- **Suggest features**: Have an idea for a new tool or improvement? We'd love to hear it
- **Improve documentation**: Help make our docs clearer
- **Add features**: Contribute new tools or enhancements
- **Fix issues**: Pick up an issue from our backlog

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)

### Setup

1. Fork the repository on GitHub

2. Clone your fork locally:

   ```bash
   git clone https://github.com/your-username/resend-ai-sdk.git
   cd resend-ai-sdk
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Build the project:

   ```bash
   pnpm build
   ```

## Development Workflow

1. Create a new branch for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test thoroughly

3. Run quality checks:

   ```bash
   pnpm type-check # TypeScript validation
   pnpm check      # Lint check
   pnpm fix        # Auto-fix issues
   ```

4. Commit your changes with a clear message

5. Push to your fork and create a pull request

## Pull Request Process

### Before Submitting

- ✅ Code passes all checks (`pnpm type-check && pnpm check`)
- ✅ Changes build successfully (`pnpm build`)

### PR Guidelines

1. **Clear conventional title**: Describe what changed (e.g., `feat: add createContact tool`)
2. **Description**: Explain what and why
3. **Link issues**: Reference any related issues (e.g., "Fixes #123")

> Use common sense when drafting your pull request. The goal is to make it easy for maintainers to review and merge your changes. Include sufficient details but at the same time avoid unnecessary information.

### Commit Message Guidelines

This project uses [release-please](https://github.com/googleapis/release-please) to automate changelog and release PRs. Please use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for all commit messages:

- `feat:` for new features (triggers a new release and changelog entry)
- `fix:` for bug fixes (triggers a new release and changelog entry)
- `chore:`, `docs:`, `refactor:`, etc. for other changes (do not trigger a release)

**Examples:**

- `feat: add createContact tool`
- `fix: handle missing email subject`
- `chore: update dependencies`

Only `feat:` and `fix:` commits will appear in the changelog and trigger a new release. All other commit types are allowed but will not trigger a release.

---

## Need Help?

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community support

Thank you for contributing!
