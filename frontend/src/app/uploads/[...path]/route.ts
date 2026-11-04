import { readStoredPhoto } from "@novi-dom/backend";

// Fotografije iz lokalne shrambe (UPLOAD_DIR). Imena datotek so naključni UUID-ji,
// zato se vsebina pod istim URL-jem nikoli ne spremeni.
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const file = await readStoredPhoto(path.join("/"));
  if (!file) return new Response("Ni najdeno", { status: 404 });

  return new Response(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
