import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const SOURCE_JSON = path.join(PROJECT_ROOT, "src", "data", "gallery.json");
const GENERATED_DIR = path.join(PROJECT_ROOT, "src", "generated");
const MANIFEST_JSON = path.join(GENERATED_DIR, "gallery.manifest.json");
const THUMBS_PUBLIC_DIR = path.join(PUBLIC_DIR, "gallery", "thumbs");

const THUMB_WIDTH = 900;
const THUMB_QUALITY = 78;

function ensureLeadingSlash(p) {
  if (typeof p !== "string") return "";
  return p.startsWith("/") ? p : `/${p}`;
}

function stripLeadingSlash(p) {
  return p.startsWith("/") ? p.slice(1) : p;
}

function normalizeUrlPath(p) {
  const withSlash = ensureLeadingSlash(p);
  // Avoid Windows backslashes if authoring on Windows
  return withSlash.replaceAll("\\", "/");
}

function toThumbUrl(srcUrl) {
  const srcNoSlash = stripLeadingSlash(normalizeUrlPath(srcUrl));
  const srcDir = path.posix.dirname(srcNoSlash);
  const base = path.posix.basename(srcNoSlash, path.posix.extname(srcNoSlash));
  const rel = path.posix.join("gallery", "thumbs", srcDir, `${base}.jpg`);
  return `/${rel}`.replaceAll("\\", "/");
}

function toFsPathFromPublicUrl(urlPath) {
  const rel = stripLeadingSlash(normalizeUrlPath(urlPath));
  return path.join(PUBLIC_DIR, rel);
}

async function fileMtimeMs(filePath) {
  try {
    const st = await fs.stat(filePath);
    return st.mtimeMs;
  } catch {
    return -1;
  }
}

function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

function stableIdFromSrc(src) {
  // Deterministic, URL-safe-ish id based on src path
  const normalized = normalizeUrlPath(src).toLowerCase();
  return normalized
    .replaceAll("/", "-")
    .replaceAll(".", "-")
    .replaceAll(/[^a-z0-9-_]/g, "")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

async function main() {
  const raw = await fs.readFile(SOURCE_JSON, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array in ${SOURCE_JSON}`);
  }

  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.mkdir(THUMBS_PUBLIC_DIR, { recursive: true });

  const photos = [];

  for (const [idx, item] of parsed.entries()) {
    const src = normalizeUrlPath(item?.src ?? "");
    const title = String(item?.title ?? "").trim();
    const shotUsing = String(item?.shotUsing ?? "").trim();
    const location = String(item?.location ?? "").trim();
    const description = String(item?.description ?? "").trim();

    if (!isNonEmptyString(src)) {
      throw new Error(`gallery.json[${idx}].src must be a non-empty string`);
    }

    const absSrc = toFsPathFromPublicUrl(src);
    const absSrcStat = await fs.stat(absSrc).catch(() => null);
    if (!absSrcStat?.isFile()) {
      throw new Error(
        `Missing file for gallery.json[${idx}].src: expected ${absSrc}`
      );
    }

    const thumbSrc = toThumbUrl(src);
    const absThumb = toFsPathFromPublicUrl(thumbSrc);
    await fs.mkdir(path.dirname(absThumb), { recursive: true });

    const srcMtime = await fileMtimeMs(absSrc);
    const thumbMtime = await fileMtimeMs(absThumb);

    const image = sharp(absSrc, { failOn: "none" });
    const meta = await image.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!width || !height) {
      throw new Error(
        `Could not read dimensions for ${src} (check file format / corruption)`
      );
    }

    const thumbWidth = Math.min(THUMB_WIDTH, width);
    const thumbHeight = Math.max(
      1,
      Math.round((height / width) * thumbWidth)
    );

    const shouldGenerate = thumbMtime < 0 || srcMtime > thumbMtime;
    if (shouldGenerate) {
      await sharp(absSrc, { failOn: "none" })
        .rotate()
        .resize({
          width: thumbWidth,
          height: thumbHeight,
          fit: "cover",
          position: "attention",
          withoutEnlargement: true,
        })
        .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
        .toFile(absThumb);
    }

    photos.push({
      id: stableIdFromSrc(src),
      src,
      thumbSrc,
      width,
      height,
      thumbWidth,
      thumbHeight,
      title,
      shotUsing,
      location,
      description,
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    thumb: { width: THUMB_WIDTH, quality: THUMB_QUALITY, format: "jpeg" },
    photos,
  };

  await fs.writeFile(MANIFEST_JSON, JSON.stringify(manifest, null, 2) + "\n");
}

main().catch((err) => {
  console.error("[gallery] Failed to generate thumbnails/manifest");
  console.error(err);
  process.exitCode = 1;
});

