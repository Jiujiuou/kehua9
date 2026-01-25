// 主题色：年度报告的主题色是粉红色/红色系
// 亮色模式：#eb425f，深色模式：#d63f5c
const THEME_COLORS = {
  light: "#eb425f", // 亮色模式主题色
  dark: "#d63f5c", // 深色模式主题色
};

/**
 * 检测当前主题模式
 * @returns {string} 'light' 或 'dark'
 */
function detectTheme() {
  const theme = document.documentElement.getAttribute("data-theme");
  return theme === "dark" ? "dark" : "light";
}

/**
 * 将十六进制颜色转换为 HSL
 * @param {string} hex - 十六进制颜色值
 * @returns {Object} HSL 对象 {h, s, l}
 */
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // 无色彩
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * 将 HSL 转换为十六进制颜色
 * @param {number} h - 色相 (0-360)
 * @param {number} s - 饱和度 (0-100)
 * @param {number} l - 亮度 (0-100)
 * @returns {string} 十六进制颜色值
 */
function hslToHex(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // 无色彩
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 生成基于主题色的颜色调色板
 * 根据词频生成不同亮度和饱和度的颜色变体
 * 在深色模式下自动提高亮度和对比度
 * 添加色相变化使颜色更丰富
 * @param {number} frequency - 当前词频
 * @param {number} maxFrequency - 最大词频
 * @param {number} index - 可选：词的索引位置，用于生成不同的色相变化
 * @returns {string} 颜色值
 */
export function getColorByFrequency(frequency, maxFrequency, index = 0) {
  const theme = detectTheme();
  const baseColor = THEME_COLORS[theme];
  
  if (maxFrequency === 0) return baseColor;

  const ratio = frequency / maxFrequency;

  // 基于当前主题的主题色生成 HSL
  const baseHsl = hexToHsl(baseColor);
  let h = baseHsl.h;

  // 添加色相变化，使颜色更丰富
  // 在主题色周围 ±40度范围内变化，保持色调一致性
  // 使用索引和词频比例来生成不同的色相偏移
  const hueVariation = 40; // 色相变化范围
  const hueOffset = ((index % 7) / 7) * hueVariation - hueVariation / 2; // -20 到 +20 度
  // 根据词频比例微调色相偏移
  const ratioBasedOffset = (ratio - 0.5) * 10; // -5 到 +5 度
  h = (h + hueOffset + ratioBasedOffset + 360) % 360; // 确保在 0-360 范围内

  // 根据主题模式和词频调整饱和度和亮度
  let s, l;

  if (theme === "dark") {
    // 深色模式：提高亮度和饱和度，确保在深色背景上有足够的对比度
    if (ratio >= 0.7) {
      // 高频词（前30%）：非常鲜艳，高亮度
      s = 75 + ratio * 15; // 75-90% 饱和度
      l = 65 + (1 - ratio) * 15; // 65-80% 亮度
    } else if (ratio >= 0.4) {
      // 中高频词（30%-60%）：高饱和度，较高亮度
      s = 60 + (ratio - 0.4) * 15; // 60-75% 饱和度
      l = 70 + (0.7 - ratio) * 10; // 70-80% 亮度
    } else if (ratio >= 0.2) {
      // 中低频词（20%-40%）：中等饱和度，高亮度
      s = 40 + (ratio - 0.2) * 20; // 40-60% 饱和度
      l = 75 + (0.4 - ratio) * 10; // 75-85% 亮度
    } else {
      // 低频词（后20%）：较低饱和度，很高亮度
      s = 25 + (ratio / 0.2) * 15; // 25-40% 饱和度
      l = 80 + (0.2 - ratio) * 10; // 80-90% 亮度
    }

    // 深色模式：确保最小亮度足够高，最小饱和度足够明显
    s = Math.max(25, Math.min(90, s));
    l = Math.max(65, Math.min(90, l));
  } else {
    // 亮色模式：保持原有的逻辑
    if (ratio >= 0.7) {
      // 高频词（前30%）：鲜艳的主题色
      s = 70 + ratio * 20; // 70-90% 饱和度
      l = 50 + (1 - ratio) * 10; // 50-60% 亮度
    } else if (ratio >= 0.4) {
      // 中高频词（30%-60%）：中等鲜艳度
      s = 50 + (ratio - 0.4) * 20; // 50-70% 饱和度
      l = 55 + (0.7 - ratio) * 10; // 55-65% 亮度
    } else if (ratio >= 0.2) {
      // 中低频词（20%-40%）：较柔和
      s = 30 + (ratio - 0.2) * 20; // 30-50% 饱和度
      l = 60 + (0.4 - ratio) * 10; // 60-70% 亮度
    } else {
      // 低频词（后20%）：很柔和
      s = 15 + (ratio / 0.2) * 15; // 15-30% 饱和度
      l = 70 + (0.2 - ratio) * 10; // 70-80% 亮度
    }

    // 亮色模式：确保值在有效范围内
    s = Math.max(15, Math.min(90, s));
    l = Math.max(50, Math.min(80, l));
  }

  return hslToHex(h, s, l);
}

/**
 * 生成随机主题色调颜色（保留用于兼容性）
 * @returns {string} 颜色值
 */
export function randomColor() {
  const theme = detectTheme();
  const baseColor = THEME_COLORS[theme];
  const baseHsl = hexToHsl(baseColor);
  const { h } = baseHsl;
  
  if (theme === "dark") {
    // 深色模式：更高的亮度和饱和度
    const s = 50 + Math.random() * 30; // 50-80% 饱和度
    const l = 65 + Math.random() * 20; // 65-85% 亮度
    return hslToHex(h, s, l);
  } else {
    // 亮色模式：保持原有逻辑
    const s = 50 + Math.random() * 30; // 50-80% 饱和度
    const l = 55 + Math.random() * 15; // 55-70% 亮度
    return hslToHex(h, s, l);
  }
}

