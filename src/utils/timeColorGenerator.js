import { EMOTION_IDS, EMOTION_CATEGORIES } from "@/constant";

// 色彩名称库（按情感分类）
const COLOR_NAMES = {
  WARM: [
    { name: '暖阳橙', description: '如午后阳光般温暖明亮' },
    { name: '落日金', description: '黄昏时分的光辉' },
    { name: '晨曦黄', description: '清晨第一缕阳光' },
    { name: '蜜柑色', description: '甜蜜而充满活力' },
    { name: '烛光暖', description: '温馨的室内光晕' }
  ],
  CALM: [
    { name: '湖水绿', description: '平静如镜的湖面' },
    { name: '薄雾蓝', description: '清晨山间的淡蓝色雾气' },
    { name: '远山青', description: '远处山脉的宁静色调' },
    { name: '云朵白', description: '轻柔的云层色彩' },
    { name: '溪流银', description: '流淌溪水的光泽' }
  ],
  ENERGETIC: [
    { name: '活力蓝', description: '充满能量的明亮蓝色' },
    { name: '火焰橙', description: '炽热而活跃的色调' },
    { name: '闪电紫', description: '瞬间的强烈色彩' },
    { name: '朝阳红', description: '日出时的热情色彩' },
    { name: '极光绿', description: '舞动的自然奇迹' }
  ],
  CONTEMPLATIVE: [
    { name: '暮色紫', description: '黄昏时分的深沉思考' },
    { name: '石墨灰', description: '理性而稳重的色调' },
    { name: '夜空蓝', description: '深邃的夜空' },
    { name: '迷雾灰', description: '朦胧而不确定的氛围' },
    { name: '书卷褐', description: '旧书页的温暖质感' }
  ],
  PROFOUND: [
    { name: '大地褐', description: '深厚而稳重的土地色彩' },
    { name: '深空黑', description: '宇宙深处的神秘' },
    { name: '古铜色', description: '时光沉淀的质感' },
    { name: '岩层灰', description: '地质变迁的见证' },
    { name: '暮光棕', description: '日夜交替时的深沉' }
  ],
  MIXED: [
    { name: '虹彩色', description: '多种情感的融合' },
    { name: '渐变灰', description: '过渡中的微妙变化' },
    { name: '斑驳色', description: '丰富多彩的斑点' },
    { name: '混合褐', description: '复杂而独特的组合' },
    { name: '幻彩色', description: '变化莫测的光影' }
  ]
};

// 色彩描述模板库
const COLOR_DESCRIPTION_TEMPLATES = {
  WARM: [
    "这一年，你的情感基调如{colorName}般温暖明亮。{additionalDetail}",
    "{colorName}填满了{year}的记忆画布。{emotionalInsight}"
  ],
  CALM: [
    "{year}年，你找到了一种{colorName}般的平静。{seasonalObservation}",
    "如{colorName}般温和而稳定，是你的{year}年。{patternNote}"
  ],
  CONTEMPLATIVE: [
    "沉思与内省为{year}年染上了{colorName}。{keyMoments}",
    "在{colorName}的色调中，你进行了深度的思考。{growthNote}"
  ],
  PROFOUND: [
    "{colorName}承载了{year}年的重量与深度。{resilienceNote}",
    "那些深刻的时刻，最终沉淀为{colorName}。{transformationNote}"
  ],
  MIXED: [
    "{colorName}记录了{year}年的复杂与丰富。{diversityNote}",
    "多种情感的织就了{colorName}的独特纹理。{balanceNote}"
  ]
};

// 诗意补充描述
const POETIC_ADDITIONS = {
  intensity: {
    high: "色彩饱和而明亮，见证了情感的强烈表达。",
    medium: "色调柔和而富有层次，记录着细腻的情感变化。",
    low: "淡雅的色彩，如同轻声细语的回忆。"
  },
  volatility: {
    high: "色彩的细微变化中，可见情感的起伏轨迹。",
    medium: "平稳中带着微澜，是这一年的情感节奏。",
    low: "一致的色调，反映了内心的稳定与平和。"
  },
  seasonality: {
    strong: "季节的更替为这一年增添了丰富的色彩层次。",
    moderate: "不同季节各有其色彩，但整体和谐统一。",
    weak: "全年保持着一致的色彩基调。"
  }
};

