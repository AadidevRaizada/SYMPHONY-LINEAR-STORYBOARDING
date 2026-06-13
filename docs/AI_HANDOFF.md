# AI Handoff Guide

Use this file when another AI tool needs to integrate the project into a larger codebase.

## Mission

Convert a software issue into comic strips that help a developer understand intent.

The output is not a debugging trace. It is a visual explanation:

1. current setup
2. occurring issue
3. expected outcome

## Non-negotiable output format

For each mode (`user` or `technical`), generate three images:

```text
setup.png
problem.png
expected.png
```

Each image is a four-panel comic strip.

## Integration entrypoint

Use:

```ts
generateFromLinear(issueId, mode)
```

Located at:

```text
src/orchestrator/run.ts
```

Exported from:

```text
src/index.ts
```

## Do not bypass this module

The cognitive compression rules live in:

```text
src/modules/visual-mapping.ts
```

Do not prompt OpenAI directly from issue text without using this mapper first. The mapper prevents visually confusing output.

## Mode semantics

`user` mode:

- focuses on product/user impact
- object is usually `app`
- problem is framed as user interruption
- expected is framed as a successful product state

`technical` mode:

- focuses on system mechanics
- object can be `token`, `API`, `request`, or `system`
- problem is framed as a failure point
- expected is framed as valid system state

## Visual style

OpenAI image prompting lives in:

```text
src/modules/image.ts
```

Keep these constraints:

- pure white background
- black ink lines
- no dark mode
- no inverted colors
- no filled black panels
- one comic-strip image per scene
- exactly four panels per image

## Linear behavior

Linear API helpers live in:

```text
src/clients/linear.ts
```

The final comment is posted with `commentCreate` and embeds uploaded Linear asset URLs.

## Useful commands

```bash
npm run typecheck
npm run test:visual-mapping
npm run test:images -- user
npm run test:images -- technical
npm run test:full -- LINEAR_ISSUE_ID user
```
