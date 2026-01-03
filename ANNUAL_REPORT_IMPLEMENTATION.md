# 年度报告功能实现计划

## 项目概述
为可话应用实现年度报告功能，支持查看全部数据或 2025 年度报告，展示用户的动态统计、时间分布、词云等数据可视化内容。

## 技术栈
- React + Vite
- wordcloud2.js（词云）
- Canvas（日历热力图）
- 项目已有：html-to-image（导出图片）

---

## 第一阶段：数据统计工具函数

### 任务清单
1. 创建 `src/utils/reportUtils.js`
2. 实现基础数据筛选函数（全部数据 vs 2025年）
3. 实现统计函数：
   - 总动态数及类型统计（文字/图片/视频/混合）
   - 文字/图片/视频总数统计
   - 陪伴天数统计（有动态的唯一日期数）
   - 最长连续发布天数
   - 月份发布统计（12个月）
   - 24小时发布分布统计
   - 星期分布统计
   - 深夜动态统计（23:00-05:00）
   - 文字动态平均字数
4. 实现关键时间节点计算：
   - 从第一条动态到 2025.12.31 的天数
   - 2025 年陪伴天数
   - 全部年份陪伴天数

### 验收标准
- ✅ 所有统计函数返回正确的数据结构
- ✅ 数据过滤（2025年 vs 全部）正确无误
- ✅ 边界情况处理（空数据、单条数据等）
- ✅ 添加完整的 JSDoc 注释
- ✅ 通过基础数据测试

### 输出文件
- `src/utils/reportUtils.js`

---

## 第二阶段：词云工具函数

### 任务清单
1. 创建 `src/utils/wordCloudUtils.js`
2. 安装依赖：`npm install wordcloud2`
3. 实现中文分词函数（简单版）：
   - 提取所有中文文本
   - 分词处理（2-4字词汇）
   - 停用词过滤
4. 实现词频统计函数
5. 实现四季关键词提取（按月份分组）：
   - 春季（3-5月）
   - 夏季（6-8月）
   - 秋季（9-11月）
   - 冬季（12-2月）
6. 实现年度关键词 TOP N 提取

### 验收标准
- ✅ 中文分词功能正常
- ✅ 停用词过滤有效（的、了、是、在等）
- ✅ 词频统计准确
- ✅ 四季关键词提取正确
- ✅ 返回数据格式符合 wordcloud2 要求

### 输出文件
- `src/utils/wordCloudUtils.js`

---

## 第三阶段：可视化组件开发

### 任务清单

#### 3.1 日历热力图组件
1. 创建 `src/components/AnnualReport/components/CalendarHeatmap.jsx`
2. 创建 `src/components/AnnualReport/components/CalendarHeatmap.module.less`
3. 使用 Canvas 绘制日历
4. 支持年份切换（2025 年 vs 全部年份）
5. 实现悬停提示（显示日期和动态数量）

#### 3.2 词云组件
1. 创建 `src/components/AnnualReport/components/WordCloud.jsx`
2. 创建 `src/components/AnnualReport/components/WordCloud.module.less`
3. 集成 wordcloud2.js
4. 支持四象限布局（四季词云）
5. 支持单个词云展示（年度词云）

#### 3.3 时间分布图表组件
1. 创建 `src/components/AnnualReport/components/TimeDistribution.jsx`
2. 创建 `src/components/AnnualReport/components/TimeDistribution.module.less`
3. 使用 Canvas 绘制 24 小时热力图
4. 高亮最活跃时段

#### 3.4 统计卡片组件
1. 创建 `src/components/AnnualReport/components/StatCard.jsx`
2. 创建 `src/components/AnnualReport/components/StatCard.module.less`
3. 支持数字递增动画
4. 支持图标显示

### 验收标准
- ✅ 日历热力图正确显示所有月份
- ✅ 词云正常渲染，中文显示正确
- ✅ 时间分布图数据准确
- ✅ 统计卡片样式美观，动画流畅
- ✅ 所有组件响应式布局

### 输出文件
- `src/components/AnnualReport/components/CalendarHeatmap.jsx`
- `src/components/AnnualReport/components/CalendarHeatmap.module.less`
- `src/components/AnnualReport/components/WordCloud.jsx`
- `src/components/AnnualReport/components/WordCloud.module.less`
- `src/components/AnnualReport/components/TimeDistribution.jsx`
- `src/components/AnnualReport/components/TimeDistribution.module.less`
- `src/components/AnnualReport/components/StatCard.jsx`
- `src/components/AnnualReport/components/StatCard.module.less`

---

## 第四阶段：报告分页组件

### 任务清单

#### 4.1 封面页
1. 创建 `src/components/AnnualReport/pages/CoverPage.jsx`
2. 显示标题："2025 可话年度报告" 或 "可话全部数据报告"
3. 显示核心数据预览
4. 添加开始按钮

#### 4.2 统计概览页
1. 创建 `src/components/AnnualReport/pages/StatisticsPage.jsx`
2. 展示总动态数
3. 展示文字/图片/视频动态分布
4. 展示文字/图片/视频总数