/**
 * HSL转RGB
 */
function hslToRgb(h, s, l) {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // 灰色
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * RGB转HEX
 */
function rgbToHex(r, g, b) {
  return '#' + 
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0');
}

/**
 * HSL转HEX
 */
function hslToHex(hsl) {
  const rgb = hslToRgb(hsl.h / 360, hsl.s, hsl.l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * 确定年度主导情感
 */
function findDominantEmotion(emotionDistribution) {
  let maxScore = 0;
  let dominantEmotion = null;
  
  Object.entries(emotionDistribution).forEach(([emotionId, data]) => {
    // 综合评分 = 频率 × 强度
    const score = data.percentage * data.intensity;
    
    if (score > maxScore) {
      maxScore = score;
      dominantEmotion = emotionId;
    }
  });
  
  return dominantEmotion || EMOTION_IDS.MIXED;
}

/**
 * 计算情感强度综合评分
 */
function calculateEmotionalIntensity(emotionDistribution, metrics) {
  // 1. 基于情感分布的强度
  let distributionIntensity = 0;
  Object.values(emotionDistribution).forEach(data => {
    distributionIntensity += data.percentage * data.intensity;
  });
  
  // 2. 基于波动率的修正
  const volatilityFactor = metrics?.emotionalVolatility 
    ? 1 - metrics.emotionalVolatility * 0.3 
    : 1;
  
  // 3. 基于峰值数量的修正
  const peakFactor = metrics?.peakCount 
    ? 1 + (metrics.peakCount.high + metrics.peakCount.low) * 0.05 
    : 1;
  
  // 4. 综合评分 (0-1)
  const rawIntensity = distributionIntensity * volatilityFactor * peakFactor;
  
  return Math.min(Math.max(rawIntensity, 0.1), 0.95);
}

/**
 * 分析季节性影响
 */
function analyzeSeasonalInfluence(seasonalPatterns) {
  if (!seasonalPatterns) return { strength: 0, dominantSeason: null };
  
  const seasons = Object.values(seasonalPatterns);
  let maxIntensity = 0;
  let dominantSeason = null;
  
  seasons.forEach(season => {
    if (season.intensity > maxIntensity) {
      maxIntensity = season.intensity;
      dominantSeason = season.dominantEmotion;
    }
  });
  
  // 季节性强度评分 (0-1)
  const seasonalStrength = maxIntensity * 0.8;
  
  return {
    strength: seasonalStrength,
    dominantSeason
  };
}

/**
 * 生成基础色彩
 */
function generateBaseColor(dominantEmotion, emotionalIntensity, seasonalInfluence) {
  // 基础情感色彩映射
  const baseColorMap = {
    [EMOTION_IDS.WARM]: { h: 30, s: 0.8, l: 0.6 },   // 橙色系
    [EMOTION_IDS.CALM]: { h: 180, s: 0.6, l: 0.7 },  // 蓝绿色系
    [EMOTION_IDS.ENERGETIC]: { h: 210, s: 0.9, l: 0.5 }, // 亮蓝色
    [EMOTION_IDS.CONTEMPLATIVE]: { h: 270, s: 0.5, l: 0.6 }, // 紫色系
    [EMOTION_IDS.PROFOUND]: { h: 20, s: 0.4, l: 0.4 }, // 褐色系
    [EMOTION_IDS.MIXED]: { h: 0, s: 0.1, l: 0.5 }      // 中性灰
  };
  
  let baseHSL = { ...baseColorMap[dominantEmotion] };
  
  // 根据情感强度调整饱和度和亮度
  if (emotionalIntensity > 0.7) {
    // 高强度：更高饱和度，适中亮度
    baseHSL.s = Math.min(baseHSL.s * 1.3, 0.95);
    baseHSL.l = baseHSL.l * 0.9;
  } else if (emotionalIntensity < 0.4) {
    // 低强度：降低饱和度，提高亮度
    baseHSL.s = baseHSL.s * 0.6;
    baseHSL.l = Math.min(baseHSL.l * 1.2, 0.9);
  }
  
  // 季节性影响：微调色相
  if (seasonalInfluence.strength > 0.5 && seasonalInfluence.dominantSeason) {
    const randomHueShift = (Math.random() - 0.5) * 10;
    baseHSL.h = (baseHSL.h + randomHueShift + 360) % 360;
  }
  
  // 添加随机微调，使每个年份的色彩更独特
  const randomHueShift = (Math.random() - 0.5) * 15; // ±7.5度
  const randomSatShift = (Math.random() - 0.5) * 0.1; // ±0.05饱和度
  
  baseHSL.h = (baseHSL.h + randomHueShift + 360) % 360;
  baseHSL.s = Math.max(0.1, Math.min(baseHSL.s + randomSatShift, 0.95));
  
  // 转换为RGB和HEX
  const rgb = hslToRgb(baseHSL.h / 360, baseHSL.s, baseHSL.l);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  
  return {
    hex,
    rgb,
    hsl: { h: Math.round(baseHSL.h), s: baseHSL.s, l: baseHSL.l }
  };
}

/**
 * 生成色彩变体
 */
function generateColorVariants(baseColor, emotionalIntensity) {
  const { hsl } = baseColor;
  
  // 根据情感强度决定变体范围
  const variantRange = emotionalIntensity > 0.7 ? 0.15 : 
                      emotionalIntensity > 0.4 ? 0.1 : 0.05;
  
  // 浅色变体 (提高亮度，降低饱和度)
  const lightHSL = {
    h: hsl.h,
    s: hsl.s * 0.7,
    l: Math.min(hsl.l + variantRange, 0.85)
  };
  
  // 深色变体 (降低亮度，提高饱和度)
  const darkHSL = {
    h: hsl.h,
    s: Math.min(hsl.s * 1.2, 0.95),
    l: Math.max(hsl.l - variantRange, 0.2)
  };
  
  // 柔色变体 (降低饱和度，微调色相)
  const mutedHSL = {
    h: (hsl.h + 5) % 360,
    s: hsl.s * 0.4,
    l: hsl.l
  };
  
  // 鲜艳变体 (提高饱和度)
  const vibrantHSL = {
    h: hsl.h,
    s: Math.min(hsl.s * 1.3, 0.95),
    l: hsl.l * 0.9
  };
  
  return {
    light: hslToHex(lightHSL),
    dark: hslToHex(darkHSL),
    muted: hslToHex(mutedHSL),
    vibrant: hslToHex(vibrantHSL)
  };
}

/**
 * 选择色彩名称
 */
function selectColorName(dominantEmotion, emotionalIntensity) {
  const names = COLOR_NAMES[dominantEmotion];
  if (!names || names.length === 0) {
    return dominantEmotion === EMOTION_IDS.MIXED ? '混合色' : '情感色';
  }
  
  // 根据情感强度选择名称索引
  const index = Math.floor(emotionalIntensity * (names.length - 1));
  const selected = names[Math.min(index, names.length - 1)];
  return selected.name;
}

/**
 * 生成诗意描述
 */
function generatePoeticDescription(year, colorName, dominantEmotion, intensity, metrics) {
  const templates = COLOR_DESCRIPTION_TEMPLATES[dominantEmotion];
  
  // 安全检查：如果模板不存在，使用默认模板
  if (!templates || !Array.isArray(templates) || templates.length === 0) {
    const defaultTemplate = `这一年，你的情感色彩是{colorName}。{additionalDetail}`;
    const emotionalInsight = intensity > 0.7 
      ? POETIC_ADDITIONS.intensity.high 
      : intensity > 0.4 
        ? POETIC_ADDITIONS.intensity.medium 
        : POETIC_ADDITIONS.intensity.low;
    
    const description = defaultTemplate
      .replace('{colorName}', colorName)
      .replace('{year}', year)
      .replace('{additionalDetail}', emotionalInsight);
    
    return {
      title: colorName,
      subtitle: `${year}年的情感色彩`,
      description,
      keywords: ['情感', '色彩', '记忆', '时光']
    };
  }
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // 情感洞察
  let emotionalInsight = '';
  if (intensity > 0.7) {
    emotionalInsight = POETIC_ADDITIONS.intensity.high;
  } else if (intensity > 0.4) {
    emotionalInsight = POETIC_ADDITIONS.intensity.medium;
  } else {
    emotionalInsight = POETIC_ADDITIONS.intensity.low;
  }
  
  // 季节观察
  let seasonalObservation = '';
  if (metrics?.seasonality && metrics.seasonality > 0.6) {
    seasonalObservation = POETIC_ADDITIONS.seasonality.strong;
  } else if (metrics?.seasonality && metrics.seasonality > 0.3) {
    seasonalObservation = POETIC_ADDITIONS.seasonality.moderate;
  } else {
    seasonalObservation = POETIC_ADDITIONS.seasonality.weak;
  }
  
  // 填充模板
  const description = template
    .replace('{colorName}', colorName)
    .replace('{year}', year)
    .replace('{additionalDetail}', emotionalInsight)
    .replace('{emotionalInsight}', emotionalInsight)
    .replace('{seasonalObservation}', seasonalObservation)
    .replace('{patternNote}', '')
    .replace('{keyMoments}', '')
    .replace('{growthNote}', '')
    .replace('{resilienceNote}', '')
    .replace('{transformationNote}', '')
    .replace('{diversityNote}', '')
    .replace('{balanceNote}', '');
  
  return {
    title: colorName,
    subtitle: `${year}年的情感色彩`,
    description,
    keywords: ['情感', '色彩', '记忆', '时光']
  };
}

/**
 * 计算色彩置信度
 */
function calculateColorConfidence(emotionDistribution, emotionalIntensity) {
  // 1. 主导情感的明确性
  const percentages = Object.values(emotionDistribution).map(d => d.percentage);
  const sortedPercentages = [...percentages].sort((a, b) => b - a);
  const dominanceScore = sortedPercentages[0] - (sortedPercentages[1] || 0);
  
  // 2. 情感强度的清晰度
  const intensityScore = emotionalIntensity;
  
  // 3. 综合置信度
  const confidence = (dominanceScore * 0.6 + intensityScore * 0.4);
  
  return Math.min(Math.max(confidence, 0.1), 0.95);
}

/**
 * 生成视觉配置
 */
function generateVisualConfig(baseColor, emotionalIntensity) {
  // 根据情感强度决定动画类型
  let animationType = 'gentle-pulse';
  let animationIntensity = 0.1;
  
  if (emotionalIntensity > 0.7) {
    animationType = 'soft-breathe';
    animationIntensity = 0.15;
  } else if (emotionalIntensity < 0.4) {
    animationType = 'subtle-glow';
    animationIntensity = 0.05;
  }
  
  // 生成渐变
  const gradient = {
    type: 'radial',
    position: { x: 0.5, y: 0.5 },
    stops: [
      { position: 0, color: baseColor.variants.light },
      { position: 0.7, color: baseColor.hex },
      { position: 1, color: baseColor.variants.dark }
    ]
  };
  
  return {
    gradient,
    texture: {
      type: emotionalIntensity > 0.6 ? 'subtle-grain' : 'none',
      opacity: emotionalIntensity * 0.08
    },
    animation: {
      type: animationType,
      duration: 3000 + emotionalIntensity * 2000,
      intensity: animationIntensity
    }
  };
}

/**
 * 从年度情感数据中提取主色彩
 * @param {Object} yearData - 年度情感数据
 * @returns {Object} 色彩定义对象
 */
export function extractYearColor(yearData) {
  const { emotionDistribution, metrics, seasonalPatterns } = yearData;
  
  // 1. 确定主导情感
  const dominantEmotion = findDominantEmotion(emotionDistribution);
  
  // 2. 计算情感强度综合评分
  const emotionalIntensity = calculateEmotionalIntensity(
    emotionDistribution,
    metrics
  );
  
  // 3. 考虑季节性影响
  const seasonalInfluence = analyzeSeasonalInfluence(seasonalPatterns);
  
  // 4. 生成基础色彩
  const baseColor = generateBaseColor(
    dominantEmotion,
    emotionalIntensity,
    seasonalInfluence
  );
  
  // 5. 生成色彩变体
  const colorVariants = generateColorVariants(baseColor, emotionalIntensity);
  
  // 6. 确定诗意名称
  const colorName = selectColorName(dominantEmotion, emotionalIntensity);
  
  // 7. 生成诗意描述
  const poeticDescription = generatePoeticDescription(
    yearData.year,
    colorName,
    dominantEmotion,
    emotionalIntensity,
    metrics
  );
  
  // 8. 计算置信度
  const colorConfidence = calculateColorConfidence(
    emotionDistribution,
    emotionalIntensity
  );
  
  return {
    year: yearData.year,
    baseColor: {
      ...baseColor,
      name: colorName
    },
    variants: colorVariants,
    derivation: {
      dominantEmotion,
      emotionalIntensity,
      seasonalInfluence,
      colorConfidence
    },
    poeticDescription,
    visualConfig: generateVisualConfig({ ...baseColor, variants: colorVariants }, emotionalIntensity)
  };
}

/**
 * 计算年度情感数据（从动态数据中提取）
 * @param {number} year - 年份
 * @param {Array} dynamics - 该年份的动态数组
 * @param {Array} emotionResults - 对应的情绪分析结果数组
 * @returns {Object} 年度情感数据
 */
export function calculateYearlyEmotionData(year, dynamics, emotionResults) {
  if (!dynamics || dynamics.length === 0 || !emotionResults || emotionResults.length === 0) {
    return null;
  }
  
  // 统计各情绪的数量和强度
  const emotionStats = {};
  let totalIntensity = 0;
  
  emotionResults.forEach((result, index) => {
    const emotionId = result.primary.emotionId;
    const intensity = result.primary.intensity;
    
    if (!emotionStats[emotionId]) {
      emotionStats[emotionId] = {
        count: 0,
        totalIntensity: 0,
        intensities: []
      };
    }
    
    emotionStats[emotionId].count += 1;
    emotionStats[emotionId].totalIntensity += intensity;
    emotionStats[emotionId].intensities.push(intensity);
    totalIntensity += intensity;
  });
  
  // 计算百分比和平均强度
  const emotionDistribution = {};
  Object.keys(emotionStats).forEach(emotionId => {
    const stats = emotionStats[emotionId];
    const avgIntensity = stats.totalIntensity / stats.count;
    
    emotionDistribution[emotionId] = {
      count: stats.count,
      percentage: stats.count / emotionResults.length,
      intensity: avgIntensity
    };
  });
  
  // 计算月度趋势（简化版：按月份分组）
  const monthlyTrend = new Array(12).fill(0);
  const monthlyCounts = new Array(12).fill(0);
  
  dynamics.forEach((dynamic, index) => {
    if (dynamic.date) {
      const month = parseInt(dynamic.date.split('-')[1]) - 1;
      if (month >= 0 && month < 12 && emotionResults[index]) {
        monthlyTrend[month] += emotionResults[index].primary.intensity;
        monthlyCounts[month] += 1;
      }
    }
  });
  
  // 计算平均值
  const normalizedMonthlyTrend = monthlyTrend.map((sum, i) => 
    monthlyCounts[i] > 0 ? sum / monthlyCounts[i] : 0
  );
  
  // 计算情感波动率（基于月度趋势的标准差）
  const avgValue = normalizedMonthlyTrend.reduce((a, b) => a + b, 0) / 12;
  const variance = normalizedMonthlyTrend.reduce((sum, val) => 
    sum + Math.pow(val - avgValue, 2), 0) / 12;
  const volatility = Math.sqrt(variance);
  
  // 计算峰值数量（简化版）
  const peakCount = {
    high: normalizedMonthlyTrend.filter(v => v > avgValue + volatility).length,
    low: normalizedMonthlyTrend.filter(v => v < avgValue - volatility).length
  };
  
  return {
    year,
    emotionDistribution,
    metrics: {
      totalPosts: dynamics.length,
      avgEmotionValue: avgValue,
      emotionalVolatility: Math.min(volatility, 1),
      peakCount,
      monthlyTrend: normalizedMonthlyTrend
    }
  };
}

