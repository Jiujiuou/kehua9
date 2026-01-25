import { useEffect, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { HiDownload } from "react-icons/hi";
import backgroundImage from "@/assets/images/background.jpg";
import backgroundDarkImage from "@/assets/images/background_dark.jpg";
import CardPreview from "@/components/Basic/CardPreview";
import { downloadElementAsImage } from "@/utils/downloadImage";
import NicknameInputPage from "./NicknameInputPage";
import Chapter1 from "./Chapter1";
import Chapter2 from "./Chapter2";
import Chapter3 from "./Chapter3";
import Chapter4 from "./Chapter4";
import Chapter5 from "./Chapter5";
import Chapter6 from "./Chapter6";
import Chapter7 from "./Chapter7";
import Chapter8 from "./Chapter8";
import Chapter9 from "./Chapter9";
import FinalChapter from "./FinalChapter";
import {
  ANNUAL_REPORT_PAGE_SWITCH_ANIMATION,
  ANNUAL_REPORT_TOTAL_PAGES,
} from "@/constant/annualReport";
import styles from "./index.module.less";

const AnnualReportCard = ({
  visible = false,
  currentIndex = 0,
  onClose,
  onPageChange,
  userNickname = "",
  onNicknameChange,
  onStartMemory,
  dynamics = [],
  allDynamics = null,
  directoryHandle = null,
  onDynamicAdd = null,
  // 样式配置，与 Preview 区域保持一致
  textIndent = true,
  paragraphSpacing = false,
  fontSize = 15,
  fontWeight = 400,
  fontFamily = "system",
  lineHeight = 1.6,
  contentGap = 12,
  borderRadius = 8,
  imageGap = 4,
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  const [theme, setTheme] = useState("light");
  const [direction, setDirection] = useState("forward"); // 'forward' 或 'backward'
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardPreviewDynamic, setCardPreviewDynamic] = useState(null);
  const [cardPreviewIndex, setCardPreviewIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardContainerRef = useRef(null);
  const downloadButtonRef = useRef(null);

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
  const hasNext = activeIndex < ANNUAL_REPORT_TOTAL_PAGES - 1;
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
        }, ANNUAL_REPORT_PAGE_SWITCH_ANIMATION.durationMs); // 动画持续时间
      }, ANNUAL_REPORT_PAGE_SWITCH_ANIMATION.delayMs);
    }
  }, [activeIndex, onPageChange, isAnimating]);

  const handleNext = useCallback(() => {
    if (activeIndex < ANNUAL_REPORT_TOTAL_PAGES - 1 && !isAnimating) {
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
        }, ANNUAL_REPORT_PAGE_SWITCH_ANIMATION.durationMs); // 动画持续时间
      }, ANNUAL_REPORT_PAGE_SWITCH_ANIMATION.delayMs);
    }
  }, [activeIndex, onPageChange, isAnimating]);

  // 点击 ESC 键关闭，支持左右箭头键切换
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event) => {
      // 检查焦点是否在可编辑元素中（input、textarea、contenteditable）
      const activeElement = document.activeElement;
      const isEditableElement =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.isContentEditable);

      // 如果焦点在可编辑元素中，且按的是方向键，则不处理（让光标移动）
      if (isEditableElement && (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown")) {
        return; // 不阻止事件，让输入框正常处理方向键
      }

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

  const handleDownload = useCallback(
    async (event) => {
      event.stopPropagation();
      if (!cardContainerRef.current) return;

      // 生成文件名：根据当前页面索引生成
      const pageNames = [
        "封面",
        "第一章",
        "第二章",
        "第三章",
        "第四章",
        "第五章",
        "第六章",
        "第七章",
        "第八章",
        "第九章",
        "终章",
      ];
      const pageName = pageNames[activeIndex] || `第${activeIndex + 1}页`;
      const filename = `年度报告_${pageName}`;

      try {
        await downloadElementAsImage({
          element: cardContainerRef.current,
          filename: filename,
          excludeElement: downloadButtonRef.current,
          contentSelector: `.${styles.cardContent}`,
          backgroundColor: theme === "dark" ? "#1a1a1a" : "#fef9f0",
          scaleFactor: 2,
        });
      } catch (error) {
        console.error("下载年度报告页面失败:", error);
      }
    },
    [activeIndex, theme, styles.cardContent]
  );

  const handleStartMemory = () => {
    if (userNickname.trim() && !isAnimating) {
      // 切换到下一页
      const nextIndex = activeIndex + 1;
      if (nextIndex < ANNUAL_REPORT_TOTAL_PAGES) {
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
          }, ANNUAL_REPORT_PAGE_SWITCH_ANIMATION.durationMs);
        }, ANNUAL_REPORT_PAGE_SWITCH_ANIMATION.delayMs);
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
        content = (
          <Chapter1
            userNickname={userNickname}
            dynamics={dynamics}
            onPreviewClick={(dynamic, index) => {
              setCardPreviewDynamic(dynamic);
              setCardPreviewIndex(index);
            }}
          />
        );
      } else if (index === 2) {
        content = (
          <Chapter2
            dynamics={dynamics}
            onPreviewClick={(dynamic, index) => {
              setCardPreviewDynamic(dynamic);
              setCardPreviewIndex(index);
            }}
          />
        );
      } else if (index === 3) {
        content = (
          <Chapter3
            dynamics={dynamics}
            textIndent={textIndent}
            paragraphSpacing={paragraphSpacing}
            fontSize={fontSize}
            fontWeight={fontWeight}
            fontFamily={fontFamily}
            lineHeight={lineHeight}
            contentGap={contentGap}
            borderRadius={borderRadius}
            imageGap={imageGap}
            onPreviewClick={(dynamic, index) => {
              setCardPreviewDynamic(dynamic);
              setCardPreviewIndex(index);
            }}
          />
        );
      } else if (index === 4) {
        content = <Chapter4 dynamics={dynamics} />;
      } else if (index === 5) {
        content = <Chapter5 dynamics={dynamics} />;
      } else if (index === 6) {
        content = <Chapter7 dynamics={dynamics} />; // 交换：index 6 渲染 Chapter7
      } else if (index === 7) {
        content = <Chapter6 dynamics={dynamics} />; // 交换：index 7 渲染 Chapter6
      } else if (index === 8) {
        content = (
          <Chapter8
            dynamics={dynamics}
            directoryHandle={directoryHandle}
            onDynamicAdd={onDynamicAdd}
          />
        );
      } else if (index === 9) {
        content = <Chapter9 userNickname={userNickname} />;
      } else if (index === 10) {
        content = <FinalChapter dynamics={Array.isArray(allDynamics) ? allDynamics : dynamics} />;
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
          ref={cardContainerRef}
          className={styles.cardContainer}
          onClick={handleCardClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            backgroundImage: `url(${
              theme === "dark" ? backgroundDarkImage : backgroundImage
            })`,
          }}
        >
          <div className={styles.cardContent}>{renderPageContent()}</div>
        </div>
      </div>
      <CardPreview
        dynamic={cardPreviewDynamic}
        dynamics={dynamics}
        currentIndex={cardPreviewIndex}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fontFamily={fontFamily}
        lineHeight={lineHeight}
        textIndent={textIndent}
        paragraphSpacing={paragraphSpacing}
        allowNavigation={false}
        onClose={() => {
          setCardPreviewDynamic(null);
          setCardPreviewIndex(0);
        }}
        onDynamicChange={(newDynamic, newIndex) => {
          setCardPreviewDynamic(newDynamic);
          setCardPreviewIndex(newIndex);
        }}
      />
    </div>
  );
};

AnnualReportCard.propTypes = {
  visible: PropTypes.bool,
  currentIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onPageChange: PropTypes.func,
  userNickname: PropTypes.string,
  onNicknameChange: PropTypes.func,
  onStartMemory: PropTypes.func,
  dynamics: PropTypes.array,
  allDynamics: PropTypes.array,
  directoryHandle: PropTypes.object,
  onDynamicAdd: PropTypes.func,
};

export default AnnualReportCard;
