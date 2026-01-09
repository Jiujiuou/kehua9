import { STOP_WORDS } from "./stopWords";

// 单字停用词（用于过滤以这些字开头或结尾的词）
const SINGLE_STOP_CHARS = new Set([
  "的", "了", "在", "是", "我", "有", "和", "就",
  "不", "人", "都", "一", "个", "上", "也", "很",
  "到", "说", "要", "去", "你", "会", "着", "没",
  "看", "好", "这", "但", "那", "她", "他", "它",
  "啊", "哦", "嗯", "吧", "呢", "吗", "呀", "啦",
  "而", "且", "并", "或", "与", "及", "等", "过",
  "地", "得",
]);

// 无意义的短词（即使不在停用词表中也要过滤）
const MEANINGLESS_SHORT_WORDS = new Set([
  "是", "有", "在", "了", "着", "过", "的", "地", "得",
  "就", "也", "都", "还", "又", "更", "最", "很", "太",
  "只", "才", "刚", "已", "曾", "将", "要", "会", "能",
]);

// 预创建停用词 Set，避免每次调用都创建
const STOP_WORDS_SET = new Set(STOP_WORDS);

/**
 * 从动态数据中提取文本内容
 * @param {Array} dynamics - 动态数组
 * @returns {string} 合并后的文本内容
 */
export function extractTextFromDynamics(dynamics) {
  if (!dynamics || !Array.isArray(dynamics)) {
    return "";
  }

  const texts = dynamics
    .map((dynamic) => {
      if (dynamic && dynamic.text) {
        return dynamic.text.trim();
      }
      return "";
    })
    .filter((text) => text.length > 0);

  return texts.join("\n");
}

/**
 * 简单的文本预处理
 * @param {string} text - 原始文本
 * @returns {string} 预处理后的文本
 */
