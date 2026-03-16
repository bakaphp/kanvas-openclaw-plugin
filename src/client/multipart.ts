import { KanvasConfig, RequestContextOverride } from "../config/types.js";
import { buildKanvasHeaders } from "./headers.js";

export async function postGraphQLMultipart<TData>(options: {
  config: KanvasConfig;
  query: string;
  variables: Record<string, unknown>;
  files: Array<{ key: string; fileName: string; contentType?: string; content: Buffer | Uint8Array | Blob | string }>;
  override?: RequestContextOverride;
}): Promise<TData> {
  const form = new FormData();

  form.append(
    "operations",
    JSON.stringify({
      query: options.query,
      variables: options.variables,
    })
  );

  const map: Record<string, string[]> = {};
  options.files.forEach((file, index) => {
    map[String(index)] = [file.key];
  });
  form.append("map", JSON.stringify(map));

  options.files.forEach((file, index) => {
    let blob: Blob;

    if (file.content instanceof Blob) {
      blob = file.content;
    } else if (typeof file.content === "string") {
      blob = new Blob([file.content], { type: file.contentType ?? "text/plain" });
    } else {
      const uint8 = file.content instanceof Uint8Array ? file.content : new Uint8Array(file.content);
      blob = new Blob([uint8 as unknown as BlobPart], {
        type: file.contentType ?? "application/octet-stream",
      });
    }

    form.append(String(index), blob, file.fileName);
  });

  const headers = buildKanvasHeaders(options.config, options.override);
  delete headers["Content-Type"];

  const response = await fetch(options.config.apiUrl, {
    method: "POST",
    headers,
    body: form,
  });

  return (await response.json()) as TData;
}
