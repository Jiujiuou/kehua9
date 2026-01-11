import {
  EMOTION_IDS,
  EMOTION_CATEGORIES,
  EMOTION_KEYWORDS,
  KEYWORD_INDEX,
  INTENSIFIERS,
  DIMINISHERS,
  NEGATORS,
  RHETORICAL_NEGATORS,
  EMOJI_EMOTIONS,
} from "@/constant";

/**
 * 简单的中文分词（备用方案）
 * 改进版：在整个文本中搜索关键词，优先匹配长词
 */
function simpleChineseSegment(text) {
  console.log("[情绪分析] 开始分词，文本:", text);
  
  const result = [];
  const matchedPositions = new Set(); // 记录已匹配的位置，避免重复
  
  // 先按标点分割，但保留标点位置信息
  const segments = text.split(/[\s,，.。!！?？;；、]+/);
  const fullText = segments.join(''); // 移除标点后的完整文本
  
  console.log("[情绪分析] 移除标点后的文本:", fullText);
  console.log("[情绪分析] KEYWORD_INDEX 大小:", Object.keys(KEYWORD_INDEX).length);
  console.log("[情绪分析] KEYWORD_INDEX 示例:", Object.keys(KEYWORD_INDEX).slice(0, 10));
  
  // 优先匹配长词（4字 -> 3字 -> 2字）
  for (let len = 4; len >= 2; len--) {
    for (let i = 0; i <= fullText.length - len; i++) {
      // 检查这个位置是否已经被匹配
      let alreadyMatched = false;
      for (let j = i; j < i + len; j++) {
        if (matchedPositions.has(j)) {
          alreadyMatched = true;
          break;
        }
      }
      
      if (alreadyMatched) continue;
      
      const phrase = fullText.substring(i, i + len);
      if (KEYWORD_INDEX[phrase]) {
        console.log(`[情绪分析] 匹配到关键词 (${len}字): "${phrase}"`);
        result.push(phrase);
        // 标记这些位置已被匹配
        for (let j = i; j < i + len; j++) {
          matchedPositions.add(j);
        }
      }
    }
  }
  
  // 添加未匹配的单字（用于上下文分析）
  for (let i = 0; i < fullText.length; i++) {
    if (!matchedPositions.has(i)) {
      result.push(fullText[i]);
    }
  }
  
  console.log("[情绪分析] 分词结果:", result);
  console.log("[情绪分析] 匹配到的关键词数量:", result.filter(w => KEYWORD_INDEX[w]).length);
  return result;
}

/**
 * 使用jieba-wasm进行中文分词
 * @param {string} text - 待分词的文本
 * @returns {string[]} 分词结果数组
 */
export async function segmentText(text) {
  console.log("[情绪分析] ========== 开始分词 ==========");
  console.log("[情绪分析] 原始文本:", text);
  
  if (!window.jieba) {
    // 备用分词方案：按字符分割，简单处理
    console.warn("[情绪分析] jieba-wasm未加载，使用简单分词");
    return simpleChineseSegment(text);
  }
  
  try {
    // 使用jieba-wasm的cut方法
    const words = jieba.cut(text, true);
    const result = Array.isArray(words) ? words : [];
    console.log("[情绪分析] jieba分词结果:", result);
    return result;
  } catch (error) {
    console.error("[情绪分析] 分词失败:", error);
    return simpleChineseSegment(text);
  }
}

/**
 * 初始化空的情感向量
 */
function initEmotionVector() {
  const vector = Object.keys(EMOTION_IDS).reduce((acc, emotionId) => {
    acc[emotionId] = {
      intensity: 0,
      count: 0,
      words: [] // 记录匹配到的词
    };
    return acc;
  }, {});
  
  console.log("[情绪分析] 初始化情感向量:", vector);
  return vector;
}

/**
 * 获取词的上下文
 */
