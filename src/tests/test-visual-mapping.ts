import {
  mapIssueToComicStrips,
  validateComicStrip,
  validateComicStripPanel,
  validateComicStrips
} from "../modules/visual-mapping.js";

const userStrips = mapIssueToComicStrips({
  actors: ["Developer"],
  mode: "user",
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

const technicalStrips = mapIssueToComicStrips({
  actors: ["Developer"],
  mode: "technical",
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

validateComicStrips(userStrips);
validateComicStrips(technicalStrips);

for (const strip of [...userStrips, ...technicalStrips]) {
  validateComicStrip(strip);

  for (const panel of strip.panels) {
    validateComicStripPanel(panel);
  }
}

try {
  mapIssueToComicStrips({
    actors: ["Developer"],
    flow: [
      {
        actor: "Developer",
        action: "sends request and refreshes token",
        object: "token"
      }
    ],
    root_cause: "expired token",
    expected: "logged in state"
  });
  throw new Error("Expected multi-action panel validation to fail.");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("exactly one action")) {
    throw error;
  }
}

console.log(JSON.stringify({ user: userStrips, technical: technicalStrips }, null, 2));
