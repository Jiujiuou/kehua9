import { useEffect, useRef, useState, useCallback } from 'react';
import WordCloud from 'wordcloud';
import styles from './WordCloudComponent.module.less';

/**
 * 词云组件
 * 使用 wordcloud 库生成词云
 */
const WordCloudComponent = ({ 
  words, 
  width = 400, 
  height = 300, 
  backgroundColor = 'transparent',
  color = null,
  fontFamily = 'Arial, sans-serif',
  gridSize = 8,
  rotateRatio = 0.5,
  weightFactor = 1,
}) => {
  const canvasRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 生成词云的函数
  const generateWordCloud = useCallback(() => {
    if (!canvasRef.current || !words || words.length === 0) return;

    console.log('[词云] 开始生成词云, refreshKey:', refreshKey);
    
    const canvas = canvasRef.current;
    
    // 清空画布
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 准备词云数据
    const list = words.map(([word, weight]) => [word, weight]);

    // 计算权重因子
    const maxWeight = Math.max(...words.map(([, w]) => w));
    const calculatedWeightFactor = weightFactor || (height / maxWeight) * 0.5;

    // 词云配置
    const options = {
      list,
      gridSize,
      weightFactor: calculatedWeightFactor,
      fontFamily,
      color: color || 'random-light',
      rotateRatio,
      backgroundColor,
      rotationSteps: 2,
      shuffle: true,
      drawOutOfBound: false,
      shrinkToFit: true,
      minSize: 12,
    };

    console.log('[词云] 配置参数:', { 
      wordCount: list.length, 
      shuffle: options.shuffle,
      rotateRatio: options.rotateRatio,
      rotationSteps: options.rotationSteps 
    });

    try {
      WordCloud(canvas, options);
      console.log('[词云] 生成完成');
    } catch (error) {
      console.error('[词云] 生成失败:', error);
    }
  }, [words, width, height, backgroundColor, color, fontFamily, gridSize, rotateRatio, weightFactor, refreshKey]);

  useEffect(() => {
    generateWordCloud();
  }, [generateWordCloud]);

  // 点击 canvas 刷新词云
  const handleCanvasClick = (e) => {
    // 阻止事件冒泡，避免触发父组件的滑动切换
    e.stopPropagation();
    console.log('[词云] Canvas 被点击, 当前 refreshKey:', refreshKey, '→ 新值:', refreshKey + 1);
    setRefreshKey(prev => prev + 1);
  };

  // 阻止鼠标按下事件冒泡
  const handleMouseDown = (e) => {
    e.stopPropagation();
    console.log('[词云] MouseDown 事件被阻止冒泡');
  };

  // 阻止触摸事件冒泡
  const handleTouchStart = (e) => {
    e.stopPropagation();
    console.log('[词云] TouchStart 事件被阻止冒泡');
  };

  if (!words || words.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>暂无词云数据</p>
      </div>
    );
  }

  return (
    <div className={styles.wordCloudComponent}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: 'auto', cursor: 'pointer' }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        title="点击重新生成词云"
      />
    </div>
  );
};

export default WordCloudComponent;

