import { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import WordCloudComponent from "../components/WordCloudComponent";
import {
  generateWordCloudData,
  formatForWordCloud,
} from "@/utils/wordCloudUtils";
import styles from "./WordCloudPage.module.less";

/**
 * 词云页
 */
const WordCloudPage = ({ reportData }) => {
  const { dynamics } = reportData;

  // 生成年度词云数据
  const wordCloudData = useMemo(() => {
    const data = generateWordCloudData(dynamics, {
      maxWords: 100,
      minLength: 2,
      minFrequency: 2,
    });
    const formattedData = formatForWordCloud(data);

    return formattedData;
  }, [dynamics]);

  const hasData = wordCloudData.length > 0;

  // 背景渐变色调色板 - 从背景图提取的颜色
  const gradientColors = useMemo(
    () => [
      "#B8C5E0", // 浅蓝紫色
      "#D4B5D8", // 淡紫色
      "#E8B8C8", // 粉紫色
      "#F0BFB6", // 淡粉色
      "#E6C0D0", // 玫瑰粉
      "#C8B8D8", // 薰衣草色
      "#D0C8E5", // 淡紫蓝
      "#E0B9C5", // 淡玫瑰
      "#DAB5C8", // 浅樱色
      "#D95062", // 主题色（深粉红）
      "#E8576B", // 珊瑚红
      "#F06F82", // 浅粉红
      "#D84457", // 深玫瑰红
      "#E66278", // 亮粉红
      "#C94D60", // 暗粉红
    ],
    []
  );

  // 颜色选择函数 - 使用 useCallback 缓存
  const colorFunction = useCallback(
    (word) => {
      // 根据词的哈希值选择颜色，保证同一个词始终是同一种颜色
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = word.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % gradientColors.length;
      return gradientColors[index];
    },
    [gradientColors]
  );

  return (
    <div className={styles.wordCloudPage}>
      <div className={styles.content}>
        <h2 className={styles.title}>你的2025关键词</h2>
        <p className={styles.subtitle}>{"这些词，藏着你的心情"}</p>

        {hasData ? (
          <div className={styles.cloudContainer}>
            <WordCloudComponent
              words={wordCloudData}
              width={800}
              height={600}
              backgroundColor="transparent"
              color={colorFunction}
            />
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>暂无足够的文字数据生成词云</p>
          </div>
        )}
      </div>
    </div>
  );
};

WordCloudPage.propTypes = {
  reportData: PropTypes.shape({
    dynamics: PropTypes.array,
    year: PropTypes.number,
    isFullReport: PropTypes.bool,
  }),
};

export default WordCloudPage;
