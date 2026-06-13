import { createIssueComment, getIssue, uploadImageToLinear } from "../clients/linear.js";
import { generateStoryboardImages } from "../modules/image.js";
import { comicStripsToStoryboard, type VisualMode } from "../modules/visual-mapping.js";

export type GeneratedPanel = {
  scene: number;
  image_url: string;
  caption: string;
};

export type LinearGenerationResult = {
  summary: string;
  mode: VisualMode;
  linear_comment_id: string;
  panels: GeneratedPanel[];
};

function formatLinearComment(result: Omit<LinearGenerationResult, "linear_comment_id">): string {
  const panelList = result.panels
    .map((panel) => {
      return `${panel.scene}. ${panel.caption}\n\n![Scene ${panel.scene}](${panel.image_url})`;
    })
    .join("\n\n");

  return `Stickman explainer comic strips generated for this issue.

Summary: ${result.summary}
Mode: ${result.mode} impact

Comic strips:
${panelList}`;
}

function expectedFromIssueText(issueText: string): string {
  const expectedMatch = issueText.match(/Expected(?: behavior)?:?\s*([^\n.]+)/i);
  return expectedMatch?.[1]?.trim() ?? "user stays logged in";
}

export async function generateFromLinear(issueId: string, mode: VisualMode = "user"): Promise<LinearGenerationResult> {
  const issue = await getIssue(issueId);

  if (!issue) {
    throw new Error(`Linear issue not found: ${issueId}`);
  }

  const issueText = [issue.title, issue.description].filter(Boolean).join("\n\n");
  const storyboard = comicStripsToStoryboard({
    actors: ["Developer"],
    mode,
    flow: [
      {
        actor: "Developer",
        action: mode === "technical" ? "sends request" : "uses app",
        object: mode === "technical" ? "token" : "app"
      }
    ],
    root_cause: issue.title,
    expected: expectedFromIssueText(issueText)
  });
  const storyboardWithImages = await generateStoryboardImages(storyboard);
  const panels = await Promise.all(
    storyboardWithImages.scenes.map(async (scene) => {
      const uploadedImage = await uploadImageToLinear(
        scene.image_url,
        `linear-stickman-${mode}-scene-${scene.scene}.png`
      );

      return {
        scene: scene.scene,
        image_url: uploadedImage.assetUrl,
        caption: scene.description
      };
    })
  );
  const resultWithoutComment = {
    summary: issue.title,
    mode,
    panels
  };
  const comment = await createIssueComment(issueId, formatLinearComment(resultWithoutComment));

  return {
    ...resultWithoutComment,
    linear_comment_id: comment.id
  };
}
