import PropTypes from "prop-types";
import styles from "./index.module.less";

/**
 * Radio 组件
 * 用于显示单选选项
 */
function Radio({ checked, onChange, label, id, name, value }) {
  const handleChange = () => {
    // 单选模式下，点击后总是选中
    onChange(true);
  };

  return (
    <div className={styles.radioWrapper}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        className={styles.radioInput}
      />
      <label htmlFor={id} className={styles.radioLabel}>
        {label}
      </label>
    </div>
  );
}

Radio.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default Radio;

