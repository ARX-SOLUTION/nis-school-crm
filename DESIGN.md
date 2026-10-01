---
version: alpha
name: Drivli Clear Safety
description: A clean, trust-forward SaaS system with bright green accents, airy spacing, and bold editorial headlines.
colors:
  primary: "#84CC16"
  secondary: "#2563EB"
  tertiary: "#0F172A"
  neutral: "#64748B"
  surface: "#FFFFFF"
  on-surface: "#0F172A"
  border: "#E2E8F0"
  muted-surface: "#F8FAFC"
  success: "#16A34A"
  error: "#EF4444"
typography:
  headline-display:
    fontFamily: Onest
    fontSize: 60px
    fontWeight: 900
    lineHeight: 75px
    letterSpacing: -1.5px
  headline-lg:
    fontFamily: Onest
    fontSize: 44px
    fontWeight: 700
    lineHeight: 53px
    letterSpacing: -0.75px
  headline-md:
    fontFamily: Onest
    fontSize: 33px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: 0px
  headline-sm:
    fontFamily: Onest
    fontSize: 24px
    fontWeight: 600
    lineHeight: 29px
    letterSpacing: 0px
  body-lg:
    fontFamily: Onest
    fontSize: 18px
    fontWeight: 400
    lineHeight: 29px
    letterSpacing: 0px
  body-md:
    fontFamily: Onest
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
    letterSpacing: 0px
  body-sm:
    fontFamily: Onest
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: 0px
  label-lg:
    fontFamily: Onest
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0px
  label-md:
    fontFamily: Onest
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0px
  label-sm:
    fontFamily: Onest
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0px
  caption:
    fontFamily: Onest
    fontSize: 12px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 6px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 44px
  2xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "#7DBA14"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.muted-surface}"
    textColor: "{colors.tertiary}"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  chip:
    backgroundColor: "#E8F7D0"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
---

# Drivli Clear Safety

## Overview
Drivli feels like a modern Russian SaaS product built around trust, clarity, and operational reassurance. The visual tone is professional but not stiff: bright green accents, crisp white surfaces, and oversized bold headlines make the experience feel energetic and confident rather than corporate or playful. The layout is spacious and conversion-oriented, with strong emphasis on readability and clear calls to action.

## Colors
- **Primary (#84CC16):** A vivid lime green used for the main CTA, status chips, and positive emphasis. It signals momentum, success, and “ready to act” energy.
- **Secondary (#2563EB):** A clear blue used for links and supportive interactive affordances. It feels reliable and technical without overpowering the brand.
- **Tertiary (#0F172A):** A deep ink tone for primary text, button text, and high-contrast UI elements. It anchors the system with strong legibility.
- **Neutral (#64748B):** A muted slate used for body copy, helper text, and secondary metadata. It keeps the interface calm and readable.
- **Surface (#FFFFFF):** The base background for most content blocks, cards, and controls. White space is a key part of the brand’s clarity.
- **Border (#E2E8F0):** A soft cool border color for inputs, cards, and secondary buttons. It provides structure without visual heaviness.
- **Muted Surface (#F8FAFC):** A very light background tone for subtle sections and panel layering. It supports depth while staying understated.
- **Success (#16A34A):** A supportive green for check marks and positive status indicators. It should reinforce confirmation rather than compete with the primary accent.
- **Error (#EF4444):** A reserved red for validation errors and destructive states. Use sparingly to preserve the calm system mood.

## Typography
The system uses Onest as the primary typeface, with Inter and Roboto as sensible fallbacks. Headlines are the visual hero: they are heavy, compact, and tightly tracked, especially the display level, which uses 60px size, 900 weight, and negative letter spacing for strong landing-page impact. Body text stays comfortable and legible at 18px/16px/14px with generous line heights, while labels are set in semi-bold weights to support clear button and navigation hierarchy.

Uppercase styling is not a dominant convention; instead, the brand relies on weight, scale, and spacing to create emphasis. The overall typographic voice is direct and confident, suitable for explaining a complex service quickly and convincingly.

## Layout & Spacing
The interface is built on a spacious, centered hero layout with generous left/right margins and clear content grouping. Vertical rhythm follows a small set of steps: 6px, 16px, 24px, 32px, 44px, and 64px, which keeps spacing consistent without feeling rigid. Sections use broad padding, and cards and controls generally sit on white space rather than dense visual containers.

Containers feel fixed-max-width and editorial, not fully fluid edge-to-edge. The main content block is left-aligned within a wide hero region, while supporting visuals sit to the right, creating a balanced marketing composition.

## Elevation & Depth
The system is intentionally flat. Depth is created with contrast, borders, and whitespace rather than pronounced shadows. Cards and panels use 1px borders in Border (#E2E8F0), and the few shadows present are very subtle, such as a small soft shadow for floating UI like cookie banners.

This restrained elevation style keeps the product feeling clean, fast, and trustworthy. Use tonal layering and borders first; avoid heavy blur or dramatic shadow stacks.

## Shapes
The shape language is soft and practical. Interactive elements typically use 8px rounding, cards use 12px, and pills/chips become fully rounded. The result is approachable without becoming bubbly or decorative. Geometry should remain simple, with rounded rectangles as the default for almost everything.

## Components
Buttons are the most important component family and should stay clear and compact. `button-primary` uses Primary (#84CC16) with dark text, 8px 16px padding, 48px height, and medium rounding for strong CTA visibility. `button-secondary` stays white with a border in Border (#E2E8F0), matching the same height and padding so it reads as a true alternative. `button-link` is text-only, blue, and borderless for lower-emphasis navigation or inline actions.

Cards use white backgrounds, 12px rounding, and 24px padding. They should feel lightweight and informational rather than elevated or ornamental. Inputs should follow the same border-and-white-surface logic as secondary buttons, with 8px rounding and comfortable internal padding.

Chips and status pills are small, rounded, and high-contrast. The chip pattern should use soft green backgrounds with green text to indicate success or informational reassurance. Links and inline actions should use Secondary (#2563EB) and remain visually distinct from primary CTAs.

Navigation and utility controls should stay minimal: simple text links, restrained borders, and no exaggerated hover effects. The overall component system should preserve the brand’s emphasis on clarity, trust, and quick decision-making.

## Do's and Don'ts
- Do keep primary actions bright, compact, and highly legible.
- Do use Onest consistently for all headlines, body text, and controls.
- Do favor white surfaces, soft borders, and generous whitespace over heavy shadows.
- Do keep headlines bold and large; they are a major brand signature.
- Do use blue for links and lime green for primary conversion actions.
- Don't introduce saturated secondary accents that compete with the lime primary.
- Don't make cards overly shadowed, glossy, or layered.
- Don't tighten spacing so much that the interface loses its airy, reassuring feel.