function getContext(words, index, windowSize) {
  const start = Math.max(0, index - windowSize);
  const end = Math.min(words.length, index + windowSize + 1);
  
  return {
    left: words.slice(start, index),
    right: words.slice(index + 1, end),
    current: words[index],
  };
}

/**
 * 应用程度加强词
 */
function applyIntensifiers(contextWords, baseIntensity) {
  let intensity = baseIntensity;
  
  // 检查最近的两个词是否为程度加强词
  for (let i = 0; i < Math.min(2, contextWords.length); i++) {
    const word = contextWords[i];
    if (INTENSIFIERS[word]) {
      intensity *= INTENSIFIERS[word];
      console.log(`[情绪分析] 应用加强词 "${word}", 强度从 ${baseIntensity} 变为 ${intensity}`);
      break; // 只应用最近的一个加强词
    }
    
    // 检查复合加强词（如"非常非常"）
    if (i < contextWords.length - 1) {
      const compoundWord = word + contextWords[i + 1];
      if (INTENSIFIERS[compoundWord]) {
        intensity *= INTENSIFIERS[compoundWord];
        console.log(`[情绪分析] 应用复合加强词 "${compoundWord}", 强度从 ${baseIntensity} 变为 ${intensity}`);
        break;
      }
    }
  }
  
  return Math.min(intensity, 1.0); // 不超过1.0
}

/**
 * 应用程度减弱词
 */
function applyDiminishers(contextWords, baseIntensity) {
  let intensity = baseIntensity;
  
  for (let i = 0; i < Math.min(2, contextWords.length); i++) {
    const word = contextWords[i];
    if (DIMINISHERS[word]) {
      intensity *= DIMINISHERS[word];
      console.log(`[情绪分析] 应用减弱词 "${word}", 强度从 ${baseIntensity} 变为 ${intensity}`);
      break;
    }
  }
  
  return intensity;
}

/**
 * 处理否定词
 */
function handleNegators(contextWords) {
  let shouldReverse = false;
  let shouldDiminish = false;
  
  // 检查最近的三个词
  for (let i = 0; i < Math.min(3, contextWords.length); i++) {
    const word = contextWords[i];
    
    if (NEGATORS.has(word)) {
      // 检查是否是反问式否定（如"何必"）
      if (RHETORICAL_NEGATORS.has(word)) {
        shouldDiminish = true;
        console.log(`[情绪分析] 检测到反问式否定词 "${word}", 将减弱情绪`);
      } else {
        shouldReverse = true;
        console.log(`[情绪分析] 检测到否定词 "${word}", 将反转情绪`);
      }
      break;
    }
  }
  
  // 检查双重否定
  if (contextWords.length >= 2) {
    if (NEGATORS.has(contextWords[0]) && NEGATORS.has(contextWords[1])) {
      shouldReverse = false; // 双重否定变肯定
      console.log("[情绪分析] 检测到双重否定，取消反转");
    }
  }
  
  return { shouldReverse, shouldDiminish };
}

/**
 * 情感反转映射
 */
function reverseEmotion(originalEmotionId) {
  const reversalMap = {
    [EMOTION_IDS.WARM]: EMOTION_IDS.CONTEMPLATIVE,
    [EMOTION_IDS.ENERGETIC]: EMOTION_IDS.CONTEMPLATIVE,
    [EMOTION_IDS.CALM]: EMOTION_IDS.CONTEMPLATIVE,
    [EMOTION_IDS.CONTEMPLATIVE]: EMOTION_IDS.CALM,
    [EMOTION_IDS.PROFOUND]: EMOTION_IDS.WARM,
  };
  
  const reversed = reversalMap[originalEmotionId] || EMOTION_IDS.MIXED;
  console.log(`[情绪分析] 情绪反转: ${originalEmotionId} -> ${reversed}`);
  return reversed;
}

/**
 * 分析文本中的表情符号
 */
