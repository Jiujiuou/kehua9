import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import ImagePreview from "@/components/Basic/ImagePreview";
import VideoPreview from "@/components/Basic/VideoPreview";
import DynamicCard from "@/components/Basic/DynamicCard";
import { PERSPECTIVE_LEXICON } from "@/constant";
import styles from "./Chapter3.module.less";

/**
 * 分析单条动态的视角倾向
 * @param {string} text - 动态文本
 * @returns {string} - 'intro' (内省), 'outro' (观察), 'neutral' (记录)
 */
function analyzePerspectiveOfOne(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return "neutral";
  }

  let introScore = 0;
  let outroScore = 0;

  // 1. 简单分词（用空格/标点分割）
  const segments = text.split(/[，。！？；,.!?;\s]+/);

  for (const segment of segments) {
    if (segment.length < 2) continue;

    let segIntroScore = 0;
    let segOutroScore = 0;

    // 2. 遍历词库计算本片段得分
    // 内向词检查
    for (const [category, data] of Object.entries(PERSPECTIVE_LEXICON.intro)) {
      for (const word of data.words) {
        if (segment.includes(word)) {
          segIntroScore += data.weight;
          // 如果出现强情感词，显著增加内向得分
          if (category === "emotion") segIntroScore += 0.5;
        }
      }
    }
    // 外向词检查
    for (const [, data] of Object.entries(PERSPECTIVE_LEXICON.outro)) {
      for (const word of data.words) {
        if (segment.includes(word)) {
          segOutroScore += data.weight;
        }
      }
    }

    // 3. 片段级判定：得分高的方向累加到全局
    if (segIntroScore > segOutroScore) {
      introScore += segIntroScore;
    } else if (segOutroScore > segIntroScore) {
      outroScore += segOutroScore;
    }
    // 如果相差不大，则忽略此片段，视为中性描述
  }

  // 4. 全局判定
  const threshold = 1.5; // 敏感度阈值，可调
  if (introScore - outroScore >= threshold) {
    return "intro";
  } else if (outroScore - introScore >= threshold) {
    return "outro";
  } else {
    return "neutral";
  }
}

/**
 * 提取文本的第一句话或前50个字符作为示例
 * @param {string} text - 动态文本
 * @returns {string} - 示例文本
 */
function extractExampleSentence(text) {
  if (!text || typeof text !== "string") return "";

  // 尝试按句号、问号、感叹号分割，取第一句
  const sentences = text.split(/[。！？.!?]/);
  if (sentences.length > 0 && sentences[0].trim().length > 0) {
    const firstSentence = sentences[0].trim();
    // 如果第一句太长，截取前50个字符
    return firstSentence.length > 50
      ? firstSentence.substring(0, 50) + "..."
      : firstSentence;
  }

  // 如果没有找到句子，直接截取前50个字符
  return text.trim().length > 50
    ? text.trim().substring(0, 50) + "..."
    : text.trim();
}

/**
 * 分析用户所有动态的视角比例
 * @param {Array} posts - 动态数组
 * @returns {Object} - 比例结果
 */
