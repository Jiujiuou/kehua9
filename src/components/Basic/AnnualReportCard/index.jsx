import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import backgroundImage from "@/assets/images/background.jpg";
import backgroundDarkImage from "@/assets/images/background_dark.jpg";
import NicknameInputPage from "./NicknameInputPage";
import Chapter1 from "./Chapter1";
import Chapter2 from "./Chapter2";
import styles from "./index.module.less";

const AnnualReportCard = ({
  visible = false,
  currentIndex = 0,
  totalPages = 1,
  onClose,
  onPageChange,
  userNickname = "",
  onNicknameChange,
  onStartMemory,
  dynamics = [],
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  const [theme, setTheme] = useState("light");
  const [direction, setDirection] = useState("forward"); // 'forward' 或 'backward'
  const [isAnimating, setIsAnimating] = useState(false);

  // 检测主题变化
  useEffect(() => {
    const checkTheme = () => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";
      setTheme(currentTheme);
    };

    // 初始检查
    checkTheme();

    // 监听主题变化
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // 当外部传入的 currentIndex 变化时，更新内部状态
  useEffect(() => {
    if (currentIndex !== undefined) {
      setActiveIndex(currentIndex);
    }
  }, [currentIndex]);

  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < totalPages - 1;
  // 判断是否可以切换到下一页：如果在第一页且没有输入昵称，则不允许
  const canGoNext = hasNext && !(activeIndex === 0 && !userNickname.trim());

  const handlePrevious = useCallback(() => {
    if (activeIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setDirection("backward");
      setPrevIndex(activeIndex);
      const newIndex = activeIndex - 1;
      setTimeout(() => {
        setActiveIndex(newIndex);
        if (onPageChange) {
          onPageChange(newIndex);
        }
        setTimeout(() => {
          setIsAnimating(false);
          setPrevIndex(newIndex);
        }, 300); // 动画持续时间
      }, 10);
    }
  }, [activeIndex, onPageChange, isAnimating]);

  const handleNext = useCallback(() => {
    if (activeIndex < totalPages - 1 && !isAnimating) {
      setIsAnimating(true);
      setDirection("forward");
      setPrevIndex(activeIndex);
      const newIndex = activeIndex + 1;
      setTimeout(() => {
        setActiveIndex(newIndex);
        if (onPageChange) {
          onPageChange(newIndex);
        }
        setTimeout(() => {
          setIsAnimating(false);
          setPrevIndex(newIndex);
        }, 300); // 动画持续时间
      }, 10);
    }
  }, [activeIndex, totalPages, onPageChange, isAnimating]);

  // 点击 ESC 键关闭，支持左右箭头键切换
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      } else if (event.key === "ArrowLeft" && hasPrevious) {
        event.preventDefault();
        handlePrevious();
      } else if (event.key === "ArrowRight" && canGoNext) {
        event.preventDefault();
        handleNext();
      }
    };

    // 使用 capture 阶段确保事件能被捕获
    document.addEventListener("keydown", handleKeyDown, true);
    // 防止背景滚动
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = "";
    };
  }, [visible, onClose, hasPrevious, canGoNext, handlePrevious, handleNext]);

  const handleArrowClick = (event, direction) => {
    event.stopPropagation();
    if (direction === "prev" && hasPrevious) {
      handlePrevious();
    } else if (direction === "next" && canGoNext) {
      handleNext();
    }
  };

  const handleBackdropClick = (event) => {
    // 如果点击的是背景，则关闭
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleCardClick = (event) => {
    // 阻止事件冒泡，防止点击卡片时关闭
    event.stopPropagation();
  };

  const handleStartMemory = () => {
    console.log(
      "AnnualReportCard handleStartMemory, userNickname:",
      userNickname
    );
    if (userNickname.trim() && !isAnimating) {
      // 切换到下一页
      const nextIndex = activeIndex + 1;
      if (nextIndex < totalPages) {
        setIsAnimating(true);
        setDirection("forward");
        setPrevIndex(activeIndex);
        setTimeout(() => {
          setActiveIndex(nextIndex);
          if (onPageChange) {
            onPageChange(nextIndex);
          }
          setTimeout(() => {
            setIsAnimating(false);
            setPrevIndex(nextIndex);
          }, 300);
        }, 10);
      }
      // 调用回调函数
      if (onStartMemory) {
        onStartMemory(userNickname.trim());
      }
    }
  };

  if (!visible) {
    return null;
  }

  // 根据当前页面索引渲染不同内容
  const renderPageContent = () => {
    const isForward = direction === "forward";
    
    // 渲染单个页面
    const renderPage = (index, isExiting = false) => {
      let content = null;
      if (index === 0) {
        content = (
          <NicknameInputPage
            userNickname={userNickname}
            onNicknameChange={onNicknameChange}
            onStartMemory={handleStartMemory}
          />
        );
      } else if (index === 1) {
        content = <Chapter1 userNickname={userNickname} dynamics={dynamics} />;
      } else if (index === 2) {
        content = <Chapter2 dynamics={dynamics} />;
      }

      if (!content) return null;

      // 只有在动画时才应用动画类，首次加载时不应用
      const animationClass = isAnimating
        ? isExiting
          ? isForward
            ? styles.slideOutLeft
            : styles.slideOutRight
          : isForward
          ? styles.slideInRight
          : styles.slideInLeft
        : "";

      return (
        <div
          key={`page-${index}`}
          className={`${styles.pageContent} ${animationClass}`}
        >
          {content}
        </div>
      );
    };

    // 如果正在动画且新旧页面不同，同时渲染两个页面
    if (isAnimating && prevIndex !== activeIndex) {
      return (
        <>
          {renderPage(prevIndex, true)}
          {renderPage(activeIndex, false)}
        </>
      );
    }

    // 正常情况只渲染当前页面
    return renderPage(activeIndex, false);
  };

  return (
    <div className={styles.previewOverlay} onClick={handleBackdropClick}>
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
          className={`${styles.navArrow} ${styles.navArrowRight} ${
            !canGoNext ? styles.disabled : ""
          }`}
          onClick={(e) => handleArrowClick(e, "next")}
        >
          <FaChevronRight />
        </div>
      )}
      <div className={styles.cardWrapper}>
        <div
          className={styles.cardContainer}
          onClick={handleCardClick}
          style={{
            backgroundImage: `url(${
              theme === "dark" ? backgroundDarkImage : backgroundImage
            })`,
          }}
        >
          <div className={styles.cardContent}>{renderPageContent()}</div>
        </div>
      </div>
    </div>
  );
};

AnnualReportCard.propTypes = {
  visible: PropTypes.bool,
  currentIndex: PropTypes.number,
  totalPages: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onPageChange: PropTypes.func,
  userNickname: PropTypes.string,
  onNicknameChange: PropTypes.func,
  onStartMemory: PropTypes.func,
  dynamics: PropTypes.array,
};

export default AnnualReportCard;
