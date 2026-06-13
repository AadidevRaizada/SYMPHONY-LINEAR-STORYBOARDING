import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

type SaveablePanel = {
  scene: number;
  image_url: string;
  filename?: string;
  caption?: string;
  description?: string;
  visual?: string;
};

type SavedPanel = {
  scene: number;
  file: string;
  caption?: string;
  description?: string;
  visual?: string;
  source: "data-url" | "remote-url";
};

const STORYBOARD_FOLDER_PATTERN = /^storyboard-?(\d+)$/i;

async function getNextStoryboardFolder(rootDir: string): Promise<string> {
  await mkdir(rootDir, { recursive: true });

  const entries = await readdir(rootDir, { withFileTypes: true });
  const highest = entries.reduce((max, entry) => {
    if (!entry.isDirectory()) {
      return max;
    }

    const match = entry.name.match(STORYBOARD_FOLDER_PATTERN);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  const nextFolder = path.join(rootDir, `storyboard-${highest + 1}`);
  await mkdir(nextFolder, { recursive: false });
  return nextFolder;
}

async function imageUrlToBuffer(imageUrl: string): Promise<{ buffer: Buffer; source: SavedPanel["source"] }> {
  const dataUrlPrefix = "data:image/png;base64,";

  if (imageUrl.startsWith(dataUrlPrefix)) {
    return {
      buffer: Buffer.from(imageUrl.slice(dataUrlPrefix.length), "base64"),
      source: "data-url"
    };
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download image ${imageUrl}: ${response.status}`);
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      source: "remote-url"
    };
  }

  throw new Error("Unsupported image URL format.");
}

function filenameForPanel(panel: SaveablePanel): string {
  if (panel.filename) {
    return panel.filename;
  }

  const description = panel.description?.toLowerCase() ?? "";

  if (description.includes(" setup:") || description.includes(" setup ")) {
    return "setup.png";
  }

  if (description.includes(" problem:") || description.includes(" problem ")) {
    return "problem.png";
  }

  if (description.includes(" expected:") || description.includes(" expected ")) {
    return "expected.png";
  }

  return `scene-${panel.scene}.png`;
}

export async function saveStoryboardImages(panels: SaveablePanel[]): Promise<string> {
  const rootDir = path.join(process.cwd(), "test-storyboards");
  const storyboardDir = await getNextStoryboardFolder(rootDir);
  const metadata: SavedPanel[] = [];

  for (const panel of panels) {
    const { buffer, source } = await imageUrlToBuffer(panel.image_url);
    const filename = filenameForPanel(panel);
    await writeFile(path.join(storyboardDir, filename), buffer);

    metadata.push({
      scene: panel.scene,
      file: filename,
      caption: panel.caption,
      description: panel.description,
      visual: panel.visual,
      source
    });
  }

  await writeFile(
    path.join(storyboardDir, "metadata.json"),
    `${JSON.stringify({ createdAt: new Date().toISOString(), panels: metadata }, null, 2)}\n`
  );

  return storyboardDir;
}
