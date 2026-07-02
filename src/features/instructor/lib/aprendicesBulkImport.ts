import axios from "axios";

function parseFilenameFromDisposition(header: string | undefined, fallback: string) {
  if (!header) return fallback;
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? fallback;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

async function readResponseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error) return data.error;
  } catch {
    /* ignore */
  }
  return "No se pudo generar la plantilla";
}

export async function downloadAprendicesImportTemplate(programaId: string, fichaId: string) {
  const response = await fetch(
    `/api/instructor/aprendices/plantilla?programaId=${encodeURIComponent(programaId)}&fichaId=${encodeURIComponent(fichaId)}`
  );

  if (!response.ok) {
    throw new Error(await readResponseError(response));
  }

  const blob = await response.blob();
  const filename = parseFilenameFromDisposition(
    response.headers.get("content-disposition") ?? undefined,
    "plantilla-aprendices.xlsx"
  );

  triggerDownload(blob, filename);
}

export type AprendicesImportApiResult = {
  ok: boolean;
  creados?: number;
  omitidos?: number;
  errores?: { fila: number; mensaje: string }[];
  totalFilas?: number;
  error?: string;
};

export async function uploadAprendicesImportFile(
  file: File,
  programaId: string,
  fichaId: string
): Promise<AprendicesImportApiResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("programaId", programaId);
  formData.append("fichaId", fichaId);

  const { data } = await axios.post<AprendicesImportApiResult>(
    "/api/instructor/aprendices/import",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
}

export async function readAprendicesImportError(error: unknown): Promise<string> {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  if (!axios.isAxiosError(error)) {
    return "No se pudo completar la operacion";
  }

  const data = error.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) return parsed.error;
    } catch {
      /* ignore */
    }
  }

  if (data && typeof data === "object" && "error" in data) {
    const msg = (data as { error?: string }).error;
    if (msg) return msg;
  }

  return "No se pudo completar la operacion";
}
