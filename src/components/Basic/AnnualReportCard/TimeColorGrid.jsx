import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { EMOTION_CATEGORIES } from "@/constant";
import TimeColorCard from "./TimeColorCard";
import styles from "./Chapter4.module.less";

const TimeColorGrid = ({ yearlyColorData = [] }) => {
  const [selectedYear, setSelectedYear] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  // 调试信息
  useEffect(() => {
    console.log("[TimeColorGrid] 接收到的年度色彩数据:", yearlyColorData);
    console.log("[TimeColorGrid] 数据数量:", yearlyColorData.length);
  }, [yearlyColorData]);

  // 如果没有数据，显示提示
  if (!yearlyColorData || yearlyColorData.length === 0) {
    console.log("[TimeColorGrid] 数据为空，显示空状态提示");
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px', 
        color: 'var(--text-secondary)',
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        width: '100%',
        minHeight: '100px'
      }}>
        暂无年度色彩数据
        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>
          请确保动态数据包含日期信息
        </div>
      </div>
    );
  }

  // 按年份排序
  const sortedData = [...yearlyColorData].sort((a, b) => a.year - b.year);
  console.log("[TimeColorGrid] 准备渲染色卡，数量:", sortedData.length);

  const handleCardClick = (colorData) => {
    setSelectedYear(colorData.year);
    setDetailPanelOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailPanelOpen(false);
    setTimeout(() => {
      setSelectedYear(null);
    }, 300);
  };

  // ESC 键关闭详情面板
  useEffect(() => {
    if (!detailPanelOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleCloseDetail();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailPanelOpen]);

  const selectedColorData = sortedData.find((d) => d.year === selectedYear);

  return (
    <>
      <div className={styles.colorGridContainer}>
        {sortedData.map((colorData, index) => {
          console.log(`[TimeColorGrid] 渲染色卡 ${index}:`, colorData.year, colorData.baseColor?.name);
          return (
            <TimeColorCard
              key={colorData.year}
              colorData={colorData}
              index={index}
              onCardClick={handleCardClick}
            />
          );
        })}
      </div>

      {detailPanelOpen && selectedColorData && (
        <div
          className={`${styles.colorDetailPanel} ${
            detailPanelOpen ? styles.active : ""
          }`}
        >
          <div className={styles.panelOverlay} onClick={handleCloseDetail} />
          <div className={styles.panelContent}>
            <div className={styles.panelHeader}>
              <h2>
                {selectedColorData.year} · {selectedColorData.baseColor.name}
              </h2>
              <button className={styles.closeBtn} onClick={handleCloseDetail}>
                &times;
              </button>
            </div>

            <div className={styles.colorDisplaySection}>
              <div
                className={styles.mainColor}
                style={{ backgroundColor: selectedColorData.baseColor.hex }}
              />
              <div className={styles.colorVariants}>
                {Object.entries(selectedColorData.variants).map(
                  ([name, color]) => (
                    <div
                      key={name}
                      className={styles.colorVariant}
                      style={{ backgroundColor: color }}
                    >
                      <span className={styles.variantLabel}>{name}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className={styles.descriptionSection}>
              <h3>诗意解读</h3>
              <p className={styles.poeticDescription}>
                {selectedColorData.poeticDescription.description}
              </p>

              <div className={styles.colorMetadata}>
                <div className={styles.metadataItem}>
                  <span className={styles.label}>主导情感</span>
                  <span className={styles.value}>
                    {
                      EMOTION_CATEGORIES[
                        selectedColorData.derivation.dominantEmotion
                      ]?.name
                    }
                  </span>
                </div>
                <div className={styles.metadataItem}>
                  <span className={styles.label}>情感强度</span>
                  <span className={styles.value}>
                    {Math.round(
                      selectedColorData.derivation.emotionalIntensity * 100
                    )}
                    %
                  </span>
                </div>
                <div className={styles.metadataItem}>
                  <span className={styles.label}>色彩置信度</span>
                  <span className={styles.value}>
                    {Math.round(
                      selectedColorData.derivation.colorConfidence * 100
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

TimeColorGrid.propTypes = {
  yearlyColorData: PropTypes.array,
};

export default TimeColorGrid;

