<div align="center">

<h1>Simple Start</h1>

<p>A clean, modern browser start page extension</p>

![](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![](https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![](https://badges.aleen42.com/src/vitejs.svg)

English | [简体中文](./README.md)

</div>

---

## 📖 Overview

**Simple Start** is a feature-rich browser new tab extension designed to boost browsing efficiency. Built with React, TypeScript, and Vite, it provides a smooth user experience with powerful customization options.

### ✨ Key Features

- ⏰ **Clock Display**: Large clock showing current time and date at a glance
- 🔍 **Quick Search**: Integrated search box with `Alt+K` keyboard shortcut
- 🔗 **Quick Links Management**: Customizable website cards with drag-and-drop sorting
- 📜 **History Suggestions**: Smart display of recently visited pages
- 🎨 **Custom Wallpaper**: Set your favorite background image
- 🌓 **Theme Toggle**: Support for light/dark theme switching
- 📋 **Command Palette**: Quick access to various operations
  - Search history
  - Tab search
  - Web search
  - Protocol jump support
- 💧 **Water Reminder**: Receive health reminders via MQTT (optional feature)
- 📤 **Data Import/Export**: Backup and restore your settings and data

### 📸 Screenshot

![shot1](doc/images/shot1.png)

### 🚧 Development Status

This project is under active development with continuous feature additions and UX improvements.

### 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **TailwindCSS** - Styling framework
- **pnpm** - Package manager
- **Chrome Extension Manifest V3** - Extension standard

### 📦 Installation

#### Option 1: Build from Source (Recommended for Developers)

```bash
# Clone the repository
git clone https://github.com/N0I0C0K/simple-start.git
cd simple-start

# Install dependencies (requires Node.js >= 18.19.1 and pnpm)
pnpm install

# Development mode (Chrome)
pnpm dev

# Development mode (Firefox)
pnpm dev:firefox

# Build for production (Chrome)
pnpm build

# Build for production (Firefox)
pnpm build:firefox

# Package as zip
pnpm zip
```

#### Option 2: Load in Browser

1. After building, open the extension management page in your browser:
   - **Chrome**: Navigate to `chrome://extensions`
   - **Firefox**: Navigate to `about:debugging#/runtime/this-firefox`
2. Enable "Developer mode" (Chrome)
3. Click "Load unpacked extension" (Chrome) or "Load Temporary Add-on" (Firefox)
4. Select the `dist` directory

### 🔧 Development Commands

```bash
# Type checking
pnpm type-check

# Linting and fixing
pnpm lint
pnpm lint:fix

# Code formatting
pnpm prettier

# Clean build artifacts
pnpm clean:bundle

# Full clean (including dependencies)
pnpm clean

# End-to-end testing
pnpm e2e
```

### 📝 Project Structure

```
simple-start/
├── chrome-extension/     # Chrome extension configuration
├── packages/
│   ├── storage/         # Data storage layer
│   ├── ui/              # UI component library
│   ├── i18n/            # Internationalization
│   ├── shared/          # Shared utilities
│   └── hmr/             # Hot module reload
├── pages/
│   ├── new-tab/         # New tab page (main page)
│   ├── popup/           # Popup window
│   ├── options/         # Settings page
│   └── ...
└── tests/               # Test files
```

### ⚙️ Configuration

The extension provides rich configuration options accessible via the settings button in the top-right corner:

- **History Suggestions**: Enable/disable history display
- **Auto-focus Command Input**: Automatically focus search box on new tab
- **Custom Wallpaper**: Set background image URL
- **MQTT Remote Control**: Configure MQTT server for cross-device reminders
- **Data Management**: Export/import configuration and bookmark data

### 🤝 Contributing

Issues and Pull Requests are welcome!

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

This project is built upon [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite).

---
