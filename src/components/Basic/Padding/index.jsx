/**
 * Padding 组件
 *
 * 功能：用于手动控制 div 之间的间距高度
 * 用途：在需要精确控制元素间距的场景中使用
 *
 * 主要参数：
 * - height: 间距高度（单位：px），默认为 0
 *
 * 使用示例：
 * <Padding height={32} />
 * <Padding height={16} />
 */
import PropTypes from "prop-types";

/**
 * 间距组件
 * @param {Object} props - 组件属性
 * @param {number} props.height - 间距高度（单位：px），默认为 0
 */
const Padding = ({ height = 0 }) => {
  return <div style={{ height: `${height}px`, width: "100%" }} />;
};

Padding.propTypes = {
  height: PropTypes.number,
};

export default Padding;
