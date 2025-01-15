import PropTypes from "prop-types";
import styles from "./index.module.less";

/**
 * ButtonGroup 组件
 * 用于显示一组互斥的按钮选项
 */
function ButtonGroup({ label, options, value, onChange }) {
  return (
    <div className={styles.buttonGroupControl}>
      <span className={styles.buttonGroupLabel}>{label}</span>
      <div className={styles.buttonGroup}>
        {options.map((option) => (
          <button
            key={option.value}
            className={`${styles.buttonGroupButton} ${
              value === option.value ? styles.active : ""
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

ButtonGroup.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ButtonGroup;

