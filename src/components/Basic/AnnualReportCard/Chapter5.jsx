import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./Chapter5.module.less";

const Chapter5 = () => {
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    console.log("[Chapter5] 组件初始化");

    // 显示主标题
    const timer = setTimeout(() => {
      setShowTitle(true);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={styles.chapter5Content}>
      <div
        className={`${styles.chapter5Title} ${
          showTitle ? styles.fadeIn : styles.hidden
        }`}
      >
        漫长的告别
      </div>
    </div>
  );
};

Chapter5.propTypes = {};

export default Chapter5;
