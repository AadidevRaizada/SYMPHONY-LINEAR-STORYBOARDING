import { env } from "../config/env.js";
import type { Storyboard, StoryboardCharacter, StoryboardScene } from "./storyboard.js";

const STICKMAN_GLOBAL_STYLE = `Expressive stickman comic inspired by clean web-animation stick figure formats.
4-panel comic strip.
Pure white background only.
Black ink lines only.
Bold clean black lines.
No black background.
No dark mode.
No inverted colors.
No filled black panels.
No shading.
Same character across panels.
Expressive but simple.
Readable at a glance.`;

export type StoryboardSceneWithImage = StoryboardScene & {
  image_url: string;
};

export type StoryboardWithImages = {
  characters: StoryboardCharacter[];
  scenes: StoryboardSceneWithImage[];
};

type OpenAIImageResponse = {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message?: string;
  };
};

function buildStickmanPrompt(scene: StoryboardScene, characters: StoryboardCharacter[]): string {
  const characterDefinitions = characters
    .map((character) => `- ${character.name}: ${character.appearance}`)
    .join("\n");
  return `${STICKMAN_GLOBAL_STYLE}

Character definitions:
${characterDefinitions}

Character:
Developer = stick figure, hoodie, round head, dot eyes.

Comic strip structure:
- Generate ONE image containing exactly 4 panels.
- This image must cover only the strip type in the visual description: setup, problem, or expected.
- Do not include the other strip types in this image.
- Each of the 4 panels shows one tiny beat of the same strip.
- Use a left-to-right comic strip format with clear panel borders.

Technical visual language:
- Use only these symbols: request = one arrow, error = one X, success = one check.
- Do not draw refresh loops, circular arrows, multiple arrows, chains, or extra symbols.
- Represent token as a single key-shaped object only when the panel object says token.
- Keep labels short: SETUP, PROBLEM, EXPECTED, TOKEN, ERROR.
- No extra symbols, no extra background elements.

Scene description:
${scene.description}

Visual description:
${scene.visual}

Strict composition rules:
- The canvas background must remain white in every panel.
- Lines, character, borders, and text must be black.
- Each panel shows one idea only.
- Each panel contains at most one stickman actor and one system object.
- Do not show multiple steps in one panel.
- Use minimal symbols.
- Use large clear actions.
- Focus on clarity over detail.
- The final image must be readable as a comic strip at a glance.`;
}

export async function generateStickmanImage(
  scene: StoryboardScene,
  characters: StoryboardCharacter[]
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: buildStickmanPrompt(scene, characters),
      n: 1,
      size: "1024x1024"
    })
  });

  const data = (await response.json()) as OpenAIImageResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `OpenAI image request failed with status ${response.status}`);
  }

  const image = data.data?.[0];
  const imageUrl = image?.url ?? (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : undefined);

  if (!imageUrl) {
    throw new Error("OpenAI image response did not include an image URL.");
  }

  return imageUrl;
}

export async function generateStoryboardImages(storyboard: Storyboard): Promise<StoryboardWithImages> {
  const scenes = await Promise.all(
    storyboard.scenes.map(async (scene) => {
      const imageUrl = await generateStickmanImage(scene, storyboard.characters);
      return {
        ...scene,
        image_url: imageUrl
      };
    })
  );

  return {
    characters: storyboard.characters,
    scenes
  };
}
