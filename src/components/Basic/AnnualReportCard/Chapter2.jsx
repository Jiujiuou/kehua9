import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./Chapter2.module.less";

const Chapter2 = ({ userNickname = "", dynamics = [] }) => {
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
        className={`${styles.content} ${showContent ? styles.fadeIn : styles.hidden}`}
      >
        <h2 className={styles.title}>第二章</h2>
        <p className={styles.description}>
          这里是第二章的内容，待完善...
        </p>
      </div>
    </div>
  );
};

Chapter2.propTypes = {
  userNickname: PropTypes.string,
  dynamics: PropTypes.array,
};

export default Chapter2;

