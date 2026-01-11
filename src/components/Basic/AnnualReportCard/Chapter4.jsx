import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { analyzeEmotionsBatch } from "@/utils/emotionAnalysis";
import {
  EMOTION_IDS,
  EMOTION_CATEGORIES,
  ANNUAL_REPORT_END_DATE,
} from "@/constant";
import {
  calculateYearlyEmotionData,
  extractYearColor,
} from "@/utils/timeColorGenerator";
import TimeColorGrid from "./TimeColorGrid";
import styles from "./Chapter4.module.less";

const Chapter4 = ({ dynamics = [] }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionStats, setEmotionStats] = useState(null);
  const [showSpectrum, setShowSpectrum] = useState(false);
  const [yearlyColorData, setYearlyColorData] = useState([]);
  const [showTimeColors, setShowTimeColors] = useState(false);

  useEffect(() => {
    console.log("[Chapter4] 组件初始化");
    console.log("[Chapter4] 接收到的动态数量:", dynamics.length);

    // 先显示主标题
    const timer1 = setTimeout(() => {
      setShowTitle(true);
    }, 300);

    // 然后显示副标题
    const timer2 = setTimeout(() => {
      setShowSubtitle(true);
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // 分析所有动态的情绪
  useEffect(() => {
    if (!dynamics || !Array.isArray(dynamics) || dynamics.length === 0) {
      console.log("[Chapter4] 没有动态数据，跳过分析");
      return;
    }

    const analyzeAllEmotions = async () => {
      console.log("\n\n");
      console.log("========================================");
      console.log("[Chapter4] ========== 开始分析所有动态的情绪 ==========");
      console.log("[Chapter4] 动态总数:", dynamics.length);
      console.log("[Chapter4] 代码版本: v2.0 - 改进版分词逻辑");
      console.log("========================================");

      // 检查 KEYWORD_INDEX
      const { KEYWORD_INDEX } = await import("@/constant");
      console.log(
        "[Chapter4] KEYWORD_INDEX 大小:",
        Object.keys(KEYWORD_INDEX).length
      );
      console.log(
        "[Chapter4] KEYWORD_INDEX 示例:",
        Object.keys(KEYWORD_INDEX).slice(0, 10)
      );
      console.log("[Chapter4] '开心' 在索引中:", !!KEYWORD_INDEX["开心"]);
      console.log("[Chapter4] '开心' 详情:", KEYWORD_INDEX["开心"]);
      console.log("[Chapter4] '难过' 在索引中:", !!KEYWORD_INDEX["难过"]);
      console.log("[Chapter4] '难过' 详情:", KEYWORD_INDEX["难过"]);

      // 测试：检查一条包含"开心"的文本
      const testText = "今天很开心";
      console.log("[Chapter4] 测试文本:", testText);
      for (let len = 4; len >= 2; len--) {
        for (let i = 0; i <= testText.length - len; i++) {
          const phrase = testText.substring(i, i + len);
          if (KEYWORD_INDEX[phrase]) {
            console.log(
              `[Chapter4] ✅ 测试匹配成功: "${phrase}" -> ${KEYWORD_INDEX[phrase].emotionId}`
            );
          }
        }
      }

      setIsAnalyzing(true);

      try {
        // 提取文本
        const texts = dynamics.filter((d) => d && d.text).map((d) => d.text);

        console.log("[Chapter4] 提取到的文本数量:", texts.length);
        console.log("[Chapter4] 文本列表:", texts);

        // 批量分析
        const results = await analyzeEmotionsBatch(texts, 10);

        console.log("\n\n");
        console.log("========================================");
        console.log("[Chapter4] ========== 分析完成 ==========");
        console.log("[Chapter4] 分析结果数量:", results.length);
        console.log("[Chapter4] 所有结果:", results);
        console.log("========================================");

        // 统计各情绪的数量
        const stats = {};
        results.forEach((result) => {
          const emotionId = result.primary.emotionId;
          stats[emotionId] = (stats[emotionId] || 0) + 1;
        });

        // 计算百分比并排序
        const emotionList = Object.keys(stats)
          .map((emotionId) => {
            const count = stats[emotionId];
            const percentage = (count / results.length) * 100;
            return {
              emotionId,
              name: EMOTION_CATEGORIES[emotionId].name,
              color: EMOTION_CATEGORIES[emotionId].color,
              description: EMOTION_CATEGORIES[emotionId].description,
              count,
              percentage: parseFloat(percentage.toFixed(1)),
            };
          })
          .sort((a, b) => b.percentage - a.percentage);

        // 找到最常见的情绪
        const mostCommonEmotion = emotionList[0];

        setEmotionStats({
          list: emotionList,
          mostCommon: mostCommonEmotion,
          total: results.length,
        });

        console.log("\n[Chapter4] ========== 情绪统计 ==========");
        emotionList.forEach((emotion) => {
          console.log(
            `[Chapter4] ${emotion.name}: ${emotion.count} 条 (${emotion.percentage}%)`
          );
        });
        console.log("========================================\n");

        // 延迟显示光谱图
        setTimeout(() => {
          setShowSpectrum(true);
        }, 500);

        // 打印非平静的动态及其捕获到的词
        console.log("\n[Chapter4] ========== 非平静动态详情 ==========");
        const nonCalmResults = [];

        results.forEach((result, index) => {
          if (result.primary.emotionId !== EMOTION_IDS.CALM) {
            const originalText = texts[index] || "";
            nonCalmResults.push({
              index: index + 1,
              text: originalText,
              result: result,
            });
          }
        });

        console.log(`[Chapter4] 非平静动态总数: ${nonCalmResults.length}`);
        console.log("\n");

        nonCalmResults.forEach(({ index, text, result }) => {
          const emotionName = result.primary.name;
          const emotionId = result.primary.emotionId;
          const intensity = result.primary.intensity.toFixed(2);
          const confidence = result.primary.confidence.toFixed(2);

          // 提取捕获到的词
          const capturedWords = [];

          // 从主情感中提取词
          if (
            result.primary.words &&
            Array.isArray(result.primary.words) &&
            result.primary.words.length > 0
          ) {
            result.primary.words.forEach((w) => {
              if (w && w.word) {
                capturedWords.push({
                  word: w.word,
                  intensity:
                    typeof w.intensity === "number"
                      ? w.intensity.toFixed(2)
                      : w.intensity,
                  emotionId:
                    w.finalEmotionId ||
                    w.originalEmotionId ||
                    result.primary.emotionId,
                  originalEmotionId: w.originalEmotionId,
                });
              }
            });
          }

          // 如果有次情感，也提取词
          if (
            result.secondary &&
            result.secondary.words &&
            Array.isArray(result.secondary.words)
          ) {
            result.secondary.words.forEach((w) => {
              if (w && w.word) {
                capturedWords.push({
                  word: w.word,
                  intensity:
                    typeof w.intensity === "number"
                      ? w.intensity.toFixed(2)
                      : w.intensity,
                  emotionId:
                    w.finalEmotionId ||
                    w.originalEmotionId ||
                    result.secondary.emotionId,
                  originalEmotionId: w.originalEmotionId,
                });
              }
            });
          }

          // 去重（同一个词可能在不同情感中出现）
          const uniqueWords = [];
          const seenWords = new Set();
          capturedWords.forEach((w) => {
            const key = `${w.word}_${w.emotionId}`;
            if (!seenWords.has(key)) {
              seenWords.add(key);
              uniqueWords.push(w);
            }
          });

          console.log(`\n[Chapter4] --- 动态 #${index} ---`);
          console.log(
            `[Chapter4] 文本: "${text.substring(0, 50)}${
              text.length > 50 ? "..." : ""
            }"`
          );
          console.log(`[Chapter4] 主情绪: ${emotionName} (${emotionId})`);
          console.log(`[Chapter4] 强度: ${intensity}, 置信度: ${confidence}`);

          if (uniqueWords.length > 0) {
            console.log(`[Chapter4] 捕获到的词 (${uniqueWords.length}个):`);
            uniqueWords.forEach((w, i) => {
              const emotionName =
                EMOTION_CATEGORIES[w.emotionId]?.name || w.emotionId;
              const emotionChange =
                w.originalEmotionId && w.originalEmotionId !== w.emotionId
                  ? ` (原: ${
                      EMOTION_CATEGORIES[w.originalEmotionId]?.name ||
                      w.originalEmotionId
                    })`
                  : "";
              console.log(
                `[Chapter4]   ${i + 1}. "${
                  w.word
                }" -> ${emotionName}${emotionChange} (强度: ${w.intensity})`
              );
            });
          } else {
            console.log(
              `[Chapter4] ⚠️ 未捕获到具体词汇（可能是通过句子结构或表情符号识别）`
            );
            // 显示所有情感信息以便调试
            console.log(`[Chapter4] 调试信息:`, {
              primaryWords: result.primary.words,
              secondaryWords: result.secondary?.words,
              allEmotions: result.allEmotions,
            });
          }

          // 如果有次情感，也显示
          if (result.secondary) {
            console.log(
              `[Chapter4] 次情绪: ${result.secondary.name} (${
                result.secondary.emotionId
              }), 强度: ${result.secondary.intensity.toFixed(2)}`
            );
          }

          // 如果是混合情感
          if (result.isMixed) {
            console.log(
              `[Chapter4] 🔀 混合情感，混合比例: ${(
                result.mixedRatio * 100
              ).toFixed(1)}%`
            );
          }
        });

        console.log("\n[Chapter4] ========================================\n");

        // 生成年度色彩数据
        console.log("\n[Chapter4] ========== 开始生成年度色彩 ==========");
        console.log("[Chapter4] 动态数据总数:", dynamics.length);
        console.log("[Chapter4] 情绪分析结果总数:", results.length);

        try {
          // 获取截止日期
          const cutoffDate = new Date(ANNUAL_REPORT_END_DATE);
          cutoffDate.setHours(23, 59, 59, 999); // 设置为当天的最后一刻

          console.log("[Chapter4] 年度报告截止日期:", ANNUAL_REPORT_END_DATE);

          // 按年份分组动态数据
          const dynamicsByYear = {};
          dynamics.forEach((dynamic, index) => {
            let year = null;
            let dynamicDate = null;

            // 优先使用 date 属性
            if (dynamic.date) {
              dynamicDate = new Date(dynamic.date + "T00:00:00");
              year = parseInt(dynamic.date.split("-")[0]);
            }
            // 如果没有 date，尝试从 timestamp 提取
            else if (dynamic.timestamp) {
              dynamicDate = new Date(dynamic.timestamp);
              if (!isNaN(dynamicDate.getTime())) {
                year = dynamicDate.getFullYear();
              }
            }

            // 检查年份有效性，并且日期必须在截止日期之前
            if (
              year &&
              !isNaN(year) &&
              year > 1900 &&
              year < 2100 &&
              dynamicDate &&
              !isNaN(dynamicDate.getTime()) &&
              dynamicDate <= cutoffDate
            ) {
              if (!dynamicsByYear[year]) {
                dynamicsByYear[year] = {
                  dynamics: [],
                  emotionResults: [],
                };
              }
              dynamicsByYear[year].dynamics.push(dynamic);
              if (results[index]) {
                dynamicsByYear[year].emotionResults.push(results[index]);
              }
            } else {
              if (dynamicDate && dynamicDate > cutoffDate) {
                console.log(
                  `[Chapter4] 跳过超过截止日期的动态，日期: ${
                    dynamic.date || dynamic.timestamp
                  }, 截止日期: ${ANNUAL_REPORT_END_DATE}`
                );
              } else {
                console.warn(
                  `[Chapter4] 无法提取年份或日期无效，动态索引: ${index}`,
                  dynamic
                );
              }
            }
          });

          console.log(
            "[Chapter4] 按年份分组完成，年份数:",
            Object.keys(dynamicsByYear).length
          );
          console.log(
            "[Chapter4] 年份列表:",
            Object.keys(dynamicsByYear).sort()
          );

          // 打印每个年份的统计信息
          Object.keys(dynamicsByYear).forEach((year) => {
            const { dynamics: yearDynamics, emotionResults: yearResults } =
              dynamicsByYear[year];
            console.log(
              `[Chapter4] ${year}年: ${yearDynamics.length}条动态, ${yearResults.length}条分析结果`
            );
          });

          // 为每年生成色彩数据
          const yearlyColors = [];
          Object.keys(dynamicsByYear)
            .sort()
            .forEach((yearStr) => {
              const year = parseInt(yearStr);
              const { dynamics: yearDynamics, emotionResults: yearResults } =
                dynamicsByYear[year];

              if (yearDynamics.length > 0 && yearResults.length > 0) {
                const yearEmotionData = calculateYearlyEmotionData(
                  year,
                  yearDynamics,
                  yearResults
                );

                if (yearEmotionData) {
                  const colorData = extractYearColor(yearEmotionData);
                  yearlyColors.push(colorData);
                  console.log(
                    `[Chapter4] ${year}年色彩: ${colorData.baseColor.name} (${colorData.baseColor.hex})`
                  );
                }
              }
            });

          console.log("[Chapter4] 生成的年度色彩数量:", yearlyColors.length);

          if (yearlyColors.length > 0) {
            setYearlyColorData(yearlyColors);

            // 延迟显示时光色卡
            setTimeout(() => {
              setShowTimeColors(true);
              console.log("[Chapter4] 时光色卡已显示");
            }, 1000);
          } else {
            console.warn("[Chapter4] 没有生成任何年度色彩数据");
          }
        } catch (error) {
          console.error("[Chapter4] 生成年度色彩时出错:", error);
          console.error("[Chapter4] 错误详情:", error.stack);
        }
      } catch (error) {
        console.error("[Chapter4] 分析过程中出错:", error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // 延迟一点再开始分析，确保标题已经显示
    const timer = setTimeout(() => {
      analyzeAllEmotions();
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [dynamics]);

  return (
    <div className={styles.chapter4Content}>
      <div
        className={`${styles.chapter4Title} ${
          showTitle ? styles.fadeIn : styles.hidden
        }`}
      >
        情绪全景
      </div>
      {showTitle && (
        <div
          className={`${styles.chapter4Subtitle} ${
            showSubtitle ? styles.fadeIn : styles.hidden
          }`}
        >
          每一种情绪，都是当时的真实
        </div>
      )}

      {isAnalyzing && (
        <div className={styles.analyzingText}>正在分析情绪...</div>
      )}

      {!isAnalyzing && emotionStats && (
        <>
          <div className={styles.spectrumContainer}>
            <div className={styles.spectrumTitle}>你的情绪光谱分布</div>

            <div className={styles.spectrumList}>
              {emotionStats.list.map((emotion, index) => (
                <div
                  key={emotion.emotionId}
                  className={`${styles.spectrumItem} ${
                    showSpectrum ? styles.fadeIn : styles.hidden
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={styles.emotionLabel}>
                    <span
                      className={styles.emotionColorDot}
                      style={{ backgroundColor: emotion.color }}
                    />
                    <span className={styles.emotionName}>{emotion.name}</span>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBar}
                      style={{
                        width: `${emotion.percentage}%`,
                        backgroundColor: emotion.color,
                      }}
                    />
                  </div>
                  <div className={styles.emotionPercentage}>
                    {emotion.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {emotionStats.mostCommon && (
            <div
              className={`${styles.mostCommonEmotion} ${
                showSpectrum ? styles.fadeIn : styles.hidden
              }`}
              style={{ animationDelay: `${emotionStats.list.length * 100}ms` }}
            >
              <div className={styles.mostCommonTitle}>
                最常见的情绪：{emotionStats.mostCommon.name}
              </div>
              <div className={styles.mostCommonDescription}>
                &ldquo;{emotionStats.mostCommon.description}&rdquo;
              </div>
            </div>
          )}

          {showTimeColors && (
            <div
              className={`${styles.timeColorSection} ${
                showTimeColors ? styles.fadeIn : styles.hidden
              }`}
              style={{
                animationDelay: `${(emotionStats.list.length + 1) * 100}ms`,
              }}
            >
              <div className={styles.timeColorTitle}>时光色卡</div>
              <div className={styles.timeColorSubtitle}>
                每一年，都有独特的情绪底色
              </div>
              {console.log("[Chapter4] 渲染时光色卡，数据:", yearlyColorData)}
              <TimeColorGrid yearlyColorData={yearlyColorData} />
            </div>
          )}

          {!showTimeColors && !isAnalyzing && emotionStats && (
            <div className={styles.timeColorSection}>
              <div className={styles.timeColorTitle}>时光色卡</div>
              <div className={styles.timeColorSubtitle}>
                每一年，都有独特的情绪底色
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                }}
              >
                正在生成年度色彩...
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

Chapter4.propTypes = {
  dynamics: PropTypes.array,
};

export default Chapter4;
