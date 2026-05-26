const BUCKET = "drawings";

/** data URL (PNG) を Buffer に変換 */
export function dataUrlToBuffer(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!match) {
    throw new Error("画像データの形式が不正です");
  }
  return Buffer.from(match[1], "base64");
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
