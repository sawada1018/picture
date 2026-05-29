const BUCKET = "drawings";

/** data URL を Buffer と MIME に変換 */
export function dataUrlToBuffer(dataUrl: string): Buffer {
  return parseImageDataUrl(dataUrl).buffer;
}

export function parseImageDataUrl(dataUrl: string): {
  buffer: Buffer;
  contentType: string;
} {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) {
    throw new Error("画像データの形式が不正です");
  }
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

/** Storage 上のオブジェクトパス: {userId}/{date}.png */
export function drawingStoragePath(userId: string, questionDate: string): string {
  return `${userId}/${questionDate}.png`;
}

/** 公開 URL を組み立て */
export function getDrawingPublicUrl(
  supabaseUrl: string,
  storagePath: string
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

export { BUCKET };
