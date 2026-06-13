import { generateStoryboardImages } from "../modules/image.js";
import { comicStripsToStoryboard, type VisualMode } from "../modules/visual-mapping.js";
import { saveStoryboardImages } from "./save-storyboard-images.js";

function getMode(): VisualMode {
  const mode = process.argv[2] ?? "user";

  if (mode !== "user" && mode !== "technical") {
    throw new Error('Mode must be "user" or "technical".');
  }

  return mode;
}

const mockStoryboard = comicStripsToStoryboard({
  actors: ["Developer"],
  mode: getMode(),
  flow: [
    {
      actor: "Developer",
      action: "sends login request",
      object: "token"
    }
  ],
  root_cause: "token refresh fails because the token is expired",
  expected: "refreshed token keeps user logged in"
});

async function main(): Promise<void> {
  const storyboardWithImages = await generateStoryboardImages(mockStoryboard);
  const savedDir = await saveStoryboardImages(
    storyboardWithImages.scenes.map((scene) => {
      const description = scene.description.toLowerCase();
      const filename = description.includes(" setup:")
        ? "setup.png"
        : description.includes(" problem:")
          ? "problem.png"
          : description.includes(" expected:")
            ? "expected.png"
            : `scene-${scene.scene}.png`;

      return {
        ...scene,
        filename
      };
    })
  );

  for (const scene of storyboardWithImages.scenes) {
    const displayUrl = scene.image_url.startsWith("data:")
      ? `${scene.image_url.slice(0, 80)}... (${scene.image_url.length} chars)`
      : scene.image_url;

    console.log(`Scene ${scene.scene}: ${displayUrl}`);
  }

  console.log(`Saved storyboard images to: ${savedDir}`);
}

main().catch((error: unknown) => {
  console.error("Image test failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
