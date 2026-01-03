/**
 * 词云工具函数
 * 用于生成词云、分词、词频统计等
 */

/**
 * 中文停用词列表
 */
const STOP_WORDS = new Set([
  '个', '这', '那', '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很',
  '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '它', '他', '她',
  '什么', '怎么', '为什么', '因为', '所以', '但是', '然后', '如果', '这样', '那样', '还是', '或者',
  '可以', '能', '能够', '已经', '还', '又', '再', '就是', '只是', '而且', '并且', '虽然', '但',
  '把', '被', '给', '让', '向', '往', '从', '以', '为', '对', '关于', '等', '等等', '啊', '呀',
  '吗', '吧', '呢', '哦', '嗯', '哈', '哎', '唉', '喔', '哇', '嘿', '嘛', '咯', '啦', '罢了',
  '之', '其', '其中', '其实', '这个', '那个', '这些', '那些', '这里', '那里', '如此', '如何',
  '来', '过', '时', '后', '前', '现在', '今天', '昨天', '明天', '每天', '天天', '一直', '总是',
  '总', '太', '非常', '很多', '一些', '几个', '多少', '怎样', '这么', '那么', '多么', '这种',
  '那种', '哪', '哪里', '哪个', '哪些', '什么样', '怎么样', '好像', '似乎', '可能', '大概',
  '也许', '应该', '必须', '需要', '想', '觉得', '感觉', '认为', '知道', '明白', '了解', '理解',
  '发现', '出现', '发生', '变成', '成为', '做', '进行', '开始', '结束', '继续', '完成', '实现', '的',
  // 新增：常见无意义2-3字词
  '时候', '不知', '不是', '也不', '有些', '起来', '出来', '过来', '回来', '下来', '上去', '下去',
  '进去', '出去', '一起', '一样', '一直', '一下', '有点', '真的', '不过', '为什', '了一', '了些',
  '来的', '去的', '到了', '多了', '大了', '小了', '新的', '老的', '好的', '是我', '我的', '你的',
  '他的', '她的', '我们', '你们', '他们', '她们', '它们', '这一', '那一', '哪一', '每一', '某一',
  '另一', '有一', '是在', '在这', '在那', '不知道', '是不是', '怎么样', '什么样', '为什么',
  '有时候', '的时候', '这时候', '那时候', '样的', '个的', '得很', '比较', '特别', '尤其',
  // 新增：数字和时间相关词
  '一年', '两年', '三年', '半年', '一月', '两月', '一天', '两天', '三天', '几天', '多天',
  '一次', '两次', '三次', '几次', '多次', '一点', '两点', '三点', '几点', '多点',
  '几个', '两个', '三个', '一些', '有的', '没的', '别的', '其它',
  // 新增：更多方向和状态词
  '上来', '下去', '进来', '出去', '回去', '过去', '起来', '下来', '上去',
  '用的', '吃的', '喝的', '看的', '做的', '买的', '卖的', '说的', '写的', '以前', '经常'
]);

/**
 * 简单的中文分词（基于常见词汇模式）
 * @param {string} text - 文本内容
 * @returns {Array<string>} 分词结果
 */
export function simpleChineseTokenizer(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const tokens = [];

  // 移除所有非中文字符和标点符号，保留空格用于分隔
  const cleanText = text.replace(/[^\u4e00-\u9fa5\s]/g, ' ');

  // 按空格分隔可能的词组
  const segments = cleanText.split(/\s+/).filter(s => s.length > 0);

  segments.forEach(segment => {
    // 对于每个段落，尝试提取2-4字的词汇
    for (let len = 4; len >= 2; len--) {
      for (let i = 0; i <= segment.length - len; i++) {
        const word = segment.substring(i, i + len);
        // 过滤掉停用词
        if (!STOP_WORDS.has(word)) {
          tokens.push(word);
        }
      }
    }

    // 也包含单字（但跳过一些常见的单字停用词）
    for (let i = 0; i < segment.length; i++) {
      const char = segment[i];
      if (!STOP_WORDS.has(char) && /[\u4e00-\u9fa5]/.test(char)) {
        tokens.push(char);
      }
    }
  });

  return tokens;
}

/**
 * 统计词频
 * @param {Array<string>} tokens - 分词结果
 * @returns {Map<string, number>} 词频统计（词 -> 出现次数）
 */
export function calculateWordFrequency(tokens) {
  const frequency = new Map();

  tokens.forEach(token => {
    if (token && token.length > 0) {
      frequency.set(token, (frequency.get(token) || 0) + 1);
    }
  });

  return frequency;
}

/**
 * 提取文本内容
 * @param {Array} dynamics - 动态数据数组
 * @returns {string} 所有文本内容合并
 */
export function extractTextFromDynamics(dynamics) {
  if (!dynamics || dynamics.length === 0) {
    return '';
  }

  return dynamics
    .map(dynamic => dynamic.text || '')
    .filter(text => text.trim().length > 0)
    .join(' ');
}

