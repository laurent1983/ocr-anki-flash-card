# ocr-anki-flash-card

Get a dialog and translation in a text file so it's easy to create flashcards (used for Assimil Russian to French).

This is a Tauri-based desktop application that helps you create Anki flashcards from OCR'd dialogues and translations.

## Prerequisites

Before you can run this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable version)

### System Dependencies (Linux)

On Linux, you'll also need to install these dependencies:

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

For other operating systems, see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/).

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/laurent1983/ocr-anki-flash-card.git
   cd ocr-anki-flash-card
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the application in development mode:
   ```bash
   npm run tauri dev
   ```

## Building for Production

To build the application for production:

```bash
npm run tauri build
```

This will create platform-specific installers in the `src-tauri/target/release/bundle/` directory.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

MIT

