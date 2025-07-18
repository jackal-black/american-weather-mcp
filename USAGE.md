# 🚀 Enhanced Weather MCP - 使用指南

## 📦 在其他项目中使用

### 方法 1：本地路径引用（推荐）

如果你已经在本机安装了 Enhanced Weather MCP，可以直接在任何项目中引用：

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["E:\\project2025\\weather-report\\build\\index.js"],
      "cwd": "E:\\project2025\\weather-report"
    }
  }
}
```

### 方法 2：从 GitHub 克隆

在新项目目录中：

```bash
# 克隆仓库
git clone https://github.com/jackal-black/enhanced-weather-mcp.git weather-mcp

# 安装依赖并构建
cd weather-mcp
npm install
npm run build
cd ..

# 在 MCP 配置中引用
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["./weather-mcp/build/index.js"],
      "cwd": "./weather-mcp"
    }
  }
}
```

### 方法 3：作为子模块

```bash
# 添加为 Git 子模块
git submodule add https://github.com/jackal-black/enhanced-weather-mcp.git weather-mcp

# 初始化和更新子模块
git submodule update --init --recursive

# 构建
cd weather-mcp
npm install
npm run build
```

## 🎯 使用示例

### 基本查询

```
# 城市天气
"洛杉矶的天气怎么样？"
"请查看纽约市的天气预报"
"Sacramento 今天天气如何？"

# 天气警报
"加州有什么天气警报吗？"
"检查德克萨斯州的天气警报"

# 当前天气
"旧金山现在的天气状况"
"请查看芝加哥的当前天气"

# 天气摘要
"给我一个加州的天气摘要"
"佛罗里达州的整体天气情况"
```

### 支持的城市

包括但不限于：
- **加州**: Los Angeles (LA), San Francisco (SF), San Diego, Sacramento
- **纽约**: New York City (NYC)
- **德州**: Houston, Dallas, Austin, San Antonio
- **佛州**: Miami, Tampa, Jacksonville
- **其他**: Chicago, Phoenix, Seattle, Denver, Boston, Atlanta

### 坐标查询

如果城市不在预设列表中，可以使用坐标：

```
"请查询纬度40.7128，经度-74.0060的天气预报"
```

## 🔧 配置选项

### 基本配置

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["path/to/enhanced-weather-mcp/build/index.js"],
      "cwd": "path/to/enhanced-weather-mcp",
      "env": {}
    }
  }
}
```

### 高级配置

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["path/to/enhanced-weather-mcp/build/index.js"],
      "cwd": "path/to/enhanced-weather-mcp",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🛠️ 故障排除

### 常见问题

1. **"Cannot find module" 错误**
   - 确保路径正确
   - 确保已运行 `npm install` 和 `npm run build`

2. **"MCP server failed to start" 错误**
   - 检查 Node.js 版本（需要 18+）
   - 确保所有依赖已安装

3. **网络连接错误**
   - 确保能访问 api.weather.gov
   - 检查防火墙设置

### 调试模式

在命令行直接运行以测试：

```bash
cd path/to/enhanced-weather-mcp
node build/index.js
```

## 📊 性能优化

- 内置 5 分钟缓存，减少 API 调用
- 支持并发请求
- 智能错误重试机制

## 🔄 更新

### 更新到最新版本

```bash
cd weather-mcp
git pull origin main
npm install
npm run build
```

### 检查版本

```bash
cd weather-mcp
npm run start --version
```

## 📞 支持

- GitHub Issues: https://github.com/jackal-black/enhanced-weather-mcp/issues
- 文档: README.md
- 更新日志: CHANGELOG.md
