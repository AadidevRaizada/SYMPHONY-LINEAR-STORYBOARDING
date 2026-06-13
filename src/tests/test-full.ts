import { generateFromLinear } from "../orchestrator/run.js";
import type { VisualMode } from "../modules/visual-mapping.js";
import { saveStoryboardImages } from "./save-storyboard-images.js";

function getIssueId(): string {
  const issueId = process.argv[2] ?? process.env.LINEAR_TEST_ISSUE_ID;

  if (!issueId || issueId.trim().length === 0) {
    throw new Error("Pass a Linear issue ID as an argument or set LINEAR_TEST_ISSUE_ID.");
  }

  return issueId.trim();
}

function getMode(): VisualMode {
  const mode = process.argv[3] ?? process.env.VISUAL_MODE ?? "user";

  if (mode !== "user" && mode !== "technical") {
    throw new Error('Mode must be "user" or "technical".');
  }

  return mode;
}

function filenameForScene(scene: number): string {
  if (scene === 1) {
    return "setup.png";
  }

  if (scene === 2) {
    return "problem.png";
  }

  if (scene === 3) {
    return "expected.png";
  }

  return `scene-${scene}.png`;
}

async function main(): Promise<void> {
  const result = await generateFromLinear(getIssueId(), getMode());
  const savedDir = await saveStoryboardImages(
    result.panels.map((panel) => ({
      ...panel,
      filename: filenameForScene(panel.scene)
    }))
  );
  console.error(`Saved storyboard images to: ${savedDir}`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error("Full pipeline test failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
