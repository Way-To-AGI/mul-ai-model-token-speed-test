# AI Model Token Speed Test (多AI模型性能测试工具)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1.0-purple.svg)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.24.0-blue.svg)](https://ant.design/)

## 项目简介

这是一个用于测试和比较不同 AI 模型 API 性能的工具。它可以同时测试多个 AI 模型的响应速度、token 生成速度等关键指标，帮助开发者选择最适合其应用场景的 AI 服务提供商。

### 主要功能



https://github.com/user-attachments/assets/cc6bb812-a906-423f-877e-8f4973a4ff15


- 🚀 支持多个 AI 模型同时测试
- 📊 实时显示性能指标
- 💾 本地保存模型配置
- 📈 支持不同的 token 统计方式
- 🔄 支持流式输出测试
- 🎛️ 灵活的模型配置管理

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm 或 yarn

### 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/mul-ai-model-token-speed-test.git

# 进入项目目录
cd mul-ai-model-token-speed-test

# 安装依赖
yarn install
# 或
npm install
```

### 运行

```bash
# 开发环境运行
yarn dev
# 或
npm run dev

# 构建生产环境
yarn build
# 或
npm run build
```

## 使用说明

1. 添加模型配置
   - 点击"添加模型"按钮
   - 填写模型名称、API Key、Base URL 和模型标识符
   - 启用/禁用模型开关

2. 编写测试内容
   - 在文本框中输入要测试的提示内容
   - 选择 token 统计方式（字符长度/响应块）

3. 开始测试
   - 点击"开始测试"按钮
   - 查看实时性能数据
   - 比较不同模型的表现

## 性能指标说明

- **首token时间**：从发送请求到收到第一个 token 的时间
- **推理token/s**：推理阶段的 token 生成速度
- **内容token/s**：内容生成阶段的 token 生成速度
- **总token/s**：整体的 token 生成速度
- **总时间**：完成整个响应所需的时间

## 技术栈

- React 19
- Vite 6
- Ant Design 5
- OpenAI API 兼容接口

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建您的特性分支 (git checkout -b feature/AmazingFeature)
3. 提交您的更改 (git commit -m 'Add some AmazingFeature')
4. 推送到分支 (git push origin feature/AmazingFeature)
5. 打开一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有任何问题或建议，欢迎提交 Issue 或通过以下方式联系我们：

- 项目 Issue: [GitHub Issues](https://github.com/yourusername/mul-ai-model-token-speed-test/issues)

## 致谢

感谢所有为这个项目做出贡献的开发者！
