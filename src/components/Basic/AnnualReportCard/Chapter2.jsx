import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./Chapter2.module.less";
import WordCloud from "./WordCloud";

const Chapter2 = ({ dynamics = [] }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // 延迟显示内容，添加淡入动画
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={styles.chapter2Content}>
      <div
        className={`${styles.content} ${
          showContent ? styles.fadeIn : styles.hidden
        }`}
      >
        <div className={styles.wordCloudWrapper}>
          <WordCloud dynamics={dynamics} />
        </div>
      </div>
    </div>
  );
};

Chapter2.propTypes = {
  dynamics: PropTypes.array,
};

export default Chapter2;
