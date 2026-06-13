import { callChatGPT } from "../clients/openai.js";

export type StoryboardCharacter = {
  name: string;
  appearance: string;
};

export type StoryboardScene = {
  scene: number;
  description: string;
  visual: string;
};

export type Storyboard = {
  characters: StoryboardCharacter[];
  scenes: StoryboardScene[];
};

function assertStoryboard(value: unknown): asserts value is Storyboard {
  if (!value || typeof value !== "object") {
    throw new Error("Storyboard output must be a JSON object.");
  }

  const storyboard = value as Partial<Storyboard>;

  if (!Array.isArray(storyboard.characters)) {
    throw new Error("Storyboard output must include a characters array.");
  }

  if (!Array.isArray(storyboard.scenes)) {
    throw new Error("Storyboard output must include a scenes array.");
  }

  if (storyboard.scenes.length !== 5) {
    throw new Error(`Storyboard output must include exactly 5 scenes. Received ${storyboard.scenes.length}.`);
  }

  for (const character of storyboard.characters) {
    if (
      !character ||
      typeof character !== "object" ||
      typeof (character as StoryboardCharacter).name !== "string" ||
      typeof (character as StoryboardCharacter).appearance !== "string"
    ) {
      throw new Error("Each storyboard character must include string name and appearance fields.");
    }
  }

  for (const scene of storyboard.scenes) {
    if (
      !scene ||
      typeof scene !== "object" ||
      typeof (scene as StoryboardScene).scene !== "number" ||
      typeof (scene as StoryboardScene).description !== "string" ||
      typeof (scene as StoryboardScene).visual !== "string"
    ) {
      throw new Error("Each storyboard scene must include scene, description, and visual fields.");
    }
  }
}

export async function generateStoryboard(issue: string): Promise<Storyboard> {
  const prompt = `
Convert this Linear issue into a structured JSON story for a linear stickman explainer.

Issue:
${issue}

Return EXACT JSON only. No markdown. No extra text.
The JSON must match this exact shape:
{
  "characters": [
    {
      "name": "Developer",
      "appearance": "stickman hoodie"
    }
  ],
  "scenes": [
    {
      "scene": 1,
      "description": "...",
      "visual": "..."
    }
  ]
}

Rules:
- Include exactly 5 scenes.
- Use scene numbers 1 through 5.
- Keep descriptions concise.
- Keep visuals simple and drawable as stickman explainer frames.
- Return valid JSON only.
`.trim();

  const rawOutput = await callChatGPT(prompt);

  try {
    const parsed = JSON.parse(rawOutput) as unknown;
    assertStoryboard(parsed);
    return parsed;
  } catch (error) {
    console.error("Invalid storyboard JSON from GPT:");
    console.error(rawOutput);
    throw error;
  }
}
