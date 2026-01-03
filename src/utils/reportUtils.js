/**
 * 年度报告数据统计工具函数
 * 用于分析和统计用户动态数据
 */

/**
 * 过滤指定年份的动态数据
 * @param {Array} dynamics - 动态数据数组
 * @param {number|null} year - 年份，null 表示全部数据
 * @returns {Array} 过滤后的动态数据
 */
export function filterDynamicsByYear(dynamics, year = null) {
  if (!dynamics || dynamics.length === 0) {
    return [];
  }

  // 设置截止日期为 2025.12.31 23:59:59
  const endDate = new Date('2025-12-31T23:59:59');

  // 如果是全部数据，过滤到 2025.12.31
  if (year === null) {
    return dynamics.filter((dynamic) => {
      const date = new Date(dynamic.timestamp);
      return date <= endDate;
    });
  }

  // 如果是指定年份，过滤该年份且不超过 2025.12.31
  return dynamics.filter((dynamic) => {
    const date = new Date(dynamic.timestamp);
    return date.getFullYear() === year && date <= endDate;
  });
}

/**
 * 获取动态类型
 * @param {Object} dynamic - 单条动态数据
 * @returns {string} 'text' | 'image' | 'video' | 'mixed'
 */
export function getDynamicType(dynamic) {
  const hasText = dynamic.text && dynamic.text.trim().length > 0;
  const hasImages = dynamic.images && dynamic.images.length > 0;
  const hasVideos = dynamic.videos && dynamic.videos.length > 0;

  if ((hasText && hasImages) || (hasText && hasVideos) || (hasImages && hasVideos)) {
    return 'mixed'; // 混合类型
  }

  if (hasImages) return 'image';
  if (hasVideos) return 'video';
  if (hasText) return 'text';

  return 'text'; // 默认为文字类型
}

/**
 * 统计动态数量及类型分布
 * @param {Array} dynamics - 动态数据数组
 * @returns {Object} 统计结果
 */
export function calculateDynamicStats(dynamics) {
  if (!dynamics || dynamics.length === 0) {
    return {
      total: 0,
      textOnly: 0,
      imageOnly: 0,
      videoOnly: 0,
      mixed: 0,
    };
  }

  const stats = {
    total: dynamics.length,
    textOnly: 0,
    imageOnly: 0,
    videoOnly: 0,
    mixed: 0,
  };

  dynamics.forEach((dynamic) => {
    const type = getDynamicType(dynamic);
    if (type === 'text') stats.textOnly++;
    else if (type === 'image') stats.imageOnly++;
    else if (type === 'video') stats.videoOnly++;
    else if (type === 'mixed') stats.mixed++;
  });

  return stats;
}

/**
 * 统计文字、图片、视频总数
 * @param {Array} dynamics - 动态数据数组
 * @returns {Object} 统计结果
 */
export function calculateContentStats(dynamics) {
  if (!dynamics || dynamics.length === 0) {
    return {
      totalTextLength: 0,
      totalImages: 0,
      totalVideos: 0,
      avgTextLength: 0,
      textDynamicsCount: 0,
    };
  }

  let totalTextLength = 0;
  let textDynamicsCount = 0;
  let totalImages = 0;
  let totalVideos = 0;

  console.log('[calculateContentStats] 开始统计，动态总数:', dynamics.length);

  let videoDynamicsCount = 0;
  dynamics.forEach((dynamic, index) => {
    if (dynamic.text && dynamic.text.trim().length > 0) {
      totalTextLength += dynamic.text.trim().length;
      textDynamicsCount++;
    }
    if (dynamic.images) {
      totalImages += dynamic.images.length;
    }
    if (dynamic.videos) {
      const videoCount = dynamic.videos.length;
      totalVideos += videoCount;
      if (videoCount > 0) {
        videoDynamicsCount++;
        console.log(`[calculateContentStats] 找到视频动态 #${index}:`, {
          timestamp: dynamic.timestamp,
          videos: dynamic.videos,
          videoCount: videoCount
        });
      }
    } else {
      // 检查是否有其他可能的视频字段名
      if (dynamic.video || dynamic.videoList || dynamic.media?.videos) {
        console.warn(`[calculateContentStats] 动态 #${index} 可能有视频但字段名不同:`, dynamic);
      }
    }
  });

  console.log('[calculateContentStats] 统计结果:', {
    totalVideos,
    videoDynamicsCount,
    totalImages,
    totalTextLength
  });

  return {
    totalTextLength,
    totalImages,
    totalVideos,
    avgTextLength: textDynamicsCount > 0 ? Math.round(totalTextLength / textDynamicsCount) : 0,
    textDynamicsCount,
  };
}

/**
 * 获取所有有动态的日期（去重）
 * @param {Array} dynamics - 动态数据数组
 * @returns {Set} 日期集合（格式：YYYY-MM-DD）
 */
export function getActiveDates(dynamics) {
  const dates = new Set();

  if (!dynamics || dynamics.length === 0) {
    return dates;
  }

  dynamics.forEach((dynamic) => {
    if (dynamic.date) {
      dates.add(dynamic.date);
    }
  });

  return dates;
}

/**
 * 计算陪伴天数（有动态的唯一日期数）
 * @param {Array} dynamics - 动态数据数组
 * @returns {number} 陪伴天数
 */
export function calculateCompanionDays(dynamics) {
  return getActiveDates(dynamics).size;
}

/**
 * 计算最长连续发布天数
 * @param {Array} dynamics - 动态数据数组
 * @returns {number} 最长连续天数
 */
export function calculateLongestStreak(dynamics) {
  if (!dynamics || dynamics.length === 0) {
    return 0;
  }

  const dates = Array.from(getActiveDates(dynamics)).sort();

  if (dates.length === 0) {
    return 0;
  }

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);

    // 计算日期差（天）
    const diffTime = currDate - prevDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      // 连续的一天
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      // 不连续，重置
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * 统计月份发布数量（1-12月）
 * @param {Array} dynamics - 动态数据数组
 * @returns {Array} 12个月的统计数据 [{month: 1, count: 10}, ...]
 */
export function calculateMonthlyStats(dynamics) {
  const monthStats = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    count: 0,
  }));

  if (!dynamics || dynamics.length === 0) {
    return monthStats;
  }

  dynamics.forEach((dynamic) => {
    const date = new Date(dynamic.timestamp);
    const month = date.getMonth(); // 0-11
    monthStats[month].count++;
  });

  return monthStats;
}

/**
 * 统计24小时发布分布
 * @param {Array} dynamics - 动态数据数组
 * @returns {Array} 24小时的统计数据 [{hour: 0, count: 5}, ...]
 */
