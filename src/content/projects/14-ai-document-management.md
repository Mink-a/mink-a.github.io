---
title: AI Document Management
type: Hackathon Winner · RAG
description: A hackathon-winning, AI-powered document management system — a Google-Drive-style workspace with retrieval-augmented generation over your own files, semantic search, and department- and user-level role-based access, all running on a local AI model.
tech: ["TypeScript", "React", "NestJS", "LangChain", "RAG", "ChromaDB", "Local LLM", "Vector Search", "RBAC"]
image: /assets/covers/ai-document-management-cover.webp
featured: true
order: 92
---

## Overview

An AI-powered document management system built for a hackathon — and the project that won it. The idea was to take the familiar shape of Google Drive (folders, files, sharing) and layer retrieval-augmented generation (RAG) on top, so a team can not just *store* documents but actually *ask questions* of them and get answers grounded in the source files rather than in a model's general knowledge.

## How it works

Uploaded documents are chunked, embedded, and stored in a **Chroma** vector database. At query time the system runs a **similarity search** to pull the most relevant chunks and passes them, as context, to a locally hosted language model through **LangChain** — retrieval-augmented generation instead of answering from the model's own weights. Running the model locally means documents never leave the environment, which matters for the kind of internal, sensitive files a department keeps in a shared drive.

## Access control

Access is governed by **role-based access control (RBAC)** scoped to both departments and individual users, so a single drive can hold each team's documents while keeping each person's view bounded to what they're allowed to see.

## A drive with AI built in

The whole thing is wrapped in a Google-Drive-style interface — browse, upload, and organize files — with the AI features (semantic search and document Q&A) built into the same workspace rather than bolted on as a separate tool.

## Tech stack

- **App** — React frontend with a NestJS backend, TypeScript end to end.
- **Retrieval** — LangChain orchestrating a RAG pipeline over a Chroma vector store with similarity search.
- **Model** — a locally hosted LLM, so both inference and documents stay on-prem.
- **Access** — department- and user-level RBAC over storage and retrieval.
