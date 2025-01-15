import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import styles from "./index.module.less";

const Catalog = ({
  dynamics = [],
  selectedDate: externalSelectedDate,
  sortOrder = "asc",
  onDateClick = null,
}) => {
  const [expandedYear, setExpandedYear] = useState(null); // 只保存当前展开的年份键值
  const [expandedMonth, setExpandedMonth] = useState(null); // 只保存当前展开的月份键值
  const [internalSelectedDate, setInternalSelectedDate] = useState(null); // 内部选中的日期（用于点击）

  // 使用外部传入的选中日期，如果没有则使用内部状态
  const selectedDate =
    externalSelectedDate !== undefined
      ? externalSelectedDate
      : internalSelectedDate;

  // 从动态数据中提取所有有动态的日期，按年份和月份组织
  const dateStructure = useMemo(() => {
    const structure = {};

    dynamics.forEach((dynamic) => {
      const dateStr = dynamic.date; // 格式: YYYY-MM-DD
      const [year, month, day] = dateStr.split("-");
      const yearKey = `${year}年`;
      const monthKey = `${parseInt(month)}月`;

      if (!structure[yearKey]) {
        structure[yearKey] = {};
      }
      if (!structure[yearKey][monthKey]) {
        structure[yearKey][monthKey] = [];
      }

      // 避免重复添加同一天
      const dayKey = `${year}-${month}-${day}`;
      if (!structure[yearKey][monthKey].includes(dayKey)) {
        structure[yearKey][monthKey].push(dayKey);
      }
    });

    // 对每个月份的日期进行排序
    Object.keys(structure).forEach((yearKey) => {
      Object.keys(structure[yearKey]).forEach((monthKey) => {
        structure[yearKey][monthKey].sort((a, b) => {
          // 根据排序顺序排序日期
          if (sortOrder === "asc") {
            // 正序：从早到晚（升序）
            return a.localeCompare(b);
          } else {
            // 倒序：从晚到早（降序）
            return b.localeCompare(a);
          }
        });
      });
    });

    return structure;
  }, [dynamics, sortOrder]);

  // 获取所有年份，根据排序顺序排列
  const years = useMemo(() => {
    return Object.keys(dateStructure).sort((a, b) => {
      const yearA = parseInt(a.replace("年", ""));
      const yearB = parseInt(b.replace("年", ""));
      if (sortOrder === "asc") {
        // 正序：从早到晚（升序）
        return yearA - yearB;
      } else {
        // 倒序：从晚到早（降序）
        return yearB - yearA;
      }
    });
  }, [dateStructure, sortOrder]);

  // 切换年份展开/收起（手风琴效果：同一时间只展开一个年份）
  const toggleYear = (yearKey) => {
    // 如果点击的是当前已展开的年份，则关闭它；否则关闭之前的年份并展开新的
    if (expandedYear === yearKey) {
      setExpandedYear(null);
      // 关闭年份时，也关闭月份
      setExpandedMonth(null);
    } else {
      setExpandedYear(yearKey);
      // 切换年份时，关闭之前的月份
      setExpandedMonth(null);
    }
  };

  // 切换月份展开/收起（手风琴效果：同一时间只展开一个月份）
  const toggleMonth = (yearKey, monthKey) => {
    const key = `${yearKey}-${monthKey}`;
    // 如果点击的是当前已展开的月份，则关闭它；否则关闭之前的月份并展开新的
    if (expandedMonth === key) {
      setExpandedMonth(null);
    } else {
      setExpandedMonth(key);
    }
  };

  // 处理日期点击
  const handleDateClick = (dateStr) => {
    setInternalSelectedDate(dateStr);
    if (onDateClick) {
      onDateClick(dateStr);
    }
  };

  // 当外部选中日期变化时，自动展开对应的年份和月份
  useEffect(() => {
    if (!externalSelectedDate || dynamics.length === 0) return;

    const [year, month] = externalSelectedDate.split("-");
    const yearKey = `${year}年`;
    const monthKey = `${parseInt(month)}月`;
    const monthKeyFull = `${yearKey}-${monthKey}`;

    // 展开对应的年份
    setExpandedYear(yearKey);

    // 展开对应的月份
    setExpandedMonth(monthKeyFull);
  }, [externalSelectedDate, dynamics]);

  return (
    <div className={styles.catalog}>
      <div className={styles.content}>
        {years.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyText}>暂无数据</div>
            <div className={styles.emptyHint}>上传数据后，日期将显示在这里</div>
          </div>
        ) : (
          years.map((yearKey) => {
            const isYearExpanded = expandedYear === yearKey;
            const months = Object.keys(dateStructure[yearKey]).sort((a, b) => {
              const monthA = parseInt(a.replace("月", ""));
              const monthB = parseInt(b.replace("月", ""));
              if (sortOrder === "asc") {
                // 正序：从早到晚（升序）
                return monthA - monthB;
              } else {
                // 倒序：从晚到早（降序）
                return monthB - monthA;
              }
            });

            return (
              <div key={yearKey} className={styles.yearItem}>
                <div
                  className={styles.yearHeader}
                  onClick={() => toggleYear(yearKey)}
                >
                  <span className={styles.expandIcon}>
                    {isYearExpanded ? <FaChevronDown /> : <FaChevronRight />}
                  </span>
                  <span className={styles.yearText}>{yearKey}</span>
                </div>
                <div
                  className={`${styles.monthsContainer} ${
                    isYearExpanded ? styles.expanded : ""
                  }`}
                >
                  {months.map((monthKey) => {
                    const monthKeyFull = `${yearKey}-${monthKey}`;
                    const isMonthExpanded = expandedMonth === monthKeyFull;
                    const dates = dateStructure[yearKey][monthKey];

                    return (
                      <div key={monthKey} className={styles.monthItem}>
                        <div
                          className={styles.monthHeader}
                          onClick={() => toggleMonth(yearKey, monthKey)}
                        >
                          <span className={styles.expandIcon}>
                            {isMonthExpanded ? (
                              <FaChevronDown />
                            ) : (
                              <FaChevronRight />
                            )}
                          </span>
                          <span className={styles.monthText}>{monthKey}</span>
                        </div>
                        <div
                          className={`${styles.datesContainer} ${
                            isMonthExpanded ? styles.expanded : ""
                          }`}
                        >
                          {dates.map((dateStr) => {
                            const [, , day] = dateStr.split("-");
                            const isSelected = selectedDate === dateStr;
                            return (
                              <div
                                key={dateStr}
                                className={`${styles.dateItem} ${
                                  isSelected ? styles.dateItemSelected : ""
                                }`}
                                onClick={() => handleDateClick(dateStr)}
                              >
                                {parseInt(day)}日
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

Catalog.propTypes = {
  dynamics: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
    })
  ),
  selectedDate: PropTypes.string,
  sortOrder: PropTypes.oneOf(["asc", "desc"]),
  onDateClick: PropTypes.func,
};

export default Catalog;
