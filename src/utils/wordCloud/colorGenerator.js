const WARM_COLORS = [
  "#ff8a00",
  "#ff5252",
  "#ff4081",
  "#e040fb",
  "#7c4dff",
  "#536dfe",
  "#448aff",
  "#40c4ff",
  "#18ffff",
  "#64ffda",
  "#69f0ae",
  "#b2ff59",
  "#eeff41",
  "#ffff00",
  "#ffd740",
  "#ffab40",
];

/**
 * 生成随机暖色调颜色
 * @returns {string} 颜色值
 */
export function randomColor() {
  return WARM_COLORS[Math.floor(Math.random() * WARM_COLORS.length)];
}

/**
 * 根据词频生成颜色（高频词使用更鲜艳的颜色）
 * @param {number} frequency - 当前词频
 * @param {number} maxFrequency - 最大词频
 * @returns {string} 颜色值
 */
export function getColorByFrequency(frequency, maxFrequency) {
  if (maxFrequency === 0) return WARM_COLORS[0];
  const ratio = frequency / maxFrequency;
  const index = Math.floor(ratio * (WARM_COLORS.length - 1));
  return WARM_COLORS[index] || WARM_COLORS[WARM_COLORS.length - 1];
}

