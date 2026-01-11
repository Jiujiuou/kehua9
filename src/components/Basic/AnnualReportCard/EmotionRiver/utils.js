import { EMOTION_CATEGORIES, EMOTION_IDS } from "@/constant";

/**
 * 将情感ID和强度映射到[-1, 1]范围的情感值
 */
function mapEmotionToValue(emotionId, intensity) {
  // 根据情感类型确定基础值范围
  const emotionValueMap = {
    [EMOTION_IDS.WARM]: { base: 0.75, range: [0.5, 1.0] },      // 温暖：正向
    [EMOTION_IDS.CALM]: { base: 0.25, range: [0.0, 0.5] },     // 平静：中性偏正向
    [EMOTION_IDS.ENERGETIC]: { base: 0.85, range: [0.6, 1.0] }, // 活力：正向
    [EMOTION_IDS.CONTEMPLATIVE]: { base: -0.25, range: [-0.5, 0.0] }, // 沉思：中性偏负向
    [EMOTION_IDS.PROFOUND]: { base: -0.75, range: [-1.0, -0.5] },   // 深刻：负向
    [EMOTION_IDS.MIXED]: { base: 0.0, range: [-0.3, 0.3] }      // 混合：中性
  };
  
  const mapping = emotionValueMap[emotionId] || { base: 0.0, range: [-0.5, 0.5] };
  const [minVal, maxVal] = mapping.range;
  
  // 根据强度在范围内插值
  // intensity通常在[0, 1]范围，我们用它来在[minVal, maxVal]范围内插值
  const normalizedIntensity = Math.max(0, Math.min(1, intensity));
  const value = minVal + normalizedIntensity * (maxVal - minVal);
  
  return value;
}

/**
 * 按日期聚合情感数据
 */
export function aggregateEmotionDataByDate(dynamics, emotionResults) {
  // 按日期分组
  const dateGroups = {};
  
  dynamics.forEach((dynamic, index) => {
    if (!dynamic || !dynamic.date) return;
    
    const date = dynamic.date; // YYYY-MM-DD格式
    const emotionResult = emotionResults[index];
    
    if (!emotionResult) return;
    
    if (!dateGroups[date]) {
      dateGroups[date] = {
        date,
        values: [],
        intensities: [],
        posts: [],
        postCount: 0,
        emotionCounts: {}
      };
    }
    
    const primary = emotionResult.primary;
    // 将情感ID和强度映射到[-1, 1]范围的值
    const emotionValue = mapEmotionToValue(primary.emotionId, primary.intensity);
    dateGroups[date].values.push(emotionValue);
    dateGroups[date].intensities.push(primary.intensity);
    dateGroups[date].postCount += 1;
    
    // 保存代表性动态（最多2条）
    if (dateGroups[date].posts.length < 2) {
      dateGroups[date].posts.push({
        id: dynamic.id || `post_${index}`,
        text: dynamic.text || '',
        emotionResult
      });
    }
    
    // 统计情感类型
    const emotionId = primary.emotionId;
    if (emotionId) {
      dateGroups[date].emotionCounts[emotionId] = 
        (dateGroups[date].emotionCounts[emotionId] || 0) + 1;
    }
  });
  
  // 转换为数组并计算平均值
  return Object.values(dateGroups).map(group => {
    const avgValue = group.values.reduce((a, b) => a + b, 0) / group.values.length;
    const avgIntensity = group.intensities.reduce((a, b) => a + b, 0) / group.intensities.length;
    
    // 确定主要情感
    let dominantEmotion = null;
    let maxCount = 0;
    Object.entries(group.emotionCounts).forEach(([emotionId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotionId;
      }
    });
    
    return {
      date: group.date,
      value: avgValue,
      intensity: avgIntensity,
      emotionId: dominantEmotion,
      postCount: group.postCount,
      posts: group.posts,
      isDataPoint: true
    };
  }).sort((a, b) => new Date(a.date) - new Date(b.date)); // 按日期排序
}

/**
 * 按周聚合情感数据
 */