function analyzeEmojisInText(text) {
  console.log("[情绪分析] ========== 分析表情符号 ==========");
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]/gu;
  const emojis = text.match(emojiPattern) || [];
  
  console.log("[情绪分析] 找到的表情符号:", emojis);
  
  const results = {};
  
  emojis.forEach((emoji) => {
    if (EMOJI_EMOTIONS[emoji]) {
      const { emotionId, intensity } = EMOJI_EMOTIONS[emoji];
      
      if (!results[emotionId]) {
        results[emotionId] = {
          intensity: 0,
          count: 0,
          emojis: [],
        };
      }
      
      results[emotionId].intensity += intensity;
      results[emotionId].count += 1;
      results[emotionId].emojis.push(emoji);
      
      console.log(`[情绪分析] 表情符号 "${emoji}" -> ${emotionId}, 强度: ${intensity}`);
    }
  });
  
  console.log("[情绪分析] 表情符号分析结果:", results);
  return results;
}

/**
 * 分析句子结构
 */
function analyzeSentenceStructure(text) {
  console.log("[情绪分析] ========== 分析句子结构 ==========");
  
  const hasQuestionMark = /[？?]/.test(text);
  const hasExclamation = /[！!]/.test(text);
  const hasEllipsis = /[….]{2,}/.test(text);
  const isShort = text.length < 15;
  
  console.log("[情绪分析] 句子特征:", {
    hasQuestionMark,
    hasExclamation,
    hasEllipsis,
    isShort,
    length: text.length,
  });
  
  let emotionId = null;
  let intensity = 0;
  
  // 疑问句 → 沉思
  if (hasQuestionMark) {
    emotionId = EMOTION_IDS.CONTEMPLATIVE;
    intensity = 0.3;
    console.log("[情绪分析] 疑问句 -> 沉思");
  }
  
  // 感叹句 → 根据内容判断
  if (hasExclamation) {
    if (/开心|快乐|幸福|美好/.test(text)) {
      emotionId = EMOTION_IDS.WARM;
      intensity = 0.4;
      console.log("[情绪分析] 感叹句(积极) -> 温暖");
    } else if (/加油|努力|冲|坚持/.test(text)) {
      emotionId = EMOTION_IDS.ENERGETIC;
      intensity = 0.4;
      console.log("[情绪分析] 感叹句(激励) -> 活力");
    } else if (!emotionId) {
      emotionId = EMOTION_IDS.MIXED;
      intensity = 0.3;
      console.log("[情绪分析] 感叹句(其他) -> 混合");
    }
  }
  
  // 省略号 → 沉思/深刻
  if (hasEllipsis) {
    if (!emotionId) {
      emotionId = EMOTION_IDS.CONTEMPLATIVE;
      intensity = 0.5;
      console.log("[情绪分析] 省略号 -> 沉思");
    } else {
      intensity += 0.2; // 增强现有情感
      console.log("[情绪分析] 省略号增强现有情感");
    }
  }
  
  // 超短句 → 平静/深刻
  if (isShort && text.length < 10) {
    if (/[。，]/.test(text)) {
      emotionId = emotionId || EMOTION_IDS.CALM;
      intensity = Math.max(intensity, 0.3);
      console.log("[情绪分析] 超短句 -> 平静");
    }
  }
  
  const result = {
    emotionId,
    intensity,
  };
  
  console.log("[情绪分析] 句子结构分析结果:", result);
  return result;
}

/**
 * 检查是否有转折词
 */
function hasTransitionWords(text) {
  const transitionWords = [
    "但是",
    "可是",
    "然而",
    "却",
    "不过",
    "只是",
    "虽然",
    "尽管",
    "即使",
    "就算",
    "哪怕",
    "反而",
    "反倒",
    "偏偏",
    "一方面",
    "另一方面",
    "其实",
    "实际上",
    "事实上",
    "不料",
    "没想到",
    "谁知",
    "哪里知道",
  ];
  
  const found = transitionWords.some((word) => text.includes(word));
  if (found) {
    console.log("[情绪分析] 检测到转折词");
  }
  return found;
}

/**
 * 检查情感冲突
 */
