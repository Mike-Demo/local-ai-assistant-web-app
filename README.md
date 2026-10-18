# LocalModel Hub — Private, On-Device AI

**Live site: [privatebrain.app](https://privatebrain.app)**

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-3bz9zep6)

A privacy-first AI assistant that runs open-source large language models **entirely in your browser** — no servers, no accounts, no telemetry. Your prompts and conversations never leave your device.

After a one-time model download, the app works fully offline. It has been tested in airplane mode: the chat keeps answering with the network completely off.

## New: BoltLocal — build apps with local AI

LocalModel Hub now builds, too. **[BoltLocal](https://boltlocal-ehg6.bolt.host)** (beta) is an app builder on the same principle: describe a small web app and a local model in your browser writes the code — prompts and code never leave the device, and previews are blocked from the network by default. Built in Bolt during the Forge weekend, based on a fork of the open-source bolt.diy project (MIT). Source: [Mike-Demo/boltlocal](https://github.com/Mike-Demo/boltlocal). It is linked from the live site's "New — Build apps with local AI" section.

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

## License

[MIT](LICENSE) — © Mike "Demo" Demopoulos
