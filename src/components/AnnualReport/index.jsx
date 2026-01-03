import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { HiDownload } from "react-icons/hi";
import { toPng } from "html-to-image";
import download from "downloadjs";
import { generateAnnualReport } from "@/utils/reportUtils";
import CoverPage from "./pages/CoverPage";
import FirstMeetingPage from "./pages/FirstMeetingPage";
import StatisticsPage from "./pages/StatisticsPage";
import TimeDistributionPage from "./pages/TimeDistributionPage";
import CalendarPage from "./pages/CalendarPage";
import MonthlyReviewPage from "./pages/MonthlyReviewPage";
import WordCloudPage from "./pages/WordCloudPage";
import AchievementsPage from "./pages/AchievementsPage";
import HighlightsPage from "./pages/HighlightsPage";
import EndingPage from "./pages/EndingPage";
import styles from "./index.module.less";

/**
 * 年度报告主组件
 */
const AnnualReport = ({ dynamics, year = null, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const pageContainerRef = useRef(null);
  const downloadButtonRef = useRef(null);

  // 生成报告数据
  const reportData = useMemo(() => {
    if (!dynamics || dynamics.length === 0) {
      return null;
    }
    return generateAnnualReport(dynamics, year);
  }, [dynamics, year]);

  // 页面列表
  const pages = useMemo(() => {
    if (!reportData) return [];

    // 如果是全部数据报告
    if (reportData.isFullReport) {
      const fullReportPages = [
        { component: StatisticsPage, key: "statistics" },
        { component: TimeDistributionPage, key: "timeDistribution" },
        // 注意：移除 CalendarPage，因为跨年数据不适合单个日历展示
        { component: MonthlyReviewPage, key: "monthlyReview" },
        { component: WordCloudPage, key: "wordCloud" },
        { component: AchievementsPage, key: "achievements" },
        { component: HighlightsPage, key: "highlights" },
        { component: EndingPage, key: "ending" },
      ];

      // 如果有第一次相遇信息，在最前面插入
      if (reportData.firstMeetingInfo?.firstDate) {
        return [
          { component: FirstMeetingPage, key: "firstMeeting" },
          ...fullReportPages,
        ];
      }

      return fullReportPages;
    }

    // 单年报告（如 2025 年）
    return [
      { component: CoverPage, key: "cover" },
      { component: StatisticsPage, key: "statistics" },
      { component: TimeDistributionPage, key: "timeDistribution" },
      { component: CalendarPage, key: "calendar" },
      { component: MonthlyReviewPage, key: "monthlyReview" },
      { component: WordCloudPage, key: "wordCloud" },
      { component: AchievementsPage, key: "achievements" },
      { component: HighlightsPage, key: "highlights" },
      { component: EndingPage, key: "ending" },
    ];
  }, [reportData]);

  // 切换到下一页
  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 切换到上一页
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 跳转到指定页
  const goToPage = (pageIndex) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setCurrentPage(pageIndex);
    }
  };

  // 触摸/鼠标事件处理
  const handleStart = (clientX) => {
    setStartX(clientX);
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;

    const diff = clientX - startX;
    const threshold = 100; // 滑动阈值

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 向右滑动，上一页
        prevPage();
      } else {
        // 向左滑动，下一页
        nextPage();
      }
      setIsDragging(false);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // 鼠标事件
  const handleMouseDown = (e) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // 触摸事件
  const handleTouchStart = (e) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        prevPage();
      } else if (e.key === "ArrowRight") {
        nextPage();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, pages.length]);

  // 分享报告
  const handleDownload = useCallback(async () => {
    if (!pageContainerRef.current || !reportData) return;

    const year = reportData.year || "all";
    const filename = `可话${year === null ? "全部数据" : year + "年"}报告_第${
      currentPage + 1
    }页.png`;

    // 临时隐藏下载按钮
    let downloadButton = null;
    let originalDisplay = "";
    if (downloadButtonRef.current) {
      downloadButton = downloadButtonRef.current;
      originalDisplay = downloadButton.style.display;
      downloadButton.style.display = "none";
    }

    try {
      const element = pageContainerRef.current;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const scaleFactor = 2;

      const dataUrl = await toPng(element, {
        width: width,
        height: height,
        pixelRatio: scaleFactor,
        backgroundColor: "#fef9f0",
        cacheBust: true,
      });

      // 恢复下载按钮显示
      if (downloadButton) {
        downloadButton.style.display = originalDisplay;
      }

      download(dataUrl, filename);
    } catch (error) {
      console.error("下载图片失败:", error);

      if (downloadButton) {
        downloadButton.style.display = originalDisplay;
      }
    }
  }, [pageContainerRef, reportData, currentPage]);

  const handleShare = () => {
    handleDownload();
  };

  if (!reportData) {
    return (
      <div className={styles.annualReport}>
        <div className={styles.error}>
          <p>暂无数据，无法生成报告</p>
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    );
  }

  const CurrentPageComponent = pages[currentPage]?.component;

  return (
    <div
      className={styles.annualReport}
      ref={containerRef}
      onClick={(e) => {
        // 点击背景关闭
        if (e.target === containerRef.current) {
          onClose();
        }
      }}
    >
      {/* 关闭按钮 */}
      <button className={styles.closeButton} onClick={onClose}>
        ✕
      </button>

      {/* 页面容器 */}
      <div
        ref={pageContainerRef}
        className={styles.pageContainer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          handleMouseUp();
          setIsHovered(false);
        }}
      >
        {/* 下载按钮 */}
        {isHovered && (
          <div
            ref={downloadButtonRef}
            className={styles.downloadButton}
            onClick={handleDownload}
            title="下载当前页"
          >
            <HiDownload />
          </div>
        )}

        {/* 页面内容 */}
        {CurrentPageComponent && (
          <CurrentPageComponent
            reportData={reportData}
            onStart={nextPage}
            onShare={handleShare}
            onClose={onClose}
          />
        )}
      </div>

      {/* 左右箭头 */}
      {currentPage > 0 && (
        <div
          className={`${styles.navArrow} ${styles.navArrowLeft}`}
          onClick={prevPage}
        >
          <FaChevronLeft />
        </div>
      )}
      {currentPage < pages.length - 1 && (
        <div
          className={`${styles.navArrow} ${styles.navArrowRight}`}
          onClick={nextPage}
        >
          <FaChevronRight />
        </div>
      )}

      {/* 页码指示 */}
      <div className={styles.pageIndicator}>
        {currentPage + 1} / {pages.length}
      </div>
    </div>
  );
};

export default AnnualReport;
