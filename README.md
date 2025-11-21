<div align="center">

<h1>Simple Start</h1>

<p>
  <a href="#english">English</a> | <a href="#中文">中文</a>
</p>

![](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![](https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![](https://badges.aleen42.com/src/vitejs.svg)

</div>

---

## English

### 📖 Overview

**Simple Start** is a modern, minimalist Chrome/Firefox extension that replaces your new tab page with a clean and customizable start interface. Built with React, TypeScript, and Vite, it provides a fast and elegant browsing experience.

### ✨ Features

- 🚀 **Lightning Fast**: Built with Vite for optimal performance
- 🎨 **Modern UI**: Clean and intuitive interface design
- 🔧 **Customizable**: Personalize your start page to fit your needs
- 🌐 **Browser Support**: Compatible with Chrome and Firefox
- ⚡ **Lightweight**: Minimal resource usage for smooth performance

### 📸 Screenshot

![shot1](doc/images/shot1.png)

### 🚧 Development Status

This project is currently under active development. New features and improvements are being added regularly.

### 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **pnpm** - Fast, disk space efficient package manager

### 📦 Installation

#### For Users

1. Download the latest release from the [Releases](https://github.com/N0I0C0K/simple-start/releases) page
2. Unzip the downloaded file
3. Open Chrome/Firefox and navigate to the extensions page:
   - Chrome: `chrome://extensions`
   - Firefox: `about:addons`
4. Enable "Developer mode" (Chrome) or click the gear icon (Firefox)
5. Click "Load unpacked" and select the unzipped folder

#### For Developers

```bash
# Clone the repository
git clone https://github.com/N0I0C0K/simple-start.git
cd simple-start

# Install dependencies (requires Node.js >= 18.19.1 and pnpm)
pnpm install

# Start development server
pnpm dev

# Build for production (Chrome)
pnpm build

# Build for Firefox
pnpm build:firefox

# Create distribution zip
pnpm zip
```

### 🔧 Development

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Format code with prettier
pnpm prettier

# Clean build artifacts
pnpm clean:bundle

# Clean all (including node_modules)
pnpm clean
```

### 📝 Project Structure

```
simple-start/
├── chrome-extension/   # Main extension code
├── packages/           # Shared packages
├── pages/              # Extension pages (newtab, popup, etc.)
├── doc/                # Documentation and assets
└── tests/              # Test files
```

### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

This project is powered by [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite)

---

## 中文

### 📖 项目简介

**Simple Start** 是一个现代化、极简风格的 Chrome/Firefox 扩展，它将你的新标签页替换为一个简洁且可定制的起始界面。使用 React、TypeScript 和 Vite 构建，提供快速优雅的浏览体验。

### ✨ 功能特性

- 🚀 **极速响应**：使用 Vite 构建，性能卓越
- 🎨 **现代界面**：简洁直观的界面设计
- 🔧 **高度定制**：个性化定制你的起始页面
- 🌐 **浏览器支持**：兼容 Chrome 和 Firefox
- ⚡ **轻量级**：最小资源占用，流畅运行

### 📸 界面截图

![shot1](doc/images/shot1.png)

### 🚧 开发状态

该项目目前正在积极开发中，新功能和改进会定期添加。

### 🛠️ 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全和更好的开发体验
- **Vite** - 快速构建工具和开发服务器
- **TailwindCSS** - 实用优先的 CSS 框架
- **pnpm** - 快速、节省磁盘空间的包管理器

### 📦 安装使用

#### 普通用户

1. 从 [Releases](https://github.com/N0I0C0K/simple-start/releases) 页面下载最新版本
2. 解压下载的文件
3. 打开 Chrome/Firefox 并导航至扩展程序页面：
   - Chrome：访问 `chrome://extensions`
   - Firefox：访问 `about:addons`
4. 启用"开发者模式"（Chrome）或点击齿轮图标（Firefox）
5. 点击"加载已解压的扩展程序"并选择解压后的文件夹

#### 开发者

```bash
# 克隆仓库
git clone https://github.com/N0I0C0K/simple-start.git
cd simple-start

# 安装依赖（需要 Node.js >= 18.19.1 和 pnpm）
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本（Chrome）
pnpm build

# 构建 Firefox 版本
pnpm build:firefox

# 创建分发压缩包
pnpm zip
```

### 🔧 开发命令

```bash
# 运行类型检查
pnpm type-check

# 运行代码检查
pnpm lint

# 使用 prettier 格式化代码
pnpm prettier

# 清理构建产物
pnpm clean:bundle

# 清理所有（包括 node_modules）
pnpm clean
```

### 📝 项目结构

```
simple-start/
├── chrome-extension/   # 扩展主要代码
├── packages/           # 共享包
├── pages/              # 扩展页面（新标签页、弹出页等）
├── doc/                # 文档和资源
└── tests/              # 测试文件
```

### 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

### 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

### 🙏 致谢

本项目基于 [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite) 构建。

---
