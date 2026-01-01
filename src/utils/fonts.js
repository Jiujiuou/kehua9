/**
 * 字体工具函数
 * 提供系统常见字体列表和字体映射
 */

/**
 * 获取系统常见字体列表
 * 由于浏览器安全限制，无法直接枚举系统字体
 * 这里提供一个常见的系统字体列表
 */
export function getSystemFonts() {
  return [
    {
      value: "system",
      label: "系统字体",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    {
      value: "arial",
      label: "Arial",
      fontFamily: "Arial, sans-serif",
    },
    {
      value: "helvetica",
      label: "Helvetica",
      fontFamily: "Helvetica, Arial, sans-serif",
    },
    {
      value: "verdana",
      label: "Verdana",
      fontFamily: "Verdana, Geneva, sans-serif",
    },
    {
      value: "tahoma",
      label: "Tahoma",
      fontFamily: "Tahoma, Geneva, sans-serif",
    },
    {
      value: "trebuchet",
      label: "Trebuchet MS",
      fontFamily: "'Trebuchet MS', Helvetica, sans-serif",
    },
    {
      value: "times",
      label: "Times New Roman",
      fontFamily: "'Times New Roman', Times, serif",
    },
    {
      value: "georgia",
      label: "Georgia",
      fontFamily: "Georgia, 'Times New Roman', serif",
    },
    {
      value: "palatino",
      label: "Palatino",
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    },
    {
      value: "courier",
      label: "Courier New",
      fontFamily: "'Courier New', Courier, monospace",
    },
    {
      value: "monaco",
      label: "Monaco",
      fontFamily: "Monaco, 'Courier New', monospace",
    },
    {
      value: "consolas",
      label: "Consolas",
      fontFamily: "Consolas, 'Courier New', monospace",
    },
    {
      value: "impact",
      label: "Impact",
      fontFamily: "Impact, Charcoal, sans-serif",
    },
    {
      value: "comic",
      label: "Comic Sans MS",
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
    },
  ];
}

/**
 * 根据字体值获取对应的 CSS font-family
 * @param {string} fontValue - 字体值
 * @returns {string} CSS font-family 字符串
 */
export function getFontFamily(fontValue) {
  const fonts = getSystemFonts();
  const font = fonts.find((f) => f.value === fontValue);
  return font ? font.fontFamily : fonts[0].fontFamily;
}

/**
 * 检测浏览器类型
 * @returns {string} 浏览器类型
 */
export function detectBrowser() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes("chrome") && !userAgent.includes("edg")) {
    return "chrome";
  } else if (userAgent.includes("firefox")) {
    return "firefox";
  } else if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
    return "safari";
  } else if (userAgent.includes("edg")) {
    return "edge";
  } else if (userAgent.includes("opera") || userAgent.includes("opr")) {
    return "opera";
  }
  
  return "unknown";
}

/**
 * 检测操作系统类型
 * @returns {string} 操作系统类型
 */
export function detectOS() {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (platform.includes("mac") || userAgent.includes("mac")) {
    return "macos";
  } else if (platform.includes("win") || userAgent.includes("windows")) {
    return "windows";
  } else if (platform.includes("linux") || userAgent.includes("linux")) {
    return "linux";
  } else if (userAgent.includes("android")) {
    return "android";
  } else if (userAgent.includes("ios") || userAgent.includes("iphone") || userAgent.includes("ipad")) {
    return "ios";
  }
  
  return "unknown";
}

