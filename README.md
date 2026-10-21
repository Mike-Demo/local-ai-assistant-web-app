# LocalModel Hub — Private, On-Device AI

**Live site: [privatebrain.app](https://privatebrain.app)**

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-3bz9zep6)

A privacy-first AI assistant that runs open-source large language models **entirely in your browser** — no servers, no accounts, no telemetry. Your prompts and conversations never leave your device.

After a one-time model download, the app works fully offline. It has been tested in airplane mode: the chat keeps answering with the network completely off.

## New: BoltLocal — build apps with local AI

LocalModel Hub now builds, too. **[BoltLocal](https://build.privatebrain.app)** (beta) is an app builder on the same principle: describe a small web app and a local model in your browser writes the code — prompts and code never leave the device, and previews are blocked from the network by default. Built in Bolt during the Forge weekend, based on a fork of the open-source bolt.diy project (MIT). Source: [Mike-Demo/boltlocal](https://github.com/Mike-Demo/boltlocal). It is linked from the live site's "New — Build apps with local AI" section.

## Why

Cloud AI means your words travel to someone else's servers, where they can be logged, trained on, or leaked. LocalModel Hub takes the opposite approach:

- **100% on-device inference** via [WebLLM](https://github.com/mlc-ai/web-llm) and WebGPU
- **No API calls, no tracking, no cookies** — verified tracker-free by Analytra, rated Safe by Norton Safe Web
- **Works offline** once a model is cached, including on mobile

## Features

- **Device preflight** — checks RAM, WebGPU, CPU cores, and browser support, then recommends the right model for your hardware
- **Model library** — 22 open-source models (Phi, Gemma, Llama, Qwen, Mistral, DeepSeek, and more), each credited with its maker and license on the [Open Source page](https://privatebrain.app/open-source)
- **Five chat modes** — General Chat, Code, Documents, Creative Writing, Quick Answers
- **Live streaming** with a status bar showing the loaded model and generation speed in tokens/sec
- **Privacy Dashboard** — see exactly what is stored on your device, and delete it
- **Dedicated mobile experience** — smaller models, battery and memory warnings, touch-first layout
- **Installable PWA** with a Privacy Center and full open-source credits built in

## Built with Bolt

This app was designed and built **entirely in [Bolt](https://bolt.new)** (Bolt Forge, using Max and Standard models) for **Bolt Builder Week**, October 2026. The only thing not made in Bolt is the demo video.

For proof, the complete Bolt build conversation is in this repository: **[BOLT_CHAT_HISTORY.md](BOLT_CHAT_HISTORY.md)** — every prompt and response, from the first brief to the custom-domain launch.

## Tech

- React + TypeScript + Vite + Tailwind CSS
- [@mlc-ai/web-llm](https://www.npmjs.com/package/@mlc-ai/web-llm) for in-browser inference (WebGPU)
- Hosted on Bolt, green-hosting verified via the [Green Web Foundation](https://www.thegreenwebfoundation.org/) — see the site's `carbon.txt`

## Run it locally

```bash
npm install
npm run dev
```

Use a recent Chrome, Edge, or Safari on desktop or mobile — WebGPU support is required, and the app will tell you if your browser can't run on-device AI.

## Security audit backlog — 2026-10-21

Parent: [Security audit #1](https://github.com/Mike-Demo/local-ai-assistant-web-app/issues/1).
Issue creation is unavailable in this session; the two titles and bodies below are ready to file in this repository.
This is triage only: no application fixes, deployed endpoint probes, or package execution were performed.
The supplied audit used static source inspection only.

### Priority

1. **Low — restrict the leaving interstitial to app-intended destinations.** This is the only confirmed finding and one root-cause group; there are no other confirmed findings to combine. An unauthenticated external linker can supply the URL, but exploitation requires a visitor to follow that link and click Continue. The risk is first-party trust lending to attacker-selected content on allowed hosts, not arbitrary-host navigation or demonstrated code execution. A localized destination check is the smallest fix; verify legitimate links remain usable.
2. **Validation queue, not confirmed remediation:** keep both leads together in the checklist issue below, without severity. Obtain owner-observed production headers and inspect the exact published/installed WebLLM package before deciding whether either warrants a finding.

### Ready-to-file issue 1

**Title:** `[security][low] Restrict leaving interstitial to app-intended destinations`

**Body:**

Parent audit: https://github.com/Mike-Demo/local-ai-assistant-web-app/issues/1

- **Status / priority:** Confirmed, low; first and only confirmed remediation item. No shared-root-cause grouping with other findings.
- **Fingerprint:** `leaving-interstitial-allows-any-path-on-allowed-hosts`
- **Evidence:** [`safeTarget()`](https://github.com/Mike-Demo/local-ai-assistant-web-app/blob/HEAD/src/pages/Leaving.tsx#L3-L16) accepts HTTPS URLs without credentials when the hostname equals or is a subdomain of `github.com` or `huggingface.co`. It does not constrain path, query, owner, or repository/model. The page reads the caller-controlled `url` query parameter and places the accepted destination behind its branded Continue link (lines 18–45).
- **Reachability / impact:** An unauthenticated external linker can craft a `https://privatebrain.app/leaving?url=...` link to an attacker-selected path on either allowed host, such as a lookalike repository, malicious release, or phishing model page. A visitor must follow the link and click Continue. The interstitial lends the app's trust to content the app never selected.
- **Root cause:** Host-level allowlisting is used as a substitute for checking app-intended destinations.
- **Smallest fix:** In `safeTarget()`, retain HTTPS and no-credentials checks and additionally require the parsed URL to exactly match or be under an app-generated destination: the `hfUrl` values in [`src/data/models.ts`](https://github.com/Mike-Demo/local-ai-assistant-web-app/blob/HEAD/src/data/models.ts) plus `REPO_URL` in [`src/lib/site.ts`](https://github.com/Mike-Demo/local-ai-assistant-web-app/blob/HEAD/src/lib/site.ts#L8). Compare parsed origins and normalized paths with a path-segment boundary, not raw string prefixes; do not broaden this to arbitrary owners, sibling repositories/models, subdomains, or ports. Explicitly constrain query parameters to those the app generates rather than leaving arbitrary queries trusted.
- **Acceptance checks for the future fix:**
  - [ ] All catalog `hfUrl` values and `REPO_URL` remain accepted, along with explicitly permitted descendants.
  - [ ] Unrelated GitHub/Hugging Face destinations and lookalike path prefixes are rejected.
  - [ ] HTTP, URL credentials, unrelated hosts, unapproved subdomains/ports, and non-app-generated queries are rejected; missing/malformed URLs remain rejected.
  - [ ] Rejected destinations have no Continue link; existing intended navigation remains usable.

### Ready-to-file issue 2

**Title:** `[security][needs-validation] Audit leads to validate`

**Body:**

Parent audit: https://github.com/Mike-Demo/local-ai-assistant-web-app/issues/1

These are unresolved leads, not confirmed findings. No severity is assigned. Record the evidence and disposition for each item before opening any remediation issue.

- [ ] **CSP is delivered only via a meta tag, so no framing protection exists in source**
  - **Fingerprint:** `meta-delivered-csp-cannot-prevent-framing`
  - **Claimed root cause / source evidence:** [`vite.config.ts`, lines 6–31](https://github.com/Mike-Demo/local-ai-assistant-web-app/blob/HEAD/vite.config.ts#L6-L31) builds the CSP solely as a meta tag with no `frame-ancestors` directive. The audit reports no `X-Frame-Options` or hosting configuration in the repository supplying framing protection. This does not establish the production response headers.
  - **Exact missing fact (from parent):** Whether the production hosting layer for privatebrain.app (Bolt hosting, not configured anywhere in this repo) serves a frame-ancestors CSP directive and/or an X-Frame-Options response header on document responses — this must be owner-observed from the live response headers; if such a header is present, the framing claim collapses.
  - **Validation / disposition:** Ask the owner to record the document URL, observation time, and relevant live response headers. If the reported protection is present, reject the framing claim; otherwise document the observed absence before deciding on a separate remediation issue. Do not treat the source meta tag as evidence of deployed framing protection.

- [ ] **Model weights and model-lib WASM are fetched from Hugging Face via WebLLM's default config with no integrity pinning in app source**
  - **Fingerprint:** `webllm-remote-model-and-wasm-loaded-without-integrity-pinning`
  - **Claimed root cause / source evidence:** [`SharedEngine.loadModel()`](https://github.com/Mike-Demo/local-ai-assistant-web-app/blob/HEAD/src/lib/sharedEngine.ts) constructs `MLCEngine` without `appConfig` and calls `engine.reload(modelId)`, relying on the default `prebuiltAppConfig`. The audit reports no hashes pinned or verified by app source for model weights or model-lib WASM. [`package-lock.json`](https://github.com/Mike-Demo/local-ai-assistant-web-app/blob/HEAD/package-lock.json) resolves `@mlc-ai/web-llm` to `0.2.86`; npm tarball integrity does not establish integrity verification for remotely fetched model assets.
  - **Exact missing fact (verbatim as supplied, including truncation):** The contents of @mlc-ai/web-llm 0.2.86's prebuiltAppConfig (the model and model_lib URLs for the catalog model IDs used by this app) and whether that exact version's fetch/cache code verifies any integrity hash for downloaded weights or model-lib WASM — both must be established by inspecting the installed/published 0.2.86 package, which is not pre…
  - **Validation / disposition:** Inspect the installed/published **0.2.86** package, map the app's catalog model IDs to their `model` and `model_lib` URLs, and cite the fetch/cache code showing whether integrity hashes are verified for both weights and WASM. Record unresolved IDs or code paths rather than assuming behavior from another version. The parent text ends at “not pre…”; request the omitted text if it imposes additional validation requirements. Do not promote this lead based solely on the lack of app-level hashes.

**Excluded:** `storage-tainted-model-id-reaches-engine-reload-without-allowlist` was rejected during independent verification. Do not reopen or file it without new evidence.

## License

[MIT](LICENSE) — © Mike "Demo" Demopoulos
