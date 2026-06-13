import { callChatGPT } from "../clients/openai.js";

async function main(): Promise<void> {
  const result = await callChatGPT("Reply with one short sentence confirming this OpenAI test works.");
  console.log("OpenAI response:");
  console.log(result);
}

main().catch((error: unknown) => {
  console.error("OpenAI test failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
