import { generateStoryboard } from "../modules/storyboard.js";

async function main(): Promise<void> {
  const storyboard = await generateStoryboard("Login fails after token refresh");
  console.log(JSON.stringify(storyboard, null, 2));
}

main().catch((error: unknown) => {
  console.error("Storyboard test failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
