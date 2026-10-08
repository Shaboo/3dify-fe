---
name: 3dify
description: Photos into 3D, expressed through a photographic contact-sheet archive.
colors:
  blue: "#6840b5"
  ink: "#30233e"
  muted: "#70627d"
  line: "#ded6e6"
  surface: "#f1edf6"
  canvas: "#faf8fc"
  plum: "#30233e"
  lilac: "#e9e1f4"
  yellow: "#e5f58b"
  danger: "#a12c46"
  white: "#fff"
  action-hover: "#d5e87b"
  plum-hover: "#4e3b60"
  field-border: "#cfc3da"
typography:
  display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(48px, 6.4vw, 92px)"
    fontWeight: 560
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Archivo, sans-serif"
    fontSize: "28px"
    fontWeight: 550
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "18px"
    fontWeight: 550
    lineHeight: 1.35
  body:
    fontFamily: "Archivo, sans-serif"
    fontSize: "15px"
    lineHeight: 1.6
  label:
    fontFamily: "Archivo, sans-serif"
    fontSize: "14px"
    fontWeight: 500
rounded:
  field: "8px"
  control: "9px"
  note: "10px"
  photo: "12px"
  panel: "14px"
  dialog: "16px"
  stage: "18px"
  status: "20px"
spacing:
  field-gap: "8px"
  compact: "12px"
  row: "20px"
  stack: "24px"
  panel: "28px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.plum}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-plum:
    backgroundColor: "{colors.plum}"
    textColor: "{colors.yellow}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  field:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  panel:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "28px"
  status:
    textColor: "{colors.muted}"
    rounded: "{rounded.status}"
    padding: "5px 10px"
  navigation-active:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.plum}"
    rounded: "{rounded.control}"
    padding: "13px 12px"
---

# Design System: 3dify

## Overview

**Creative North Star: "The Photographic Contact-Sheet Archive"**

The Photographic Contact-Sheet Archive makes photos feel like tangible material. Lilac grounds, plum framing, and yellow actions give 3dify an expressive public face while its workspace stays quiet and legible.

Archivo carries both large, tightly set headlines and compact working controls. Ordered captions, restrained borders, and rounded photographic containers connect public pages, authentication, plans, and account tools. Illustrative artwork is always distinguished from actual generated output.

**Key Characteristics:**

- Photographic material and explicit captions.
- Lilac surfaces, plum framing, yellow actions.
- Large Archivo headlines with compact working controls.

## Colors

Soft lavender material meets dark plum framing and a bright yellow action signal. The frontmatter records the shipped palette from `src/app/globals.css`; the legacy `blue` name now denotes violet.

### Primary

- **Action Yellow:** primary actions, selected workspace navigation, and emphasis against plum.
- **Deep Plum:** text, sidebar, integration framing, and inverse buttons on auth and plan pages.

### Secondary

- **Lilac:** photographic context, upload surfaces, and plan containers.
- **Violet (blue):** headline emphasis, links, focus outlines, and numbered workflow markers.

### Neutral

- **Canvas / Surface / White:** page ground, supporting areas, and working panels.
- **Muted / Line / Field Border:** secondary text, dividers, and input outlines.
- **Danger:** destructive emphasis; error notes additionally use pale rose backgrounds.

**The Truthful Image Rule.** Illustrative artwork must remain labeled as illustrative and must not imply a verified generated output.

## Typography

Display and body use locally hosted Archivo with a sans-serif fallback. The variable font supports the intermediate headline weights; `font-display: swap` keeps content visible during loading. The font file and its OFL license live in `public/fonts/`.

The frontmatter captures the desktop landing display, global heading roles, body, and field label. Workspace titles use a smaller responsive display; landing headlines step down at tablet and mobile widths. Supporting text stays compact, with longer workspace descriptions bounded to 65 characters and shorter photographic copy kept narrower. Code examples use the system monospace stack; prices, sequence numbers, and working tables use tabular numerals.

## Layout

Public pages use generous outer gutters and bounded content. The landing container tops out at 1800px, with 5vw gutters becoming 90px at that limit. Workflow and integration sections use two columns on desktop. Account screens pair a 240px plum sidebar with a flexible workspace bounded to 1600px; the sidebar becomes 210px at 1200px.

At 900px public sections consolidate. At 700px the workspace sidebar becomes a horizontally scrollable navigation strip with a scroll cue; the active destination scrolls into view on route changes. Forms become one column, authentication stacks and removes the large artwork, and the photographic action occupies a full-width lower rail. Tables retain intentional scrolling inside their bounded region with an explicit cue where actions extend beyond the visible area. Keep children able to shrink within their available width.

## Elevation & Depth

Most surfaces use tonal layering and fine borders. Photographic lighting supplies depth in the object study. Shadows are reserved for feedback and modal interruption: toast uses `0 8px 32px #30233e26`; dialog uses `0 16px 64px #30233e40` over a translucent plum overlay. Working panels stay flat.

## Shapes

Compact rounded controls, slightly softer working panels, and broad photographic containers share a restrained form language. The frontmatter captures the actual radius vocabulary. Status pills are compact and rounded; sequence markers alone are circular. Borders establish data grouping, while upload targets use a dashed outline.

## Components

### Buttons

Yellow actions lead public pages and working screens; plum inverse buttons lead authentication and plan selection. Secondary controls use transparent grounds with a fine border. Hover shifts the background; disabled controls reduce opacity and use a blocked cursor. Keyboard focus uses a violet outline with an offset, changing to yellow on plum navigation. Standard transitions last 0.18 seconds.

### Inputs / Fields

Canvas-filled fields have a fine lavender stroke, compact rounded corners, and visible labels. Focus changes the stroke to violet and retains the global outline. Error feedback uses a separate rose note with readable explanatory text.

### Cards / Containers

White bordered panels hold operational controls. Lilac plan containers and contact-sheet photo previews reuse the same rounded material language. Job cards reveal hover and selected states without implying a task result. Status pills always retain their text alongside semantic color.

### Navigation

The header pairs the 3dify wordmark with concise account and public destinations. Sidebar links use pale text on plum; the current page receives yellow fill and `aria-current`. Mobile navigation remains scrollable and exposes the current destination. Preserve the skip link and visible keyboard focus.

### Photographic object study

The labeled illustrative chair sits above a plum explanatory rail with an inset detail crop and yellow workspace link. Inspect detail is a real pressed-state toggle between a full object and a magnified crop of the same artwork. It does not simulate generation or rotate a model. Its image transition uses a slower ease-out; reduced-motion preferences suppress transitions and animation throughout the interface.

## Do's and Don'ts

### Do:

- **Do** label illustrative artwork and preserve its provenance.
- **Do** keep selected navigation and keyboard focus visible on narrow screens.
- **Do** use quiet surfaces and tabular numerals for working data.
- **Do** honor reduced-motion preferences.

### Don't:

- **Don't** present the chair artwork as a verified generation result.
- **Don't** invent status, usage metrics, testimonials, or plan features.
- **Don't** make the landing image treatment mandatory on every working screen.
