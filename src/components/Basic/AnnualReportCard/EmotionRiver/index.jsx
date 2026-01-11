import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { analyzeEmotionsBatch } from '@/utils/emotionAnalysis';
import { EMOTION_CATEGORIES } from '@/constant';
import { aggregateEmotionDataByDate } from './utils';
import EmotionRiverCanvas from './EmotionRiverCanvas';
import styles from './EmotionRiver.module.less';

const EmotionRiver = ({ dynamics = [] }) => {
  const [emotionData, setEmotionData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!dynamics || dynamics.length === 0) {
      setIsLoading(false);
      return;
    }

    const loadEmotionData = async () => {
      setIsLoading(true);
      
      try {
        // 提取文本
        const texts = dynamics
          .filter((d) => d && d.text)
          .map((d) => d.text);

        if (texts.length === 0) {
          setIsLoading(false);
          return;
        }

        // 批量分析情绪
        const results = await analyzeEmotionsBatch(texts, 10);

        // 按日期聚合数据
        const aggregatedData = aggregateEmotionDataByDate(dynamics, results);

        setEmotionData(aggregatedData);
      } catch (error) {
        console.error('[EmotionRiver] 分析过程中出错:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmotionData();
  }, [dynamics]);

  useEffect(() => {
    if (!isLoading && emotionData.length > 0 && canvasRef.current) {
      // 延迟启动动画
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.animateRiverFlow();
        }
      }, 500);
    }
  }, [isLoading, emotionData]);

  const handlePointClick = (point) => {
    setSelectedPoint(point);
    showDetailPanel(point);
  };

  const showDetailPanel = (point) => {
    let panel = document.getElementById('emotion-detail-panel');
    
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'emotion-detail-panel';
      panel.className = styles.detailPanel;
      document.body.appendChild(panel);
    }

    const date = new Date(point.date);
    const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    
    const emotionInfo = point.data?.emotionId 
      ? EMOTION_CATEGORIES[point.data.emotionId]
      : null;
    const emotionName = emotionInfo ? emotionInfo.name : '未知';
    const emotionDesc = emotionInfo ? emotionInfo.description : '';

    panel.innerHTML = `
      <div class="${styles.panelHeader}">
        <h3>情感时刻详情</h3>
        <button class="${styles.closeBtn}">&times;</button>
      </div>
      <div class="${styles.panelContent}">
        <div class="${styles.dateSection}">
          <div class="${styles.dateLabel}">日期</div>
          <div class="${styles.dateValue}">${formattedDate}</div>
        </div>
        <div class="${styles.emotionSection}">
          <div class="${styles.emotionLabel}">情感状态</div>
          <div class="${styles.emotionValue}">
            <span class="${styles.emotionName}">${emotionName}</span>
            <span class="${styles.emotionDesc}">${emotionDesc}</span>
          </div>
          <div class="${styles.emotionIntensity}">
            强度: ${point.data ? (point.data.intensity * 100).toFixed(0) : 0}%
          </div>
        </div>
        <div class="${styles.postsSection}">
          ${point.data && point.data.posts && point.data.posts.length > 0
            ? `<div class="${styles.postsLabel}">当日动态</div>
               ${point.data.posts.map((post, index) => `
                 <div class="${styles.postItem}">
                   <div class="${styles.postText}">${
                     post.text && post.text.length > 50
                       ? post.text.substring(0, 50) + '...'
                       : post.text || ''
                   }</div>
                 </div>
               `).join('')}`
            : `<div class="${styles.noPosts}">当日无动态记录</div>`}
        </div>
      </div>
    `;

    panel.classList.add(styles.active);

    // 添加关闭按钮事件
    const closeBtn = panel.querySelector(`.${styles.closeBtn}`);
    if (closeBtn) {
      closeBtn.onclick = () => {
        panel.classList.remove(styles.active);
        setSelectedPoint(null);
        if (canvasRef.current) {
          canvasRef.current.setSelectedPoint(null);
        }
      };
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>正在分析情绪数据...</div>
      </div>
    );
  }

  if (emotionData.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>暂无情绪数据</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>情绪河流</div>
      <div className={styles.subtitle}>时间维度的情感流动可视化</div>
      
      <div className={styles.canvasContainer}>
        <EmotionRiverCanvas
          ref={canvasRef}
          data={emotionData}
          width={800}
          height={400}
          margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
          riverWidth={40}
          showGrid={true}
          showPoints={true}
          showLabels={true}
          animationDuration={2000}
          onPointClick={handlePointClick}
        />
      </div>
    </div>
  );
};

EmotionRiver.propTypes = {
  dynamics: PropTypes.array
};

export default EmotionRiver;