function hasEmotionalConflict(text) {
  const positiveWords = ["开心", "快乐", "幸福", "喜欢", "爱"];
  const negativeWords = ["难过", "伤心", "痛苦", "讨厌", "恨"];
  
  const hasPositive = positiveWords.some((word) => text.includes(word));
  const hasNegative = negativeWords.some((word) => text.includes(word));
  
  const conflict = hasPositive && hasNegative;
  if (conflict) {
    console.log("[情绪分析] 检测到情感冲突");
  }
  return conflict;
}

/**
 * 计算置信度
 */
function calculateConfidence(primaryEmotion, totalIntensity, text) {
  let confidence = 0.5; // 基础置信度
  
  // 1. 基于情感强度
  confidence += primaryEmotion.intensity * 0.3;
  
  // 2. 基于情感词数量
  confidence += Math.min(primaryEmotion.count * 0.1, 0.2);
  
  // 3. 基于文本长度
  const length = text.length;
  if (length >= 15 && length <= 100) {
    confidence += 0.1;
  } else if (length > 100) {
    confidence += 0.05;
  } else {
    confidence -= 0.1;
  }
  
  // 4. 转折词降低置信度
  if (hasTransitionWords(text)) {
    confidence -= 0.15;
  }
  
  // 5. 检查情感冲突
  if (hasEmotionalConflict(text)) {
    confidence -= 0.2;
  }
  
  const finalConfidence = Math.max(0.1, Math.min(0.95, confidence));
  console.log(`[情绪分析] 置信度计算: ${finalConfidence}`);
  return finalConfidence;
}

/**
 * 归一化情感结果并确定主情感
 */
function normalizeEmotionResult(emotionVector, totalIntensity, originalText) {
  console.log("[情绪分析] ========== 归一化情感结果 ==========");
  console.log("[情绪分析] 原始情感向量:", emotionVector);
  console.log("[情绪分析] 总强度:", totalIntensity);
  
  // 计算每个情感的相对强度
  const emotions = Object.keys(emotionVector)
    .filter((emotionId) => emotionVector[emotionId].count > 0)
    .map((emotionId) => ({
      emotionId,
      intensity:
        emotionVector[emotionId].intensity /
        Math.max(emotionVector[emotionId].count, 1),
      count: emotionVector[emotionId].count,
      rawIntensity: emotionVector[emotionId].intensity,
      words: emotionVector[emotionId].words,
    }))
    .sort((a, b) => b.intensity - a.intensity);
  
  console.log("[情绪分析] 排序后的情感列表:", emotions);
  
  // 如果没有检测到情感
  if (emotions.length === 0) {
    console.log("[情绪分析] 未检测到情感，返回默认值");
    return {
      primary: {
        emotionId: EMOTION_IDS.CALM,
        name: EMOTION_CATEGORIES[EMOTION_IDS.CALM].name,
        intensity: 0.3,
        confidence: 0.1,
      },
      secondary: null,
      isMixed: false,
      mixedRatio: 0,
      allEmotions: [],
    };
  }
  
  const primary = emotions[0];
  const secondary = emotions.length > 1 ? emotions[1] : null;
  
  console.log("[情绪分析] 主情感:", primary);
  console.log("[情绪分析] 次情感:", secondary);
  
  // 判断是否为混合情感
  let isMixed = false;
  let mixedRatio = 0;
  
  if (secondary && secondary.intensity > 0.2) {
    const intensityDiff = primary.intensity - secondary.intensity;
    if (intensityDiff < 0.3) {
      isMixed = true;
      mixedRatio = secondary.intensity / primary.intensity;
      console.log("[情绪分析] 检测到混合情感，比例:", mixedRatio);
    }
  }
  
  // 转折词可能表示混合情感
  if (
    hasTransitionWords(originalText) &&
    secondary &&
    secondary.intensity > 0.15
  ) {
    isMixed = true;
    mixedRatio = Math.max(mixedRatio, 0.5);
    console.log("[情绪分析] 转折词导致混合情感");
  }
  
  // 计算置信度
  const confidence = calculateConfidence(primary, totalIntensity, originalText);
  
  // 构建结果对象
  const result = {
    primary: {
      emotionId: primary.emotionId,
      name: EMOTION_CATEGORIES[primary.emotionId].name,
      intensity: primary.intensity,
      confidence,
      color: EMOTION_CATEGORIES[primary.emotionId].color,
      words: primary.words,
    },
    secondary: secondary
      ? {
          emotionId: secondary.emotionId,
          name: EMOTION_CATEGORIES[secondary.emotionId].name,
          intensity: secondary.intensity,
          color: EMOTION_CATEGORIES[secondary.emotionId].color,
          words: secondary.words,
        }
      : null,
    isMixed,
    mixedRatio,
    allEmotions: emotions.slice(0, 3).map((e) => ({
      emotionId: e.emotionId,
      name: EMOTION_CATEGORIES[e.emotionId].name,
      intensity: e.intensity,
      color: EMOTION_CATEGORIES[e.emotionId].color,
      words: e.words,
    })),
  };
  
  console.log("[情绪分析] ========== 最终结果 ==========");
  console.log("[情绪分析] 完整结果:", result);
  
  return result;
}

