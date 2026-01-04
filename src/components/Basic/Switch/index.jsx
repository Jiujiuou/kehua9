/**
 * Switch 组件
 *
 * 功能：提供开关切换功能，支持多个选项之间的切换
 * 用途：用于在多个互斥选项之间进行选择，带有平滑的动画效果
 * 使用位置：
 * - 设置项的开关切换
 * - 视图模式切换（如列表/网格）
 * - 标签页切换
 * - 任何需要在有限选项间切换的场景
 *
 * 主要参数：
 * - options: 选项数组，每个选项包含 { value, label, icon }
 * - value: 当前选中的值
 * - onChange: 切换时的回调函数
 * - size: 尺寸，可选值：'small'、'medium'(默认)
 *
 * 使用示例：
 * <Switch
 *   options={[
 *     { value: 'list', label: '列表', icon: <FiList /> },
 *     { value: 'grid', label: '网格', icon: <FiGrid /> }
 *   ]}
 *   value={viewMode}
 *   onChange={setViewMode}
 * />
 */
import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import styles from "./index.module.less";

/**
 * Switch 开关组件
 * @param {Object} props - 组件属性
 * @param {Array} props.options - 选项数组，每个选项包含 { value, label?, icon? }
 * @param {string|number} props.value - 当前选中的值
 * @param {function} props.onChange - 值改变时的回调函数
 * @param {string} props.className - 额外的CSS类名
 * @param {string} props.size - 尺寸：'small' 或 'medium'
 */
const Switch = ({
  options,
  value,
  onChange,
  className = "",
  size = "medium",
}) => {
  const optionRefs = useRef([]);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  // 更新滑块位置
  useEffect(() => {
    const updateSliderPosition = () => {
      const selectedIndex = options.findIndex((opt) => opt.value === value);
      if (selectedIndex >= 0 && optionRefs.current[selectedIndex]) {
        const element = optionRefs.current[selectedIndex];
        setSliderStyle({
          left: element.offsetLeft,
          width: element.offsetWidth,
        });
      }
    };

    // 使用 setTimeout 确保 DOM 已渲染
    const timer = setTimeout(updateSliderPosition, 0);

    // 监听窗口大小变化
    window.addEventListener("resize", updateSliderPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateSliderPosition);
    };
  }, [value, options]);

  const handleOptionClick = (optionValue) => {
    if (optionValue !== value) {
      // 点击非选中态选项，切换到被点击的选项
      onChange(optionValue);
    } else {
      // 点击已选中选项，自动切换到下一个选项
      const currentIndex = options.findIndex(
        (option) => option.value === value
      );
      const nextIndex = (currentIndex + 1) % options.length;
      onChange(options[nextIndex].value);
    }
  };

  const sizeClass = size === "small" ? styles.switchContainerSmall : "";
  const padding = size === "small" ? 4 : 3;

  return (
    <div
      className={`${styles.switchContainer} ${sizeClass} ${className}`.trim()}
    >
      {/* 滑动背景层 */}
      <div
        className={styles.switchSlider}
        style={{
          left: `${sliderStyle.left}px`,
          width: `${sliderStyle.width}px`,
          top: `${padding}px`,
          bottom: `${padding}px`,
        }}
      />

      {/* 选项 */}
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <div
            key={option.value !== null ? option.value : `option-${index}`}
            ref={(el) => (optionRefs.current[index] = el)}
            className={`${styles.switchOption} ${
              isSelected ? styles.switchOptionSelected : ""
            }`.trim()}
            onClick={() => handleOptionClick(option.value)}
          >
            {option.icon && (
              <span className={styles.switchOptionIcon}>{option.icon}</span>
            )}
            {option.label && (
              <span className={styles.switchOptionLabel}>{option.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

Switch.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: function (props, propName, componentName) {
        const value = props[propName];
        if (
          value !== null &&
          typeof value !== "string" &&
          typeof value !== "number" &&
          typeof value !== "boolean"
        ) {
          return new Error(
            `Invalid prop \`${propName}\` of type \`${typeof value}\` supplied to \`${componentName}\`, expected string, number, boolean or null.`
          );
        }
      },
      label: PropTypes.string,
      icon: PropTypes.node,
    })
  ).isRequired,
  value: function (props, propName, componentName) {
    const value = props[propName];
    if (
      value !== null &&
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      return new Error(
        `Invalid prop \`${propName}\` of type \`${typeof value}\` supplied to \`${componentName}\`, expected string, number, boolean or null.`
      );
    }
  },
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(["small", "medium"]),
};

export default Switch;
