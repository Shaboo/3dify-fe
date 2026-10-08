# 3dify

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The existing repository identifies the primary use as testing photo-to-3D generation in a standalone website. API developers are supported through keys, webhooks, and documentation. The user delegated redesign decisions; a broader commercial audience remains undecided.

## Product Purpose

Turn photos of an object into a generation task, track its actual backend status, and download available GLB and USDZ output.

## Operating Context

Register or sign in, activate a subscription, select photos, generate, inspect task status, and download results. The website operates independently of Shopify. Local development uses a Next.js frontend and an existing backend.

## Capabilities and Constraints

- Provider-reported photo limits; original JPG, PNG, and WebP uploads.
- Actual backend plans, subscription management, API keys, and webhooks; role-restricted admin plan editing.
- Free website activation requires no card but generation still consumes provider credits.
- Never automatically retry generation. An uncertain response requires checking history and explicitly acknowledging another submission.
- Preserve authentication, role enforcement, and existing API contracts.

## Brand Commitments

The product is named 3dify. The user requested a complete redesign and delegated its direction.

## Evidence on Hand

README.md, docs/HANDOFF.md, current application routes, and mocked browser regression tests establish existing functionality. Live provider success is not verified by these tests. Do not invent testimonials, customer counts, benchmarks, plan features, or successful output examples.

## Product Principles

- Make the next generation step clear.
- Show real task status and actionable errors.
- Keep integration tools discoverable without obscuring the primary workflow.
- Distinguish illustrative artwork from actual generated results.
