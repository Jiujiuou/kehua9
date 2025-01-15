/**
 * Button 组件
 *
 * 功能：提供统一风格的按钮实现，支持多种类型、尺寸和状态
 * 用途：用于触发操作或导航的交互元素，整个应用的按钮交互标准组件
 * 使用位置：
 * - 查询、提交、导出等操作按钮
 * - 导航和切换标签页
 * - 对话框的确认和取消
 * - 各种需要用户点击触发动作的场景
 *
 * 主要参数：
 * - text: 按钮文本
 * - type: 按钮类型，可选值：'primary'(默认)、'secondary'、'danger'
 * - size: 按钮大小，可选值：'small'、'medium'(默认)、'large'
 * - icon: 按钮图标，可选
 * - disabled: 是否禁用，默认false
 * - onClick: 点击事件处理函数
 *
 * 使用示例：
 * <Button type="primary" text="提交" onClick={handleSubmit} />
 * <Button type="danger" text="删除" icon="🗑️" onClick={handleDelete} />
 */
import PropTypes from "prop-types";
import styles from "./index.module.less";

/**
 * 通用按钮组件
 * @param {Object} props - 组件属性
 * @param {string} props.text - 按钮文本
 * @param {string|ReactNode} props.icon - 按钮图标
 * @param {string} props.type - 按钮类型: 'primary', 'secondary', 'danger'
 * @param {string} props.size - 按钮大小: 'small', 'medium', 'large'
 * @param {boolean} props.disabled - 是否禁用
 * @param {function} props.onClick - 点击事件处理函数
 * @param {string} props.className - 额外的CSS类名
 * @param {string} props.title - 鼠标悬停提示
 */
const Button = ({
  text,
  icon,
  type = "primary",
  size = "medium",
  disabled = false,
  onClick,
  className = "",
  title = "",
  ...rest
}) => {
  // 根据类型和大小生成类名
  const buttonClass = `
    ${styles.buttonContainer} 
    ${styles[`type${type.charAt(0).toUpperCase() + type.slice(1)}`]} 
    ${styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`]}
    ${disabled ? styles.buttonDisabled : ""}
    ${className}
  `.trim();

  return (
    <button
      className={buttonClass}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      {...rest}
    >
      {icon && <span className={styles.buttonIcon}>{icon}</span>}
      {text && <span className={styles.buttonText}>{text}</span>}
    </button>
  );
};

Button.propTypes = {
  text: PropTypes.string,
  icon: PropTypes.node,
  type: PropTypes.oneOf(["primary", "secondary", "danger"]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  title: PropTypes.string,
};

export default Button;