/**
 * 判断词语是否应该被过滤
 * @param {string} word - 词语
 * @returns {boolean} 是否应该过滤
 */
function shouldFilterWord(word) {
  // 单字过滤：只保留少数常见名词或意义明确的字
  if (word.length === 1) {
    const allowedSingleChars = new Set([
      '家', '爱', '梦', '书', '茶', '酒', '雨', '雪', '风', '云', '月', '星',
      '春', '夏', '秋', '冬', '花', '树', '山', '水', '天', '地', '心', '路'
    ]);
    if (!allowedSingleChars.has(word)) {
      return true;
    }
  }

  // 2字词：以助词结尾或开头
  if (word.length === 2) {
    const particles = ['的', '了', '在', '是', '过', '着', '有', '不', '也', '都', '就', '来', '去'];
    if (particles.some(p => word.endsWith(p) || word.startsWith(p))) {
      return true;
    }
  }

  // 3字词：以「的」「了」「过」「着」结尾
  if (word.length === 3) {
    if (word.endsWith('的') || word.endsWith('了') || word.endsWith('过') || word.endsWith('着')) {
      return true;
    }
  }

  // 4字词：以「了」「过」「着」结尾（可能是动词时态）
  if (word.length === 4) {
    if (word.endsWith('了') || word.endsWith('过') || word.endsWith('着')) {
      return true;
    }
  }

  return false;
}

/**
 * 去除被长词包含的短词（子词去重）
 * @param {Array<[string, number]>} wordList - 词频列表 [[词, 次数], ...]
 * @returns {Array<[string, number]>} 去重后的词频列表
 */
function removeSubwords(wordList) {
  // 按词长降序排序
  const sortedByLength = [...wordList].sort((a, b) => b[0].length - a[0].length);
  const toRemove = new Set();

  for (let i = 0; i < sortedByLength.length; i++) {
    const [longWord, longCount] = sortedByLength[i];
    if (toRemove.has(longWord)) continue;

    // 检查后面的短词
    for (let j = i + 1; j < sortedByLength.length; j++) {
      const [shortWord, shortCount] = sortedByLength[j];
      if (toRemove.has(shortWord)) continue;

      // 如果短词被长词包含，且长词词频达到一定比例，则移除短词
      if (longWord.includes(shortWord)) {
        // 根据短词长度使用不同阈值：2字词要求更高（70%），3字词及以上（50%）
        const threshold = shortWord.length === 2 ? 0.7 : 0.5;
        if (longCount >= shortCount * threshold) {
          toRemove.add(shortWord);
        }
      }
    }
  }

  return wordList.filter(([word]) => !toRemove.has(word));
}


/**
 * 计算TF-IDF权重
 * @param {Array} dynamics - 动态数据数组
 * @param {Array<string>} targetWords - 需要计算权重的词列表
 * @returns {Map<string, number>} 词 -> TF-IDF值
 */
function calculateTFIDF(dynamics, targetWords) {
  const tfidfScores = new Map();
  const wordSet = new Set(targetWords);

  // 为每条动态分词
  const documents = dynamics.map(dynamic => {
    const text = dynamic.text || '';
    const tokens = simpleChineseTokenizer(text);
    return tokens;
  });

  const totalDocs = documents.length;

  // 计算每个词的IDF（在多少文档中出现）
  const docFrequency = new Map();
  documents.forEach(doc => {
    const uniqueWords = new Set(doc);
    uniqueWords.forEach(word => {
      if (wordSet.has(word)) {
        docFrequency.set(word, (docFrequency.get(word) || 0) + 1);
      }
    });
  });

  // 计算每个词的总词频（TF）
  const termFrequency = new Map();
  documents.forEach(doc => {
    doc.forEach(word => {
      if (wordSet.has(word)) {
        termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
      }
    });
  });

  // 计算TF-IDF
  targetWords.forEach(word => {
    const tf = termFrequency.get(word) || 0;
    const df = docFrequency.get(word) || 1;

    // TF-IDF = TF × log(总文档数 / 包含该词的文档数)
    // 加1避免log(1)=0的情况
    const idf = Math.log((totalDocs + 1) / (df + 1));
    const tfidf = tf * idf;

    tfidfScores.set(word, tfidf);
  });

  return tfidfScores;
}


/**
 * 生成词云数据
 * @param {Array} dynamics - 动态数据数组
 * @param {Object} options - 配置选项
 * @param {number} options.maxWords - 最大词数，默认100
 * @param {number} options.minLength - 最小词长，默认2
 * @param {number} options.minFrequency - 最小词频，默认2
 * @param {boolean} options.useTFIDF - 是否使用TF-IDF权重，默认true
 * @returns {Array<[string, number]>} 词云数据 [[词, 权重], ...]
 */
