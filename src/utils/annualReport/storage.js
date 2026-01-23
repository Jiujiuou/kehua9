// 年度报告相关的 localStorage JSON 工具

export const safeParseJson = (str, fallback) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

export const loadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return safeParseJson(raw, fallback);
  } catch (e) {
    console.error(`[annualReport storage] load failed: ${key}`, e);
    return fallback;
  }
};

export const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[annualReport storage] save failed: ${key}`, e);
    return false;
  }
};

export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`[annualReport storage] remove failed: ${key}`, e);
    return false;
  }
};

export const appendToJSONList = (key, item) => {
  const existing = loadJSON(key, []);
  const list = Array.isArray(existing) ? existing : [];
  list.push(item);
  if (!saveJSON(key, list)) {
    throw new Error("写入本地存储失败");
  }
  return list;
};
