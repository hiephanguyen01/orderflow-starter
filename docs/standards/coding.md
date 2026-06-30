# Coding Standards

## TypeScript

- Enable strict mode.
- Do not use `any`.
- Prefer `unknown` for untrusted values.
- Add explicit return types to exported functions.
- Avoid unsafe type assertions.
- Prefer discriminated unions for state.
- Use enums only when they provide meaningful domain value.

## Naming

```text
Variables and functions: camelCase
Classes and types: PascalCase
Constants: UPPER_SNAKE_CASE
Files and directories: kebab-case
Database columns: snake_case
API JSON fields: camelCase
Permission codes: resource.action
```

## Functions

- Keep functions focused.
- Avoid boolean parameters with unclear meaning.
- Prefer parameter objects when a function needs several arguments.
- Return early for invalid states.
- Do not silently catch errors.

## Comments

Comments should explain:

- why a non-obvious decision exists;
- concurrency assumptions;
- security requirements;
- business invariants;
- compatibility constraints.

Do not comment obvious syntax.

## Error Handling

Never:

```ts
try {
  await operation();
} catch {}
```

Instead:

- handle expected errors;
- translate infrastructure errors at module boundaries;
- log unexpected errors once with structured context;
- preserve the original cause;
- never expose stack traces or sensitive data to clients.
