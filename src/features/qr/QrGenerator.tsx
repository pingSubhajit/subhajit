import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Image as ImageIcon,
  Link2,
  Palette,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DotType =
  | "dots"
  | "rounded"
  | "classy"
  | "classy-rounded"
  | "square"
  | "extra-rounded";
type CornerSquareType = "dot" | "square" | "extra-rounded" | DotType;
type CornerDotType = "dot" | "square" | DotType;
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

type Appearance = {
  foreground: string;
  background: string;
  transparent: boolean;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  errorCorrectionLevel: ErrorCorrectionLevel;
  margin: number;
  size: number;
  logoSize: number;
  logoMargin: number;
};

type Preset = {
  name: string;
  values: Pick<
    Appearance,
    | "foreground"
    | "background"
    | "transparent"
    | "dotType"
    | "cornerSquareType"
    | "cornerDotType"
  >;
};

type QRCodeStylingInstance = {
  append: (container?: HTMLElement) => void;
  update: (options?: Record<string, unknown>) => void;
  getRawData: (extension?: "png" | "svg") => Promise<Blob | null>;
};

const STORAGE_KEY = "subhajit.qr.appearance.v1";

const defaultAppearance: Appearance = {
  foreground: "#f4f4f5",
  background: "#18181b",
  transparent: false,
  dotType: "rounded",
  cornerSquareType: "extra-rounded",
  cornerDotType: "dot",
  errorCorrectionLevel: "Q",
  margin: 18,
  size: 960,
  logoSize: 0.28,
  logoMargin: 8,
};

const presets: Preset[] = [
  {
    name: "Classic",
    values: {
      foreground: "#111111",
      background: "#ffffff",
      transparent: false,
      dotType: "square",
      cornerSquareType: "square",
      cornerDotType: "square",
    },
  },
  {
    name: "Quiet",
    values: {
      foreground: "#f4f4f5",
      background: "#18181b",
      transparent: false,
      dotType: "rounded",
      cornerSquareType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Mono",
    values: {
      foreground: "#d4d4d8",
      background: "#09090b",
      transparent: false,
      dotType: "dots",
      cornerSquareType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Ocean",
    values: {
      foreground: "#67e8f9",
      background: "#082f49",
      transparent: false,
      dotType: "classy-rounded",
      cornerSquareType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Signal",
    values: {
      foreground: "#bef264",
      background: "#1a2e05",
      transparent: false,
      dotType: "extra-rounded",
      cornerSquareType: "extra-rounded",
      cornerDotType: "dot",
    },
  },
  {
    name: "Ink",
    values: {
      foreground: "#0f172a",
      background: "#f8fafc",
      transparent: false,
      dotType: "classy",
      cornerSquareType: "extra-rounded",
      cornerDotType: "square",
    },
  },
];

const dotTypes: { label: string; value: DotType }[] = [
  { label: "Rounded", value: "rounded" },
  { label: "Dots", value: "dots" },
  { label: "Square", value: "square" },
  { label: "Classy", value: "classy" },
  { label: "Classy rounded", value: "classy-rounded" },
  { label: "Extra rounded", value: "extra-rounded" },
];

const cornerSquareTypes: { label: string; value: CornerSquareType }[] = [
  { label: "Extra rounded", value: "extra-rounded" },
  { label: "Square", value: "square" },
  { label: "Dot", value: "dot" },
  { label: "Rounded", value: "rounded" },
  { label: "Classy", value: "classy" },
];

const cornerDotTypes: { label: string; value: CornerDotType }[] = [
  { label: "Dot", value: "dot" },
  { label: "Square", value: "square" },
  { label: "Rounded", value: "rounded" },
  { label: "Dots", value: "dots" },
  { label: "Extra rounded", value: "extra-rounded" },
];

const errorCorrectionLevels: { label: string; value: ErrorCorrectionLevel }[] =
  [
    { label: "Low", value: "L" },
    { label: "Medium", value: "M" },
    { label: "Quartile", value: "Q" },
    { label: "High", value: "H" },
  ];

function normalizeUrl(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return { value: "", valid: false, reason: "Enter a URL" };
  }

  const withScheme = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        value: withScheme,
        valid: false,
        reason: "Use an HTTP or HTTPS URL",
      };
    }
    if (!parsed.hostname) {
      return { value: withScheme, valid: false, reason: "Enter a host name" };
    }
    return { value: withScheme, valid: true, reason: "" };
  } catch {
    return { value: withScheme, valid: false, reason: "Enter a valid URL" };
  }
}

