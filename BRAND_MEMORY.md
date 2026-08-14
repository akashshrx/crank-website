# Brand Memory — Glide

This document captures the official brand identity, visual assets, design philosophy, typography, color palette, and atmospheric WebGL elements that define the Glide experience across all pages.

---

## 🎨 Visual Identity & Brand Philosophy

### 1. Brand Atmosphere & The "Glide" Vibe
Glide represents lightness, effortless velocity, and atmospheric depth. The visual language evokes the feeling of soaring through an open sky:
* **WebGL Sky Atmosphere (`sky.js`):** Dynamic real-time WebGL sky canvas featuring smooth atmospheric gradients, daytime light and space-night transitions.
* **3D Volumetric Clouds (`cloud.png`):** Soft, layered cloud textures rendered with spatial depth behind the UI elements, reinforcing the airborne experience.
* **Autonomous Paper Plane Murmuration (`community.js`):** A flock of 3D paper planes executing organic starling murmuration flight patterns, following serene golden-ratio orbits with soft paper tints and high-inertia physics.

---

## ✒️ Typography (The Two Core Fonts)

Glide relies exclusively on two purpose-driven Google Fonts:

1. **Figtree (Primary Font — Headings, Body & UI)**
   * **Family:** `'Figtree', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
   * **Usage:** Used across all pages for main headings, subheadings, body text, buttons, navigation, and UI labels.
   * **Weights:** Ranging from light (`300`) up to bold/extra-bold (`700` – `800`) for clear hierarchy without needing separate display fonts.

2. **Caveat (Handwritten Accent Font)**
   * **Family:** `'Caveat', cursive`
   * **Usage:** Used for expressive handwritten highlights, playful callouts, creator notes, and key privacy/shimmer highlights (`shimmer-target`).
   * **Vibe:** Human, warm, and personal.

---

## 🎨 Color Palette & Sky Gradients

### 1. Primary Accent & Glide Blue
* **Glide Blue / Sky Blue:** `#0099e6` / `#00b49d` — Vibrant, atmospheric blue representing flight and clarity.
* **Deep Forest Emerald:** `#044f46` — Rich primary accent used for subtle glows and buttons.
* **Secondary Accents:** Soft Clay Red (`#c93b55`), Sage Green (`#2a7f76`), and Soft Ochre (`#a87920`).

### 2. Backgrounds & Themes
* **Dark Sky Mode (Main Theme):** Deep Off-Black / Atmosphere Dark (`#050508` or `#0b0b0a`).
* **Text Main:** Crisp Warm White (`#ffffff` or `#fbfbfa`).
* **Muted Text:** Warm Sage Grey (`rgba(255, 255, 255, 0.6)` / `#878782`).
* **Light Mode Fallback (Privacy / Documents):** Warm Cream background (`#fcfcf9`) with dark charcoal text (`#121210`). Auto-detects space night mode after 6 PM.

---

## 💻 Layout & Interactive Brand Elements

### 1. The Mac Notch Header (`.header-container`)
* **Mac Notch Styling:** The top navigation bar is styled to mirror a native macOS camera notch.
* **Desktop Hover Animation:** On desktop, hovering over the notch scales it dynamically left, right, and down by **5%** (expanding to `821.1px` width by `67.2px` height) with cubic-bezier transitions.
* **Mobile Breakpoint:** Scaled notch deactivates under `768px`, falling back to a full-width rounded pill.

### 2. Prompt Pills & Brand Vectors (Stack Section)
* **Official SVG Vectors:** Always use 100% accurate brand SVG vector paths (Figma, Notion, Slack, GitHub, Linear, HubSpot, Chrome, Notes, Adobe, etc.). Never use hand-drawn approximations or simplified circle drafts.
* **Sizing & Styling:** Kept compact (`clamp(1.28rem, 1.79vw, 1.79rem)`) without heavy background boxes. LinkedIn logo is rendered in monochrome white (`#fff`).

### 3. macOS Dock Footer
* **Layout Order:**
  * **Left:** Copyright text `GLIDE INC. © 2026` + `ALL RIGHTS RESERVED`.
  * **Center:** macOS dock icon container with the official Glide logo (`logo_white.png` or `logo_dark.png`).
  * **Right:** Navigation links (`FAQ`, `Privacy Policy`, etc.).
* **Theme Adaptability:** Dark backgrounds use white text and white logo; Light backgrounds adapt to charcoal text and dark logo, with automatic night-mode switching after 6 PM.

---

## 📊 Analytics & Autocapture (Amplitude)
* **Central Handler:** All client-side telemetry is bundled in `analytics.bundled.js` (compiled from `analytics.js`).
* **Tracked Events:** `download_button_clicked`, `faq_expanded` / `faq_collapsed`, `theme_changed`.