function analyzeAllPerspectives(posts) {
  if (!posts || posts.length === 0) {
    return {
      intro: 0,
      outro: 0,
      neutral: 100,
      counts: { intro: 0, outro: 0, neutral: 0 },
      dominantType: "neutral",
      examples: { intro: [], outro: [], neutral: [] },
    };
  }

  let introCount = 0,
    outroCount = 0,
    neutralCount = 0;
  const introPosts = [];
  const outroPosts = [];
  const neutralPosts = [];

  posts.forEach((post) => {
    const text = post?.text || "";
    const type = analyzePerspectiveOfOne(text);
    if (type === "intro") {
      introCount++;
      introPosts.push(post);
    } else if (type === "outro") {
      outroCount++;
      outroPosts.push(post);
    } else {
      neutralCount++;
      neutralPosts.push(post);
    }
  });

  const total = introCount + outroCount + neutralCount;

  // 计算精确的百分比（保留小数）
  const introPercentExact = (introCount / total) * 100;
  const outroPercentExact = (outroCount / total) * 100;
  const neutralPercentExact = (neutralCount / total) * 100;

  // 使用最大余数法确保百分比总和为100%
  // 先向下取整，然后按余数大小分配剩余的1%
  const percents = [
    { value: introPercentExact, index: 0 },
    { value: outroPercentExact, index: 1 },
    { value: neutralPercentExact, index: 2 },
  ];

  // 向下取整
  const floors = percents.map((p) => Math.floor(p.value));
  const remainders = percents.map((p) => p.value - Math.floor(p.value));

  // 计算总和
  const floorSum = floors.reduce((sum, val) => sum + val, 0);
  const diff = 100 - floorSum;

  // 按余数大小排序，分配剩余的百分比
  const sortedRemainders = remainders
    .map((r, i) => ({ remainder: r, index: i }))
    .sort((a, b) => b.remainder - a.remainder);

  // 分配剩余的百分比给余数最大的项
  for (let i = 0; i < diff; i++) {
    floors[sortedRemainders[i].index]++;
  }

  const introPercent = floors[0];
  const outroPercent = floors[1];
  const neutralPercent = floors[2];

  // 确定主导类型（使用精确值进行比较，避免舍入误差）
  let dominantType = "neutral";
  if (
    introPercentExact > outroPercentExact &&
    introPercentExact > neutralPercentExact
  ) {
    dominantType = "intro";
  } else if (
    outroPercentExact > introPercentExact &&
    outroPercentExact > neutralPercentExact
  ) {
    dominantType = "outro";
  }

  // 提取每个视角的典型例句（最多3条）
  const getExamples = (postList) => {
    return postList
      .slice(0, 3)
      .map((post) => extractExampleSentence(post?.text || ""))
      .filter((text) => text.length > 0);
  };

  return {
    intro: introPercent,
    outro: outroPercent,
    neutral: neutralPercent,
    counts: { intro: introCount, outro: outroCount, neutral: neutralCount },
    dominantType,
    examples: {
      intro: getExamples(introPosts),
      outro: getExamples(outroPosts),
      neutral: getExamples(neutralPosts),
    },
  };
}

/**
 * 添加个性化描述
 */
function addCharacterDescription(I, O, R) {
  const descriptors = [];

  if (I > 40) descriptors.push("感受细腻");
  if (O > 40) descriptors.push("观察敏锐");
  if (R > 40) descriptors.push("记录详实");
  if (Math.abs(I - O) < 10 && Math.abs(I - R) < 10)
    descriptors.push("表达平衡");
  if (I < 20 && O < 20) descriptors.push("聚焦当下");
  if (R < 20 && I > 40) descriptors.push("偏重内心");

  if (descriptors.length > 0) {
    return `这让你成为一个${descriptors.join("、")}的记录者。`;
  }
  return "";
}

/**
 * 生成视角总结文案
 */
