# Domain Docs

How engineering skills consume this repository’s domain documentation.

## Before exploring, read these

- Root `CONTEXT.md`, when present.
- Relevant decisions under `docs/adr/`.

If either is absent, proceed silently. Domain-modeling skills create missing domain docs lazily when terms or decisions are resolved.

## File structure

```text
/
├── CONTEXT.md
├── docs/adr/
└── apps/
```

## Use the glossary’s vocabulary

Use terms as defined in `CONTEXT.md`. A missing concept signals either invented language or a real modeling gap.

## Flag ADR conflicts

Surface contradictions with existing ADRs explicitly rather than silently overriding them.
