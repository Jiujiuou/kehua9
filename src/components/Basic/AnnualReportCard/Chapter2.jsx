import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import ImagePreview from "@/components/Basic/ImagePreview";
import VideoPreview from "@/components/Basic/VideoPreview";
import DynamicCard from "@/components/Basic/DynamicCard";
import Padding from "@/components/Basic/Padding";
import { PERSPECTIVE_LEXICON } from "@/constant";
import styles from "./Chapter2.module.less";

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
      posts: { intro: [], outro: [], neutral: [] },
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
    // 返回完整的动态对象列表，用于展示
    posts: {
      intro: introPosts,
      outro: outroPosts,
      neutral: neutralPosts,
    },
  };
}

const Chapter2 = ({
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
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");
  const [showFirstSpark, setShowFirstSpark] = useState(false);
  const [showSecondMeditation, setShowSecondMeditation] = useState(false);
  const [showBottomContent, setShowBottomContent] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [previewVideoIndex, setPreviewVideoIndex] = useState(0);
  const [expandedIntro, setExpandedIntro] = useState(false);
  const [expandedOutro, setExpandedOutro] = useState(false);

  const SUBTITLE_TEXT = "从最刹那的灵感，到最绵长的倾诉。";

  // 延迟辅助函数
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 打字机效果
  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 100; // 每个字符的延迟（毫秒）
    let typingTimer = null;
    let initialDelayTimer = null;

    const typeText = () => {
      if (currentIndex < SUBTITLE_TEXT.length) {
        setDisplayedSubtitle(SUBTITLE_TEXT.slice(0, currentIndex + 1));
        currentIndex++;
        typingTimer = setTimeout(typeText, typingSpeed);
      } else {
        // 文字显示完成后，开始显示后面的内容
        const runAnimationSequence = async () => {
          // 先显示"最刹那的火花"和动态卡片
          await delay(2000);
          setShowFirstSpark(true);

          // 间隔 2s 后显示"最绵长的沉思"和动态卡片
          await delay(3000);
          setShowSecondMeditation(true);

          // 再间隔 2s 后显示底部内容
          await delay(3000);
          setShowBottomContent(true);
        };

        runAnimationSequence();
      }
    };

    // 切换到当前卡片后 500ms 再开启打字机效果
    initialDelayTimer = setTimeout(() => {
      typeText();
    }, 500);

    return () => {
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
      if (initialDelayTimer) {
        clearTimeout(initialDelayTimer);
      }
    };
  }, []);

  // 找到最长和最短的动态
  const { longestPost, shortestPost } = useMemo(() => {
    if (!dynamics || dynamics.length === 0) {
      return { longestPost: null, shortestPost: null };
    }

    // 过滤出有文本内容的动态
    const postsWithText = dynamics.filter(
      (dynamic) => dynamic && dynamic.text && dynamic.text.trim().length > 0,
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

  // 生成核心洞察句
  const coreInsight = useMemo(() => {
    if (!perspectiveAnalysis || dynamics.length === 0) return "";
    const { counts } = perspectiveAnalysis;

    // 如果某一类动态极少，调整文案
    if (counts.intro < 5 && counts.outro >= 5) {
      return "你的记录，是一幅细腻的内心导航图。你善于为每个事件落下感受的注脚，这让你写下的，不仅是日记，更是情绪的谱系。";
    }
    if (counts.outro < 5 && counts.intro >= 5) {
      return "你的记录，是一扇观察世界的窗。你习惯捕捉外部世界的生动细节，让平凡的日常充满了具体的画面与温度。";
    }

    // 默认情况：两种视角都有一定数量
    return "我们注意到，你的记录常在两种目光间轻柔地切换：";
  }, [perspectiveAnalysis, dynamics]);

  // 生成总结升华句
  const summarySentence = useMemo(() => {
    if (!perspectiveAnalysis || dynamics.length === 0) return "";
    const { dominantType } = perspectiveAnalysis;

    if (dominantType === "intro") {
      return "而更多时候，这些向内的目光，让平凡的日常，变成了你独特的、带有体温的日记。";
    } else if (dominantType === "outro") {
      return "而更多时候，这些向外的观察，让平凡的日常，变成了你独特的、充满画面感的记录。";
    } else {
      return "而更多时候，这两种目光交织在一起，让平凡的日常，变成了你独特的、带有体温的日记。";
    }
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
  const handlePreviewClick = (dynamic, index) => {
    if (onPreviewClick) {
      // 如果 index 未提供，则通过 findDynamicIndex 查找
      const finalIndex =
        index !== undefined ? index : findDynamicIndex(dynamic);
      onPreviewClick(dynamic, finalIndex);
    }
  };

  return (
    <div className={styles.chapter2Content}>
      <div className={styles.content}>
        <div className={styles.textWrapper}>
          <h2 className={styles.title}>表达光谱的两极</h2>
          <p className={styles.subtitle}>
            {displayedSubtitle}
            {displayedSubtitle.length < SUBTITLE_TEXT.length && (
              <span className={styles.cursor}>|</span>
            )}
          </p>
        </div>

        {longestPost && shortestPost && (
          <div className={styles.postsContainer}>
            {/* 左侧：最刹那的火花 */}
            {showFirstSpark && (
              <div className={`${styles.postCard} ${styles.fadeIn}`}>
                <div className={styles.postHeader}>
                  <h3 className={styles.postTitle}>
                    最刹那的火花 · {shortestPost.text.trim().length}字
                  </h3>
                  <p className={styles.postInterpretation}>
                    瞬间的感受，也被你精准捕捉。
                  </p>
                </div>
                <Padding height={12} />
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
              </div>
            )}

            {showFirstSpark && <Padding height={32} />}

            {/* 右侧：最绵长的沉思 */}
            {showSecondMeditation && (
              <div className={`${styles.postCard} ${styles.fadeIn}`}>
                <div className={styles.postHeader}>
                  <h3 className={styles.postTitle}>
                    最绵长的沉思 · {longestPost.text.trim().length}字
                  </h3>
                  <p className={styles.postInterpretation}>
                    有些心事，需要足够的篇幅来安放。
                  </p>
                </div>
                <Padding height={12} />

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
              </div>
            )}
          </div>
        )}

        {/* 你的文字重心分析区域 */}
        {showBottomContent &&
          perspectiveAnalysis &&
          dynamics.length > 0 &&
          perspectiveAnalysis.counts.intro >= 5 &&
          perspectiveAnalysis.counts.outro >= 5 && (
            <div className={`${styles.perspectiveSection} ${styles.fadeIn}`}>
              {/* 模块主标题 */}
              <div className={styles.perspectiveHeader}>
                <h3 className={styles.perspectiveTitle}>
                  你的文字，有两种重心
                </h3>
              </div>

              {/* 核心洞察句 */}
              {coreInsight && (
                <div className={styles.coreInsight}>
                  <p>{coreInsight}</p>
                </div>
              )}

              <Padding height={32} />

              {/* 向内与向外的并列阐述区 */}
              <div className={styles.perspectiveContent}>
                {/* 向内的描摹 */}
                {perspectiveAnalysis.posts.intro.length > 0 && (
                  <div className={styles.perspectiveBlock}>
                    <div className={styles.perspectiveBlockHeader}>
                      <h4 className={styles.perspectiveBlockTitle}>
                        向内的描摹
                      </h4>
                      <p className={styles.perspectiveBlockDescription}>
                        你习惯为事件落下感受的注脚，捕捉心绪的细微波动。
                      </p>
                      <p className={styles.perspectiveBlockSubDescription}>
                        &ldquo;这让你在记录&lsquo;发生了什么&rsquo;时，也诚实地回答了&lsquo;感觉如何&rsquo;。&rdquo;
                      </p>
                    </div>
                    <div className={styles.exampleCards}>
                      {(expandedIntro
                        ? perspectiveAnalysis.posts.intro
                        : perspectiveAnalysis.posts.intro.slice(0, 2)
                      ).map((dynamic, idx) => (
                        <div
                          key={dynamic.timestamp || idx}
                          className={styles.exampleCard}
                        >
                          <DynamicCard
                            dynamic={prepareDynamicForCard(dynamic)}
                            index={findDynamicIndex(dynamic)}
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
                        </div>
                      ))}
                      {perspectiveAnalysis.posts.intro.length > 2 && (
                        <button
                          className={styles.expandButton}
                          onClick={() => setExpandedIntro(!expandedIntro)}
                        >
                          {expandedIntro
                            ? "收起"
                            : `展开更多（${perspectiveAnalysis.posts.intro.length - 2}条）`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <Padding height={32} />

                {/* 向外的观察 */}
                {perspectiveAnalysis.posts.outro.length > 0 && (
                  <div className={styles.perspectiveBlock}>
                    <div className={styles.perspectiveBlockHeader}>
                      <h4 className={styles.perspectiveBlockTitle}>
                        向外的观察
                      </h4>
                      <p className={styles.perspectiveBlockDescription}>
                        你也时常像敏锐的镜头，定格外部世界的生动细节。
                      </p>
                      <p className={styles.perspectiveBlockSubDescription}>
                        &ldquo;这让你在描绘世界时，充满了具体的画面与温度。&rdquo;
                      </p>
                    </div>
                    <div className={styles.exampleCards}>
                      {(expandedOutro
                        ? perspectiveAnalysis.posts.outro
                        : perspectiveAnalysis.posts.outro.slice(0, 2)
                      ).map((dynamic, idx) => (
                        <div
                          key={dynamic.timestamp || idx}
                          className={styles.exampleCard}
                        >
                          <DynamicCard
                            dynamic={prepareDynamicForCard(dynamic)}
                            index={findDynamicIndex(dynamic)}
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
                        </div>
                      ))}
                      {perspectiveAnalysis.posts.outro.length > 2 && (
                        <button
                          className={styles.expandButton}
                          onClick={() => setExpandedOutro(!expandedOutro)}
                        >
                          {expandedOutro
                            ? "收起"
                            : `展开更多（${perspectiveAnalysis.posts.outro.length - 2}条）`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 总结升华句 */}
              {summarySentence && (
                <div
                  className={`${styles.summarySentence} ${
                    summarySentence.includes("这两种目光交织在一起")
                      ? styles.sparkleText
                      : ""
                  }`}
                >
                  <p>{summarySentence}</p>
                  {summarySentence.includes("这两种目光交织在一起") && (
                    <>
                      <span className={styles.sparkleDot1}></span>
                      <span className={styles.sparkleDot2}></span>
                      <span className={styles.sparkleDot3}></span>
                      <span className={styles.sparkleDot4}></span>
                      <span className={styles.sparkleDot5}></span>
                      <span className={styles.sparkleDot6}></span>
                    </>
                  )}
                </div>
              )}
              <Padding height={32} />
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

Chapter2.propTypes = {
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

export default Chapter2;
