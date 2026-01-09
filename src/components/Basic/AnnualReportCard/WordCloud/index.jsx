import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import WordCloud from "wordcloud";
import { extractTextFromDynamics } from "@/utils/wordCloud/textProcessor";
import { getColorByFrequency } from "@/utils/wordCloud/colorGenerator";
import WordCloudWorker from "./wordCloud.worker.js?worker";
import styles from "./index.module.less";

const WordCloudComponent = ({ dynamics = [] }) => {
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const wordFrequencyRef = useRef(null); // 存储词频数据，用于响应式重新渲染
  const hoveredWordRef = useRef(null); // 当前 hover 的词
  const [hoveredWord, setHoveredWord] = useState(null); // 用于显示 hover 状态
  const [relatedTexts, setRelatedTexts] = useState([]); // 与 hover 词相关的文本片段列表（最多3条）

  useEffect(() => {
    if (!dynamics || dynamics.length === 0) {
      setLoading(false);
      wordFrequencyRef.current = null;
      return;
    }

    // 提取文本
    const text = extractTextFromDynamics(dynamics);

    if (!text || text.trim().length === 0) {
      setLoading(false);
      wordFrequencyRef.current = null;
      return;
    }

    setLoading(true);

    // 清理旧的 Worker
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    // 创建 Worker
    workerRef.current = new WordCloudWorker();

    // 监听 Worker 消息
    workerRef.current.onmessage = (event) => {
      const { success, data, error: workerError } = event.data;

      if (success && data && data.length > 0) {
        wordFrequencyRef.current = data;
        renderWordCloud(data);
        setLoading(false);
        setError(null);
      } else {
        console.error("[WordCloud] Worker 处理失败:", workerError);
        setError(workerError || "处理文本时出错");
        setLoading(false);
        wordFrequencyRef.current = null;
      }
    };

    // 发送文本到 Worker
    workerRef.current.postMessage({ text });

    // 清理函数
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [dynamics]);

  // 响应式处理：当窗口大小变化时，只重新渲染，不重新处理数据
  useEffect(() => {
    if (!containerRef.current || loading) return;

    const resizeObserver = new ResizeObserver(() => {
      // 当容器大小变化时，使用已存储的词频数据重新渲染
      if (canvasRef.current && wordFrequencyRef.current) {
        renderWordCloud(wordFrequencyRef.current);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [loading]);

  // 高亮关键词的函数（复用搜索的高亮逻辑）
  const highlightKeyword = (text, keyword) => {
    if (!keyword || !text) return text;

    const regex = new RegExp(
      `(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === keyword.toLowerCase()) {
        return (
          <mark key={index} className={styles.highlight}>
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  // 提取某个词的相关文本片段（最多3条）
  const extractRelatedTexts = (word) => {
    const related = [];
    if (dynamics && Array.isArray(dynamics) && word) {
      for (const dynamic of dynamics) {
        if (dynamic && dynamic.text && dynamic.text.includes(word)) {
          // 提取包含关键词的片段
          const text = dynamic.text;

          // 尝试按句子分割，找到包含关键词的句子
          const sentences = text.split(/[。！？\n]/);
          const sentenceWithKeyword = sentences.find((sentence) =>
            sentence.includes(word)
          );

          if (sentenceWithKeyword) {
            // 如果找到包含关键词的句子，使用该句子
            let snippet = sentenceWithKeyword.trim();

            // 如果句子太长（超过50个字符），提取关键词前后各25个字符
            if (snippet.length > 50) {
              const keywordIndex = snippet.indexOf(word);
              if (keywordIndex !== -1) {
                const contextLength = 25;
                const start = Math.max(0, keywordIndex - contextLength);
                const end = Math.min(
                  snippet.length,
                  keywordIndex + word.length + contextLength
                );
                snippet = snippet.substring(start, end);

                if (start > 0) {
                  snippet = "..." + snippet;
                }
                if (end < sentenceWithKeyword.trim().length) {
                  snippet = snippet + "...";
                }
              }
            }

            related.push(snippet);
            if (related.length >= 3) {
              break;
            }
          } else {
            // 如果没有找到完整句子，使用固定字符数提取
            const keywordIndex = text.indexOf(word);
            if (keywordIndex !== -1) {
              const contextLength = 30;
              const start = Math.max(0, keywordIndex - contextLength);
              const end = Math.min(
                text.length,
                keywordIndex + word.length + contextLength
              );
              let snippet = text.substring(start, end);

              if (start > 0) {
                snippet = "..." + snippet;
              }
              if (end < text.length) {
                snippet = snippet + "...";
              }

              related.push(snippet);
              if (related.length >= 3) {
                break;
              }
            }
          }
        }
      }
    }
    return related;
  };

  const renderWordCloud = (wordFrequency) => {
    if (!canvasRef.current || !wordFrequency || wordFrequency.length === 0) {
      console.warn("[WordCloud] 渲染条件不满足:", {
        hasCanvas: !!canvasRef.current,
        hasData: !!wordFrequency,
        dataLength: wordFrequency?.length || 0,
      });
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!container) {
      console.warn("[WordCloud] 容器不存在");
      return;
    }

    const width = container.clientWidth || 800;
    // 保持合理的宽高比，避免文字被拉伸（使用 4:3 的比例）
    const aspectRatio = 4 / 3;
    const idealHeight = Math.round(width / aspectRatio);
    // 使用容器高度和理想高度中的较小值，但不要太小
    const height = Math.max(
      Math.min(container.clientHeight || 600, idealHeight),
      Math.round(width * 0.6)
    );

    // 设置 Canvas 尺寸（像素尺寸）
    canvas.width = width;
    canvas.height = height;

    // 确保 CSS 尺寸与像素尺寸匹配，避免拉伸
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // 计算最大词频和最小词频
    const frequencies = wordFrequency.map(([, freq]) => freq);
    const maxFrequency = Math.max(...frequencies);
    const minFrequency = Math.min(...frequencies);

    // 根据 Canvas 大小计算合适的字体大小范围
    const minFontSize = Math.max(10, Math.min(width, height) / 30);
    const maxFontSize = Math.max(30, Math.min(width, height) / 8);

    // 确定需要横着显示的高频词数量（前10个或前20%的词，确保更多高频词横着显示）
    const topWordsCount = Math.min(
      10,
      Math.max(5, Math.ceil(wordFrequency.length * 0.2))
    );
    const topWords = new Set(
      wordFrequency.slice(0, topWordsCount).map(([word]) => word)
    );

    // 配置词云选项
    const options = {
      list: wordFrequency.slice(0, 40),
      gridSize: Math.max(4, Math.round((8 * width) / 1024)),
      weightFactor: function (size) {
        // size 是词频值，将其映射到合理的字体大小范围
        if (maxFrequency === minFrequency) {
          return (minFontSize + maxFontSize) / 2;
        }
        // 线性映射：最小词频 -> minFontSize, 最大词频 -> maxFontSize
        const ratio = (size - minFrequency) / (maxFrequency - minFrequency);
        const fontSize = minFontSize + ratio * (maxFontSize - minFontSize);
        return fontSize;
      },
      fontFamily: "Arial, sans-serif",
      color: function (word, _weight, _fontSize, _distance, _theta) {
        // 根据词频设置颜色
        const freq = wordFrequency.find(([w]) => w === word)?.[1] || 1;
        return getColorByFrequency(freq, maxFrequency);
      },
      // 自定义旋转函数：高频词横着显示（角度为0），其他词可以旋转
      rotate: function (word, _weight, _fontSize, _distance, _theta) {
        // 如果是高频词，强制横着显示（角度为0）
        if (topWords.has(word)) {
          return 0;
        }
        // 其他词随机旋转：50% 的概率旋转，旋转角度为 0, 90, -90 度
        if (Math.random() < 0.5) {
          const steps = [0, 90, -90];
          return steps[Math.floor(Math.random() * steps.length)];
        }
        return 0;
      },
      backgroundColor: "transparent",
      minSize: minFontSize,
      drawOutOfBound: false,
      // 设置词云起始位置，让词云更居中，减少上下空白
      // 使用 height * 0.45 让词云稍微偏上，减少底部空白
      origin: [width / 2, height * 0.45],
      // 启用自适应填充，让词云更好地填充可用空间
      shrinkToFit: true,
      // hover 回调：当鼠标进入或离开词的区域时触发
      hover: function (item, dimension, event) {
        if (item) {
          // item 是 [word, weight, ...] 格式的数组
          const word = item[0];
          // 只有当词发生变化时才处理
          if (hoveredWordRef.current !== word) {
            hoveredWordRef.current = word;
            setHoveredWord(word);
            canvas.style.cursor = "pointer";
            console.log("Hover word:", word);

            // 提取该词的相关文本片段
            const related = extractRelatedTexts(word);
            setRelatedTexts(related);
          }
        } else {
          // item 为 null 表示鼠标移出了词的区域
          // 保持最后 hover 的词，不清空
          canvas.style.cursor = "default";
        }
      },
      // click 回调：当点击词时触发
      click: function (item, dimension, event) {
        if (item) {
          const word = item[0];
          console.log("Click word:", word, item, dimension);
        }
      },
    };

    try {
      // WordCloud 函数会使用 options 中的 hover 和 click 回调
      WordCloud(canvas, options);
      console.log("[WordCloud] 词云渲染完成");

      // 渲染完成后，默认展示词频最高的词
      if (wordFrequency && wordFrequency.length > 0) {
        const topWord = wordFrequency[0][0]; // 词频最高的词
        hoveredWordRef.current = topWord;
        setHoveredWord(topWord);
        const related = extractRelatedTexts(topWord);
        setRelatedTexts(related);
      }
    } catch (err) {
      console.error("[WordCloud] 词云渲染错误:", err);
      setError("词云渲染失败");
    }
  };

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.wordCloudWrapper}>
      <div className={styles.titleSection}>
        <h2 className={styles.title}>你的个人词典</h2>
        <p className={styles.subtitle}>
          词语的大小，代表它在你的世界里占据的分量。
        </p>
      </div>
      <div ref={containerRef} className={styles.wordCloudContainer}>
        {loading && (
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>正在生成词云...</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={styles.wordCloudCanvas}
          style={{ display: loading ? "none" : "block" }}
        />
      </div>
      {relatedTexts.length > 0 && (
        <div className={styles.relatedDynamicsContainer}>
          {relatedTexts.map((text, index) => (
            <div key={index} className={styles.relatedDynamicItem}>
              {hoveredWord ? highlightKeyword(text, hoveredWord) : text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

WordCloudComponent.propTypes = {
  dynamics: PropTypes.array,
};

export default WordCloudComponent;
