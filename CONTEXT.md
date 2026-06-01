# Subhajit Site

This context describes the public experiences available on Subhajit Kundu's personal site and the language used to distinguish them.

## Language

**QR Code Generator**:
A standalone public tool that creates tracker-free QR codes, primarily for URLs, with detailed visual customization.
_Avoid_: QR tracker, link shortener, homepage replacement

**Tracker-Free QR Code**:
A QR code that directly encodes the user's destination URL without redirects, short links, click analytics, or server-side saved scan data.
_Avoid_: Dynamic QR code, tracked QR code, analytics QR code

**Destination URL**:
The exact web address encoded into a Tracker-Free QR Code. The QR Code Generator does not support non-URL payloads in its initial scope.
_Avoid_: Payload, content, data

**Normalized URL**:
The final Destination URL after the QR Code Generator adds a missing scheme such as `https://`. The Normalized URL is what the generated QR code encodes; normalization preserves query strings, fragments, casing, paths, and trailing slashes.
_Avoid_: Clean URL, fixed URL, parsed URL

**URL Warning**:
A non-blocking notice about a Destination URL that may deserve review, such as a non-HTTPS public URL. URL Warnings do not prevent QR Export.
_Avoid_: Blocked URL, rejected URL, safety verdict

**QR Appearance**:
The visual properties of the QR code itself, including colors, transparency, module and corner styles, error correction, quiet zone, size, and optional Center Logo treatment. QR Appearance can return to defaults through a reset control, but it does not require multi-step undo history.
_Avoid_: Template, campaign, preset

**Scan Safety**:
Heuristic confidence that a customized Tracker-Free QR Code remains scannable despite QR Appearance changes. Scan Safety favors warnings and safer defaults over blocking export, but it does not guarantee scanner verification.
_Avoid_: Validation, quality score, compliance

**Center Logo**:
An optional user-provided image placed in the middle of a Tracker-Free QR Code and kept only in the browser during editing and export.
_Avoid_: Brand library, hosted logo, uploaded asset

**QR Export**:
The downloadable output of a Tracker-Free QR Code as PNG or SVG, with PNG clipboard copy when supported by the browser. QR Export should match the preview, include the Center Logo when technically reliable, and never add attribution or watermarking.
_Avoid_: PDF export, EPS export, hosted download, branded output

**Generator Workspace**:
The primary `/qr` experience where a user enters a Destination URL, adjusts essential QR Appearance controls, reviews Scan Safety, and creates a QR Export without navigating through a marketing page first. It shares the site's quiet dark foundation and typography while staying minimal, utilitarian, focused, and spacious; advanced QR Appearance controls remain available without dominating the first view.
_Avoid_: Landing page, campaign builder, dense dashboard

**Direct-Link Tool**:
A public tool that is available at its route but not promoted from the personal homepage, site navigation, or search indexing.
_Avoid_: Homepage feature, navigation item, project listing, indexed page

**Saved Appearance**:
The user's locally remembered QR Appearance preferences. Saved Appearance excludes Destination URLs and Center Logos.
_Avoid_: Saved QR code, saved project, history

**Style Preset**:
A built-in, editable starting point for QR Appearance. Style Presets are not saved user projects or tracked campaigns.
_Avoid_: Template, campaign preset, saved project

**Client-Side Generation**:
QR code creation, customization, Center Logo handling, and QR Export performed in the browser after `/qr` loads, without backend calls.
_Avoid_: Server generation, hosted rendering, upload flow

## Example Dialogue

Dev: Should the QR Code Generator change the personal homepage?

Domain Expert: No. The QR Code Generator is its own public tool; the personal homepage remains separate.

Dev: Can the QR Code Generator add branded redirects later?

Domain Expert: No. A Tracker-Free QR Code directly encodes the destination URL; it is not a redirect or analytics layer.

Dev: Should the QR Code Generator support Wi-Fi, contact cards, or email payloads?

Domain Expert: Not initially. The only supported QR content is a Destination URL.

Dev: If someone types `example.com`, what does the QR code contain?

Domain Expert: It contains the Normalized URL, `https://example.com`, and the app shows that value before export.

Dev: Should private, local, or non-HTTPS URLs be blocked?

Domain Expert: No. The QR Code Generator may show a URL Warning, but the user can still export the QR code.

Dev: Does elaborate customization mean frames, saved themes, and batch campaigns?

Domain Expert: No. It means detailed control over QR Appearance for a single Tracker-Free QR Code.

Dev: Can a user export a QR code with weak contrast or a large logo?

Domain Expert: Yes, but Scan Safety should warn them and default to safer settings when custom styling increases risk.

Dev: Where is the Center Logo stored?

Domain Expert: It is not stored by the site. The user selects it locally, edits the QR code in the browser, and can remove or replace it.

Dev: Which file types should QR Export include?

Domain Expert: PNG and SVG are in scope first. PDF, EPS, and WebP are not initial requirements.

Dev: Should `/qr` introduce the feature before showing the generator?

Domain Expert: No. The Generator Workspace is the first experience; users should be able to create and export immediately.

Dev: Should visitors find the QR Code Generator from the homepage?

Domain Expert: No. It is a Direct-Link Tool at `/qr`, not a promoted homepage feature.

Dev: Should the QR Code Generator remember the last URL I typed?

Domain Expert: No. Saved Appearance can remember styling preferences locally, but it must not remember Destination URLs or Center Logos.

Dev: Are Style Presets the same as saved QR projects?

Domain Expert: No. Style Presets are fixed starting points for QR Appearance and can be edited for the current QR code.

Dev: Does exporting a QR code require a backend request?

Domain Expert: No. Client-Side Generation means the QR Code Generator keeps generation and export in the browser after the page loads.