#### 4.3 时间分布页
1. 创建 `src/components/AnnualReport/pages/TimeDistributionPage.jsx`
2. 展示 24 小时发布分布图
3. 显示最活跃时段
4. 显示深夜动态占比

#### 4.4 日历热力图页
1. 创建 `src/components/AnnualReport/pages/CalendarPage.jsx`
2. 展示日历热力图
3. 显示陪伴天数统计
4. 显示最长连续发布天数

#### 4.5 词云页
1. 创建 `src/components/AnnualReport/pages/WordCloudPage.jsx`
2. 展示四季词云（4象限）或年度词云
3. 显示年度关键词 TOP10

#### 4.6 结尾页
1. 创建 `src/components/AnnualReport/pages/EndingPage.jsx`
2. 显示从第一条动态到 2025.12.31 的陪伴天数
3. 温馨结尾文案
4. 分享按钮

### 验收标准
- ✅ 所有页面使用统一的背景（background.jpg）
- ✅ 页面布局美观，内容居中
- ✅ 文字清晰可读
- ✅ 动画效果流畅
- ✅ 支持左右滑动切换

### 输出文件
- `src/components/AnnualReport/pages/CoverPage.jsx`
- `src/components/AnnualReport/pages/StatisticsPage.jsx`
- `src/components/AnnualReport/pages/TimeDistributionPage.jsx`
- `src/components/AnnualReport/pages/CalendarPage.jsx`
- `src/components/AnnualReport/pages/WordCloudPage.jsx`
- `src/components/AnnualReport/pages/EndingPage.jsx`
- 各页面对应的 `.module.less` 文件

---

## 第五阶段：主报告组件及集成

### 任务清单
1. 创建 `src/components/AnnualReport/index.jsx`
2. 创建 `src/components/AnnualReport/index.module.less`
3. 实现分页切换逻辑（左右滑动）
4. 实现进度指示器（底部小圆点）
5. 实现报告模式选择（全部数据 vs 2025年）
6. 集成所有分页组件
7. 实现报告导出功能（使用 html-to-image）
8. 在主应用中添加入口按钮

### 验收标准
- ✅ 报告完整展示，所有页面正常
- ✅ 左右滑动切换流畅
- ✅ 进度指示器正确显示
- ✅ 模式切换功能正常
- ✅ 导出图片功能正常
- ✅ 入口按钮位置合理

### 输出文件
- `src/components/AnnualReport/index.jsx`
- `src/components/AnnualReport/index.module.less`

---

## 第六阶段：优化与测试

### 任务清单
1. 性能优化：
   - 大数据量时的计算优化
   - 词云生成优化
   - 组件懒加载
2. 体验优化：
   - 加载状态显示
   - 错误处理
   - 动画优化
3. 兼容性测试：
   - 不同浏览器测试
   - 移动端适配
4. 边界情况测试：
   - 无数据
   - 数据量极少（<10条）
   - 数据量极大（>10000条）

### 验收标准
- ✅ 大数据量（1000+条）加载流畅
- ✅ 移动端展示正常
- ✅ 边界情况处理得当
- ✅ 无明显性能问题
- ✅ 用户体验流畅

---

## 最终验收标准

### 功能完整性
- ✅ 支持选择报告模式（全部数据 / 2025年）
- ✅ 展示所有统计数据
- ✅ 日历热力图正常显示
- ✅ 词云正常生成
- ✅ 时间分布图正常显示
- ✅ 支持导出报告图片

### 用户体验
- ✅ 页面美观，背景使用 background.jpg
- ✅ 动画流畅自然
- ✅ 交互逻辑清晰
- ✅ 加载状态明确
- ✅ 错误提示友好

### 代码质量
- ✅ 代码结构清晰
- ✅ 注释完整
- ✅ 无明显性能问题
- ✅ 无 console 错误

---

## 时间节点说明

**重要：** 所有涉及"到 2025.12.31"的天数计算，必须使用 `2025-12-31 23:59:59` 作为结束时间节点，因为应用在此日期后不再维护。

---

## 文件结构总览

```
src/
├── utils/
│   ├── reportUtils.js          # 数据统计工具函数
│   └── wordCloudUtils.js       # 词云工具函数
└── components/
    └── AnnualReport/
        ├── index.jsx           # 主报告组件
        ├── index.module.less   # 主报告样式
        ├── components/         # 可复用组件
        │   ├── CalendarHeatmap.jsx
        │   ├── CalendarHeatmap.module.less
        │   ├── WordCloud.jsx
        │   ├── WordCloud.module.less
        │   ├── TimeDistribution.jsx
        │   ├── TimeDistribution.module.less
        │   ├── StatCard.jsx
        │   └── StatCard.module.less
        └── pages/              # 报告页面
            ├── CoverPage.jsx
            ├── StatisticsPage.jsx
            ├── TimeDistributionPage.jsx
            ├── CalendarPage.jsx
            ├── WordCloudPage.jsx
            └── EndingPage.jsx
```

---

开始实施日期：2026-01-03
预计完成时间：按阶段逐步实现

