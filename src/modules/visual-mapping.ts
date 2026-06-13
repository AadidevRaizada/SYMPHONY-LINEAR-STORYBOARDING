import type { Storyboard } from "./storyboard.js";

export type VisualMode = "user" | "technical";
export type ComicStripType = "setup" | "problem" | "expected";
export type PanelSymbol = "arrow" | "X" | "check";
export type ComicPanelNumber = 1 | 2 | 3 | 4;

export type FlowStep = {
  actor?: string;
  action: string;
  object: string;
};

export type VisualMappingInput = {
  actors: string[];
  flow: Array<string | FlowStep>;
  root_cause: string;
  expected: string;
  mode?: VisualMode;
};

export type ComicStripPanel = {
  panel: ComicPanelNumber;
  type: ComicStripType;
  focus: string;
  actor: string;
  object: string;
  symbol: PanelSymbol;
  caption: string;
};

export type ComicStrip = {
  scene: 1 | 2 | 3;
  type: ComicStripType;
  title: string;
  focus: string;
  panels: [ComicStripPanel, ComicStripPanel, ComicStripPanel, ComicStripPanel];
};

const MULTI_STEP_PATTERN = /\bthen\b|\band then\b|→|->|=>|-->|⟶|➡|,/i;
const MULTI_ACTION_PATTERN = /\bthen\b|\band\b|\bwhile\b|\bafter\b|\bbefore\b|→|->|=>|-->|⟶|➡|,/i;
const MULTI_OBJECT_PATTERN = /\s+(?:and|with|plus|&)\s+|\/|,/i;
const EXTRA_SYMBOL_PATTERN = /🔄|↻|↺|⟳|⟲|❌|✓|✔|✅|→.*→|->.*->/;

function requireSingleText(value: string, field: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  if (MULTI_STEP_PATTERN.test(normalized)) {
    throw new Error(`${field} must not contain a multi-step flow.`);
  }

  return normalized;
}

function requireSingleAction(value: string, field: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  if (MULTI_ACTION_PATTERN.test(normalized)) {
    throw new Error(`${field} must contain exactly one action.`);
  }

  return normalized;
}

function requireSingleObject(value: string, field: string): string {
  const normalized = requireSingleText(value, field);

  if (MULTI_OBJECT_PATTERN.test(normalized)) {
    throw new Error(`${field} must contain exactly one object.`);
  }

  if (EXTRA_SYMBOL_PATTERN.test(normalized)) {
    throw new Error(`${field} must not include visual symbols.`);
  }

  return normalized;
}

function firstActor(actors: string[]): string {
  const actor = actors.find((candidate) => candidate.trim().length > 0);

  if (!actor) {
    throw new Error("At least one actor is required.");
  }

  return requireSingleObject(actor, "actor");
}

function inferObjectFromText(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("token")) {
    return "token";
  }

  if (lower.includes("api")) {
    return "API";
  }

  if (lower.includes("request")) {
    return "request";
  }

  if (lower.includes("login")) {
    return "login";
  }

  return "system";
}

function normalizeFlowStep(step: string | FlowStep, fallbackActor: string): FlowStep {
  if (typeof step === "string") {
    return {
      actor: fallbackActor,
      action: requireSingleAction(step, "flow action"),
      object: inferObjectFromText(step)
    };
  }

  return {
    actor: step.actor ? requireSingleObject(step.actor, "flow actor") : fallbackActor,
    action: requireSingleAction(step.action, "flow action"),
    object: requireSingleObject(step.object, "flow object")
  };
}

function validateFlowInput(flow: Array<string | FlowStep>, fallbackActor: string): void {
  for (const step of flow) {
    normalizeFlowStep(step, fallbackActor);
  }
}

function technicalProblemFocus(rootCause: string): string {
  const lower = rootCause.toLowerCase();

  if (lower.includes("expired") && lower.includes("token")) {
    return "expired token";
  }

  if (lower.includes("refresh") && lower.includes("token")) {
    return "failed token refresh";
  }

  if (lower.includes("api")) {
    return "failed API";
  }

  if (lower.includes("request")) {
    return "failed request";
  }

  return requireSingleText(rootCause, "root_cause");
}

function userProblemFocus(rootCause: string): string {
  const lower = rootCause.toLowerCase();

  if (lower.includes("login") || lower.includes("logged in") || lower.includes("token")) {
    return "login interruption";
  }

  if (lower.includes("error")) {
    return "visible error";
  }

  if (lower.includes("request")) {
    return "blocked action";
  }

  return requireSingleText(rootCause, "root_cause");
}

