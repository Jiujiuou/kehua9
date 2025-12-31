import { useRef, useState, useEffect, useCallback } from "react";
import styles from "./index.module.less";
import Header from "@/components/Layout/Header";
import Preview from "@/components/Basic/Preview";
import Control from "@/components/Layout/Control";
import Catalog from "@/components/Layout/Catalog";
import { loadSettings, saveSetting } from "@/utils/storage";

function App() {
  const previewRef = useRef(null);

  // 从 localStorage 加载配置
  const savedSettings = loadSettings();

  const [sortOrder, setSortOrder] = useState(savedSettings.sortOrder);
  const [dynamics, setDynamics] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [imageGap, setImageGap] = useState(savedSettings.imageGap);
  const [previewPadding, setPreviewPadding] = useState(
    savedSettings.previewPadding
  );
  const [contentGap, setContentGap] = useState(savedSettings.contentGap);
  const [borderRadius, setBorderRadius] = useState(savedSettings.borderRadius);
  const [textIndent, setTextIndent] = useState(
    savedSettings.textIndent ?? false
  );
  const [paragraphSpacing, setParagraphSpacing] = useState(
    savedSettings.paragraphSpacing ?? false
  );
  const [fontSize, setFontSize] = useState(savedSettings.fontSize ?? 15);
  const [fontWeight, setFontWeight] = useState(savedSettings.fontWeight ?? 400);
  const [contentTypeFilter, setContentTypeFilter] = useState(
    savedSettings.contentTypeFilter ?? null
  );
  const [directoryHandle, setDirectoryHandle] = useState(null);

  // 当配置改变时，保存到 localStorage
  useEffect(() => {
    saveSetting("sortOrder", sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    saveSetting("imageGap", imageGap);
  }, [imageGap]);

  useEffect(() => {
    saveSetting("previewPadding", previewPadding);
  }, [previewPadding]);

  useEffect(() => {
    saveSetting("contentGap", contentGap);
  }, [contentGap]);

  useEffect(() => {
    saveSetting("borderRadius", borderRadius);
  }, [borderRadius]);

  useEffect(() => {
    saveSetting("textIndent", textIndent);
  }, [textIndent]);

  useEffect(() => {
    saveSetting("paragraphSpacing", paragraphSpacing);
  }, [paragraphSpacing]);

  useEffect(() => {
    saveSetting("fontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    saveSetting("fontWeight", fontWeight);
  }, [fontWeight]);

  useEffect(() => {
    saveSetting("contentTypeFilter", contentTypeFilter);
  }, [contentTypeFilter]);

  const handleSortOrderChange = (newOrder) => {
    setSortOrder(newOrder);
  };

  const handleDynamicsChange = useCallback((newDynamics) => {
    setDynamics(newDynamics);
  }, []);

  const handleDateClick = (dateStr) => {
    // 先更新选中日期，这样滚动时不会触发更新
    setSelectedDate(dateStr);
    if (previewRef.current && previewRef.current.scrollToDate) {
      previewRef.current.scrollToDate(dateStr);
    }
  };

  const handleScrollChange = (dateStr) => {
    // 只有当日期改变时才更新，避免循环更新
    setSelectedDate((prevDate) => {
      if (dateStr !== prevDate) {
        return dateStr;
      }
      return prevDate;
    });
  };

  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.content}>
        <Catalog
          dynamics={dynamics}
          selectedDate={selectedDate}
          sortOrder={sortOrder}
          onDateClick={handleDateClick}
        />
        <Preview
          ref={previewRef}
          sortOrder={sortOrder}
          imageGap={imageGap}
          previewPadding={previewPadding}
          contentGap={contentGap}
          borderRadius={borderRadius}
          textIndent={textIndent}
          paragraphSpacing={paragraphSpacing}
          fontSize={fontSize}
          fontWeight={fontWeight}
          contentTypeFilter={contentTypeFilter}
          dynamics={dynamics}
          onDynamicsChange={handleDynamicsChange}
          onScrollChange={handleScrollChange}
          onDirectoryHandleChange={setDirectoryHandle}
          directoryHandle={directoryHandle}
        />
        <Control
          sortOrder={sortOrder}
          imageGap={imageGap}
          previewPadding={previewPadding}
          contentGap={contentGap}
          borderRadius={borderRadius}
          textIndent={textIndent}
          paragraphSpacing={paragraphSpacing}
          fontSize={fontSize}
          fontWeight={fontWeight}
          contentTypeFilter={contentTypeFilter}
          directoryHandle={directoryHandle}
          dynamics={dynamics}
          onSortOrderChange={handleSortOrderChange}
          onImageGapChange={setImageGap}
          onPreviewPaddingChange={setPreviewPadding}
          onContentGapChange={setContentGap}
          onBorderRadiusChange={setBorderRadius}
          onTextIndentChange={setTextIndent}
          onParagraphSpacingChange={setParagraphSpacing}
          onFontSizeChange={setFontSize}
          onFontWeightChange={setFontWeight}
          onContentTypeFilterChange={setContentTypeFilter}
          onDynamicsChange={handleDynamicsChange}
        />
      </div>
    </div>
  );
}

export default App;