function generatePerspectiveSummary(I, O, R) {
  // 1. 检查单一主导视角
  if (I > 65 && I - O > 30 && I - R > 30) {
    const variants = [
      `你是一个内在世界的细心观察者。在 ${I}% 的动态中，你都习惯看向自己的内心——那些"我觉得"、"我感到"、"回忆中"的时刻，是你与自己最真诚的对话。这种内省的习惯，让你在喧嚣中保留了倾听自己声音的空间。`,
      `你的表达，像是内心的一面镜子。${I}% 的动态都在映照自己的感受与思考。当你说着"心里"、"思念"、"安静"时，我们听见了内在河流的流淌声。这种向内探索的勇气，很珍贵。`,
      `嘿，我注意到你的动态里，有超过 ${I}% 都在表达自己的感受和想法。你似乎习惯把动态当作一面镜子，映照内心的涟漪。这样的记录方式，让每个瞬间都有了情感的重量。`,
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  if (O > 65 && O - I > 30 && O - R > 30) {
    const variants = [
      `你有一双捕捉世界细节的眼睛。${O}% 的动态都在描述你看到、听到、感受到的外部世界——窗外的雨、路边的花、天空的颜色。你通过观察与世界温柔连接，让平凡的事物都有了诗意的光芒。`,
      `你的文字常常是一扇窗，${O}% 的窗外风景被记录下来。那些关于"看见"、"发现"、"窗外"的叙述，让我们透过你的眼睛重新认识世界。这种观察力，是一种难得的天赋。`,
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  if (R > 65 && R - I > 30 && R - O > 30) {
    const variants = [
      `你是一个生活的忠实记录者。${R}% 的动态都在为时间留下具体的锚点——"今天"、"完成"、"遇到"、"去了"。这些看似平凡的记录，像日记本上的折角，标记着生活原本的模样。`,
      `你的动态像是时间的地图，${R}% 的标记都是具体的事件和日常。你用文字为每一天留下坐标，让回忆能够顺着"今天做了什么"的线索，找到回家的路。`,
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  // 2. 检查双视角组合
  if (I + O > 80 && I > 20 && O > 20) {
    if (I > O && I - R > 20) {
      return `你在内心与外界之间架起了一座桥。${I}% 的内省与 ${O}% 的观察相互交织——当外在的风景触动内在的感受，你的文字便有了双重的深度。这种内化与外化的平衡，让你的表达既敏感又丰富。`;
    }
    if (O > I && O - R > 20) {
      return `你的观察常常引发内心的回响。${O}% 的观察与 ${I}% 的内省如同和弦——看见一片云，想起一个人；听见一首歌，涌起一阵情绪。世界对你来说，既是风景也是镜子。`;
    }
    if (Math.abs(I - O) < 15) {
      return `你自如地在内在感受与外部观察间游走。${I}% 看向自己，${O}% 望向世界，两者几乎平分秋色。这种平衡让你既能感受内心的微澜，也能看见世界的细节。`;
    }
  }

  if (I + R > 80 && I > 20 && R > 20) {
    if (I > R && I - O > 20) {
      return `你既记录生活的轨迹，也不忘感受的温度。${I}% 的内省与 ${R}% 的记录相互映衬——事件因感受而深刻，感受因事件而具体。你的动态，是日记也是心情笔记。`;
    }
    if (R > I && R - O > 20) {
      return `你的记录常常带有感受的注脚。${R}% 的事件记载与 ${I}% 的情感表达交织在一起——不仅记录了"做了什么"，也记下了"感受到了什么"。这让日常有了双重的意义。`;
    }
  }

  if (O + R > 80 && O > 20 && R > 20) {
    return `你像一个带着笔记本的旅人，${O}% 观察世界，${R}% 记录旅程。你的动态既有眼前的风景，也有脚下的路径，让每一次停留都有了文字的形状。`;
  }

  // 3. 检查平衡型
  const maxVal = Math.max(I, O, R);
  const minVal = Math.min(I, O, R);
  if (maxVal - minVal < 15 && minVal > 20) {
    const variants = [
      `你的表达有一种美妙的平衡。内省（${I}%）、观察（${O}%）、记录（${R}%）几乎均匀分布在你的动态中。你像是三个视角的舞者，在感受、观看、记叙间自如旋转，让每一次表达都完整而立体。`,
      `你的动态是三维的——向内探索深度，向外拓展广度，在时间轴上留下印记。这种平衡不是刻意为之，而是你与世界对话的自然方式。`,
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  if (maxVal - minVal < 25) {
    const dominant = I > O && I > R ? "内省" : O > I && O > R ? "观察" : "记录";
    return `你在三种视角间找到了舒适的节奏。虽然 ${dominant} 视角稍多一些，但整体上你的表达兼顾了内心、外界与时间。这种包容性，让你的动态丰富多彩。`;
  }

  // 4. 检查边缘模式
  if (I < 15 && R > 50) {
    return `你很少直接谈论自己的感受（仅 ${I}%），更习惯通过具体事件的记录（${R}%）来承载一切。这或许意味着，你把情感都编织进了日常的经纬中。`;
  }

  if (O < 15 && I > 50) {
    return `你的目光更多看向自己的内在（${I}%），较少描述外部世界（仅 ${O}%）。但这让你的内心图景格外细腻清晰，每一个情绪的起伏都被温柔注视。`;
  }

  if (R < 15 && O > 40) {
    return `你很少记录具体事件（仅 ${R}%），但对外界的观察（${O}%）细致入微。你的动态更像是一幅幅印象派的画，捕捉瞬间的感受与氛围。`;
  }

  // 5. 检查两极分化
  if (maxVal > 55 && minVal < 20) {
    const high = I === maxVal ? "内省" : O === maxVal ? "观察" : "记录";
    const highPercent = I === maxVal ? I : O === maxVal ? O : R;
    const low = I === minVal ? "内省" : O === minVal ? "观察" : "记录";
    const lowPercent = I === minVal ? I : O === minVal ? O : R;
    return `你的表达有明显的侧重——${high} 视角占据主导（${highPercent}%），而 ${low} 视角则相对安静（${lowPercent}%）。这种选择性的表达，恰恰形成了你独特的叙述风格。`;
  }

  // 6. 默认通用
  const description = addCharacterDescription(I, O, R);
  return `你的表达有自己独特的韵律。内省（${I}%）、观察（${O}%）、记录（${R}%）以这样的比例组合，构成了你与世界对话的方式。这不是偏好，而是你真实的表达习惯。${description}`;
}

const Chapter3 = ({
  dynamics = [],
  // 样式配置，与 Preview 区域保持一致
  textIndent = true,
  paragraphSpacing = false,
  fontSize = 15,
  fontWeight = 400,
  fontFamily = "system",
  lineHeight = 1.6,
  contentGap = 12,
  borderRadius = 8,
  imageGap = 4,
  onPreviewClick,
}) => {
  const [showContent, setShowContent] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [previewVideoIndex, setPreviewVideoIndex] = useState(0);

  useEffect(() => {
    // 延迟显示内容，添加淡入动画
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // 找到最长和最短的动态
  const { longestPost, shortestPost } = useMemo(() => {
    if (!dynamics || dynamics.length === 0) {
      return { longestPost: null, shortestPost: null };
    }

    // 过滤出有文本内容的动态
    const postsWithText = dynamics.filter(
      (dynamic) => dynamic && dynamic.text && dynamic.text.trim().length > 0
    );

    if (postsWithText.length === 0) {
      return { longestPost: null, shortestPost: null };
    }

    // 找到最长和最短的动态
    let longest = postsWithText[0];
    let shortest = postsWithText[0];

    postsWithText.forEach((post) => {
      const textLength = post.text.trim().length;
      if (textLength > longest.text.trim().length) {
        longest = post;
      }
      if (textLength < shortest.text.trim().length) {
        shortest = post;
      }
    });

    return { longestPost: longest, shortestPost: shortest };
  }, [dynamics]);

  // 分析个人视角
  const perspectiveAnalysis = useMemo(() => {
    return analyzeAllPerspectives(dynamics);
  }, [dynamics]);

  // 生成视角总结文案
  const perspectiveSummary = useMemo(() => {
    if (!perspectiveAnalysis || dynamics.length === 0) return "";
    return generatePerspectiveSummary(
      perspectiveAnalysis.intro,
      perspectiveAnalysis.outro,
      perspectiveAnalysis.neutral
    );
  }, [perspectiveAnalysis, dynamics]);

  // 格式化日期时间显示（和 preview 区域保持一致）
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}`;
  };

  // 为 DynamicCard 准备动态数据（需要 date 和 time 字段）
  const prepareDynamicForCard = (dynamic) => {
    if (!dynamic) return null;
    return {
      ...dynamic,
      date: formatDateTime(dynamic.timestamp).split(" ")[0],
      time: formatDateTime(dynamic.timestamp).split(" ")[1] || "",
    };
  };

  // 找到动态在原始数组中的索引
  const findDynamicIndex = (targetDynamic) => {
    if (!targetDynamic) return 0;
    return dynamics.findIndex((d) => d.timestamp === targetDynamic.timestamp);
  };

  // 处理预览点击
  const handlePreviewClick = (dynamic) => {
    if (onPreviewClick) {
      const index = findDynamicIndex(dynamic);
      onPreviewClick(dynamic, index);
    }
  };

  return (
    <div className={styles.chapter3Content}>
      <div
        className={`${styles.content} ${
          showContent ? styles.fadeIn : styles.hidden
        }`}
      >
        <div className={styles.textWrapper}>
          <h2 className={styles.title}>表达光谱的两极</h2>
          <p className={styles.subtitle}>从最刹那的灵感，到最绵长的倾诉。</p>
        </div>

        {longestPost && shortestPost && (
          <div className={styles.postsContainer}>
            {/* 左侧：最刹那的火花 */}
            <div className={styles.postCard}>
              <div className={styles.postHeader}>
                <h3 className={styles.postTitle}>
                  最刹那的火花 · {shortestPost.text.trim().length}字
                </h3>
              </div>
              <DynamicCard
                dynamic={prepareDynamicForCard(shortestPost)}
                index={0}
                contentGap={contentGap}
                borderRadius={borderRadius}
                imageGap={imageGap}
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily={fontFamily}
                lineHeight={lineHeight}
                textIndent={textIndent}
                paragraphSpacing={paragraphSpacing}
                showPreviewButton={false}
                showDeleteButton={false}
                allowContentClickToPreview={true}
                onPreviewClick={handlePreviewClick}
                onImageClick={(images, imgIndex) => {
                  setPreviewImages(images);
                  setPreviewIndex(imgIndex);
                }}
                onVideoClick={(videos, vidIndex) => {
                  setPreviewVideos(videos);
                  setPreviewVideoIndex(vidIndex);
                }}
              />
              <p className={styles.postInterpretation}>
                瞬间的感受，也被你精准捕捉。
              </p>
            </div>

            {/* 右侧：最绵长的沉思 */}
            <div className={styles.postCard}>
              <div className={styles.postHeader}>
                <h3 className={styles.postTitle}>
                  最绵长的沉思 · {longestPost.text.trim().length}字
                </h3>
              </div>
              <DynamicCard
                dynamic={prepareDynamicForCard(longestPost)}
                index={1}
                contentGap={contentGap}
                borderRadius={borderRadius}
                imageGap={imageGap}
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily={fontFamily}
                lineHeight={lineHeight}
                textIndent={textIndent}
                paragraphSpacing={paragraphSpacing}
                showPreviewButton={false}
                showDeleteButton={false}
                textClassName={styles.truncatedText}
                allowContentClickToPreview={true}
                onPreviewClick={handlePreviewClick}
                onImageClick={(images, imgIndex) => {
                  setPreviewImages(images);
                  setPreviewIndex(imgIndex);
                }}
                onVideoClick={(videos, vidIndex) => {
                  setPreviewVideos(videos);
                  setPreviewVideoIndex(vidIndex);
                }}
              />
              <p className={styles.postInterpretation}>
                有些心事，需要足够的篇幅来安放。
              </p>
            </div>
          </div>
        )}

        {/* 个人视角分析区域 */}
        {perspectiveAnalysis && dynamics.length > 0 && (
          <div className={styles.perspectiveSection}>
            <div className={styles.perspectiveHeader}>
              <h3 className={styles.perspectiveTitle}>
                🌟 你的表达，有三种温度
              </h3>
              <p className={styles.perspectiveSubtitle}>
                这些视角，是你与世界的对话方式
              </p>
            </div>

            {/* 视角卡片展示 - 三个卡片并排 */}
            <div className={styles.perspectiveCards}>
              {/* 内省视角卡片 */}
              <div className={styles.perspectiveCard}>
                <div className={styles.cardIcon}>🔍</div>
                <h4 className={styles.cardTitle}>向内看</h4>
                <p className={styles.cardSubtitle}>倾听内心</p>
                <div className={styles.cardPercentage}>
                  {perspectiveAnalysis.intro}%
                </div>
              </div>

              {/* 观察视角卡片 */}
              <div className={styles.perspectiveCard}>
                <div className={styles.cardIcon}>👁</div>
                <h4 className={styles.cardTitle}>向外看</h4>
                <p className={styles.cardSubtitle}>观察世界</p>
                <div className={styles.cardPercentage}>
                  {perspectiveAnalysis.outro}%
                </div>
              </div>

              {/* 记录视角卡片 */}
              <div className={styles.perspectiveCard}>
                <div className={styles.cardIcon}>📝</div>
                <h4 className={styles.cardTitle}>记录</h4>
                <p className={styles.cardSubtitle}>书写日常</p>
                <div className={styles.cardPercentage}>
                  {perspectiveAnalysis.neutral}%
                </div>
              </div>
            </div>

            {/* 视角总结文案 */}
            {perspectiveSummary && (
              <div className={styles.perspectiveSummary}>
                <p className={styles.summaryText}>{perspectiveSummary}</p>
              </div>
            )}

            {/* 典型表达示例区域 */}
            <div className={styles.examplesSection}>
              {/* 内省视角示例 */}
              {perspectiveAnalysis.examples.intro.length > 0 && (
                <div className={styles.exampleGroup}>
                  <div className={styles.exampleGroupHeader}>
                    <span className={styles.exampleIcon}>🔍</span>
                    <span className={styles.exampleGroupTitle}>
                      当你这样说时，属于&ldquo;内省视角&rdquo;：
                    </span>
                  </div>
                  <div className={styles.exampleItems}>
                    {perspectiveAnalysis.examples.intro.map((example, idx) => (
                      <div key={idx} className={styles.exampleItem}>
                        &ldquo;{example}&rdquo;
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 观察视角示例 */}
              {perspectiveAnalysis.examples.outro.length > 0 && (
                <div className={styles.exampleGroup}>
                  <div className={styles.exampleGroupHeader}>
                    <span className={styles.exampleIcon}>👁</span>
                    <span className={styles.exampleGroupTitle}>
                      当你这样说时，属于&ldquo;观察视角&rdquo;：
                    </span>
                  </div>
                  <div className={styles.exampleItems}>
                    {perspectiveAnalysis.examples.outro.map((example, idx) => (
                      <div key={idx} className={styles.exampleItem}>
                        &ldquo;{example}&rdquo;
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 记录视角示例 */}
              {perspectiveAnalysis.examples.neutral.length > 0 && (
                <div className={styles.exampleGroup}>
                  <div className={styles.exampleGroupHeader}>
                    <span className={styles.exampleIcon}>📝</span>
                    <span className={styles.exampleGroupTitle}>
                      当你这样说时，属于&ldquo;记录视角&rdquo;：
                    </span>
                  </div>
                  <div className={styles.exampleItems}>
                    {perspectiveAnalysis.examples.neutral.map(
                      (example, idx) => (
                        <div key={idx} className={styles.exampleItem}>
                          &ldquo;{example}&rdquo;
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ImagePreview
        images={previewImages}
        currentIndex={previewIndex}
        onClose={() => {
          setPreviewImages([]);
          setPreviewIndex(0);
        }}
      />
      <VideoPreview
        videos={previewVideos}
        currentIndex={previewVideoIndex}
        onClose={() => {
          setPreviewVideos([]);
          setPreviewVideoIndex(0);
        }}
      />
    </div>
  );
};

Chapter3.propTypes = {
  dynamics: PropTypes.array,
  // 样式配置
  textIndent: PropTypes.bool,
  paragraphSpacing: PropTypes.bool,
  fontSize: PropTypes.number,
  fontWeight: PropTypes.number,
  fontFamily: PropTypes.string,
  lineHeight: PropTypes.number,
  contentGap: PropTypes.number,
  borderRadius: PropTypes.number,
  imageGap: PropTypes.number,
  // 事件处理
  onPreviewClick: PropTypes.func,
};

export default Chapter3;