function isPrivateOrLocal(hostname: string) {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  )
    return true;
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd"))
    return true;

  const parts = host.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part)))
    return false;

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return null;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function luminance(channel: number) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(foreground: string, background: string) {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg) return 21;

  const fgL =
    0.2126 * luminance(fg.r) +
    0.7152 * luminance(fg.g) +
    0.0722 * luminance(fg.b);
  const bgL =
    0.2126 * luminance(bg.r) +
    0.7152 * luminance(bg.g) +
    0.0722 * luminance(bg.b);
  const lighter = Math.max(fgL, bgL);
  const darker = Math.min(fgL, bgL);
  return (lighter + 0.05) / (darker + 0.05);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 250);
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/50"
    >
      {children}
    </label>
  );
}

function NumberRange({
  id,
  label,
  min,
  max,
  step = 1,
  value,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <span className="text-xs tabular-nums text-foreground/55">
          {suffix === "%" ? Math.round(value * 100) : value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        min={min}
        max={max}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full cursor-pointer accent-foreground"
      />
    </div>
  );
}

export function QrGenerator() {
  const [url, setUrl] = React.useState("");
  const [appearance, setAppearance] =
    React.useState<Appearance>(defaultAppearance);
  const [logo, setLogo] = React.useState<string | null>(null);
  const [logoName, setLogoName] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [isReady, setIsReady] = React.useState(false);
  const [hasLoadedStorage, setHasLoadedStorage] = React.useState(false);

  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const qrRef = React.useRef<QRCodeStylingInstance | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const normalized = React.useMemo(() => normalizeUrl(url), [url]);

  const setAppearanceValue = React.useCallback(
    <Key extends keyof Appearance>(key: Key, value: Appearance[Key]) => {
      setAppearance((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const qrOptions = React.useMemo(
    () => ({
      width: appearance.size,
      height: appearance.size,
      type: "svg" as const,
      data: normalized.value,
      image: logo ?? undefined,
      margin: appearance.margin,
      qrOptions: {
        errorCorrectionLevel: appearance.errorCorrectionLevel,
      },
      dotsOptions: {
        color: appearance.foreground,
        type: appearance.dotType,
      },
      cornersSquareOptions: {
        color: appearance.foreground,
        type: appearance.cornerSquareType,
      },
      cornersDotOptions: {
        color: appearance.foreground,
        type: appearance.cornerDotType,
      },
      backgroundOptions: {
        color: appearance.transparent ? "transparent" : appearance.background,
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: appearance.logoSize,
        margin: appearance.logoMargin,
        saveAsBlob: true,
      },
    }),
    [appearance, logo, normalized.valid, normalized.value],
  );

  const urlWarning = React.useMemo(() => {
    if (!normalized.valid) return null;
    const parsed = new URL(normalized.value);
    if (parsed.protocol === "http:" && !isPrivateOrLocal(parsed.hostname)) {
      return "Non-HTTPS public URL";
    }
    return null;
  }, [normalized]);

  const scanWarnings = React.useMemo(() => {
    const warnings: string[] = [];
    if (
      !appearance.transparent &&
      contrastRatio(appearance.foreground, appearance.background) < 4.5
    ) {
      warnings.push("Low contrast");
    }
    if (appearance.transparent) {
      warnings.push("Transparent background");
    }
    if (appearance.margin < 8) {
      warnings.push("Small quiet zone");
    }
    if (logo && appearance.logoSize > 0.34) {
      warnings.push("Large logo");
    }
    if (logo && appearance.errorCorrectionLevel !== "H") {
      warnings.push("Use high correction with logo");
    }
    return warnings;
  }, [appearance, logo]);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Appearance>;
        setAppearance((current) => ({ ...current, ...parsed }));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasLoadedStorage(true);
    }
  }, []);

  React.useEffect(() => {
    if (!hasLoadedStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
  }, [appearance, hasLoadedStorage]);

  React.useEffect(() => {
    let cancelled = false;

    async function renderQr() {
      if (!normalized.valid) {
        if (previewRef.current) previewRef.current.innerHTML = "";
        qrRef.current = null;
        setIsReady(false);
        return;
      }

      const QRCodeStyling = (await import("qr-code-styling")).default;
      if (cancelled || !previewRef.current) return;

      if (!qrRef.current) {
        qrRef.current = new QRCodeStyling(qrOptions) as QRCodeStylingInstance;
        previewRef.current.innerHTML = "";
        qrRef.current.append(previewRef.current);
      } else {
        qrRef.current.update(qrOptions);
      }

      setIsReady(true);
    }

    renderQr().catch(() => {
      if (!cancelled) setStatus("Preview failed");
    });

    return () => {
      cancelled = true;
    };
  }, [normalized.valid, qrOptions]);

  function applyPreset(preset: Preset) {
    setAppearance((current) => ({ ...current, ...preset.values }));
    setStatus("");
  }

  function resetStyle() {
    setAppearance(defaultAppearance);
    setLogo(null);
    setLogoName("");
    setStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/svg+xml",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setStatus("Use PNG, JPG, SVG, or WebP");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatus("Logo must be under 2 MB");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(String(reader.result));
      setLogoName(file.name);
      setStatus("");
      setAppearance((current) => ({ ...current, errorCorrectionLevel: "H" }));
    };
    reader.onerror = () => setStatus("Logo failed");
    reader.readAsDataURL(file);
  }

  async function exportQr(extension: "png" | "svg") {
    if (!qrRef.current || !normalized.valid) return;

    try {
      const blob = await qrRef.current.getRawData(extension);
      if (!blob) throw new Error("Missing export data");
      downloadBlob(blob, `qr-code.${extension}`);
      setStatus(`${extension.toUpperCase()} downloaded`);
    } catch {
      setStatus(`${extension.toUpperCase()} export failed`);
    }
  }

  async function copyPng() {
    if (!qrRef.current || !normalized.valid) return;

    try {
      if (!navigator.clipboard || !("ClipboardItem" in window)) {
        setStatus("Clipboard unavailable");
        return;
      }

      const blob = await qrRef.current.getRawData("png");
      if (!blob) throw new Error("Missing PNG data");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setStatus("PNG copied");
    } catch {
      setStatus("Copy failed");
    }
  }

  const canExport = normalized.valid && isReady;
  const safetyLabel = !normalized.valid
    ? "Waiting"
    : scanWarnings.length === 0
      ? "Looks safe"
      : "Review before export";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)] lg:items-start">
      <section className="space-y-6" aria-label="QR code controls">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-foreground/65">
            <Link2 className="size-4" aria-hidden="true" />
            <FieldLabel htmlFor="qr-url">URL</FieldLabel>
          </div>
          <input
            id="qr-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setStatus("");
            }}
            placeholder="https://example.com"
            aria-describedby="qr-url-state qr-normalized-url"
            className="h-12 w-full rounded-md border border-white/10 bg-white/[0.03] px-4 text-base text-foreground outline-none transition placeholder:text-foreground/25 focus:border-foreground/35 focus:ring-4 focus:ring-white/10"
          />
          {normalized.valid && (
            <div
              id="qr-normalized-url"
              className="break-all text-xs text-foreground/55"
            >
              Finalized URL: {normalized.value}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground/65">
            <Palette className="size-4" aria-hidden="true" />
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/50">
              Style
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="flex h-12 cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/[0.025] px-3 text-left text-sm text-foreground/75 transition hover:border-white/25 hover:bg-white/[0.05] focus:outline-none focus:ring-4 focus:ring-white/10"
              >
                <span>{preset.name}</span>
                <span
                  className="size-5 rounded-sm border border-white/20"
                  style={{
                    background: preset.values.transparent
                      ? `linear-gradient(135deg, ${preset.values.foreground} 0 50%, transparent 50% 100%)`
                      : preset.values.foreground,
                  }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel htmlFor="qr-foreground">Foreground</FieldLabel>
              <div className="flex h-12 items-center gap-3 rounded-md border border-white/10 bg-white/[0.025] px-3">
                <input
                  id="qr-foreground"
                  type="color"
                  value={appearance.foreground}
                  onChange={(event) =>
                    setAppearanceValue("foreground", event.target.value)
                  }
                  className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="font-mono text-xs text-foreground/60">
                  {appearance.foreground}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="qr-background">Background</FieldLabel>
              <div className="flex h-12 items-center gap-3 rounded-md border border-white/10 bg-white/[0.025] px-3">
                <input
                  id="qr-background"
                  type="color"
                  value={appearance.background}
                  disabled={appearance.transparent}
                  onChange={(event) =>
                    setAppearanceValue("background", event.target.value)
                  }
                  className="size-8 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-40"
                />
                <span className="font-mono text-xs text-foreground/60">
                  {appearance.transparent
                    ? "transparent"
                    : appearance.background}
                </span>
              </div>
            </div>
          </div>

          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.025] px-3 text-sm text-foreground/70 transition hover:border-white/20">
            Transparent background
            <input
              type="checkbox"
              checked={appearance.transparent}
              onChange={(event) =>
                setAppearanceValue("transparent", event.target.checked)
              }
              className="size-5 cursor-pointer accent-foreground"
            />
          </label>
        </div>

        <details className="group rounded-md border border-white/10 bg-white/[0.02] open:bg-white/[0.025]">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm text-foreground/75 focus:outline-none focus:ring-4 focus:ring-white/10">
            QR details
            <span className="text-xs text-foreground/40 group-open:hidden">
              Open
            </span>
            <span className="hidden text-xs text-foreground/40 group-open:inline">
              Close
            </span>
          </summary>
          <div className="space-y-5 border-t border-white/10 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="qr-dot-type">Dots</FieldLabel>
                <select
                  id="qr-dot-type"
                  value={appearance.dotType}
                  onChange={(event) =>
                    setAppearanceValue("dotType", event.target.value as DotType)
                  }
                  className="h-11 w-full rounded-md border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-foreground/35 focus:ring-4 focus:ring-white/10"
                >
                  {dotTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="qr-corner-square">Corners</FieldLabel>
                <select
                  id="qr-corner-square"
                  value={appearance.cornerSquareType}
                  onChange={(event) =>
                    setAppearanceValue(
                      "cornerSquareType",
                      event.target.value as CornerSquareType,
                    )
                  }
                  className="h-11 w-full rounded-md border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-foreground/35 focus:ring-4 focus:ring-white/10"
                >
                  {cornerSquareTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="qr-corner-dot">Corner dots</FieldLabel>
                <select
                  id="qr-corner-dot"
                  value={appearance.cornerDotType}
                  onChange={(event) =>
                    setAppearanceValue(
                      "cornerDotType",
                      event.target.value as CornerDotType,
                    )
                  }
                  className="h-11 w-full rounded-md border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-foreground/35 focus:ring-4 focus:ring-white/10"
                >
                  {cornerDotTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="qr-correction">Correction</FieldLabel>
                <select
                  id="qr-correction"
                  value={appearance.errorCorrectionLevel}
                  onChange={(event) =>
                    setAppearanceValue(
                      "errorCorrectionLevel",
                      event.target.value as ErrorCorrectionLevel,
                    )
                  }
                  className="h-11 w-full rounded-md border border-white/10 bg-background px-3 text-sm text-foreground outline-none focus:border-foreground/35 focus:ring-4 focus:ring-white/10"
                >
                  {errorCorrectionLevels.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <NumberRange
              id="qr-size"
              label="Size"
              min={512}
              max={2048}
              step={64}
              value={appearance.size}
              suffix="px"
              onChange={(value) => setAppearanceValue("size", value)}
            />
            <NumberRange
              id="qr-margin"
              label="Quiet zone"
              min={0}
              max={48}
              value={appearance.margin}
              suffix="px"
              onChange={(value) => setAppearanceValue("margin", value)}
            />
          </div>
        </details>

        <details className="group rounded-md border border-white/10 bg-white/[0.02] open:bg-white/[0.025]">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm text-foreground/75 focus:outline-none focus:ring-4 focus:ring-white/10">
            Center logo
            <span className="text-xs text-foreground/40 group-open:hidden">
              Open
            </span>
            <span className="hidden text-xs text-foreground/40 group-open:inline">
              Close
            </span>
          </summary>
          <div className="space-y-5 border-t border-white/10 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                id="qr-logo"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoChange}
                className="sr-only"
              />
              <Button
                asChild
                variant="outline"
                className="h-11 cursor-pointer border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
              >
                <label htmlFor="qr-logo">
                  <Upload className="size-4" aria-hidden="true" />
                  Upload
                </label>
              </Button>
              {logo ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 text-foreground/70 hover:bg-white/[0.06]"
                  onClick={() => {
                    setLogo(null);
                    setLogoName("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="size-4" aria-hidden="true" />
                  Remove
                </Button>
              ) : null}
              <div className="flex min-h-11 items-center gap-2 text-sm text-foreground/50">
                <ImageIcon className="size-4" aria-hidden="true" />
                <span className="max-w-56 truncate">
                  {logoName || "No logo"}
                </span>
              </div>
            </div>
            <NumberRange
              id="qr-logo-size"
              label="Logo size"
              min={0.16}
              max={0.45}
              step={0.01}
              value={appearance.logoSize}
              suffix="%"
              onChange={(value) => setAppearanceValue("logoSize", value)}
            />
            <NumberRange
              id="qr-logo-padding"
              label="Logo padding"
              min={0}
              max={24}
              value={appearance.logoMargin}
              suffix="px"
              onChange={(value) => setAppearanceValue("logoMargin", value)}
            />
          </div>
        </details>
      </section>

      <aside
        className="space-y-4 lg:sticky lg:top-10"
        aria-label="QR code preview and export"
      >
        <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4 shadow-2xl shadow-black/20">
          <div
            className={cn(
              "grid aspect-square w-full place-items-center overflow-hidden rounded-md border border-white/10 bg-white/[0.03] p-5",
              !normalized.valid && "opacity-45",
            )}
          >
            <div
              ref={previewRef}
              aria-hidden={!normalized.valid}
              className="grid max-h-full max-w-full place-items-center [&_canvas]:h-auto [&_canvas]:max-h-full [&_canvas]:max-w-full [&_svg]:h-auto [&_svg]:max-h-full [&_svg]:max-w-full"
            />
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-white/[0.025] p-4">
          {status ? (
            <div className="flex items-start justify-between gap-4 mb-4">
              <div
                className="text-right text-xs text-foreground/45"
                aria-live="polite"
              >
                {status}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              type="button"
              disabled={!canExport}
              onClick={() => exportQr("png")}
              className="h-11"
            >
              <Download className="size-4" aria-hidden="true" />
              PNG
            </Button>
            <Button
              type="button"
              disabled={!canExport}
              onClick={() => exportQr("svg")}
              variant="secondary"
              className="h-11"
            >
              <Download className="size-4" aria-hidden="true" />
              SVG
            </Button>
            <Button
              type="button"
              disabled={!canExport}
              onClick={copyPng}
              variant="outline"
              className="h-11 border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"
            >
              <Copy className="size-4" aria-hidden="true" />
              Copy
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={resetStyle}
            className="mt-2 h-10 w-full text-foreground/65 hover:bg-white/[0.06]"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset style
          </Button>
        </div>
      </aside>
    </div>
  );
}
