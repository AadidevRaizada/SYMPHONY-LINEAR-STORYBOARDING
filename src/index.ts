export { getIssue, createIssueComment, uploadImageToLinear } from "./clients/linear.js";
export { callChatGPT } from "./clients/openai.js";
export { generateStickmanImage, generateStoryboardImages } from "./modules/image.js";
export {
  comicStripsToStoryboard,
  formatComicStripForPrompt,
  mapIssueToComicStrips,
  validateComicStrip,
  validateComicStripPanel,
  validateComicStrips,
  type ComicStrip,
  type ComicStripPanel,
  type ComicStripType,
  type VisualMappingInput,
  type VisualMode
} from "./modules/visual-mapping.js";
export { generateFromLinear, type LinearGenerationResult } from "./orchestrator/run.js";