export function preprocessText(text) {
  if (!text) return "";

  // 去除特殊字符，保留中文、英文、数字
  return text
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 简单的中文分词（基于正则表达式）
 * 这是一个简化版本，后续可以替换为 jieba-wasm
 * @param {string} text - 待分词文本
 * @returns {Array<string>} 分词结果数组
 */
export function simpleSegment(text) {
  if (!text) {
    return [];
  }

  const words = [];
  const chinesePattern = /[\u4e00-\u9fa5]/g;
  const chineseChars = text.match(chinesePattern) || [];

  // 使用滑动窗口提取 2-3 字的中文词
  for (let i = 0; i < chineseChars.length - 1; i++) {
    // 提取 2 字词
    if (i + 1 < chineseChars.length) {
      const twoCharWord = chineseChars[i] + chineseChars[i + 1];
      words.push(twoCharWord);
    }
    // 提取 3 字词
    if (i + 2 < chineseChars.length) {
      const threeCharWord = chineseChars[i] + chineseChars[i + 1] + chineseChars[i + 2];
      words.push(threeCharWord);
    }
  }

  // 匹配英文单词（限制为2-3个字符，与中文词保持一致）
  const englishWords = text.match(/[a-zA-Z]{2,3}/g) || [];

  return [...words, ...englishWords];
}

/**
 * 统计词频并过滤停用词
 * @param {Array<string>} words - 分词结果数组
 * @returns {Array<[string, number]>} 词频数组，格式为 [[词, 频次], ...]
 */
/**
 * 增强的过滤函数
 */
function shouldFilterWord(word) {
  const trimmedWord = word.trim();

  // 基础过滤：长度、纯数字
  if (trimmedWord.length < 2 || trimmedWord.length > 3 || /^\d+$/.test(trimmedWord)) {
    return true;
  }

  // 停用词过滤
  if (STOP_WORDS_SET.has(trimmedWord)) {
    return true;
  }

  // 无意义的短词过滤
  if (MEANINGLESS_SHORT_WORDS.has(trimmedWord)) {
    return true;
  }

  // 过滤以停用字开头或结尾的词
  const firstChar = trimmedWord[0];
  const lastChar = trimmedWord[trimmedWord.length - 1];
  if (SINGLE_STOP_CHARS.has(firstChar) || SINGLE_STOP_CHARS.has(lastChar)) {
    return true;
  }

  // 过滤重复字符的词（如"哈哈"、"等等"）
  if (trimmedWord.length === 2 && trimmedWord[0] === trimmedWord[1]) {
    // 但保留一些有意义的重复词
    const validRepeats = new Set(["哈哈", "呵呵", "嘿嘿", "嘻嘻"]);
    if (!validRepeats.has(trimmedWord)) {
      return true;
    }
  }

  return false;
}

/**
 * 后处理：尝试合并被拆分的词，并过滤无意义的词碎片
 * 例如："羽毛" + "毛球" -> "羽毛球"
 */
function postProcessWordFreq(wordFreq, originalText) {
  const mergedFreq = { ...wordFreq };
  const words = Object.keys(wordFreq);

  // === 第一步：合并被拆分的词 ===
  for (let i = 0; i < words.length; i++) {
    const word1 = words[i];
    if (word1.length !== 2) continue;

    for (let j = i + 1; j < words.length; j++) {
      const word2 = words[j];
      if (word2.length !== 2) continue;

      // 检查是否可以合并：word1的最后一个字 = word2的第一个字
      if (word1[word1.length - 1] === word2[0]) {
        const mergedWord = word1 + word2.substring(1); // 应该是3字词

        // 关键修复：确保合并后的词长度不超过3
        if (mergedWord.length > 3) {
          continue;
        }

        const freq1 = wordFreq[word1] || 0;
        const freq2 = wordFreq[word2] || 0;

        // 如果合并后的词频较高，且合并词不在停用词表中
        if (freq1 >= 2 && freq2 >= 2 && !shouldFilterWord(mergedWord)) {
          // 合并词频
          mergedFreq[mergedWord] = (mergedFreq[mergedWord] || 0) + Math.min(freq1, freq2);
          // 减少原词的词频
          mergedFreq[word1] = Math.max(0, (mergedFreq[word1] || 0) - 1);
          mergedFreq[word2] = Math.max(0, (mergedFreq[word2] || 0) - 1);
        }
      }
    }
  }

  // 清理词频为0的词，并再次过滤超过3字的词
  Object.keys(mergedFreq).forEach(word => {
    if (mergedFreq[word] <= 0 || word.length > 3) {
      delete mergedFreq[word];
    }
  });

  // === 第二步：过滤无意义的"跨词碎片"和短句 ===
  const meaninglessFragments = new Set([
    // 常见不合理碎片
    '车回家', '回家路', '突然想', '然想', '来才知', '为什',
    '直以来', '年纪大', '多吃青', '吃青菜', '期播客',
    '求同存', '同存异', '付密码', '支付密', '欢吃橄', '喜欢吃',
    '来的时', '工作变', '作变动', '些小孔', '用高压',
    '午节前', '些难以', '压锅煮', '医生日', '半年纪', '段时间',
    '车回答', '记忆医', '青年纪', '然想', '段时', '女之',
  ]);

  // 规则1：直接删除黑名单中的无意义碎片
  for (const fragment of meaninglessFragments) {
    if (mergedFreq[fragment]) {
      delete mergedFreq[fragment];
    }
  }

  // 规则2：智能过滤"ABB"或"AAB"型疑似碎片
  // 如果该词本身是2-3字，且存在于另一个更长的高频词中，则可能是碎片
  const meaningfulShortWords = new Set([
    '手机', '城市', '生活', '医生', '游戏', '电话', '微信', '周末',
    '公司', '火车', '软件', '阳台', '大学', '同事', '女生', '北京',
    '高中', '初中', '印象', '东西', '开心', '以前', '记忆', '认识',
    '之前', '朋友', '工作', '健康', '回家', '喜欢', '日子', '老家',
    '春节', '白糖', '能力', '使用',
  ]);

  const wordsToCheck = Object.keys(mergedFreq);
  for (const word of wordsToCheck) {
    if (word.length >= 2 && word.length <= 3) {
      // 检查是否被包含在更长的高频词中
      const isPartOfLongerWord = wordsToCheck.some(longWord => {
        if (longWord === word || longWord.length <= word.length) {
          return false;
        }
        // 检查长词是否包含该词，且长词频率更高或相等
        return longWord.includes(word) && (mergedFreq[longWord] || 0) >= (mergedFreq[word] || 0);
      });

      // 如果是碎片，且不在有意义的短词白名单中，则删除
      if (isPartOfLongerWord && !meaningfulShortWords.has(word)) {
        delete mergedFreq[word];
      }
    }
  }

  // 规则3：基于原文的上下文验证（对中低频长词进行验证）
  if (originalText) {
    const wordsToVerify = Object.keys(mergedFreq);

    for (const word of wordsToVerify) {
      if (word.length >= 3 && (mergedFreq[word] || 0) < 8) {
        // 构建正则，检查它是否被标点或空格包围，或与相邻字能组成更合理的词
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // 检查它是否常与相邻字符连在一起出现
        const contextRegex = new RegExp(`[\\u4e00-\\u9fa5]?${escapedWord}[\\u4e00-\\u9fa5]?`, 'g');
        const contexts = [];
        let match;
        // 使用 matchAll 或手动循环，避免正则的 lastIndex 问题
        let lastIndex = 0;
        while ((match = contextRegex.exec(originalText)) !== null) {
          contexts.push(match[0]);
          // 避免无限循环
          if (match.index === lastIndex) {
            contextRegex.lastIndex++;
          }
          lastIndex = match.index;
        }

        // 如果上下文中，它很少作为独立单元出现，则考虑删除
        if (contexts.length > 0) {
          const independentCount = contexts.filter(ctx => ctx === word).length;
          const independentRatio = independentCount / contexts.length;

          if (independentRatio < 0.3) {
            delete mergedFreq[word];
          }
        }
      }
    }
  }

  return mergedFreq;
}

export function countWordFrequency(words, originalText) {
  const frequencyMap = {};

  // 第一步：基础词频统计（同时过滤超过3字的词）
  words.forEach((word) => {
    const trimmedWord = word.trim();

    // 严格限制：只保留2-3字的词
    if (trimmedWord.length < 2 || trimmedWord.length > 3) {
      return;
    }

    if (shouldFilterWord(trimmedWord)) {
      return;
    }

    frequencyMap[trimmedWord] = (frequencyMap[trimmedWord] || 0) + 1;
  });

  // 第二步：后处理合并和智能过滤
  const processedFreq = postProcessWordFreq(frequencyMap, originalText);

  // 第三步：最终过滤，确保没有超过3字的词
  const finalFreq = {};
  Object.keys(processedFreq).forEach(word => {
    if (word.length >= 2 && word.length <= 3) {
      finalFreq[word] = processedFreq[word];
    }
  });

  // 第四步：排序
  return Object.entries(finalFreq)
    .map(([word, count]) => [word, count])
    .sort((a, b) => b[1] - a[1]); // 按频次降序
}

/**
 * 处理文本并返回词频数据
 * @param {string} text - 原始文本
 * @returns {Array<[string, number]>} 词频数组
 */
export function processText(text) {
  const processedText = preprocessText(text);
  const words = simpleSegment(processedText);
  return countWordFrequency(words, text);
}

