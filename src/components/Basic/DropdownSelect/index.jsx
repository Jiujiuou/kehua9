/**
 * DropdownSelect 组件
 *
 * 功能：高级下拉选择框，支持自定义选项、删除选项和点击复制
 * 用途：用于配置选择、数据过滤和各种选择场景
 * 使用位置：
 * - Control 组件中的配置选择（App Key、语言、命名空间等）
 * - 筛选条件选择
 * - 任何需要从多个选项中进行选择的场景
 *
 * 主要参数：
 * - label: 选择器标签文本
 * - value: 当前选中的值
 * - options: 选项数组
 * - onSelect: 选择选项时的回调函数
 * - onAddCustom: 添加自定义选项的回调函数（可选）
 * - onDeleteOption: 删除选项的回调函数（可选）
 * - formatOptionLabel: 自定义格式化选项标签的函数（可选）
 *
 * 依赖：
 * - Button 和 InputDialog 组件
 * - useOutsideClick、copyToClipboard 和 showMessage 工具函数
 *
 * 特殊功能：
 * - 点击输入框文本可复制内容
 * - 支持添加自定义选项
 * - 支持删除现有选项
 * - 点击外部区域自动关闭下拉列表
 *
 * 使用示例：
 * <DropdownSelect
 *   label="语言"
 *   value={selectedLanguage}
 *   options={languageOptions}
 *   onSelect={handleLanguageSelect}
 *   onAddCustom={handleAddLanguage}
 *   onDeleteOption={handleDeleteLanguage}
 * />
 */
import { useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { copyToClipboard, useOutsideClick } from "@/utils";
import { useMessageStore } from "@/store";
import { InputDialog, Button } from "@/components";
import styles from "./index.module.less";

function DropdownSelect({
  label,
  value,
  placeholder,
  options = [],
  onSelect,
  onAddCustom,
  onDeleteOption,
  formatOptionLabel,
  className = "",
}) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const dropdownRef = useRef(null);
  const { showMessage } = useMessageStore();

  // 关闭下拉框的回调
  const closeDropdown = useCallback(() => {
    setIsDropdownVisible(false);
  }, []);

  // 使用通用的外部点击hook
  useOutsideClick(dropdownRef, closeDropdown);

  // 切换下拉框显示状态
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  // 选择选项
  const selectOption = (option) => {
    onSelect(option);
    setIsDropdownVisible(false);
  };

  // 处理输入框文本点击
  const handleInputTextClick = async (e) => {
    e.stopPropagation();
    const displayText = formatOptionLabel ? formatOptionLabel(value) : value;
    if (displayText && displayText.trim()) {
      const result = await copyToClipboard(displayText, label || "选项");
      showMessage(result.message);
    }
  };

  // 删除选项
  const deleteOption = (option, event) => {
    event.stopPropagation();
    onDeleteOption?.(option);
  };

  // 添加自定义选项
  const addCustomOption = () => {
    setIsDropdownVisible(false); // 关闭下拉框
    setShowInputDialog(true); // 打开输入对话框
  };

  // 处理自定义选项确认
  const handleCustomOptionConfirm = (value) => {
    if (value && value.trim()) {
      const trimmedValue = value.trim();
      onAddCustom?.(trimmedValue);
      onSelect(trimmedValue);
    }
  };

  return (
    <div className={`${styles.dropdownFormGroup} ${className}`}>
      <label className={styles.dropdownFormLabel}>{label}</label>
      <div className={styles.dropdownFormSelect} ref={dropdownRef}>
        <div
          className={styles.dropdownSelectInputWrapper}
          onClick={toggleDropdown}
        >
          <div className={styles.dropdownSelectInputContainer}>
            <div className={styles.dropdownSelectInput}>
              {(formatOptionLabel ? formatOptionLabel(value) : value) ? (
                <div
                  className={styles.dropdownSelectInputText}
                  onClick={handleInputTextClick}
                >
                  {formatOptionLabel ? formatOptionLabel(value) : value}
                </div>
              ) : (
                <div className={styles.dropdownSelectInputPlaceholder}>
                  {placeholder}
                </div>
              )}
            </div>
          </div>
          <div
            className={`${styles.dropdownSelectArrow} ${
              isDropdownVisible ? styles.open : ""
            }`}
          >
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L6 6L11 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {isDropdownVisible && (
          <div className={styles.dropdownSelectDropdown}>
            <div className={styles.dropdownOptionsContainer}>
              {options.map((option, index) => (
                <div key={option}>
                  <div
                    className={styles.dropdownSelectOption}
                    onClick={() => selectOption(option)}
                  >
                    <span
                      title={
                        formatOptionLabel ? formatOptionLabel(option) : option
                      }
                    >
                      {formatOptionLabel ? formatOptionLabel(option) : option}
                    </span>
                    {onDeleteOption && (
                      <span
                        className={styles.dropdownDeleteOption}
                        onClick={(e) => deleteOption(option, e)}
                      >
                        ×
                      </span>
                    )}
                  </div>
                  {index < options.length - 1 && (
                    <div className={styles.dropdownOptionDivider}></div>
                  )}
                </div>
              ))}
            </div>
            {onAddCustom && (
              <div className={styles.dropdownCustomAddSection}>
                {options.length > 0 && (
                  <div className={styles.dropdownCustomAddDivider}></div>
                )}
                <div className={styles.customAddButtonContainer}>
                  <Button
                    text="+ 添加自定义选项"
                    type="secondary"
                    size="small"
                    onClick={addCustomOption}
                    className={styles.customAddButton}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <InputDialog
        isOpen={showInputDialog}
        onClose={() => setShowInputDialog(false)}
        onConfirm={handleCustomOptionConfirm}
        title={`添加自定义${label}`}
        placeholder={`请输入自定义${label}...`}
        confirmText="添加"
        cancelText="取消"
      />
    </div>
  );
}

DropdownSelect.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  options: PropTypes.array,
  onSelect: PropTypes.func.isRequired,
  onAddCustom: PropTypes.func,
  onDeleteOption: PropTypes.func,
  formatOptionLabel: PropTypes.func,
  className: PropTypes.string,
};

export default DropdownSelect;