export function calculateHourlyStats(dynamics) {
  const hourStats = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: 0,
  }));

  if (!dynamics || dynamics.length === 0) {
    return hourStats;
  }

  dynamics.forEach((dynamic) => {
    if (dynamic.time) {
      const hour = parseInt(dynamic.time.split(':')[0], 10);
      if (hour >= 0 && hour < 24) {
        hourStats[hour].count++;
      }
    }
  });

  return hourStats;
}

/**
 * 获取最活跃的小时段
 * @param {Array} dynamics - 动态数据数组
 * @returns {Object} {hour: 14, count: 50, percentage: 15.5}
 */
export function getMostActiveHour(dynamics) {
  const hourStats = calculateHourlyStats(dynamics);
  const maxStat = hourStats.reduce((max, stat) => (stat.count > max.count ? stat : max), hourStats[0]);

  return {
    hour: maxStat.hour,
    count: maxStat.count,
    percentage: dynamics.length > 0 ? parseFloat(((maxStat.count / dynamics.length) * 100).toFixed(1)) : 0,
  };
}

/**
 * 统计星期分布（0=周日, 1=周一, ..., 6=周六）
 * @param {Array} dynamics - 动态数据数组
 * @returns {Array} 7天的统计数据 [{day: 0, dayName: '周日', count: 10}, ...]
 */
export function calculateWeekdayStats(dynamics) {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekStats = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    dayName: dayNames[i],
    count: 0,
  }));

  if (!dynamics || dynamics.length === 0) {
    return weekStats;
  }

  dynamics.forEach((dynamic) => {
    const date = new Date(dynamic.timestamp);
    const day = date.getDay(); // 0-6
    weekStats[day].count++;
  });

  return weekStats;
}

/**
 * 获取最活跃的星期
 * @param {Array} dynamics - 动态数据数组
 * @returns {Object} {day: 1, dayName: '周一', count: 100}
 */
export function getMostActiveWeekday(dynamics) {
  const weekStats = calculateWeekdayStats(dynamics);
  const maxStat = weekStats.reduce((max, stat) => (stat.count > max.count ? stat : max), weekStats[0]);

  return {
    day: maxStat.day,
    dayName: maxStat.dayName,
    count: maxStat.count,
    percentage: dynamics.length > 0 ? parseFloat(((maxStat.count / dynamics.length) * 100).toFixed(1)) : 0,
  };
}

/**
 * 统计深夜动态（23:00-05:00）
 * @param {Array} dynamics - 动态数据数组
 * @returns {Object} {count: 50, percentage: 15.5}
 */
export function calculateLateNightStats(dynamics) {
  if (!dynamics || dynamics.length === 0) {
    return { count: 0, percentage: 0 };
  }

  let lateNightCount = 0;

  dynamics.forEach((dynamic) => {
    if (dynamic.time) {
      const hour = parseInt(dynamic.time.split(':')[0], 10);
      // 23:00-23:59 或 00:00-05:59
      if (hour >= 23 || hour < 5) {
        lateNightCount++;
      }
    }
  });

  return {
    count: lateNightCount,
    percentage: ((lateNightCount / dynamics.length) * 100).toFixed(1),
  };
}

/**
 * 获取最活跃的月份
 * @param {Array} dynamics - 动态数据数组
 * @returns {Object} {month: 8, monthName: '8月', count: 120}
 */
export function getMostActiveMonth(dynamics) {
  const monthStats = calculateMonthlyStats(dynamics);
  const maxStat = monthStats.reduce((max, stat) => (stat.count > max.count ? stat : max), monthStats[0]);

  return {
    month: maxStat.month,
    monthName: `${maxStat.month}月`,
    count: maxStat.count,
    percentage: dynamics.length > 0 ? ((maxStat.count / dynamics.length) * 100).toFixed(1) : 0,
  };
}

/**
 * 计算从第一条动态到 2025.12.31 的天数
 * @param {Array} dynamics - 动态数据数组
 * @returns {number} 天数
 */
