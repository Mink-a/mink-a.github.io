---
title: Textify
type: Personal Project · OCR App
description: A full-stack OCR app that turns images and PDFs into clean, copyable text — using Google Drive's built-in document conversion as a zero-cost OCR engine instead of a paid Vision API.
tech: ["TypeScript", "React", "Vite", "NestJS", "Tailwind CSS", "Zod", "Axios", "Google Drive API", "Docker"]
image: /assets/covers/textify-cover.webp
featured: false
order: 65
---

## Overview

Textify is a small full-stack OCR app: drag in a scan, screenshot, or PDF and get clean, copyable text back. I built it to scratch a real itch — piles of paper records I wanted indexed and searchable — but the part I'm proudest of is the engine. Instead of paying for a hosted OCR/Vision API, Textify performs OCR for free by leaning on a service that already does it well: **Google Drive**.

## How it works

The clever bit is that **uploading an image to Google Drive as a Google Doc makes Drive run OCR on it automatically**. The NestJS backend turns that side effect into a proper OCR pipeline:

1. **Validate** the upload — ≤ 5 MB, and one of `png` / `jpg` / `jpeg` / `pdf`.
2. **Rasterize** — if it's a PDF, split it into one PNG per page (`pdf-to-png-converter`).
3. **OCR each page** by round-tripping through Drive:
   - upload the image with mime type `application/vnd.google-apps.document`, which triggers Drive's OCR,
   - export the resulting Doc as `text/plain`,
   - delete the temporary Drive file so nothing accumulates.
4. **Return one text string per page**; the frontend joins them with newlines into a single document.

The result is a genuinely zero-cost OCR engine — no paid Vision API, no model to host — at the price of one network round trip per page.

## Features

- **Drag-and-drop upload** with a click-to-browse fallback and a live file preview.
- **Multi-format input**: PNG, JPG/JPEG, and multi-page PDF.
- **Validation on both ends** — the 5 MB cap and allowed MIME types are enforced client- *and* server-side.
- **Copy** the extracted text to the clipboard or **download** it as a `.txt` file.
- **Light / dark theme**.
- **Swagger / OpenAPI docs** served at `/api`.

## Tech stack

- **Frontend** — React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), react-dropzone, react-hook-form + Zod, Axios, Sonner, next-themes.
- **Backend** — NestJS 10, TypeScript, Multer for uploads, `@nestjs/swagger`, `@nestjs/serve-static`.
- **OCR engine** — Google Drive API (`googleapis`) over OAuth2 (`@google-cloud/local-auth`).
- **PDF handling** — `pdf-to-png-converter`.
- **Packaging** — a single Docker image bundling frontend + backend.

## Architecture and deployment

Frontend and backend are separate packages in development, but production ships as **one single-origin container**: the Docker build compiles the SPA, copies it into the NestJS app, and serves both the API and the static frontend from the same process — so the Axios client just posts to a relative `files/upload` path with no CORS to manage. OAuth credentials (`credentials.json` plus a saved `token.json` refresh token) are read from `/etc/secrets/`, which maps cleanly onto a host like Render where they're mounted as secret files.

## Limitations

I kept the project honest about the tradeoffs, because they're inherent to the approach:

- OCR quality is entirely Google Drive's — it varies with scan quality, handwriting, and layout complexity.
- Every page is a full Drive round trip (upload → export → delete), so large multi-page PDFs scale linearly in time.
- It needs a Google account with Drive API access; the temporary docs count against (and are cleaned out of) that account's Drive.
- A hard 5 MB per-file cap.

## What I took away

Textify is my favorite kind of hack: solving a problem by *noticing* that the capability already exists somewhere for free, then wiring it up cleanly. The engineering wasn't a model — it was the orchestration: validation, PDF rasterization, the upload/export/delete dance, and keeping the whole thing a single deployable artifact. The limitations are real, but for "make my paper searchable," it's exactly enough.
