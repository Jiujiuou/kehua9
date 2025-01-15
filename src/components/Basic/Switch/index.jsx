/**
 * Switch 组件
 *
 * 功能：开关切换组件，支持自定义内容和提示
 * 用途：用于二元状态的切换，如开/关、亮/暗模式等
 * 使用位置：
 * - Header组件中用于切换明暗主题
 * - 各种设置界面中的开关选项
 * - 需要用户做出二选一选择的场景
 */
import { useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useTipsPosition } from "@/hooks";
import styles from "./index.module.less";

/**
 * 通用开关组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.checked - 开关状态
 * @param {function} props.onChange - 状态变化处理函数
 * @param {string|React.ReactNode} props.leftContent - 左侧内容（关闭状态）
 * @param {string|React.ReactNode} props.rightContent - 右侧内容（开启状态）
 * @param {string} props.tips - 提示文本
 * @param {string} props.className - 额外的CSS类名
 */
function Switch({
  checked = false,
  onChange,
  leftContent,
  rightContent,
  tips = "",
  className = "",
}) {
  const switchRef = useRef(null);

  // 使用自定义Hook计算提示位置
  const tipsPosition = useTipsPosition(switchRef, tips);

  const handleToggle = useCallback(() => {
    if (onChange) {
      onChange(!checked);
    }
  }, [onChange, checked]);

  return (
    <div
      ref={switchRef}
      className={`${styles.switchToggle} ${className}`}
      onClick={handleToggle}
      data-tips={tips}
      data-checked={checked}
    >
      <div className={`${styles.switchIcon} ${!checked ? styles.active : ""}`}>
        {leftContent}
      </div>
      <div className={`${styles.switchIcon} ${checked ? styles.active : ""}`}>
        {rightContent}
      </div>
      {tips && (
        <div
          className={`${styles.switchTipsText} ${
            styles[`switchTips${tipsPosition}`]
          }`}
        >
          {tips}
        </div>
      )}
    </div>
  );
}

Switch.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  leftContent: PropTypes.node,
  rightContent: PropTypes.node,
  tips: PropTypes.string,
  className: PropTypes.string,
};

export default Switch;
