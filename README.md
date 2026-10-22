# Blue Prince Wiki - Desktop

A standalone desktop wiki for tracking findings in the game **Blue Prince**. This application stores all data locally on your machine (no cloud, no AI dependencies).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Local & Private:** All data and images are stored in your local application data folder.
- **Manual Entries:** Track title, category, room, description, and tags for every discovery.
- **Image Support:** Upload photos of your findings and view them in a zoomable gallery.
- **Native Desktop App:** Built with Next.js and Tauri for native performance on Windows, macOS, and Linux.
- **PC Optimized:** Streamlined for desktop use with keyboard and mouse.

## Prerequisites

To build or run this project from source, you need:

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) for your operating system.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode:**
   ```bash
   npm run tauri dev
   ```

## Building for Production

To create a standalone executable for your operating system:

```bash
npm run tauri build
```

The compiled application will be available in the `src-tauri/target/release/bundle/` directory.

## Data Storage

Data is stored in your system's standard application data folder:
- **Windows:** `%APPDATA%\blue-prince-wiki\data.json`
- **macOS:** `~/Library/Application Support/blue-prince-wiki/data.json`
- **Linux:** `~/.local/share/blue-prince-wiki/data.json`

Images are stored in an `images/` subfolder within the same directory.

## Legal Disclaimer

This is an **unofficial fan-made project**. "Blue Prince" and all associated assets, including the game's icon are the property of [Dogubomb](http://www.dogubomb.com/) and [Raw Fury](https://rawfury.com/). This tool is intended for personal use and is not affiliated with the developers or publishers.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
