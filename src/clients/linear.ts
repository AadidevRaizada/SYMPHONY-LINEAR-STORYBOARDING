import { env } from "../config/env.js";

export type LinearIssue = {
  title: string;
  description: string | null;
};

export type LinearComment = {
  id: string;
  body: string;
  createdAt: string;
};

export type LinearUploadedImage = {
  assetUrl: string;
  source: "imageUploadFromUrl" | "fileUpload";
};

type LinearUploadHeader = {
  key: string;
  value: string;
};

type LinearUploadFile = {
  uploadUrl: string;
  assetUrl: string;
  headers: LinearUploadHeader[];
};

type LinearGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
  }>;
};

export async function getIssue(issueId: string): Promise<LinearIssue | null> {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: env.LINEAR_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: `
        query GetIssue($id: String!) {
          issue(id: $id) {
            title
            description
          }
        }
      `,
      variables: {
        id: issueId
      }
    })
  });

  const data = (await response.json()) as LinearGraphQLResponse<{ issue: LinearIssue | null }>;

  if (!response.ok) {
    throw new Error(`Linear request failed with status ${response.status}`);
  }

  if (data.errors?.length) {
    throw new Error(data.errors.map((error) => error.message).join("; "));
  }

  return data.data?.issue ?? null;
}

export async function createIssueComment(issueId: string, body: string): Promise<LinearComment> {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: env.LINEAR_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: `
        mutation CreateComment($input: CommentCreateInput!) {
          commentCreate(input: $input) {
            success
            comment {
              id
              body
              createdAt
            }
          }
        }
      `,
      variables: {
        input: {
          issueId,
          body
        }
      }
    })
  });

  const data = (await response.json()) as LinearGraphQLResponse<{
    commentCreate: {
      success: boolean;
      comment: LinearComment;
    };
  }>;

  if (!response.ok) {
    throw new Error(`Linear comment request failed with status ${response.status}`);
  }

  if (data.errors?.length) {
    throw new Error(data.errors.map((error) => error.message).join("; "));
  }

  if (!data.data?.commentCreate.success || !data.data.commentCreate.comment) {
    throw new Error("Linear commentCreate did not return a created comment.");
  }

  return data.data.commentCreate.comment;
}

export async function uploadImageUrlToLinear(url: string): Promise<LinearUploadedImage> {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: env.LINEAR_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: `
        mutation UploadImageFromUrl($url: String!) {
          imageUploadFromUrl(url: $url) {
            success
            url
          }
        }
      `,
      variables: {
        url
      }
    })
  });

  const data = (await response.json()) as LinearGraphQLResponse<{
    imageUploadFromUrl: {
      success: boolean;
      url: string | null;
    };
  }>;

  if (!response.ok) {
    throw new Error(`Linear imageUploadFromUrl request failed with status ${response.status}`);
  }

  if (data.errors?.length) {
    throw new Error(data.errors.map((error) => error.message).join("; "));
  }

  const assetUrl = data.data?.imageUploadFromUrl.url;

  if (!data.data?.imageUploadFromUrl.success || !assetUrl) {
    throw new Error("Linear imageUploadFromUrl did not return an uploaded image URL.");
  }

  return {
    assetUrl,
    source: "imageUploadFromUrl"
  };
}

async function requestFileUpload(filename: string, contentType: string, size: number): Promise<LinearUploadFile> {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: env.LINEAR_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: `
        mutation UploadFile($filename: String!, $contentType: String!, $size: Int!) {
          fileUpload(filename: $filename, contentType: $contentType, size: $size, makePublic: true) {
            success
            uploadFile {
              uploadUrl
              assetUrl
              headers {
                key
                value
              }
            }
          }
        }
      `,
      variables: {
        filename,
        contentType,
        size
      }
    })
  });

  const data = (await response.json()) as LinearGraphQLResponse<{
    fileUpload: {
      success: boolean;
      uploadFile: LinearUploadFile | null;
    };
  }>;

  if (!response.ok) {
    throw new Error(`Linear fileUpload request failed with status ${response.status}`);
  }

  if (data.errors?.length) {
    throw new Error(data.errors.map((error) => error.message).join("; "));
  }

  const uploadFile = data.data?.fileUpload.uploadFile;

  if (!data.data?.fileUpload.success || !uploadFile) {
    throw new Error("Linear fileUpload did not return upload details.");
  }

  return uploadFile;
}

function pngDataUrlToBuffer(dataUrl: string): Buffer {
  const prefix = "data:image/png;base64,";

  if (!dataUrl.startsWith(prefix)) {
    throw new Error("Only PNG data URLs can be uploaded to Linear.");
  }

  return Buffer.from(dataUrl.slice(prefix.length), "base64");
}

export async function uploadImageDataUrlToLinear(dataUrl: string, filename: string): Promise<LinearUploadedImage> {
  const contentType = "image/png";
  const file = pngDataUrlToBuffer(dataUrl);
  const uploadFile = await requestFileUpload(filename, contentType, file.byteLength);
  const uploadHeaders = new Headers();

  for (const header of uploadFile.headers) {
    uploadHeaders.set(header.key, header.value);
  }

  if (!uploadHeaders.has("content-type")) {
    uploadHeaders.set("content-type", contentType);
  }

  const uploadResponse = await fetch(uploadFile.uploadUrl, {
    method: "PUT",
    headers: uploadHeaders,
    body: new Blob([new Uint8Array(file)], { type: contentType })
  });

  if (!uploadResponse.ok) {
    const message = await uploadResponse.text();
    throw new Error(`Linear asset upload failed with status ${uploadResponse.status}: ${message}`);
  }

  return {
    assetUrl: uploadFile.assetUrl,
    source: "fileUpload"
  };
}

export async function uploadImageToLinear(imageUrl: string, filename: string): Promise<LinearUploadedImage> {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return uploadImageUrlToLinear(imageUrl);
  }

  return uploadImageDataUrlToLinear(imageUrl, filename);
}