export function generateWordCloudData(dynamics, options = {}) {
  const {
    maxWords = 100,
    minLength = 2,
    minFrequency = 2,
    useTFIDF = true,
  } = options;

  // 提取所有文本
  const text = extractTextFromDynamics(dynamics);

  if (!text) {
    return [];
  }

  // 分词
  const tokens = simpleChineseTokenizer(text);

  // 统计词频
  const frequency = calculateWordFrequency(tokens);

  // 转换为数组并进行初步过滤
  let wordList = Array.from(frequency.entries())
    .filter(([word, count]) => {
      // 基本过滤：长度和频率
      if (word.length < minLength || count < minFrequency) {
        return false;
      }
      // 规则过滤：助词词组
      if (shouldFilterWord(word)) {
        return false;
      }
      return true;
    });

  // 子词去重
  wordList = removeSubwords(wordList);

  // 使用TF-IDF重新计算权重（可选）
  if (useTFIDF && dynamics.length > 0) {
    const words = wordList.map(([word]) => word);
    const tfidfScores = calculateTFIDF(dynamics, words);

    // 替换词频为TF-IDF分数
    wordList = wordList.map(([word]) => [word, tfidfScores.get(word) || 0]);
  }

  // 按权重降序排序并取前N个
  wordList = wordList
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords);

  return wordList;
}

/**
 * 生成四季词云数据
 * @param {Object} seasonalDynamics - 四季分组的动态数据 {spring: [], summer: [], autumn: [], winter: []}
 * @param {Object} options - 配置选项
 * @returns {Object} 四季词云数据
 */
export function generateSeasonalWordClouds(seasonalDynamics, options = {}) {
  const {
    maxWords = 50, // 每个季节的最大词数
    minLength = 2,
    minFrequency = 1, // 季节性数据可能较少，降低最小词频要求
  } = options;

  const result = {
    spring: [],
    summer: [],
    autumn: [],
    winter: [],
  };

  // 为每个季节生成词云数据
  Object.keys(result).forEach(season => {
    const dynamics = seasonalDynamics[season] || [];
    result[season] = generateWordCloudData(dynamics, {
      maxWords,
      minLength,
      minFrequency,
    });
  });

  return result;
}

/**
 * 获取年度关键词 TOP N
 * @param {Array} dynamics - 动态数据数组
 * @param {number} topN - 返回前N个关键词，默认10
 * @returns {Array<{word: string, count: number, rank: number}>} 关键词列表
 */
export function getTopKeywords(dynamics, topN = 10) {
  const wordCloudData = generateWordCloudData(dynamics, {
    maxWords: topN,
    minLength: 2,
    minFrequency: 2,
  });

  return wordCloudData.map(([word, count], index) => ({
    word,
    count,
    rank: index + 1,
  }));
}

/**
 * 为 wordcloud 库格式化数据
 * wordcloud 需要的格式：[[word, weight], ...] 或 [{word, weight}, ...]
 * @param {Array<[string, number]>} wordCloudData - 词云数据
 * @returns {Array<[string, number]>} 格式化后的数据
 */
export function formatForWordCloud(wordCloudData) {
  if (!wordCloudData || wordCloudData.length === 0) {
    return [];
  }

  // 归一化权重（将词频转换为相对权重，范围 1-100）
  const maxFrequency = Math.max(...wordCloudData.map(([, count]) => count));
  const minFrequency = Math.min(...wordCloudData.map(([, count]) => count));

  // 避免除以0
  const range = maxFrequency - minFrequency || 1;

  return wordCloudData.map(([word, count]) => {
    // 归一化到 10-100 的范围（保证最小的词也有一定大小）
    let normalizedWeight = 10 + ((count - minFrequency) / range) * 90;

    // 词长加权：长词获得额外权重
    const lengthBonus = word.length >= 4 ? 1.2 : (word.length === 3 ? 1.0 : 0.85);
    normalizedWeight = normalizedWeight * lengthBonus;

    return [word, Math.round(normalizedWeight)];
  });
}

/**
 * 获取四季名称的中文映射
 */
export const SEASON_NAMES = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};

/**
 * 获取四季的颜色主题
 */
export const SEASON_COLORS = {
  spring: {
    primary: '#7EC8A3', // 春天绿
    secondary: '#A8E6CF',
    gradient: ['#7EC8A3', '#A8E6CF', '#DCEDC1'],
  },
  summer: {
    primary: '#FFD93D', // 夏天黄
    secondary: '#FFBE7B',
    gradient: ['#FFD93D', '#FFBE7B', '#FFA07A'],
  },
  autumn: {
    primary: '#F4A460', // 秋天橙
    secondary: '#E8A87C',
    gradient: ['#F4A460', '#E8A87C', '#DDA15E'],
  },
  winter: {
    primary: '#87CEEB', // 冬天蓝
    secondary: '#B0C4DE',
    gradient: ['#87CEEB', '#B0C4DE', '#D3E0EA'],
  },
};