function technicalExpectedFocus(expected: string): string {
  const lower = expected.toLowerCase();

  if (lower.includes("logged in") || lower.includes("login")) {
    return "active session";
  }

  if (lower.includes("token")) {
    return "valid token";
  }

  if (lower.includes("success")) {
    return "success state";
  }

  return requireSingleText(expected, "expected");
}

function userExpectedFocus(expected: string): string {
  const lower = expected.toLowerCase();

  if (lower.includes("logged in") || lower.includes("login")) {
    return "stays logged in";
  }

  if (lower.includes("error")) {
    return "no error";
  }

  if (lower.includes("success")) {
    return "task succeeds";
  }

  return requireSingleText(expected, "expected");
}

function objectForTechnicalProblem(rootCause: string): string {
  const focus = technicalProblemFocus(rootCause);

  if (focus.includes("token")) {
    return "token";
  }

  if (focus.includes("API")) {
    return "API";
  }

  if (focus.includes("request")) {
    return "request";
  }

  return "system";
}

function makePanel(
  panel: ComicPanelNumber,
  type: ComicStripType,
  actor: string,
  object: string,
  focus: string,
  symbol: PanelSymbol,
  caption: string
): ComicStripPanel {
  const comicPanel = {
    panel,
    type,
    focus,
    actor,
    object,
    symbol,
    caption
  };

  validateComicStripPanel(comicPanel);
  return comicPanel;
}

export function validateComicStripPanel(panel: ComicStripPanel): void {
  requireSingleObject(panel.actor, "actor");
  requireSingleObject(panel.object, "object");
  requireSingleText(panel.focus, "focus");
  requireSingleText(panel.caption, "caption");

  if (!["arrow", "X", "check"].includes(panel.symbol)) {
    throw new Error(`Panel ${panel.panel} uses unsupported symbol "${panel.symbol}".`);
  }

  if (MULTI_OBJECT_PATTERN.test(panel.focus) || EXTRA_SYMBOL_PATTERN.test(panel.focus)) {
    throw new Error(`Panel ${panel.panel} focus must identify one clear element.`);
  }
}

export function validateComicStrip(strip: ComicStrip): void {
  if (strip.panels.length !== 4) {
    throw new Error(`${strip.type} strip must contain exactly 4 panels.`);
  }

  for (const panel of strip.panels) {
    if (panel.type !== strip.type) {
      throw new Error(`Panel ${panel.panel} type must match strip type "${strip.type}".`);
    }

    validateComicStripPanel(panel);
  }
}

export function validateComicStrips(strips: ComicStrip[]): asserts strips is [ComicStrip, ComicStrip, ComicStrip] {
  if (strips.length !== 3) {
    throw new Error(`Visual mapping must contain exactly 3 comic strips. Received ${strips.length}.`);
  }

  const expectedTypes: ComicStripType[] = ["setup", "problem", "expected"];

  strips.forEach((strip, index) => {
    if (strip.type !== expectedTypes[index]) {
      throw new Error(`Strip ${index + 1} must be "${expectedTypes[index]}".`);
    }

    validateComicStrip(strip);
  });
}

function mapUserComicStrips(input: VisualMappingInput): [ComicStrip, ComicStrip, ComicStrip] {
  const actor = firstActor(input.actors);
  const problemFocus = userProblemFocus(input.root_cause);
  const expectedFocus = userExpectedFocus(input.expected);
  const strips: ComicStrip[] = [
    {
      scene: 1,
      type: "setup",
      title: "Current setup",
      focus: "normal app use",
      panels: [
        makePanel(1, "setup", actor, "app", "user goal", "arrow", "User starts the task"),
        makePanel(2, "setup", actor, "app", "normal use", "arrow", "App responds normally"),
        makePanel(3, "setup", actor, "app", "steady progress", "check", "User keeps working"),
        makePanel(4, "setup", actor, "app", "setup understood", "check", "Everything looks fine")
      ]
    },
    {
      scene: 2,
      type: "problem",
      title: "Occurring issue",
      focus: problemFocus,
      panels: [
        makePanel(1, "problem", actor, "app", "continued task", "arrow", "User continues"),
        makePanel(2, "problem", actor, "app", problemFocus, "X", "The issue appears"),
        makePanel(3, "problem", actor, "app", "blocked user", "X", "User is stopped"),
        makePanel(4, "problem", actor, "app", "confused user", "X", "User loses context")
      ]
    },
    {
      scene: 3,
      type: "expected",
      title: "Expected outcome",
      focus: expectedFocus,
      panels: [
        makePanel(1, "expected", actor, "app", "same task", "arrow", "User tries again"),
        makePanel(2, "expected", actor, "app", expectedFocus, "check", "App stays correct"),
        makePanel(3, "expected", actor, "app", "smooth progress", "check", "User continues"),
        makePanel(4, "expected", actor, "app", "goal reached", "check", "Result is achieved")
      ]
    }
  ];

  validateComicStrips(strips);
  return strips;
}

