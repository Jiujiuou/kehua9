import { useState } from 'react';
import styles from './ReportSelector.module.less';

/**
 * 年度报告选择器
 */
const ReportSelector = ({ onSelect, onClose }) => {
  const [selectedType, setSelectedType] = useState('2025');

  const handleConfirm = () => {
    if (selectedType === 'all') {
      onSelect(null);
    } else {
      onSelect(parseInt(selectedType));
    }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <h3 className={styles.title}>选择你要回顾的时光</h3>

        <div className={styles.content}>
          <div className={styles.options}>
            <label 
              className={`${styles.option} ${selectedType === '2025' ? styles.selected : ''}`}
              onClick={() => setSelectedType('2025')}
            >
              <div className={styles.optionContent}>
                <div className={styles.optionTitle}>2025 年</div>
                <div className={styles.optionDesc}>这一年的足迹</div>
              </div>
            </label>

            <label 
              className={`${styles.option} ${selectedType === 'all' ? styles.selected : ''}`}
              onClick={() => setSelectedType('all')}
            >
              <div className={styles.optionContent}>
                <div className={styles.optionTitle}>全部时光</div>
                <div className={styles.optionDesc}>所有年份的回忆</div>
              </div>
            </label>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            开启回忆
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportSelector;