export function aggregateEmotionDataWeekly(aggregatedData) {
  const weeklyData = {};
  
  aggregatedData.forEach(item => {
    const date = new Date(item.date);
    const year = date.getFullYear();
    const weekNumber = getWeekNumber(date);
    
    const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        date: getFirstDayOfWeek(date).toISOString().split('T')[0],
        values: [],
        intensities: [],
        posts: [],
        postCount: 0,
        emotionCounts: {}
      };
    }
    
    weeklyData[weekKey].values.push(item.value);
    weeklyData[weekKey].intensities.push(item.intensity);
    weeklyData[weekKey].postCount += item.postCount;
    weeklyData[weekKey].posts.push(...item.posts.slice(0, 1));
    
    if (item.emotionId) {
      weeklyData[weekKey].emotionCounts[item.emotionId] = 
        (weeklyData[weekKey].emotionCounts[item.emotionId] || 0) + 1;
    }
  });
  
  return Object.values(weeklyData).map(week => {
    const avgValue = week.values.reduce((a, b) => a + b, 0) / week.values.length;
    const avgIntensity = week.intensities.reduce((a, b) => a + b, 0) / week.intensities.length;
    
    let dominantEmotion = null;
    let maxCount = 0;
    Object.entries(week.emotionCounts).forEach(([emotionId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotionId;
      }
    });
    
    return {
      date: week.date,
      value: avgValue,
      intensity: avgIntensity,
      emotionId: dominantEmotion,
      postCount: week.postCount,
      posts: week.posts.slice(0, 3),
      isDataPoint: week.values.length >= 3,
      dataDays: week.values.length
    };
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * 获取日期所在的周数
 */
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * 获取一周的第一天（周一）
 */
function getFirstDayOfWeek(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const newDate = new Date(date);
  newDate.setDate(diff);
  return newDate;
}

/**
 * 生成河流曲线的数据点
 */
export function generateRiverCurvePoints(aggregatedData, canvasWidth, canvasHeight, margin) {
  const points = [];
  
  // 过滤出有效的数据点
  const validDataPoints = aggregatedData.filter(item => item.isDataPoint !== false);
  
  if (validDataPoints.length === 0) {
    console.warn('[generateRiverCurvePoints] 没有有效的数据点');
    return [];
  }
  
  const plotWidth = canvasWidth - margin.left - margin.right;
  const plotHeight = canvasHeight - margin.top - margin.bottom;
  
  // 使用有效数据点的数量来计算xScale
  const xScale = validDataPoints.length > 1 ? plotWidth / (validDataPoints.length - 1) : 0;
  const yScale = plotHeight / 2; // 情感值从-1到1，所以总高度为2
  
  validDataPoints.forEach((item, pointIndex) => {
    const x = margin.left + pointIndex * xScale;
    const y = margin.top + plotHeight / 2 - item.value * yScale;
    
    const size = Math.max(4, Math.min(10, (item.intensity || 0.5) * 12));
    const color = getEmotionColor(item.value, item.emotionId);
    
    points.push({
      x,
      y,
      date: item.date,
      originalValue: item.value,
      smoothedValue: item.value,
      size,
      color,
      opacity: 0.8,
      isPeak: false,
      isValley: false,
      isDataPoint: true,
      originalIndex: pointIndex,
      data: item,
      margin,
      plotHeight,
      yScale
    });
  });
  
  // 应用曲线平滑
  return applyCurveSmoothing(points);
}

/**
 * 应用曲线平滑（Catmull-Rom样条曲线）
 */
function applyCurveSmoothing(points, tension = 0.4) {
  if (points.length < 3) return points;
  
  const smoothedPoints = points.map(p => ({ ...p }));
  
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    
    // 计算平滑后的值
    smoothedPoints[i].smoothedValue = p1.originalValue + 
      tension * ((p2.originalValue - p0.originalValue) / 2);
    
    // 重新计算y坐标（使用平滑后的值）
    smoothedPoints[i].y = p1.margin.top + p1.plotHeight / 2 - 
      smoothedPoints[i].smoothedValue * p1.yScale;
  }
  
  return smoothedPoints;
}

/**
 * 生成贝塞尔曲线控制点
 */
export function generateBezierControlPoints(points, tension = 0.4) {
  if (points.length < 2) return [];
  
  const controlPoints = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;
    
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
    
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
    
    controlPoints.push({
      start: { x: p1.x, y: p1.y },
      cp1: { x: cp1x, y: cp1y },
      cp2: { x: cp2x, y: cp2y },
      end: { x: p2.x, y: p2.y }
    });
  }
  
  return controlPoints;
}

