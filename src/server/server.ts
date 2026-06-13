import path from "node:path";
import express, { type Request, type Response } from "express";
import { generateFromLinear } from "../orchestrator/run.js";
import {
  comicStripsToStoryboard,
  mapIssueToComicStrips,
  type VisualMappingInput,
  type VisualMode
} from "../modules/visual-mapping.js";

type StoryboardRequestBody = {
  actors?: unknown;
  flow?: unknown;
  root_cause?: unknown;
  expected?: unknown;
  mode?: unknown;
};

type LinearGenerateRequestBody = {
  issueId?: unknown;
  mode?: unknown;
};

const app = express();
const port = Number(process.env.PORT ?? 3000);
const publicDir = path.resolve(process.cwd(), "public");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "linear-stickman-explainer-skill" });
});

function parseMode(value: unknown): VisualMode {
  if (value === undefined || value === null || value === "") {
    return "user";
  }

  if (value === "user" || value === "technical") {
    return value;
  }

  throw new Error('Mode must be "user" or "technical".');
}

function parseVisualInput(body: StoryboardRequestBody): VisualMappingInput {
  const rootCause = typeof body.root_cause === "string" ? body.root_cause.trim() : "";
  const expected = typeof body.expected === "string" ? body.expected.trim() : "";

  if (!rootCause) {
    throw new Error("root_cause is required.");
  }

  if (!expected) {
    throw new Error("expected is required.");
  }

  return {
    actors: Array.isArray(body.actors) && body.actors.every((actor) => typeof actor === "string")
      ? body.actors
      : ["Developer"],
    flow: Array.isArray(body.flow) ? (body.flow as VisualMappingInput["flow"]) : [],
    root_cause: rootCause,
    expected,
    mode: parseMode(body.mode)
  };
}

app.post("/visual-map", (request: Request<object, object, StoryboardRequestBody>, response: Response) => {
  try {
    const input = parseVisualInput(request.body);
    response.json(mapIssueToComicStrips(input));
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Failed to generate visual map." });
  }
});

app.post("/storyboard", (request: Request<object, object, StoryboardRequestBody>, response: Response) => {
  try {
    const input = parseVisualInput(request.body);
    response.json(comicStripsToStoryboard(input));
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Failed to generate storyboard." });
  }
});

app.post(
  "/linear/generate",
  async (request: Request<object, object, LinearGenerateRequestBody>, response: Response) => {
    const issueId = typeof request.body.issueId === "string" ? request.body.issueId.trim() : "";

    if (!issueId) {
      response.status(400).json({ error: "issueId is required." });
      return;
    }

    try {
      const result = await generateFromLinear(issueId, parseMode(request.body.mode));
      response.json(result);
    } catch (error) {
      console.error("Failed to generate from Linear:");
      console.error(error instanceof Error ? error.message : error);
      response.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate from Linear." });
    }
  }
);

app.listen(port, () => {
  console.log(`Dashboard running at http://localhost:${port}`);
});
