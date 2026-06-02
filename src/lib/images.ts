import path from "node:path";
import sharp from "sharp";
import { rgbaToThumbHash, thumbHashToDataURL } from "thumbhash";

export interface ImageData {
  /** Public URL of the asset, unchanged from the caller. */
  src: string;
  /** Intrinsic pixel width (0 if a remote image could not be fetched). */
  width: number;
  /** Intrinsic pixel height (0 if a remote image could not be fetched). */
  height: number;
  /** Inline PNG data URL (ThumbHash) blur-up placeholder; "" when unavailable. */
  placeholder: string;
}

// Build-time memoisation: the same cover is requested by the home grid, the
// projects index, and the detail page within one build — decode each file once.
const cache = new Map<string, ImageData>();

function isRemote(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

/** Decode an image (path or buffer) into dimensions + a ThumbHash placeholder. */
async function compute(src: string, input: string | Buffer): Promise<ImageData> {
  const pipeline = sharp(input);
  const meta = await pipeline.metadata();

  // ThumbHash requires both dimensions ≤ 100px; fit the largest side to 100.
  const { data, info } = await pipeline
    .resize(100, 100, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hash = rgbaToThumbHash(info.width, info.height, data);
  return {
    src,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    placeholder: thumbHashToDataURL(hash),
  };
}

/**
 * Resolve an `image` reference to dimensions plus a ThumbHash placeholder,
 * computed at build time with `sharp` (runs in Astro's frontmatter, which
 * executes in Node during the static build and in dev).
 *
 * Local `public/`-relative paths (e.g. `/assets/covers/x.webp`) are read from
 * disk and a missing file throws, so a broken `image:` path fails the build
 * loudly. Remote URLs are fetched once; if the fetch or decode fails the build
 * still succeeds with an empty placeholder (the image just renders without the
 * blur-up), so a flaky external host can't break a deploy.
 */
export async function getImageData(src: string): Promise<ImageData> {
  const cached = cache.get(src);
  if (cached) return cached;

  let result: ImageData;
  if (isRemote(src)) {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      result = await compute(src, Buffer.from(await res.arrayBuffer()));
    } catch (err) {
      console.warn(
        `[BlurImage] skipping placeholder for remote image ${src}: ${(err as Error).message}`,
      );
      result = { src, width: 0, height: 0, placeholder: "" };
    }
  } else {
    result = await compute(src, path.join(process.cwd(), "public", src));
  }

  cache.set(src, result);
  return result;
}