export function calculateDaysUntilEnd(dynamics) {
  if (!dynamics || dynamics.length === 0) {
    return 0;
  }

  // 找出最早的动态
  const earliestDynamic = dynamics.reduce((earliest, dynamic) => {
    const currentDate = new Date(dynamic.timestamp);
    const earliestDate = new Date(earliest.timestamp);
    return currentDate < earliestDate ? dynamic : earliest;
  }, dynamics[0]);

  const startDate = new Date(earliestDynamic.timestamp);
  const endDate = new Date('2025-12-31T23:59:59');

  const diffTime = endDate - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * 获取第一条动态的日期
 * @param {Array} dynamics - 动态数据数组
 * @returns {string} 日期字符串（YYYY年MM月DD日）
 */
export function getFirstDynamicDate(dynamics) {
  if (!dynamics || dynamics.length === 0) {
    return '';
  }

  const earliestDynamic = dynamics.reduce((earliest, dynamic) => {
    const currentDate = new Date(dynamic.timestamp);
    const earliestDate = new Date(earliest.timestamp);
    return currentDate < earliestDate ? dynamic : earliest;
  }, dynamics[0]);

  const date = new Date(earliestDynamic.timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}年${month}月${day}日`;
}

/**
 * 计算第一次相遇的信息（从第一条动态到现在）
 * @param {Array} dynamics - 动态数据数组
 * @returns {Object} { firstDate: string, daysPassed: number, yearsPassed: number }
 */
export function calculateFirstMeetingInfo(dynamics) {
  if (!dynamics || dynamics.length === 0) {
    return {
      firstDate: '',
      daysPassed: 0,
      yearsPassed: 0,
    };
  }

  // 找出最早的动态
  const earliestDynamic = dynamics.reduce((earliest, dynamic) => {
    const currentDate = new Date(dynamic.timestamp);
    const earliestDate = new Date(earliest.timestamp);
    return currentDate < earliestDate ? dynamic : earliest;
  }, dynamics[0]);

  const firstDate = new Date(earliestDynamic.timestamp);
  const now = new Date('2025-12-31T23:59:59'); // 使用报告结束日期作为现在

  // 计算天数差
  const diffTime = now - firstDate;
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 计算年份（保留一位小数）
  const yearsPassed = (daysPassed / 365).toFixed(1);

  // 格式化日期
  const year = firstDate.getFullYear();
  const month = String(firstDate.getMonth() + 1).padStart(2, '0');
  const day = String(firstDate.getDate()).padStart(2, '0');
  const formattedDate = `${year}年${month}月${day}日`;

  return {
    firstDate: formattedDate,
    daysPassed,
    yearsPassed: parseFloat(yearsPassed),
  };
}

/**
 * 计算平均每天发布动态数
 * @param {Array} dynamics - 动态数据数组
 * @returns {number} 平均值（保留1位小数）
 */
export function calculateAvgDynamicsPerDay(dynamics) {
  if (!dynamics || dynamics.length === 0) {
    return 0;
  }

  const activeDays = calculateCompanionDays(dynamics);
  if (activeDays === 0) {
    return 0;
  }

  return (dynamics.length / activeDays).toFixed(1);
}

/**
 * 按四季分组动态
 * @param {Array} dynamics - 动态数据数组
 * @returns {Object} {spring: [], summer: [], autumn: [], winter: []}
 */
export function groupDynamicsBySeason(dynamics) {
  const seasons = {
    spring: [], // 春季：3-5月
    summer: [], // 夏季：6-8月
    autumn: [], // 秋季：9-11月
    winter: [], // 冬季：12-2月
  };

  if (!dynamics || dynamics.length === 0) {
    return seasons;
  }

  dynamics.forEach((dynamic) => {
    const date = new Date(dynamic.timestamp);
    const month = date.getMonth() + 1; // 1-12

    if (month >= 3 && month <= 5) {
      seasons.spring.push(dynamic);
    } else if (month >= 6 && month <= 8) {
      seasons.summer.push(dynamic);
    } else if (month >= 9 && month <= 11) {
      seasons.autumn.push(dynamic);
    } else {
      // 12, 1, 2月
      seasons.winter.push(dynamic);
    }
  });

  return seasons;
}

/**
 * 获取完整的年度报告统计数据
 * @param {Array} dynamics - 动态数据数组
 * @param {number|null} year - 年份，null 表示全部数据
 * @returns {Object} 完整的统计数据
 */
export function generateAnnualReport(dynamics, year = null) {
  console.log('[generateAnnualReport] 开始生成报告:', {
    totalDynamics: dynamics?.length,
    year,
    sampleDynamic: dynamics?.[0]
  });

  // 过滤数据
  const filteredDynamics = filterDynamicsByYear(dynamics, year);

  console.log('[generateAnnualReport] 过滤后的动态数:', filteredDynamics.length);

  // 检查原始数据中的视频
  const allVideos = dynamics?.reduce((count, d) => {
    return count + (d.videos?.length || 0);
  }, 0);
  console.log('[generateAnnualReport] 原始数据中的视频总数:', allVideos);

  // 检查过滤后数据中的视频
  const filteredVideos = filteredDynamics.reduce((count, d) => {
    return count + (d.videos?.length || 0);
  }, 0);
  console.log('[generateAnnualReport] 过滤后的视频总数:', filteredVideos);

  // 基础统计
  const dynamicStats = calculateDynamicStats(filteredDynamics);
  const contentStats = calculateContentStats(filteredDynamics);

  // 时间统计
  const companionDays = calculateCompanionDays(filteredDynamics);
  const longestStreak = calculateLongestStreak(filteredDynamics);
  const monthlyStats = calculateMonthlyStats(filteredDynamics);
  const hourlyStats = calculateHourlyStats(filteredDynamics);
  const weekdayStats = calculateWeekdayStats(filteredDynamics);

  // 活跃度统计
  const mostActiveHour = getMostActiveHour(filteredDynamics);
  const mostActiveWeekday = getMostActiveWeekday(filteredDynamics);
  const mostActiveMonth = getMostActiveMonth(filteredDynamics);
  const lateNightStats = calculateLateNightStats(filteredDynamics);

  // 关键时间节点
  const daysUntilEnd = calculateDaysUntilEnd(filteredDynamics); // 使用过滤后的数据
  const firstDynamicDate = getFirstDynamicDate(filteredDynamics); // 使用过滤后的数据
  const firstMeetingInfo = calculateFirstMeetingInfo(filteredDynamics); // 第一次相遇信息（使用过滤后的数据）
  const avgDynamicsPerDay = calculateAvgDynamicsPerDay(filteredDynamics);

  // 四季分组
  const seasonalDynamics = groupDynamicsBySeason(filteredDynamics);

  // 新增：个性化标签
  const userTags = calculateUserTags(filteredDynamics, hourlyStats, weekdayStats, dynamicStats, contentStats);

  // 新增：成就徽章
  const achievements = calculateAchievements(filteredDynamics, companionDays, longestStreak, contentStats);

  // 新增：时段分析
  const timePeriods = calculateTimePeriods(hourlyStats);

  // 新增：突破性记录
  const records = calculateRecords(filteredDynamics);

  // 新增：第一条动态（根据过滤后的数据）
  const firstDynamic = getFirstDynamic(filteredDynamics);

  // 新增：最后一条动态（根据过滤后的数据，2025.12.31之前）
  const lastDynamic = getLastDynamic(filteredDynamics);

  // 新增：数字故事文案
  const storyText = generateStoryText(contentStats, companionDays);

  // 新增：温暖文案生成
  const coverText = generateCoverText(filteredDynamics.length, companionDays, year, year === null);
  const statisticsText = generateStatisticsText(dynamicStats, contentStats, filteredDynamics.length, avgDynamicsPerDay, filteredDynamics);
  const timeDistributionText = generateTimeDistributionText(mostActiveHour, lateNightStats, userTags);
  const calendarText = generateCalendarText(companionDays, longestStreak, mostActiveWeekday, year, filteredDynamics, monthlyStats);
  const highlightsText = generateHighlightsText(records);
  const monthlyReviewText = generateMonthlyReviewText(monthlyStats, year, year === null);

  return {
    // 基础信息
    year,
    isFullReport: year === null,
    totalDynamics: filteredDynamics.length,

    // 动态类型统计
    dynamicStats,

    // 内容统计
    contentStats,

    // 时间统计
    companionDays,
    longestStreak,
    monthlyStats,
    hourlyStats,
    weekdayStats,

    // 活跃度统计
    mostActiveHour,
    mostActiveWeekday,
    mostActiveMonth,
    lateNightStats,
    avgDynamicsPerDay,

    // 关键时间节点
    daysUntilEnd,
    firstDynamicDate,
    firstMeetingInfo,

    // 四季分组数据
    seasonalDynamics,

    // 新增数据
    userTags,
    achievements,
    timePeriods,
    records,
    firstDynamic,
    lastDynamic,
    storyText,

    // 温暖文案
    coverText,
    statisticsText,
    timeDistributionText,
    calendarText,
    highlightsText,
    monthlyReviewText,

    // 原始数据（供词云等功能使用）
    dynamics: filteredDynamics,
  };
}

/**
 * 计算个性化标签
 */
export function calculateUserTags(dynamics, hourlyStats, weekdayStats, dynamicStats, contentStats) {
  const tags = [];

  if (!dynamics || dynamics.length === 0) return tags;

  const total = dynamics.length;

  // 深夜发布者 (23:00-5:00 占比超过25%)
  const lateNightCount = hourlyStats.slice(23).concat(hourlyStats.slice(0, 6)).reduce((sum, stat) => sum + stat.count, 0);
  const lateNightRatio = lateNightCount / total;
  if (lateNightRatio > 0.25) {
    tags.push({
      icon: '🌙',
      title: '深夜的文字家',
      description: '深夜的文字，总是格外真诚'
    });
  }

  // 早起记录者 (6:00-9:00 占比超过20%)
  const morningCount = hourlyStats.slice(6, 9).reduce((sum, stat) => sum + stat.count, 0);
  const morningRatio = morningCount / total;
  if (morningRatio > 0.2) {
    tags.push({
      icon: '🌅',
      title: '晨光记录者',
      description: '清晨的记录者，比太阳起得更早'
    });
  }

  // 图片爱好者 (图片动态占比超过40%)
  const imageRatio = (dynamicStats.imageOnly + dynamicStats.mixed * 0.5) / total;
  if (imageRatio > 0.4) {
    tags.push({
      icon: '📸',
      title: '镜头记录者',
      description: '用镜头记录生活的美好'
    });
  }

  // 文字创作者 (平均字数超过100)
  if (contentStats.avgTextLength > 100) {
    tags.push({
      icon: '✍️',
      title: '文字编织者',
      description: '字里行间，藏着你的小世界'
    });
  }

  // 视频记录者 (视频动态占比超过15%)
  const videoRatio = (dynamicStats.videoOnly + dynamicStats.mixed * 0.3) / total;
  if (videoRatio > 0.15) {
    tags.push({
      icon: '🎬',
      title: '影像故事家',
      description: '镜头下的故事，有声有色'
    });
  }

  // 周末生活家 (周末发布占比超过40%)
  const weekendCount = weekdayStats[0].count + weekdayStats[6].count; // 周日 + 周六
  const weekendRatio = weekendCount / total;
  if (weekendRatio > 0.4) {
    tags.push({
      icon: '📅',
      title: '周末生活家',
      description: '周末是你与自己相处的时光'
    });
  }

  // 返回最多5个标签
  return tags.slice(0, 5);
}

/**
 * 计算成就徽章
 */
export function calculateAchievements(dynamics, companionDays, longestStreak, contentStats) {
  const achievements = [];

  if (!dynamics || dynamics.length === 0) return achievements;

  const totalDynamics = dynamics.length;

  // ========== 坚持类成就 ==========

  // 马拉松选手 - 连续30天以上
  if (longestStreak >= 30) {
    achievements.push({
      icon: '🏃',
      title: '马拉松选手',
      description: `连续 ${longestStreak} 天记录，这份坚持令人敬佩`
    });
  } else if (longestStreak >= 7) {
    // 坚持的力量 - 连续7天以上
    achievements.push({
      icon: '🏆',
      title: '坚持的力量',
      description: `连续 ${longestStreak} 天记录，你做到了`
    });
  }

  // 时间旅行者 - 记录时间跨度超过365天
  if (dynamics.length > 0) {
    const timestamps = dynamics.map(d => new Date(d.timestamp).getTime());
    const timeSpan = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24);
    if (timeSpan >= 365) {
      const years = Math.floor(timeSpan / 365);
      achievements.push({
        icon: '⏰',
        title: '时间旅行者',
        description: `记录跨越了 ${years} 年时光，见证了岁月流转`
      });
    }
  }

  // 时光的见证者 - 12个月都有记录
  const months = new Set(dynamics.map(d => new Date(d.timestamp).getMonth()));
  if (months.size === 12) {
    achievements.push({
      icon: '🌟',
      title: '时光的见证者',
      description: '12个月都有你的身影，四季轮回中不曾缺席'
    });
  }

  // ========== 数量类成就 ==========

  // 记录大师 - 总动态数超过500
  if (totalDynamics >= 500) {
    achievements.push({
      icon: '👑',
      title: '记录大师',
      description: `${totalDynamics} 条动态，你是生活的记录大师`
    });
  } else if (totalDynamics >= 200) {
    // 记录达人 - 总动态数超过200
    achievements.push({
      icon: '🎨',
      title: '记录达人',
      description: `${totalDynamics} 条动态，每一条都是珍贵的回忆`
    });
  } else if (totalDynamics >= 100) {
    // 记录的足迹 - 总动态数超过100
    achievements.push({
      icon: '✨',
      title: '记录的足迹',
      description: `${totalDynamics} 条动态，见证了你的每一刻`
    });
  }

  // 高产作家 - 有单日发布超过5条的记录
  const dailyCount = {};
  dynamics.forEach(d => {
    const date = d.date;
    dailyCount[date] = (dailyCount[date] || 0) + 1;
  });
  const maxDailyCount = Math.max(...Object.values(dailyCount));
  if (maxDailyCount >= 5) {
    achievements.push({
      icon: '✍️',
      title: '高产作家',
      description: `单日最多发布了 ${maxDailyCount} 条，那天一定有很多故事`
    });
  }

  // ========== 内容类成就 ==========

  // 长篇巨著 - 有超过1000字的文章
  const hasVeryLongText = dynamics.some(d => d.text && d.text.length > 1000);
  if (hasVeryLongText) {
    const maxLength = Math.max(...dynamics.filter(d => d.text).map(d => d.text.length));
    achievements.push({
      icon: '📚',
      title: '长篇巨著',
      description: `你写下过 ${maxLength} 字的长文，那是最深的思考`
    });
  } else if (dynamics.some(d => d.text && d.text.length > 500)) {
    // 文字的深度 - 有超过500字的长文
    const maxLength = Math.max(...dynamics.filter(d => d.text).map(d => d.text.length));
    achievements.push({
      icon: '📖',
      title: '文字的深度',
      description: `你写下过 ${maxLength} 字的长文，文字是你的朋友`
    });
  }

  // 全能记录者 - 文字、图片、视频都有
  const hasText = dynamics.some(d => d.text && d.text.trim().length > 0);
  const hasImages = contentStats.totalImages > 0;
  const hasVideos = contentStats.totalVideos > 0;
  if (hasText && hasImages && hasVideos) {
    achievements.push({
      icon: '🎯',
      title: '全能记录者',
      description: '文字、图片、视频样样精通，记录方式多姿多彩'
    });
  }

  // 镜头里的世界 - 图片超过50张
  if (contentStats.totalImages >= 100) {
    achievements.push({
      icon: '📸',
      title: '镜头里的世界',
      description: `${contentStats.totalImages} 张照片，你用镜头定格了无数美好瞬间`
    });
  } else if (contentStats.totalImages >= 50) {
    achievements.push({
      icon: '📷',
      title: '摄影爱好者',
      description: `${contentStats.totalImages} 张照片，每一张都值得珍藏`
    });
  }

  // 影像的故事 - 视频超过10个
  if (contentStats.totalVideos >= 10) {
    achievements.push({
      icon: '🎬',
      title: '影像的故事',
      description: `${contentStats.totalVideos} 个视频，记录了流动的时光`
    });
  }

  // 图文大师 - 图文结合动态占比超过40%
  const mixedCount = dynamics.filter(d => {
    const hasText = d.text && d.text.trim().length > 0;
    const hasMedia = (d.images && d.images.length > 0) || (d.videos && d.videos.length > 0);
    return hasText && hasMedia;
  }).length;
  if (mixedCount / totalDynamics >= 0.4) {
    achievements.push({
      icon: '🖼️',
      title: '图文大师',
      description: '你善于用图文结合的方式记录，每一条都是精心编排'
    });
  }

  // ========== 时间类成就 ==========

  // 早起的鸟儿 - 早上5-7点发布过动态
  const earlyMorningCount = dynamics.filter(d => {
    if (!d.time) return false;
    const hour = parseInt(d.time.split(':')[0], 10);
    return hour >= 5 && hour < 7;
  }).length;
  if (earlyMorningCount >= 5) {
    achievements.push({
      icon: '🌅',
      title: '早起的鸟儿',
      description: `清晨 5-7 点发布过 ${earlyMorningCount} 条动态，你是晨光的见证者`
    });
  }

  // 深夜诗人 - 深夜（23-5点）发布超过10条
  const lateNightCount = dynamics.filter(d => {
    if (!d.time) return false;
    const hour = parseInt(d.time.split(':')[0], 10);
    return hour >= 23 || hour < 5;
  }).length;
  if (lateNightCount >= 10) {
    achievements.push({
      icon: '🌙',
      title: '深夜诗人',
      description: `深夜时分发布过 ${lateNightCount} 条动态，那些安静的时光属于你`
    });
  }

  // 午后时光 - 下午14-17点最活跃
  const afternoonCount = dynamics.filter(d => {
    if (!d.time) return false;
    const hour = parseInt(d.time.split(':')[0], 10);
    return hour >= 14 && hour < 17;
  }).length;
  if (afternoonCount / totalDynamics >= 0.3) {
    achievements.push({
      icon: '☕',
      title: '午后时光',
      description: '下午是你最活跃的时段，午后的阳光伴你记录'
    });
  }

  // 周末时光 - 周末动态超过总数的30%
  const weekendCount = dynamics.filter(d => {
    const date = new Date(d.timestamp);
    const day = date.getDay();
    return day === 0 || day === 6;
  }).length;
  if (weekendCount / totalDynamics >= 0.3) {
    achievements.push({
      icon: '☀️',
      title: '周末时光',
      description: '周末是你记录生活的黄金时间，休闲中不忘留下足迹'
    });
  }

  // 夜猫子 - 晚上22点后动态超过30%
  const nightCount = dynamics.filter(d => {
    if (!d.time) return false;
    const hour = parseInt(d.time.split(':')[0], 10);
    return hour >= 22;
  }).length;
  if (nightCount / totalDynamics >= 0.3) {
    achievements.push({
      icon: '🦉',
      title: '夜猫子',
      description: '深夜才是你的主场，夜晚让思绪更加自由'
    });
  }

  return achievements;
}

/**
 * 计算四时段数据
 */
export function calculateTimePeriods(hourlyStats) {
  const morning = { name: '晨光时分', time: '6:00-12:00', emoji: '🌅', count: 0 };
  const afternoon = { name: '午后时光', time: '12:00-18:00', emoji: '☀️', count: 0 };
  const evening = { name: '夜幕降临', time: '18:00-24:00', emoji: '🌙', count: 0 };
  const night = { name: '静谧深夜', time: '0:00-6:00', emoji: '🌃', count: 0 };

  hourlyStats.forEach((stat, hour) => {
    if (hour >= 6 && hour < 12) {
      morning.count += stat.count;
    } else if (hour >= 12 && hour < 18) {
      afternoon.count += stat.count;
    } else if (hour >= 18 && hour < 24) {
      evening.count += stat.count;
    } else {
      night.count += stat.count;
    }
  });

  const total = morning.count + afternoon.count + evening.count + night.count;

  morning.percentage = total > 0 ? ((morning.count / total) * 100).toFixed(1) : 0;
  afternoon.percentage = total > 0 ? ((afternoon.count / total) * 100).toFixed(1) : 0;
  evening.percentage = total > 0 ? ((evening.count / total) * 100).toFixed(1) : 0;
  night.percentage = total > 0 ? ((night.count / total) * 100).toFixed(1) : 0;

  return [morning, afternoon, evening, night];
}

/**
 * 计算突破性记录
 */
export function calculateRecords(dynamics) {
  if (!dynamics || dynamics.length === 0) {
    return {
      maxDailyCount: { count: 0, date: '' },
      maxTextLength: { length: 0, date: '' },
      longestGap: { days: 0, start: '', end: '' }
    };
  }

  // 单日最多记录
  const dailyCount = {};
  dynamics.forEach(d => {
    const date = d.date;
    dailyCount[date] = (dailyCount[date] || 0) + 1;
  });
  const maxDaily = Object.entries(dailyCount).sort((a, b) => b[1] - a[1])[0];
  const maxDailyCount = { count: maxDaily[1], date: maxDaily[0] };

  // 最长文字
  const textsWithDate = dynamics.filter(d => d.text).map(d => ({ length: d.text.length, date: d.date }));
  const maxText = textsWithDate.sort((a, b) => b.length - a.length)[0] || { length: 0, date: '' };
  const maxTextLength = maxText;

  // 最长空档期
  const sortedDates = [...new Set(dynamics.map(d => d.date))].sort();
  let maxGap = 0;
  let gapStart = '';
  let gapEnd = '';

  for (let i = 1; i < sortedDates.length; i++) {
    const date1 = new Date(sortedDates[i - 1]);
    const date2 = new Date(sortedDates[i]);
    const gap = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));

    if (gap > maxGap) {
      maxGap = gap;
      gapStart = sortedDates[i - 1];
      gapEnd = sortedDates[i];
    }
  }

  const longestGap = { days: maxGap, start: gapStart, end: gapEnd };

  return {
    maxDailyCount,
    maxTextLength,
    longestGap
  };
}

/**
 * 获取第一条动态
 */
export function getFirstDynamic(dynamics) {
  if (!dynamics || dynamics.length === 0) return null;

  const sorted = [...dynamics].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const first = sorted[0];

  // 计算距今天数
  const firstDate = new Date(first.timestamp);
  const now = new Date();
  const daysPassed = Math.floor((now - firstDate) / (1000 * 60 * 60 * 24));

  return {
    ...first,
    daysPassed,
    preview: first.text ? (first.text.length > 200 ? first.text.substring(0, 200) + '...' : first.text) : ''
  };
}

/**
 * 获取最后一条动态（2025.12.31之前）
 */
export function getLastDynamic(dynamics) {
  if (!dynamics || dynamics.length === 0) return null;

  const endDate = new Date('2025-12-31T23:59:59');

  // 过滤出2025.12.31之前的动态，然后按时间排序
  const filtered = dynamics.filter(d => {
    const date = new Date(d.timestamp);
    return date <= endDate;
  });

  if (filtered.length === 0) return null;

  const sorted = [...filtered].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const last = sorted[0];

  // 计算距今天数
  const lastDate = new Date(last.timestamp);
  const now = new Date();
  const daysPassed = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

  return {
    ...last,
    daysPassed,
    preview: last.text ? (last.text.length > 200 ? last.text.substring(0, 200) + '...' : last.text) : ''
  };
}

/**
 * 生成数字故事文案
 */
export function generateStoryText(contentStats, companionDays) {
  const texts = [];

  // 文字量故事
  const totalWords = contentStats.totalTextLength;
  if (totalWords < 50000) {
    texts.push({
      text: `你写下的文字，是一个中篇故事的长度`
    });
  } else if (totalWords < 100000) {
    texts.push({
      text: `你写下的文字，足够写一本小说了`
    });
  } else if (totalWords < 200000) {
    texts.push({
      text: `你写下的文字，可以出版两本书`
    });
  } else {
    texts.push({
      text: `你写下的文字，是一座文字的宝库`
    });
  }

  // 照片量故事
  const totalImages = contentStats.totalImages;
  if (totalImages > 0) {
    if (totalImages < 30) {
      texts.push({
        text: `你用镜头记录的瞬间，每一张都珍贵`
      });
    } else if (totalImages < 100) {
      texts.push({
        text: `你的照片，足够办一场小型摄影展`
      });
    } else if (totalImages < 300) {
      texts.push({
        text: `你用镜头，记录了生活的方方面面`
      });
    } else {
      texts.push({
        text: `你是生活的摄影师，镜头从未停歇`
      });
    }
  }

  // 时间占比故事
  const yearDays = 365;
  const ratio = (companionDays / yearDays) * 100;

  if (ratio < 10) {
    texts.push({
      text: `偶尔的记录，像星星点点的光`
    });
  } else if (ratio < 30) {
    texts.push({
      text: `每个月，都有你的足迹`
    });
  } else if (ratio < 50) {
    texts.push({
      text: `一年中，有三分之一的日子被你点亮`
    });
  } else if (ratio < 70) {
    texts.push({
      text: `大半年的时光，都有你的陪伴`
    });
  } else {
    texts.push({
      text: `几乎每天，你都在记录生活`
    });
  }

  return texts;
}

/**
 * 根据时间段获取场景描述
 * @param {number} hour - 小时（0-23）
 * @returns {string} 场景描述
 */
export function getTimePeriodDescription(hour) {
  if (hour >= 1 && hour < 6) {
    return "深夜时分，当世界安静下来";
  } else if (hour >= 6 && hour < 9) {
    return "清晨醒来，新的一天开始";
  } else if (hour >= 9 && hour < 12) {
    return "上午时光，忙碌中抽空";
  } else if (hour >= 12 && hour < 14) {
    return "午间休息，片刻的宁静";
  } else if (hour >= 14 && hour < 18) {
    return "午后时光";
  } else if (hour >= 18 && hour < 20) {
    return "傍晚时分，一天的疲惫渐渐散去";
  } else if (hour >= 20 && hour < 23) {
    return "夜晚来临";
  } else {
    return "夜深了";
  }
}

/**
 * 生成封面页文案
 * @param {number} totalDynamics - 总动态数
 * @param {number} companionDays - 陪伴天数
 * @param {number|null} year - 年份
 * @param {boolean} isFullReport - 是否全部数据报告
 * @returns {Object} 封面文案对象
 */
export function generateCoverText(totalDynamics, companionDays, year, isFullReport) {
  if (isFullReport) {
    return {
      mainText: `留下了${totalDynamics}个瞬间`,
      subText: `有${companionDays}天，你都来到了这里，记录着生活的点点滴滴`,
    };
  } else {
    return {
      mainText: `留下了${totalDynamics}个瞬间`,
      subText: `有${companionDays}天，你都在记录生活，每一笔都是温柔的时光`,
    };
  }
}

/**
 * 生成统计页文案
 * @param {Object} dynamicStats - 动态类型统计
 * @param {Object} contentStats - 内容统计
 * @param {number} totalDynamics - 总动态数
 * @param {number} avgDynamicsPerDay - 平均每天动态数
 * @param {Array} dynamics - 动态数据（用于检查成就）
 * @returns {Object} 统计页文案对象
 */
export function generateStatisticsText(dynamicStats, contentStats, totalDynamics, avgDynamicsPerDay, dynamics = []) {
  const texts = [];

  // 总动态数描述 + 记录的足迹成就
  if (totalDynamics >= 100) {
    texts.push({
      type: 'main',
      text: `这一年，你在这里留下了${totalDynamics}个瞬间，见证了每一刻的珍贵`,
    });
  } else {
    texts.push({
      type: 'main',
      text: `这一年，你在这里留下了${totalDynamics}个瞬间`,
    });
  }

  // 动态类型描述
  const typeDescriptions = [];
  if (dynamicStats.textOnly > 0) {
    typeDescriptions.push(`${dynamicStats.textOnly}条是纯文字`);
  }
  if (dynamicStats.mixed > 0) {
    typeDescriptions.push(`${dynamicStats.mixed}条图文并茂`);
  }
  if (dynamicStats.imageOnly > 0) {
    typeDescriptions.push(`${dynamicStats.imageOnly}条是图片`);
  }
  if (dynamicStats.videoOnly > 0) {
    typeDescriptions.push(`${dynamicStats.videoOnly}条是视频`);
  }

  if (typeDescriptions.length > 0) {
    texts.push({
      type: 'normal',
      text: `其中${typeDescriptions.join('，')}`,
    });
  }

  // 文字量描述 + 文字的深度成就
  if (contentStats.totalTextLength > 0) {
    const avgLength = Math.round(contentStats.avgTextLength);
    const hasLongText = dynamics.some(d => d.text && d.text.length > 500);

    if (hasLongText) {
      const maxLength = Math.max(...dynamics.filter(d => d.text).map(d => d.text.length));
      texts.push({
        type: 'normal',
        text: `你写下了${contentStats.totalTextLength.toLocaleString()}个字，平均每条${avgLength}字。你写下过${maxLength}字的长文，那是最深的思考`,
      });
    } else {
      texts.push({
        type: 'normal',
        text: `你写下了${contentStats.totalTextLength.toLocaleString()}个字，平均每条${avgLength}字，就像在写一本属于自己的书`,
      });
    }
  }

  // 图片描述 + 镜头里的世界成就
  if (contentStats.totalImages > 0) {
    if (contentStats.totalImages >= 50) {
      texts.push({
        type: 'normal',
        text: `你用镜头记录了${contentStats.totalImages}个瞬间，定格了那些美好的时光`,
      });
    } else {
      texts.push({
        type: 'normal',
        text: `你用镜头记录了${contentStats.totalImages}个瞬间，每一张都珍贵`,
      });
    }
  }

  // 视频描述 + 影像的故事成就
  if (contentStats.totalVideos > 0) {
    if (contentStats.totalVideos >= 10) {
      texts.push({
        type: 'normal',
        text: `${contentStats.totalVideos}个视频，记录了流动的时光`,
      });
    }
  }

  // 平均记录描述
  if (avgDynamicsPerDay && avgDynamicsPerDay > 0) {
    const avgRounded = typeof avgDynamicsPerDay === 'number'
      ? avgDynamicsPerDay.toFixed(1)
      : avgDynamicsPerDay;
    texts.push({
      type: 'normal',
      text: `平均每天${avgRounded}次记录，生活的点滴都被你细心收藏`,
    });
  }

  return texts;
}

/**
 * 生成时间分布页文案
 * @param {Object} mostActiveHour - 最活跃时段
 * @param {Object} lateNightStats - 深夜统计
 * @param {Array} userTags - 用户标签（用于判断是否深夜文字家）
 * @returns {Object} 时间分布页文案对象
 */
export function generateTimeDistributionText(mostActiveHour, lateNightStats, userTags = []) {
  const texts = [];

  // 最活跃时段描述
  const hour = mostActiveHour.hour;
  const nextHour = hour + 1;
  const timePeriod = getTimePeriodDescription(hour);
  const hourText = `${hour}:00-${nextHour}:00`;

  // 判断是否是深夜文字家
  const isLateNightWriter = userTags.some(tag => tag.title === '深夜文字家');

  let mainText = '';
  if (hour >= 1 && hour < 6) {
    if (isLateNightWriter) {
      mainText = `你最爱凌晨发布动态。${hourText}是你最活跃的时候，深夜时分，当世界安静下来，你在这里记录着那些白天来不及说的话。夜深人静时，总是真诚的`;
    } else {
      mainText = `你最爱凌晨发布动态。${hourText}是你最活跃的时候，${timePeriod}，你在这里记录着那些白天来不及说的话`;
    }
  } else if (hour >= 6 && hour < 9) {
    mainText = `你最爱清晨发布动态。${hourText}是你最活跃的时候，${timePeriod}，你习惯在这里开始新的一天`;
  } else if (hour >= 9 && hour < 12) {
    mainText = `你最爱上午发布动态。${hourText}是你最活跃的时候，${timePeriod}，你在这里记录着忙碌中的片刻`;
  } else if (hour >= 12 && hour < 14) {
    mainText = `你最爱午间发布动态。${hourText}是你最活跃的时候，${timePeriod}，你在这里享受着片刻的宁静`;
  } else if (hour >= 14 && hour < 18) {
    mainText = `你最爱下午发布动态。${hourText}是你最活跃的时候，手边的咖啡蓄满了忙碌，但此刻你学会在这里放个空`;
  } else if (hour >= 18 && hour < 20) {
    mainText = `你最爱傍晚发布动态。${hourText}是你最活跃的时候，${timePeriod}，你在这里记录着一天的结束`;
  } else if (hour >= 20 && hour < 23) {
    mainText = `你最爱晚上发布动态。${hourText}是你最活跃的时候，${timePeriod}，你在这里整理着一天的思绪`;
  } else {
    if (isLateNightWriter) {
      mainText = `你最爱深夜发布动态。${hourText}是你最活跃的时候，夜深了，你还在记录着。夜深人静时，总是真诚的`;
    } else {
      mainText = `你最爱深夜发布动态。${hourText}是你最活跃的时候，${timePeriod}，你还在记录着`;
    }
  }

  texts.push({
    type: 'main',
    text: mainText,
  });

  // 深夜时光描述（如果不是最活跃时段在深夜，才额外提及）
  if (lateNightStats.count > 0 && !(hour >= 23 || hour < 6)) {
    texts.push({
      type: 'normal',
      text: `深夜时光（23:00-05:00），你有${lateNightStats.count}次记录，那些安静的夜晚，你都在这里`,
    });
  }

  return texts;
}

/**
 * 生成日历页文案
 * @param {number} companionDays - 陪伴天数
 * @param {number} longestStreak - 最长连续天数
 * @param {Object} mostActiveWeekday - 最活跃星期
 * @param {number|null} year - 年份
 * @param {Array} dynamics - 动态数据（用于检查12个月成就）
 * @param {Array} monthlyStats - 月度统计数据
 * @returns {Object} 日历页文案对象
 */
export function generateCalendarText(companionDays, longestStreak, mostActiveWeekday, year, dynamics = [], monthlyStats = []) {
  const texts = [];

  // 陪伴天数描述
  let mainText = '';
  if (year) {
    mainText = `今年你${companionDays}天都在这里记录生活`;
  } else {
    mainText = `这些年，你${companionDays}天都在这里记录生活`;
  }

  // 连续记录描述 + 坚持的力量成就
  if (longestStreak >= 7) {
    mainText += `，最长连续${longestStreak}天，你做到了`;
  } else {
    mainText += `，你的最长连续记录是${longestStreak}天`;
  }

  // 成就描述
  if (companionDays >= 300) {
    mainText += `。300天以上都在记录，恭喜你荣获「记录全勤奖」！`;
  } else if (companionDays >= 200) {
    mainText += `。这一年，你几乎每天都在记录，是真正的记录达人`;
  } else if (companionDays >= 100) {
    mainText += `。这一年，你有一半以上的日子都在记录，生活被你用心地保存下来`;
  } else if (companionDays >= 50) {
    mainText += `。这一年，你用心记录着生活的点点滴滴`;
  } else {
    mainText += `。偶尔的记录，像星星点点的光，照亮了这一年`;
  }

  // 时光的见证者成就 (12个月都有记录)
  const months = new Set(dynamics.map(d => new Date(d.timestamp).getMonth()));
  if (months.size === 12) {
    mainText += `。12个月都有你的身影，你是时光的见证者`;
  }

  texts.push({
    type: 'main',
    text: mainText,
  });

  // 最活跃星期描述
  if (mostActiveWeekday && mostActiveWeekday.dayName) {
    texts.push({
      type: 'normal',
      text: `你最爱在${mostActiveWeekday.dayName}发布动态，这一天总是你最活跃的时候`,
    });
  }

  // 添加月度分析
  const monthlyInsights = generateMonthlyInsights(dynamics, monthlyStats);
  monthlyInsights.forEach(insight => {
    texts.push({
      type: 'normal',
      text: insight,
    });
  });

  return texts;
}

/**
 * 生成月度分析文案
 * @param {Array} dynamics - 动态数据
 * @param {Array} monthlyStats - 月度统计数据
 * @returns {Array} 月度分析文案数组
 */
export function generateMonthlyInsights(dynamics, monthlyStats) {
  const insights = [];

  if (!dynamics || dynamics.length === 0 || !monthlyStats) return insights;

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  // 找出空白月份（没有任何记录）
  const emptyMonths = monthlyStats.filter(m => m.count === 0).map(m => m.month);
  if (emptyMonths.length > 0 && emptyMonths.length < 12) {
    const monthName = monthNames[emptyMonths[0]];
    insights.push(`${monthName}，你没有留下任何记录，也许那时正忙着别的事情`);
  }

  // 找出最活跃月份
  const mostActiveMonth = monthlyStats.reduce((max, m) => m.count > max.count ? m : max, monthlyStats[0]);
  if (mostActiveMonth.count > 0) {
    const monthName = monthNames[mostActiveMonth.month];
    insights.push(`${monthName}是你最活跃的月份，那个月你留下了${mostActiveMonth.count}个瞬间`);
  }

  // 检查是否有满勤月份（该月每天都有记录）
  const monthlyDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const year = dynamics.length > 0 ? new Date(dynamics[0].timestamp).getFullYear() : new Date().getFullYear();
  // 判断是否闰年
  if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
    monthlyDays[1] = 29;
  }

  const monthlyDaysSet = {};
  dynamics.forEach(d => {
    const date = new Date(d.timestamp);
    const month = date.getMonth();
    const day = date.getDate();
    if (!monthlyDaysSet[month]) {
      monthlyDaysSet[month] = new Set();
    }
    monthlyDaysSet[month].add(day);
  });

  const perfectMonths = [];
  for (let month = 0; month < 12; month++) {
    if (monthlyDaysSet[month] && monthlyDaysSet[month].size === monthlyDays[month]) {
      perfectMonths.push(month);
    }
  }

  if (perfectMonths.length > 0) {
    const monthName = monthNames[perfectMonths[0]];
    insights.push(`${monthName}，你每一天都在记录，那是最用心的一个月`);
  }

  return insights;
}

/**
 * 生成月度回顾页面的文案
 * @param {Array} monthlyStats - 月度统计数据
 * @param {number|null} year - 年份
 * @param {boolean} isFullReport - 是否是全部数据报告
 * @returns {Array} 文案数组
 */
export function generateMonthlyReviewText(monthlyStats, year, isFullReport) {
  const texts = [];

  if (!monthlyStats || monthlyStats.length === 0) return texts;

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  // 找出最活跃和最安静的月份
  const sortedMonths = [...monthlyStats].sort((a, b) => b.count - a.count);
  const mostActiveMonth = sortedMonths[0];
  const activeMonths = monthlyStats.filter(m => m.count > 0);
  const emptyMonths = monthlyStats.filter(m => m.count === 0);

  // 主文案：总结性描述
  if (isFullReport) {
    texts.push({
      type: 'main',
      text: `这些年，你在${activeMonths.length}个月都有记录，见证了四季的变化`,
    });
  } else {
    texts.push({
      type: 'main',
      text: `${year}年，你在${activeMonths.length}个月都有记录，见证了四季的变化`,
    });
  }

  // 最活跃月份
  if (mostActiveMonth.count > 0) {
    const monthName = monthNames[mostActiveMonth.month - 1];
    texts.push({
      type: 'normal',
      text: `${monthName}是你最活跃的月份，那个月你留下了${mostActiveMonth.count}个瞬间`,
    });
  }

  // 空白月份
  if (emptyMonths.length > 0 && emptyMonths.length < 12) {
    const emptyMonthNames = emptyMonths.map(m => monthNames[m.month - 1]).join('、');
    if (emptyMonths.length === 1) {
      texts.push({
        type: 'normal',
        text: `${emptyMonthNames}，你没有留下任何记录，也许那时正忙着别的事情`,
      });
    } else {
      texts.push({
        type: 'normal',
        text: `${emptyMonthNames}这${emptyMonths.length}个月，你没有留下记录，也许那时正忙着别的事情`,
      });
    }
  }

  // 如果所有月份都有记录
  if (emptyMonths.length === 0) {
    texts.push({
      type: 'normal',
      text: '12个月都有你的身影，你是时光的见证者',
    });
  }

  return texts;
}

/**
 * 生成那些瞬间页面的文案
 * @param {Object} records - 记录数据
 * @returns {Array} 文案数组
 */
export function generateHighlightsText(records) {
  const texts = [];

  if (!records) return texts;

  // 单日最多记录
  if (records.maxDailyCount && records.maxDailyCount.count > 0) {
    const date = new Date(records.maxDailyCount.date);
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    texts.push({
      type: 'highlight',
      text: `${dateStr}，你在这一天留下了${records.maxDailyCount.count}条记录，那是你记录最密集的一天`,
    });
  }

  // 最长文字
  if (records.maxTextLength && records.maxTextLength.length > 0) {
    texts.push({
      type: 'highlight',
      text: `你写过的最长的一篇，有${records.maxTextLength.length.toLocaleString()}个字，那天你有很多话想说`,
    });
  }

  // 最长间隔
  if (records.longestGap && records.longestGap.days > 1) {
    const startDate = new Date(records.longestGap.start);
    const endDate = new Date(records.longestGap.end);
    const startStr = `${startDate.getMonth() + 1}月${startDate.getDate()}日`;
    const endStr = `${endDate.getMonth() + 1}月${endDate.getDate()}日`;
    texts.push({
      type: 'highlight',
      text: `最长的空档期是${records.longestGap.days}天，从${startStr}到${endStr}，你都没有来过，后来你又回来了`,
    });
  }

  return texts;
}

