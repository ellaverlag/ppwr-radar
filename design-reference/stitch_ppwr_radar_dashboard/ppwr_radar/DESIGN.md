---
name: PPWR Radar
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#3d4944'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#6d7a73'
  outline-variant: '#bccac2'
  surface-tint: '#006c52'
  primary: '#006950'
  on-primary: '#ffffff'
  primary-container: '#008566'
  on-primary-container: '#f5fff8'
  inverse-primary: '#68dbb4'
  secondary: '#2b5cad'
  on-secondary: '#ffffff'
  secondary-container: '#7ca8fe'
  on-secondary-container: '#003b82'
  tertiary: '#745b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#d0a600'
  on-tertiary-container: '#4f3d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#86f7cf'
  primary-fixed-dim: '#68dbb4'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#00513d'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004494'
  tertiary-fixed: '#ffe08b'
  tertiary-fixed-dim: '#f1c100'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-sm:
    fontFamily: jetbrainsMono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  max-width: 1200px
---

## Brand & Style
The design system is built on a foundation of **Minimalism** and **Editorial Precision**. It is designed to serve a highly specialized audience—policy makers, legal counsels, and sustainability officers—who require clarity, objectivity, and a "legal-grade" sense of trust. 

The aesthetic is inspired by high-end broadsheet journalism and modern government whitepapers. It prioritizes information density and hierarchy over decorative elements. The emotional response should be one of calm authority; the UI disappears to let the regulatory data speak. Visual noise is eliminated to reduce cognitive load during complex research.

## Colors
The palette is rooted in a high-contrast monochromatic base, using pure white (`#FFFFFF`) for the canvas and black (`#000000`) for primary text to ensure maximum legibility. 

- **Primary Green (#24A27F):** Used for "Action" states, positive compliance indicators, and active UI highlights.
- **Institutional Blue (#004494):** Reserved for legal references, hyperlinked text, and elements relating to European Commission documentation.
- **Highlight Gold (#FFCC00):** Used sparingly as a "star" or "critical alert" marker for high-priority regulatory changes.
- **Neutral Accents:** Light grays (`#F2F2F2`, `#E5E5E5`) are used for dividers and secondary backgrounds to maintain structure without breaking the minimalist aesthetic.

## Typography
This design system utilizes **Inter** for all primary interfaces to maintain a clean, systematic feel. The type hierarchy is "Strong & Generous"—headlines are tight and bold, while body text uses an expanded line-height (1.6x+) to ensure comfortable reading of long-form regulatory articles. 

For technical identifiers or document versions, **JetBrains Mono** is introduced to provide a subtle "data-centric" distinction. All labels use uppercase tracking to differentiate them from body copy.

## Layout & Spacing
The layout follows a strict **8pt grid system**. 

- **Grid:** A 12-column fixed grid is used for desktop layouts, centered with a maximum width of 1200px to prevent line lengths from becoming illegible. 
- **Margins:** Generous outer margins (64px+) on desktop create a "frame" effect, reinforcing the editorial feel. 
- **Whitespace:** Spacing should be used aggressively to separate distinct legal sections. When in doubt, increase the `xxl` (48px) spacing between major content blocks.
- **Mobile:** Transition to a 4-column fluid grid with 16px side margins.

## Elevation & Depth
In alignment with the minimalist brief, this design system eschews traditional shadows and blurs. 

- **Hierarchy through Borders:** Depth is communicated via 1px solid outlines (`#E5E5E5`). 
- **Tonal Layering:** Occasional use of a light gray background (`#FAFAFA`) is permitted to group related information, but the primary canvas must remain white.
- **Zero Shadow Policy:** No drop shadows are used. Elements that need to "float" (like modals) should use a thick 2px black border or a high-contrast overlay to define their boundaries.

## Shapes
The shape language is **Sharp**. 

All buttons, cards, and input fields must have a 0px border radius. This architectural approach reinforces the "legal-grade" and structured nature of the data. The only exception is for circular status dots or specific icons where geometry requires it.

## Components
- **Buttons:** Rectangular, sharp corners. Primary buttons are solid Black with White text. Secondary buttons are White with a 1px Black border.
- **Cards:** Minimalist containers with a 1px `#E5E5E5` border. No shadows. Padding should be generous (`24px`).
- **Chips/Badges:** Outlined only. Use `label-md` typography. Status-specific chips use a 1px border of the status color (Green for "In Force", Gold for "Pending").
- **Inputs:** Simple bottom-border or 1px gray outline. Focus state is indicated by a 1px Black border.
- **Navigation:** Typography-heavy. Active states are indicated by a 2px bottom bar in Primary Green.
- **Legal Lists:** Use the 8pt grid for indentation. Nested regulatory points should use a subtle vertical line on the left to guide the eye.