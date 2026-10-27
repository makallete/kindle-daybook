---
name: "Kindle Daybook"
description: "A paper-and-ink project manual for a personal e-ink display."
colors:
  ink: "#171717"
  paper: "#fff"
  secondary: "#555"
  rule: "#d7d7d4"
  wash: "#f5f5f2"
  control-border: "#aaa"
  ink-hover: "#353535"
typography:
  display:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(52px, 5.5vw, 77px)"
    fontWeight: 600
    lineHeight: 1.07
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(34px, 3.5vw, 46px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-1.4px"
  title:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.4px"
  body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  supporting:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  compact: "4px"
  field: "5px"
  action: "7px"
  panel: "8px"
spacing:
  page-wide: "56px"
  page-medium: "32px"
  page-small: "22px"
  section-wide: "95px"
  section-small: "55px"
  field-gap: "8px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.action}"
    padding: "13px 21px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "8px 13px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "9px 12px"
    height: "46px"
  compatibility-panel:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "27px 30px"
---

# Design System: Kindle Daybook

## Overview

**Creative North Star: "The Paper-and-Ink Manual"**

The public website continues the established Daybook identity: self-hosted Manrope, white paper, black ink, confident type and open whitespace. Its character is an accessible project manual, with practical controls and a concrete preview of the device rather than ornamental marketing surfaces.

This document records the public website in `website/`. The device renderer in `worker/src/worker.js` inherits the same visual character but keeps its separately measured 758 × 1024 old-WebKit layout. Website grids, responsive rules and browser-sized type must not be copied into the Kindle application.

**Key Characteristics:**

- Large, quiet display type with a single dark primary action
- Open sections divided by fine neutral rules
- Restrained fields, native disclosures and copy controls
- A dark device frame around an actual-rendered, labeled fictional preview
- Turkish and English guides and device previews within the same visual system

## Colors

The palette is neutral paper and ink, with a slightly softened wash for instructional content.

### Primary

- **Ink:** primary text, active language selection, primary buttons and reversed text selection.
- **Ink hover:** a restrained lighter ink for the primary action's hover state.

### Neutral

- **Paper:** the ground and reversed primary-action text.
- **Secondary:** paragraphs, supporting details and field notes.
- **Rule:** section boundaries, disclosure rows and quiet structural separation.
- **Wash:** compatibility and command surfaces.
- **Control border:** field outlines and command-copy controls.

**The Ink Hierarchy Rule.** Use large dark surfaces for actions and the physical-device frame; keep explanatory content open on paper.

## Typography

**Display Font:** bundled Manrope, with Arial and sans-serif fallbacks.
**Body Font:** the same locally supplied regular, semibold and bold Manrope family.
**Code Font:** the system monospace stack, used only for literal commands and configuration identifiers.

The frontmatter carries the primary type ramp. Hero introductions use a slightly larger body treatment, while step titles and disclosure summaries establish the tutorial hierarchy. Paragraphs remain comfortably spaced; instructional commands wrap instead of forcing horizontal page overflow.

**The One Voice Rule.** Use Manrope for both display and interface text; monospace denotes code rather than a visual mood.

## Layout

The website uses a centered container with a maximum width of 1280px. The hero pairs text with a device preview; later sections alternate open two-column arrangements, horizontal tutorial rows and a two-column FAQ. Large sections use the recorded wide rhythm, with thin rules carrying separation.

At 950px, page gutters reduce to the medium token, gaps tighten and the device frame narrows. At 700px, content stacks, page gutters use the small token, the header is shorter, the dedicated GitHub navigation link hides and the language control remains. Main GitHub actions elsewhere remain available. Name controls, compatibility fields, downloads and FAQ become single-column arrangements. The native Home comparison uses paired, equal-width figures on desktop and stacks them at the small breakpoint.

The embedded device retains its own 758 × 1024 canvas and is scaled as one unit. It is an illustrative preview, not a responsive substitute for the e-ink application's measured layout.

## Elevation & Depth

The interface is flat and uses no shadows. Whitespace, type scale, thin rules and the light command/compatibility wash establish hierarchy. The dark device frame is a concrete silhouette, not a raised card treatment.

Anchor scrolling is smooth in ordinary browser use and becomes immediate when reduced motion is requested. No decorative entrance animation is part of the website system.

## Shapes

Controls have gently curved compact corners. Instructional panels use the panel radius; primary actions are a little tighter. The device frame has a more pronounced physical enclosure with an inset screen. Circles are reserved for tiny status marks and the embedded device's existing date treatment.

## Components

### Buttons and links

Primary actions reverse paper text on ink, use the recorded action spacing and a compact corner. Text links remain underlined with a deliberate offset. The name-preview action is outlined; command-copy buttons are smaller but retain a clear boundary.

Focus uses a visible ink outline with an offset. Hover changes the primary action to ink hover and the outlined name action to wash. Do not add elevation or motion to these states.

### GitHub source and guide links

The header source link is a bordered paper control with the actual GitHub Primer logo (20px), a 12px corner radius and a 42px minimum height. It uses 9px × 14px padding, a 9px icon/text gap and semibold 14px type. Its hover uses wash with a quiet gray border. Below 600px, header padding becomes 8px × 10px, the gap 7px, type 13px and logo 18px. The lower full-guide link uses the same primitive with an oval (999px) radius and wrapping label. Both keep the logo separate from the text span so TR/EN replacement preserves the icon; logo images are decorative because the adjacent label supplies the link name.

### Inputs and compatibility

Inputs and selects use paper, a quiet control border and the field corner. Labels sit above fields. Compatibility feedback is readable text in the wash panel; it is not communicated by color alone. The same styling supports both the accepted and unverified-device messages.

### Navigation and language

The project wordmark is semibold-to-bold Manrope with a small authored screen symbol. Navigation is compact and text-led. TR and EN are buttons with an ink-filled active state. Language changes preserve the same layout rules and switch the embedded device preview between Turkish and English. The application also localizes its own controls, dates, weather and commute through `APP_LANGUAGE`; calendar event titles remain user content and are not translated.

### Tutorial disclosures and commands

Steps are broad, ruled rows with an open/closed indicator and content indented beneath the title. Native disclosure behavior keeps the interaction simple. Commands sit on wash, wrap safely and have explicit copy controls with a visible completion label.

### Device preview and naming

The preview is generated by the actual renderer using fictional events, weather and route values. Its caption identifies the data as illustrative. The user's chosen name updates locally without a server request. The device title must remain on one line, use ellipsis for long names and leave the clock's space intact.

### Native Home comparison

Before/after Home diagrams use a paper field, thin ink frame, outline toolbar symbols and fictional book covers. The diagrams show Store becoming the app shortcut and the pinned app beside four recent books; their visible caption identifies them as schematics rather than device screenshots. Supporting outcomes remain open text below the figures. The optional workflow and reversible archiving explanation use the same tutorial language as the core setup, without claiming measured speed gains.

### Optional screensaver customization

The bottom of the page includes a native disclosure, closed by default, titled “Kindle ekran koruyucu özelleştirme” in Turkish, with its English equivalent. It is used after initial setup; screensaver instructions and a raw guide link do not appear in the main prompt section. The prompt-section photo note covers the menu icon and Home cover only.

The disclosure uses the existing paper/ink ruled language, with a 21px semibold summary (20px at 600px and below) and a plus/minus indicator. Its maximum width is 820px, with a 36px bottom margin (28px mobile). The expanded content opens with the user-approved “Yukarıdaki kurulumu eksiksiz tamamladıktan sonra Kindle’ın ekran koruyucusunu da istediğin fotoğrafla değiştirebilirsin!” and its English equivalent. Three steps follow: upload a photo to the Codex/Claude Code conversation used for setup; request a prepared preview; approve application, then return Home and use the power button to verify sleep-screen appearance. Step one contains its instruction entirely in the heading, without a duplicate body paragraph; the heading has no bottom margin. The other two steps retain their explanations.

The steps reuse the current outlined-number timeline: 42px circles, 1px connectors, 68px text indentation and 34px gaps; at 600px and below, circles become 34px, indentation 53px and gaps 28px. These instructional number circles are an additional functional use of circles, alongside existing date/status treatments. No upload field is added to the website.

### Footer

The footer remains restrained, with the project wordmark, license link and the exact signature “Developed by makallete”. Author attribution is not used as the display application's name.

## Do's and Don'ts

### Do:

- **Do** preserve paper, ink, Manrope and open ruled structure.
- **Do** keep instructional content readable in both Turkish and English.
- **Do** distinguish the website's responsive layout from the fixed Kindle renderer.
- **Do** label fictional preview content and preserve readable long-name truncation.
- **Do** retain visible focus and reduced-motion behavior.

### Don't:

- **Don't** add shadows or decorative motion to this flat instructional interface.
- **Don't** turn every explanatory paragraph into a boxed card.
- **Don't** use an author's name as the user's fixed screen identity.
- **Don't** import browser-only grid or script features into the old-WebKit device layout.
