import React, { useState, useRef, useEffect } from "react";
import styles from "./index.module.css";

const Slider = ({ min = 0, max = 100, step = 1, value, onChange }) => {
  const [currentValue, setCurrentValue] = useState(value || min);

  // 同步外部value变化到内部状态
  useEffect(() => {
    if (value !== undefined && value !== currentValue) {
      setCurrentValue(value);
    }
  }, [value, currentValue]);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const sliderRef = useRef(null);

  const handleSliderClick = (e) => {
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const sliderWidth = rect.width;

    // 计算值
    const newValue =
      Math.round(((offsetX / sliderWidth) * (max - min)) / step) * step + min;
    setCurrentValue(newValue);
    onChange?.(newValue);
  };

  const handleThumbDrag = (e) => {
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    const offsetX = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const sliderWidth = rect.width;

    // 计算值
    const newValue =
      Math.round(((offsetX / sliderWidth) * (max - min)) / step) * step + min;
    setCurrentValue(newValue);
    onChange?.(newValue);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
    document.addEventListener("mousemove", handleThumbDrag);
    document.addEventListener(
      "mouseup",
      () => {
        document.removeEventListener("mousemove", handleThumbDrag);
        setIsDragging(false);
      },
      { once: true }
    );
  };

  // 格式化显示的数值，根据step决定精度
  const formatValue = (value) => {
    // 根据step决定小数位数
    if (step >= 1) {
      return Math.round(value);
    } else if (step >= 0.5) {
      // 步长0.5时：整数显示为整数，半数显示为.5
      return value % 1 === 0 ? Math.round(value) : Number(value.toFixed(1));
    } else if (step >= 0.1) {
      return Number(value.toFixed(1));
    } else if (step >= 0.01) {
      return Number(value.toFixed(2));
    }
    // 默认保留1位小数
    return Number(value.toFixed(1));
  };

  const thumbPosition = ((currentValue - min) / (max - min)) * 100;

  return (
    <div
      className={styles.slider}
      ref={sliderRef}
      onClick={handleSliderClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${thumbPosition}%` }}
        ></div>
      </div>
      <div
        className={styles.thumb}
        style={{ left: `${thumbPosition}%` }}
        onMouseDown={handleMouseDown}
      >
        {(isDragging || isHovering) && (
          <div className={styles.valueTooltip}>{formatValue(currentValue)}</div>
        )}
      </div>
    </div>
  );
};

export default Slider;
