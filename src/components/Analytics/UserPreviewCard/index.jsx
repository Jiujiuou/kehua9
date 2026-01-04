import { useEffect, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import styles from "./index.module.less";

const UserPreviewCard = ({
  user,
  users = [],
  currentIndex = 0,
  onClose,
  onUserChange,
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  // 当外部传入的 currentIndex 变化时，更新内部状态
  useEffect(() => {
    if (currentIndex !== undefined && users.length > 0) {
      setActiveIndex(currentIndex);
    }
  }, [currentIndex, users.length]);

  const currentUser =
    users && users.length > 0 ? users[activeIndex] : user;
  const hasPrevious = activeIndex > 0;
  const hasNext = users && activeIndex < users.length - 1;

  const handlePrevious = useCallback(() => {
    if (activeIndex > 0) {
      const newIndex = activeIndex - 1;
      setActiveIndex(newIndex);
      if (onUserChange && users[newIndex]) {
        onUserChange(users[newIndex], newIndex);
      }
    }
  }, [activeIndex, users, onUserChange]);

  const handleNext = useCallback(() => {
    if (users && activeIndex < users.length - 1) {
      const newIndex = activeIndex + 1;
      setActiveIndex(newIndex);
      if (onUserChange && users[newIndex]) {
        onUserChange(users[newIndex], newIndex);
      }
    }
  }, [activeIndex, users, onUserChange]);

  // 点击 ESC 键关闭，支持左右箭头键切换
  useEffect(() => {
    if (!user) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      } else if (event.key === "ArrowLeft" && hasPrevious) {
        event.preventDefault();
        handlePrevious();
      } else if (event.key === "ArrowRight" && hasNext) {
        event.preventDefault();
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = "";
    };
  }, [user, onClose, hasPrevious, hasNext, handlePrevious, handleNext]);

  // 按日期分组并统计每天每个事件类型的数量
  const dailyEventStats = useMemo(() => {
    if (!currentUser || !currentUser.events || currentUser.events.length === 0) {
      return [];
    }

    const dateMap = {};
    
    currentUser.events.forEach((event) => {
      // 从 time 字段提取日期（格式：YYYY-MM-DD hh:mm:ss）
      const date = event.time ? event.time.split(" ")[0] : "";
      if (!date) return;

      // 格式化日期为 YYYY-M-D 格式（去掉前导零）
      const [year, month, day] = date.split("-");
      const formattedDate = `${year}-${parseInt(month)}-${parseInt(day)}`;

      if (!dateMap[formattedDate]) {
        dateMap[formattedDate] = {};
      }

      const eventName = event.eventName || "未知";
      dateMap[formattedDate][eventName] = (dateMap[formattedDate][eventName] || 0) + 1;
    });

    // 转换为数组并按日期排序（最新的在前）
    return Object.entries(dateMap)
      .map(([date, events]) => ({
        date,
        events: Object.entries(events).map(([eventName, count]) => ({
          eventName,
          count,
        })),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [currentUser]);

  if (!user || !currentUser) {
    return null;
  }

  const handleArrowClick = (event, direction) => {
    event.stopPropagation();
    if (direction === "prev" && hasPrevious) {
      handlePrevious();
    } else if (direction === "next" && hasNext) {
      handleNext();
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleCardClick = (event) => {
    event.stopPropagation();
  };

  return (
    <div className={styles.previewOverlay} onClick={handleBackdropClick}>
      <button className={styles.closeButton} onClick={onClose}>
        <FaTimes />
      </button>
      {hasPrevious && (
        <div
          className={`${styles.navArrow} ${styles.navArrowLeft}`}
          onClick={(e) => handleArrowClick(e, "prev")}
        >
          <FaChevronLeft />
        </div>
      )}
      {hasNext && (
        <div
          className={`${styles.navArrow} ${styles.navArrowRight}`}
          onClick={(e) => handleArrowClick(e, "next")}
        >
          <FaChevronRight />
        </div>
      )}
      <div className={styles.cardWrapper}>
        <div
          className={styles.cardContainer}
          onClick={handleCardClick}
        >
          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <div className={styles.userId}>{currentUser.userId}</div>
            </div>
            
            <div className={styles.userInfo}>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <label className={styles.label}>行为总数</label>
                  <div className={styles.statValue}>{currentUser.count}</div>
                </div>
                <div className={styles.statItem}>
                  <label className={styles.label}>所在地区</label>
                  <div className={styles.statValue}>{currentUser.city || "未知"}</div>
                </div>
              </div>
            </div>

            {dailyEventStats.length > 0 && (
              <div className={styles.eventsSection}>
                <h3 className={styles.sectionTitle}>行为记录</h3>
                <div className={styles.eventsList}>
                  {dailyEventStats.map((dayData, dayIndex) => (
                    <div key={dayIndex} className={styles.dayGroup}>
                      <span className={styles.dayHeader}>{dayData.date}</span>
                      <div className={styles.dayEvents}>
                        {dayData.events.map((eventStat, eventIndex) => (
                          <span key={eventIndex} className={styles.eventStatItem}>
                            <span className={styles.eventName}>{eventStat.eventName}</span>
                            <span className={styles.eventCount}>：{eventStat.count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {users.length > 1 && (
              <div className={styles.pagination}>
                {activeIndex + 1} / {users.length}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

UserPreviewCard.propTypes = {
  user: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    city: PropTypes.string,
    events: PropTypes.array,
  }),
  users: PropTypes.array,
  currentIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onUserChange: PropTypes.func,
};

export default UserPreviewCard;

