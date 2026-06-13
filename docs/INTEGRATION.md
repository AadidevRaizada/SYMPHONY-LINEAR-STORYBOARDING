# Integration Walkthrough

This project is meant to be copied or imported into a larger TypeScript backend.

## What the system does

Input: a Linear issue ID.

Output: three Linear-hosted comic-strip images and a Linear comment.

Flow:

```text
Linear issue
-> deterministic visual mapping
-> 3 comic strips: setup, problem, expected
-> OpenAI image generation
-> Linear image upload
-> Linear commentCreate with markdown embeds
```

## Recommended integration path

1. Copy `src/clients`, `src/modules`, `src/orchestrator`, and `src/config` into the host backend.
2. Install runtime dependencies:
   ```bash
   npm install dotenv
   ```
3. Ensure the host runtime is Node 18+ because the code uses native `fetch`.
4. Add environment variables:
   ```env
   LINEAR_API_KEY=
   OPENAI_API_KEY=
   ```
5. Call:
   ```ts
   import { generateFromLinear } from "./orchestrator/run.js";

   await generateFromLinear(issueId, "user");
   await generateFromLinear(issueId, "technical");
   ```

## Choosing a mode

Use `user` when the recipient should understand the product/user pain:

```ts
await generateFromLinear(issueId, "user");
```

Use `technical` when the recipient should understand system behavior:

```ts
await generateFromLinear(issueId, "technical");
```

## Using only the deterministic mapper

If the host project already has its own image renderer, use only:

```ts
import { mapIssueToComicStrips } from "./modules/visual-mapping.js";

const strips = mapIssueToComicStrips({
  actors: ["Developer"],
  flow: [{ actor: "Developer", action: "uses app", object: "app" }],
  root_cause: "Login fails after token refresh",
  expected: "User stays logged in",
  mode: "user"
});
```

The mapper enforces:

- exactly 3 strips
- strip order: setup, problem, expected
- exactly 4 panels per strip
- one actor and one object per panel
- one focus per panel
- no multi-step actions like `A -> B -> C`

## Linear image upload behavior

OpenAI currently returns base64 data URLs for `gpt-image-1`. The Linear client:

1. detects hosted URLs and uses `imageUploadFromUrl`
2. detects PNG data URLs and uses `fileUpload`
3. embeds the resulting Linear asset URLs in the final comment

## Production notes

- Do not expose `OPENAI_API_KEY` or `LINEAR_API_KEY` in frontend code.
- Keep `generateFromLinear` behind server-side auth in the host app.
- Consider queueing image generation for large batches.
- Store generated asset URLs if the host app needs a history.
- Keep generated local test images out of git.
