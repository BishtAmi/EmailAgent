export function extractEmailBody(payload: any): string {
  if (!payload.parts) {
    return payload.body?.data
      ? Buffer.from(payload.body.data, 'base64').toString()
      : '';
  }

  const part = payload.parts.find(
    (p: any) => p.mimeType === 'text/plain'
  );

  if (!part) return '';

  return Buffer.from(part.body.data, 'base64').toString();
}