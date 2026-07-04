# Project Customization Rules — Glide Website

- The product name is **Glide** (formerly Crank/Caret). Avoid using "Crank" or "Caret" in code, text copy, or document filenames.
- The GitHub repository name is `glide-website`.
- The primary download file target is `Glide_macOS.dmg`.
- The official branding logos for Glide are:
  - Dark logo: `logo_dark.png` (used in the header navigation bar).
  - White logo: `logo_white.png` (used in the dock footer layout).

### Development Guidelines

- **Cursive Font Margin Adjustment**: The `Caveat` font (used for `.caveat-highlight` or similar classes) has cursive styling where letters tilt to the right. Always apply a right margin (e.g., `margin-right: 0.1em;`) or padding on these span tags to prevent cursive characters from overlapping the normal characters that follow.
- **GSAP Parent Wrapper Animation**: To avoid visual elements overlapping with scrolling grids during GSAP pinning timelines, animate the parent container (e.g. `.questions-title-side`) rather than the text and children elements separately. This ensures all components fade out and translate in perfect synchronicity.
- **CSS Specificity with SVG Diagrams**: The SVG line-art diagrams (e.g., inside `.bento-diagram`) are styled globally. When introducing high-fidelity details (like thin wireframes, cursor paths, or small circles), override the global settings with explicit classes (e.g. `.window-btn`, `.cursor-path`) using `!important`. Always add `:not(.accent-line)` exclusions to hover state declarations so they don't override the glowing filter bloom on accent lines.
- **CSS Apple Keyboard replica styling**: When rendering keyboard keys, use specific classes (e.g., `.mac-key-cap`) to avoid bleeding styles from page-wide generic `.key-cap` buttons. Use `white-space: nowrap;` on text labels to prevent multi-line wrapping of longer words like "command" from stretching the keys.
- **Footer Text Contrast**: The site theme shifts based on time of day. To ensure the footer navigation links and copyrights are readable on both day (light blue) and night (dark blue) WebGL canvases, style them as white text (`#ffffff`) with a drop shadow (`text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4)`). Avoid dark/transparent opacities.
