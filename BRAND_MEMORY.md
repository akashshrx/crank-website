# Brand Memory — Wispr Flow & Glide

This document captures the brand assets, design philosophy, typography hierarchy, and implementation rules to keep the Glide visual identity premium, cohesive, and consistent across all pages.

---

## 🎨 Visual Identity & Style Guide

### 1. Typography (The Editorial Contrast)
Wispr Flow and Glide achieve their premium look by pairing a traditional, elegant Serif display font with a clean, modern, readable Sans-Serif font:
*   **Headings / Display Text:** **EB Garamond** (Google Fonts). Elegant, high-contrast, classic serif. Gives a literary, high-trust, human-centric vibe. Used with italic highlights to emphasize key actions.
*   **Body / UI Text:** **Figtree** (Google Fonts). Warm, geometric sans-serif. Highly readable at small sizes.
*   **Monospace Text:** **JetBrains Mono**. Clean, technical sans-serif for code/short descriptions.
*   **Caveat Highlights:** **Caveat** (Google Fonts). Used for handwritten highlights in answers or key privacy elements (e.g. `shimmer-target` highlights).

### 2. Color Palette (Organic & High-Trust)
*   **Primary Background:** Warm Off-Black (`#0b0b0a` or `#0e0e0d`).
*   **Primary Text:** Crisp Warm White (`#fbfbfa`).
*   **Accent Teal:** Emerald Forest Green/Blue (`#044f46` / `#00b49d` / `#0099e6`).
*   **Muted Text:** Warm Sage Grey (`#878782` or `#8f928e`).
*   **Light Mode Fallback:** Warm Cream (`#fcfcf9` background, `#121210` text, used on pages like the Privacy Policy).

### 3. Layout & Notch Interaction
*   **The Mac Notch:** The primary top navigation bar is styled like a native macOS camera notch (`.header-container`).
    *   **Desktop Hover Effect:** When hovering over the notch, it expands dynamically left, right, and down by **5%** (width scales to `821.1px` and height to `67.2px`) with a smooth CSS cubic-bezier transition, returning to default sizes on hover-out.
    *   **Mobile Screens:** Scaled notch is deactivated on screen widths under `768px`, fallback to standard full-width rounded pill.
*   **Prompt Pills (Stack Section):**
    *   **Icons:** Always use official, pixel-perfect multicolor or monochrome brand SVG vector paths directly inline (Figma, Notion, Slack, GitHub, Linear, HubSpot, Apple).
    *   **Sizing:** Kept compact (`clamp(1.28rem, 1.79vw, 1.79rem)`) without background boxes for a clean, minimalist layout.
    *   **LinkedIn Logo:** Rendered in monochrome white (`#fff`) to align perfectly with the surrounding prompt layouts.

---

## 💻 macOS Dock Footer Specifications
To ensure consistency across the **Homepage (`index.html`)**, **FAQ (`faq.html`)**, and **Privacy Policy (`privacy.html`)**:

*   **Markup Order:**
    *   **Left of Dock Icon:** Copyright block `GLIDE INC. © 2026` + `ALL RIGHT RESERVED` (aligned to the right / flex-end).
    *   **Center:** macOS dock icon container containing the Glide logo.
    *   **Right of Dock Icon:** Navigation sublinks (`FAQ`, `Privacy Policy`) aligned to the left / flex-start.
*   **Color Adaptability:**
    *   **Dark backgrounds (Home, FAQ):** White text (`#ffffff`), white hover highlights, and white logo (`logo_white.png`).
    *   **Light backgrounds (Privacy Policy):** Adaptable grey text (`#777777`), black hovers (`#000000`), and dark logo (`logo_dark.png`).
    *   **Night Theme (Privacy Policy Auto-detect):** Instantly flips the Privacy page footer to high-contrast white text and swaps the dock logo to white when local time is after 6 PM or before 6 AM.

---

## 📊 Analytics & Autocapture (Amplitude)
*   **Central Script:** All interactions are handled client-side via `analytics.bundled.js` (compiled from `analytics.js` via `esbuild`).
*   **Tracked Events:**
    *   `download_button_clicked` (Download CTA clicks).
    *   `faq_expanded` / `faq_collapsed` (FAQ accordion interaction tracking).
    *   `theme_changed` (Day vs. Space Night modes switched).
