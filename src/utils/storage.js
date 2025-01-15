/**
 * localStorage 工具函数
 * 用于保存和读取应用配置
 */

const STORAGE_KEY = "kehua-preview-settings";

// 默认配置
const DEFAULT_SETTINGS = {
  sortOrder: "asc",
  imageGap: 10,
  previewPadding: 20,
  contentGap: 12,
  borderRadius: 8,
  textIndent: false,
  paragraphSpacing: false,
  fontSize: 15,
  fontWeight: 400,
  contentTypeFilter: null, // null: 全部, 'textOnly': 纯文字, 'withImages': 含图片
};

/**
 * 从 localStorage 读取配置
 * @returns {Object} 配置对象
 */
export function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 合并默认配置，确保所有字段都存在
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error("读取配置失败:", error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * 保存配置到 localStorage
 * @param {Object} settings - 配置对象
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("保存配置失败:", error);
  }
}

/**
 * 保存单个配置项
 * @param {string} key - 配置键名
 * @param {*} value - 配置值
 */
export function saveSetting(key, value) {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
}

