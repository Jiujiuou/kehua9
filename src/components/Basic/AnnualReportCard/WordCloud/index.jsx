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
  const [wordCloudReady, setWordCloudReady] = useState(false); // 标记词云是否已渲染完成

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
        setWordCloudReady(false); // 重置状态，准备重新渲染
        renderWordCloud(data);
        setLoading(false);
        setError(null);
      } else {
        console.error("[WordCloud] Worker 处理失败:", workerError);
        setError(workerError || "处理文本时出错");
        setLoading(false);
        setWordCloudReady(false);
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
        setWordCloudReady(false); // 重置状态，准备重新渲染
        renderWordCloud(wordFrequencyRef.current);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [loading]);

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
    const height = container.clientHeight || 600;

    // 设置 Canvas 尺寸
    canvas.width = width;
    canvas.height = height;

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
      // hover 回调：当鼠标进入或离开词的区域时触发
      hover: function (item, dimension, event) {
        if (item) {
          // item 是 [word, weight, ...] 格式的数组
          const word = item[0];
          // 只有当词发生变化时才打印日志
          if (hoveredWordRef.current !== word) {
            hoveredWordRef.current = word;
            setHoveredWord(word);
            canvas.style.cursor = "pointer";
            console.log("Hover word:", word);
          }
        } else {
          // item 为 null 表示鼠标移出了词的区域
          // 只有当之前有 hover 的词时才打印日志
          if (hoveredWordRef.current !== null) {
            hoveredWordRef.current = null;
            setHoveredWord(null);
            canvas.style.cursor = "default";
          }
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
      // 标记词云已渲染完成
      setWordCloudReady(true);
      console.log("[WordCloud] 词云渲染完成");
    } catch (err) {
      console.error("[WordCloud] 词云渲染错误:", err);
      setError("词云渲染失败");
      setWordCloudReady(false);
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
    </div>
  );
};

WordCloudComponent.propTypes = {
  dynamics: PropTypes.array,
};

export default WordCloudComponent;
