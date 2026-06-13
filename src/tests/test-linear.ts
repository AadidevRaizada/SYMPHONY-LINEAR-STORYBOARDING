import { getIssue } from "../clients/linear.js";

async function main(): Promise<void> {
  const dummyIssueId = "00000000-0000-0000-0000-000000000000";

  try {
    const issue = await getIssue(dummyIssueId);
    console.log("Linear issue response:");
    console.log(issue);
  } catch (error: unknown) {
    console.log("Linear test handled expected dummy issue error:");
    console.log(error instanceof Error ? error.message : error);
  }
}

main().catch((error: unknown) => {
  console.error("Linear test failed unexpectedly:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