/**
 * 检测情感峰值点
 */
export function detectEmotionPeaks(points, threshold = 0.7) {
  const peaks = [];
  const valleys = [];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];
    
    // 局部峰值
    if (current.smoothedValue > prev.smoothedValue && 
        current.smoothedValue > next.smoothedValue &&
        current.smoothedValue > threshold) {
      current.isPeak = true;
      current.peakType = 'high';
      peaks.push({
        point: current,
        strength: current.smoothedValue,
        date: current.date
      });
    }
    
    // 局部谷值
    if (current.smoothedValue < prev.smoothedValue && 
        current.smoothedValue < next.smoothedValue &&
        current.smoothedValue < -threshold) {
      current.isValley = true;
      current.peakType = 'low';
      valleys.push({
        point: current,
        strength: current.smoothedValue,
        date: current.date
      });
    }
  }
  
  // 标记最显著的峰值
  markSignificantPeaks(peaks, valleys, points);
  
  return { peaks, valleys };
}

/**
 * 标记最显著的峰值
 */
function markSignificantPeaks(peaks, valleys, allPoints) {
  const sortedPeaks = [...peaks].sort((a, b) => b.strength - a.strength);
  const sortedValleys = [...valleys].sort((a, b) => a.strength - b.strength);
  
  const topPeaks = sortedPeaks.slice(0, 3);
  const topValleys = sortedValleys.slice(0, 3);
  
  topPeaks.forEach(peak => {
    peak.point.isSignificant = true;
    peak.point.significanceLabel = getPeakLabel('high', peak.strength);
  });
  
  topValleys.forEach(valley => {
    valley.point.isSignificant = true;
    valley.point.significanceLabel = getPeakLabel('low', valley.strength);
  });
  
  markTurningPoints(allPoints);
}

/**
 * 生成峰值标签
 */
function getPeakLabel(type, strength) {
  const highLabels = [
    { threshold: 0.9, label: '情感高峰' },
    { threshold: 0.7, label: '明亮时刻' },
    { threshold: 0.5, label: '温暖峰值' }
  ];
  
  const lowLabels = [
    { threshold: -0.9, label: '情感低谷' },
    { threshold: -0.7, label: '沉思时刻' },
    { threshold: -0.5, label: '深刻谷底' }
  ];
  
  const labels = type === 'high' ? highLabels : lowLabels;
  
  for (const item of labels) {
    if (type === 'high' && strength >= item.threshold) {
      return item.label;
    }
    if (type === 'low' && strength <= item.threshold) {
      return item.label;
    }
  }
  
  return type === 'high' ? '高点' : '低点';
}

/**
 * 标记转折点
 */
function markTurningPoints(points) {
  for (let i = 2; i < points.length - 2; i++) {
    const segment1 = points[i].smoothedValue - points[i-2].smoothedValue;
    const segment2 = points[i+2].smoothedValue - points[i].smoothedValue;
    
    if (segment1 * segment2 < -0.3 && Math.abs(segment1) > 0.2 && Math.abs(segment2) > 0.2) {
      points[i].isTurningPoint = true;
      points[i].turningDirection = segment2 > 0 ? 'up' : 'down';
    }
  }
}

/**
 * 获取情感颜色
 */
function getEmotionColor(value, emotionId) {
  if (emotionId && EMOTION_CATEGORIES[emotionId]) {
    return EMOTION_CATEGORIES[emotionId].color;
  }
  
  // 根据情感值返回颜色
  if (value > 0.5) {
    return '#FFB74D'; // 温暖橙
  } else if (value > 0) {
    return '#81C784'; // 平静绿
  } else if (value > -0.5) {
    return '#7986CB'; // 沉思蓝紫
  } else {
    return '#9575CD'; // 深刻紫
  }
}

/**
 * 格式化日期标签
 */
export function formatDateLabel(date, totalDays) {
  if (totalDays <= 30) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else if (totalDays <= 365) {
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                       '7月', '8月', '9月', '10月', '11月', '12月'];
    return monthNames[date.getMonth()];
  } else {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }
}

/**
 * 调整颜色透明度
 */
export function adjustColorOpacity(color, opacity) {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = match[1];
      const g = match[2];
      const b = match[3];
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  return color;
}