/**
 * 分析单条文本的情感
 * @param {string} text - 待分析文本
 * @returns {Object} 情感分析结果
 */
export async function analyzeEmotion(text) {
  console.log("\n\n");
  console.log("========================================");
  console.log("[情绪分析] ========== 开始分析新文本 ==========");
  console.log("[情绪分析] 文本内容:", text);
  console.log("========================================");
  
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    console.log("[情绪分析] 文本为空，返回默认值");
    return {
      primary: {
        emotionId: EMOTION_IDS.CALM,
        name: EMOTION_CATEGORIES[EMOTION_IDS.CALM].name,
        intensity: 0.3,
        confidence: 0.1,
      },
      secondary: null,
      isMixed: false,
      mixedRatio: 0,
      allEmotions: [],
    };
  }
  
  // 1. 分词
  const words = await segmentText(text);
  console.log("[情绪分析] 分词完成，共", words.length, "个词");
  console.log("[情绪分析] 分词结果详情:", words);
  
  // 调试：检查 KEYWORD_INDEX
  console.log("[情绪分析] KEYWORD_INDEX 检查:");
  console.log("[情绪分析]   KEYWORD_INDEX 大小:", Object.keys(KEYWORD_INDEX).length);
  console.log("[情绪分析]   示例关键词:", Object.keys(KEYWORD_INDEX).slice(0, 20));
  
  // 调试：检查文本中是否包含关键词
  const sampleKeywords = ['开心', '快乐', '难过', '悲伤', '平静', '思考', '兴奋'];
  const foundInText = sampleKeywords.filter(kw => text.includes(kw));
  console.log("[情绪分析]   文本中包含的示例关键词:", foundInText);
  
  // 2. 初始化情感向量
  const emotionVector = initEmotionVector();
  
  // 3. 分析每个词的情感
  let totalIntensity = 0;
  let matchedWordsCount = 0;
  const matchedWordsByEmotion = {}; // 按情绪分类记录匹配到的词
  
  console.log("[情绪分析] ========== 开始匹配情绪词 ==========");
  console.log("[情绪分析] 将检查的词列表:", words.slice(0, 20));
  console.log("[情绪分析] 总词数:", words.length);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // 检查是否是已知情感词
    if (KEYWORD_INDEX[word]) {
      matchedWordsCount++;
      const wordInfo = KEYWORD_INDEX[word];
      let intensity = wordInfo.baseIntensity;
      let emotionId = wordInfo.emotionId;
      
      console.log(`\n[情绪分析] 匹配到情绪词 #${matchedWordsCount}: "${word}"`);
      console.log(`[情绪分析]   原始情绪ID: ${emotionId}`);
      console.log(`[情绪分析]   基础强度: ${intensity}`);
      
      // 获取上下文（前后各2个词）
      const context = getContext(words, i, 2);
      console.log(`[情绪分析]   上下文:`, {
        left: context.left,
        current: context.current,
        right: context.right,
      });
      
      // 应用程度修饰
      intensity = applyIntensifiers(context.left, intensity);
      intensity = applyDiminishers(context.left, intensity);
      
      // 处理否定词
      const { shouldReverse, shouldDiminish } = handleNegators(context.left);
      if (shouldReverse) {
        emotionId = reverseEmotion(emotionId);
        intensity = intensity * 0.6;
        console.log(`[情绪分析]   反转后情绪ID: ${emotionId}`);
        console.log(`[情绪分析]   反转后强度: ${intensity}`);
      } else if (shouldDiminish) {
        intensity = intensity * 0.4;
        console.log(`[情绪分析]   减弱后强度: ${intensity}`);
      }
      
      // 添加到情感向量（累加，不会覆盖）
      emotionVector[emotionId].intensity += intensity;
      emotionVector[emotionId].count += 1;
      emotionVector[emotionId].words.push({
        word,
        intensity,
        originalEmotionId: wordInfo.emotionId,
        finalEmotionId: emotionId,
      });
      totalIntensity += intensity;
      
      // 按情绪分类记录
      if (!matchedWordsByEmotion[emotionId]) {
        matchedWordsByEmotion[emotionId] = [];
      }
      matchedWordsByEmotion[emotionId].push({
        word,
        intensity,
        originalEmotionId: wordInfo.emotionId,
        finalEmotionId: emotionId
      });
      
      console.log(`[情绪分析]   ✅ 添加到情感向量: ${emotionId}`);
      console.log(`[情绪分析]      - 累计强度: ${emotionVector[emotionId].intensity.toFixed(2)}`);
      console.log(`[情绪分析]      - 累计次数: ${emotionVector[emotionId].count}`);
      console.log(`[情绪分析]      - 该情绪已匹配的词: ${matchedWordsByEmotion[emotionId].map(w => w.word).join(', ')}`);
    }
  }
  
  console.log(`\n[情绪分析] ========== 情绪词匹配完成 ==========`);
  console.log(`[情绪分析] 共匹配 ${matchedWordsCount} 个情绪词`);
  console.log(`[情绪分析] 涉及 ${Object.keys(matchedWordsByEmotion).length} 种不同情绪`);
  
  // 显示每种情绪匹配到的词
  Object.keys(matchedWordsByEmotion).forEach(emotionId => {
    const words = matchedWordsByEmotion[emotionId];
    const emotionName = EMOTION_CATEGORIES[emotionId]?.name || emotionId;
    console.log(`[情绪分析] ${emotionName} (${emotionId}): ${words.length} 个词`);
    words.forEach((w, i) => {
      console.log(`[情绪分析]   ${i + 1}. "${w.word}" (强度: ${w.intensity.toFixed(2)})`);
    });
  });
  
  console.log("[情绪分析] 当前情感向量:", emotionVector);
  
  // 如果没有匹配到任何词，尝试直接在整个文本中搜索关键词
  if (matchedWordsCount === 0) {
    console.log("[情绪分析] ⚠️ 未匹配到任何词，尝试直接文本搜索...");
    console.log("[情绪分析] 原始文本:", text);
    console.log("[情绪分析] KEYWORD_INDEX 检查:");
    console.log("[情绪分析]   - '开心' 是否存在:", !!KEYWORD_INDEX['开心']);
    console.log("[情绪分析]   - '开心' 详情:", KEYWORD_INDEX['开心']);
    console.log("[情绪分析]   - '难过' 是否存在:", !!KEYWORD_INDEX['难过']);
    console.log("[情绪分析]   - '难过' 详情:", KEYWORD_INDEX['难过']);
    
    const directMatches = [];
    
    // 按长度从长到短搜索
    for (let len = 4; len >= 2; len--) {
      for (let i = 0; i <= text.length - len; i++) {
        const phrase = text.substring(i, i + len);
        if (KEYWORD_INDEX[phrase]) {
          directMatches.push({
            word: phrase,
            position: i,
            info: KEYWORD_INDEX[phrase]
          });
          console.log(`[情绪分析] ✅ 直接搜索匹配到: "${phrase}" at position ${i}, 情绪: ${KEYWORD_INDEX[phrase].emotionId}`);
        }
      }
    }
    
    // 如果有直接匹配的结果，使用这些结果
    if (directMatches.length > 0) {
      console.log(`[情绪分析] ✅ 直接搜索找到 ${directMatches.length} 个匹配`);
      directMatches.forEach(match => {
        const { emotionId, baseIntensity } = match.info;
        emotionVector[emotionId].intensity += baseIntensity;
        emotionVector[emotionId].count += 1;
        emotionVector[emotionId].words.push({
          word: match.word,
          intensity: baseIntensity,
          originalEmotionId: emotionId,
          finalEmotionId: emotionId,
        });
        totalIntensity += baseIntensity;
        matchedWordsCount++;
      });
      console.log("[情绪分析] 更新后的情感向量:", emotionVector);
    } else {
      console.log("[情绪分析] ❌ 直接搜索也未找到匹配，文本可能不包含情绪词");
      console.log("[情绪分析] 文本内容:", text);
      console.log("[情绪分析] 文本长度:", text.length);
    }
  }
  
  // 4. 处理表情符号（单独处理，因为可能不在分词结果中）
  const emojiResults = analyzeEmojisInText(text);
  Object.keys(emojiResults).forEach((emotionId) => {
    emotionVector[emotionId].intensity += emojiResults[emotionId].intensity;
    emotionVector[emotionId].count += emojiResults[emotionId].count;
    totalIntensity += emojiResults[emotionId].intensity;
  });
  
  // 5. 句子结构分析
  const structureResult = analyzeSentenceStructure(text);
  if (structureResult.emotionId) {
    emotionVector[structureResult.emotionId].intensity +=
      structureResult.intensity;
    emotionVector[structureResult.emotionId].count += 1;
    totalIntensity += structureResult.intensity;
  }
  
  // 6. 归一化并确定主情感
  return normalizeEmotionResult(emotionVector, totalIntensity, text);
}