function mapTechnicalComicStrips(input: VisualMappingInput): [ComicStrip, ComicStrip, ComicStrip] {
  const actor = firstActor(input.actors);
  const setupStep = normalizeFlowStep(input.flow[0] ?? { actor, action: "normal request", object: "system" }, actor);
  const setupObject = requireSingleObject(setupStep.object, "setup object");
  const problemObject = objectForTechnicalProblem(input.root_cause);
  const problemFocus = technicalProblemFocus(input.root_cause);
  const expectedFocus = technicalExpectedFocus(input.expected);
  const expectedObject = expectedFocus.includes("token") ? "token" : "system";
  const strips: ComicStrip[] = [
    {
      scene: 1,
      type: "setup",
      title: "Current setup",
      focus: `${setupObject} works`,
      panels: [
        makePanel(1, "setup", actor, setupObject, `${setupObject} request`, "arrow", "Request starts"),
        makePanel(2, "setup", actor, setupObject, `${setupObject} accepted`, "check", "System accepts it"),
        makePanel(3, "setup", actor, "system", "active state", "check", "State stays active"),
        makePanel(4, "setup", actor, "system", "normal system", "check", "System is healthy")
      ]
    },
    {
      scene: 2,
      type: "problem",
      title: "Occurring issue",
      focus: problemFocus,
      panels: [
        makePanel(1, "problem", actor, problemObject, "same request", "arrow", "Request repeats"),
        makePanel(2, "problem", actor, problemObject, problemFocus, "X", "Failure point"),
        makePanel(3, "problem", actor, "system", "blocked state", "X", "System blocks work"),
        makePanel(4, "problem", actor, "system", "broken outcome", "X", "Issue is visible")
      ]
    },
    {
      scene: 3,
      type: "expected",
      title: "Expected outcome",
      focus: expectedFocus,
      panels: [
        makePanel(1, "expected", actor, expectedObject, "same request", "arrow", "Request repeats"),
        makePanel(2, "expected", actor, expectedObject, expectedFocus, "check", "State is valid"),
        makePanel(3, "expected", actor, "system", "accepted state", "check", "System accepts work"),
        makePanel(4, "expected", actor, "system", "correct outcome", "check", "Outcome is correct")
      ]
    }
  ];

  validateComicStrips(strips);
  return strips;
}

export function mapIssueToComicStrips(input: VisualMappingInput): [ComicStrip, ComicStrip, ComicStrip] {
  const actor = firstActor(input.actors);
  validateFlowInput(input.flow, actor);
  return input.mode === "technical" ? mapTechnicalComicStrips(input) : mapUserComicStrips(input);
}

export function formatComicStripForPrompt(strip: ComicStrip): string {
  validateComicStrip(strip);

  return `Comic strip: ${strip.title}
Strip type: ${strip.type}
Main focus: ${strip.focus}
Panel count: exactly 4

${strip.panels
  .map(
    (panel) => `Panel ${panel.panel}
Focus: ${panel.focus}
Actor: ${panel.actor}
Object: ${panel.object}
Symbol: single ${panel.symbol}
Caption: ${panel.caption}
Rule: show only this one moment.`
  )
  .join("\n\n")}`;
}

export function comicStripsToStoryboard(input: VisualMappingInput): Storyboard {
  const strips = mapIssueToComicStrips(input);
  const mode = input.mode ?? "user";

  return {
    characters: [
      {
        name: firstActor(input.actors),
        appearance: "stick figure, hoodie, round head, dot eyes"
      }
    ],
    scenes: strips.map((strip) => ({
      scene: strip.scene,
      description: `${mode} impact ${strip.type}: ${input.root_cause}. Expected: ${input.expected}`,
      visual: `Mode: ${mode} impact\n${formatComicStripForPrompt(strip)}`
    }))
  };
}

export const panelsToStoryboard = comicStripsToStoryboard;
