# Agent instructions

This project converts Linear issues into stickman comic-strip explainers.

## Core contract

- Generate three separate images per run: `setup`, `problem`, `expected`.
- Each image is one four-panel comic strip.
- Support `user` and `technical` modes.
- Always route visual structure through `src/modules/visual-mapping.ts` before image generation.
- Do not bypass validation by writing direct image prompts from raw issue text.

## Key entrypoints

- Full Linear pipeline: `src/orchestrator/run.ts`
- Deterministic visual mapper: `src/modules/visual-mapping.ts`
- OpenAI image generation: `src/modules/image.ts`
- Linear GraphQL/upload/comment helpers: `src/clients/linear.ts`
- Public exports: `src/index.ts`

## Commands

```bash
npm run typecheck
npm run build
npm run test:visual-mapping
npm run test:images -- user
npm run test:images -- technical
npm run test:full -- LINEAR_ISSUE_ID user
```

Generated image artifacts go under `test-storyboards/storyboard-N/` and must not be committed.