/**
 * 批量情感分析
 * @param {Array} posts - 可以是字符串数组或对象数组（对象需要有 text 属性）
 * @param {number} batchSize - 批次大小
 */
export async function analyzeEmotionsBatch(posts, batchSize = 50) {
  console.log(`[情绪分析] 开始批量分析，共 ${posts.length} 条动态，批次大小: ${batchSize}`);
  
  // 检查第一个元素，判断是字符串数组还是对象数组
  const isStringArray = posts.length > 0 && typeof posts[0] === 'string';
  console.log(`[情绪分析] 数据类型: ${isStringArray ? '字符串数组' : '对象数组'}`);
  
  const results = [];
  
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    console.log(`[情绪分析] 处理批次 ${Math.floor(i / batchSize) + 1}, 索引 ${i} - ${i + batchSize - 1}`);
    
    const batchPromises = batch.map((post, index) => {
      console.log(`\n[情绪分析] --- 处理动态 ${i + index + 1}/${posts.length} ---`);
      
      // 根据数据类型提取文本
      let text = '';
      if (isStringArray) {
        text = post || ''; // 如果是字符串数组，直接使用
      } else {
        text = (post && post.text) || ''; // 如果是对象数组，提取 text 属性
      }
      
      console.log(`[情绪分析] 提取的文本:`, text);
      console.log(`[情绪分析] 文本类型:`, typeof text);
      console.log(`[情绪分析] 文本长度:`, text ? text.length : 0);
      
      return analyzeEmotion(text);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // 每批处理后让出主线程
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  
  console.log(`[情绪分析] 批量分析完成，共分析 ${results.length} 条动态`);
  return results;
}

