import { useEffect, useState } from 'react';
import styles from './StatCard.module.less';

/**
 * 统计卡片组件
 * 用于展示单个统计数据，支持数字递增动画
 */
const StatCard = ({ title, value, suffix = '', icon, description, delay = 0, animate = true }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    // 延迟开始动画
    const startTimeout = setTimeout(() => {
      const duration = 1500; // 动画持续时间
      const steps = 60; // 动画步数
      const stepDuration = duration / steps;
      const stepValue = value / steps;

      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(stepValue * currentStep));
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [value, delay, animate]);

  return (
    <div className={styles.statCard}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.value}>
          {displayValue.toLocaleString()}
          {suffix && <span className={styles.suffix}>{suffix}</span>}
        </div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
    </div>
  );
};

export default StatCard;

