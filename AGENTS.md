# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

TypeScript library providing [AI SDK](https://ai-sdk.dev) tools for [Resend](https://resend.com) email sending. Exports: `sendEmail`, `sendBatchEmails`, `getEmail`, `listEmails`, `listTemplates`, `getTemplate`, `createContact`, `listContacts`, `removeContact`.

## Commands

**Package manager**: pnpm (v10.28.2)

```bash
pnpm install          # Install dependencies
pnpm build            # Build (tsup -> dist/)
pnpm type-check       # TypeScript checking (tsc --noEmit)
pnpm check            # Lint/format check (Ultracite/Biome)
pnpm fix              # Auto-fix lint/format issues
pnpm test             # Run tests (requires RESEND_API_KEY in .env)
```

**CI pipeline**: `pnpm type-check && pnpm check && pnpm build && pnpm test`

## Code Style

### Formatting (Biome/Ultracite)

- **Indentation**: 2 spaces
- **Line width**: 80 characters
- **Semicolons**: Always
- **Quotes**: Double for JSX
- **Trailing commas**: ES5 style
- **Arrow parens**: Always `(x) => x`
- **Line endings**: LF

### Imports

Organized automatically by Biome. Use `import type` for type-only imports:

```typescript
import { Resend } from "resend";
import { tool } from "ai";
import { z } from "zod";
import type { SomeType } from "some-package";
```

### TypeScript

- **Target**: ES2022, **Module**: NodeNext, **Strict**: enabled
- Use `const` over `let`, arrow functions over function expressions
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Avoid `any` (use `unknown`), avoid non-null assertions (`!`)
- Use `interface` over `type` for object shapes
- No enums, no namespaces

### Naming

- **Files**: kebab-case (`my-tool.ts`)
- **Variables/Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: camelCase (not SCREAMING_SNAKE_CASE)

### Zod Schemas

```typescript
const MySchema = z.object({
  field: z.string().describe("Description of the field"),
  optionalField: z.string().optional().describe("Optional description"),
});
```

### AI SDK Tool Pattern

```typescript
export const myTool = tool({
  description: "Clear description of what the tool does and when to use it.",
  inputSchema: z.object({
    param: z.string().describe("What this parameter is for"),
  }),
  inputExamples: [{ input: { param: "example" } }],
  outputSchema: MyOutputSchema,
  strict: true,
  needsApproval: false, // true for destructive operations (delete, overwrite)
  execute: async ({ param }) => {
    try {
      const result = await someOperation();
      return { success: true, data: result };
    } catch (error) {
      console.error("Error in myTool:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### Error Handling

- Use try-catch in async functions
- Return structured error responses (don't throw)
- Pattern: `error instanceof Error ? error.message : "Fallback"`
- Log errors with `console.error()` before returning

## Project Structure

```
src/index.ts    # Main entry, exports all tools
dist/           # Build output (ESM)
```

## Key Linting Rules

The project uses Ultracite (Biome wrapper) with strict rules:

- **No forEach** - Use `for...of` or array methods like `map`/`filter`
- **No any** - Use `unknown` or proper types (`noExplicitAny`)
- **No unused variables/imports** - Will fail CI
- **No non-null assertions** - Handle null cases explicitly
- **Arrow functions** - Prefer over function expressions
- **Optional chaining** - Use `?.` instead of manual checks
- **Import type** - Required for type-only imports (`useImportType`)
- **Consistent interfaces** - Use `interface` over `type` for objects
- **File naming** - Must be kebab-case (`useFilenamingConvention`)

Run `pnpm fix` to auto-fix most issues.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features (triggers release)
- `fix:` - Bug fixes (triggers release)
- `chore:`, `docs:`, `refactor:` - Other changes (no release)

Examples: `feat: add createContact tool`, `fix: handle missing email subject`

## Dependencies

- `resend` - Resend SDK
- `ai` - Vercel AI SDK (peer)
- `zod` - Schema validation (peer)

## Environment

- `RESEND_API_KEY` - Required for Resend API operations
- `RESEND_EMAIL_DOMAIN` - Your verified domain for sending emails
