import { useEffect, useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { ANNUAL_REPORT_STORAGE_KEYS } from "@/constant/annualReport";
import { appendToJSONList, loadJSON, removeItem, saveJSON } from "@/utils/annualReport";
import { writeDynamicToFile } from "@/utils/writeData";
import styles from "./Chapter8.module.less";

const {
  chapter8Draft: DRAFT_STORAGE_KEY,
  chapter8LocalDynamics: LOCAL_DYNAMICS_STORAGE_KEY,
} = ANNUAL_REPORT_STORAGE_KEYS;

const buildNewTextOnlyDynamic = (text) => {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return {
    timestamp: now.toISOString(),
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    text: String(text || "").trim(),
    images: [],
    videos: [],
  };
};

const Chapter8 = ({ dynamics = [], directoryHandle = null, onDynamicAdd = null }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const [showWriter, setShowWriter] = useState(false);
  const [writerText, setWriterText] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [lastSavedDynamic, setLastSavedDynamic] = useState(null);

  const totalDynamicsCount = useMemo(
    () => (Array.isArray(dynamics) ? dynamics.length : 0),
    [dynamics]
  );

  // 进入发布器时加载草稿
  useEffect(() => {
    if (!showWriter) return;

    const parsed = loadJSON(DRAFT_STORAGE_KEY, null);
    if (parsed?.text && typeof parsed.text === "string") {
      setWriterText(parsed.text);
    }
  }, [showWriter]);

  // 自动保存草稿
  useEffect(() => {
    if (!showWriter) return;

    saveJSON(DRAFT_STORAGE_KEY, { text: writerText, timestamp: Date.now() });
  }, [writerText, showWriter]);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 300);
    const t2 = setTimeout(() => setShowGuide(true), 800);
    const t3 = setTimeout(() => setShowButton(true), 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const closeWriter = useCallback(() => {
    setShowWriter(false);
    setPublished(false);
    setIsPublishing(false);
    setLastSavedDynamic(null);
  }, []);

  const openWriter = useCallback(() => {
    setShowWriter(true);
    setPublished(false);
  }, []);

  const clearDraft = useCallback(() => {
    removeItem(DRAFT_STORAGE_KEY);
  }, []);

  const saveToLocalStorage = useCallback((dynamic) => {
    appendToJSONList(LOCAL_DYNAMICS_STORAGE_KEY, dynamic);
  }, []);

  const handlePublish = useCallback(async () => {
    const text = String(writerText || "").trim();
    if (!text) return;

    setIsPublishing(true);
    try {
      const newDynamic = buildNewTextOnlyDynamic(text);
      const year = String(newDynamic.date || "").slice(0, 4);

      if (directoryHandle) {
        await writeDynamicToFile(directoryHandle, year, newDynamic);
      } else {
        saveToLocalStorage(newDynamic);
      }

      // 通知外部把这条动态加入当前列表（便于立即可见/参与后续统计）
      if (typeof onDynamicAdd === "function") {
        onDynamicAdd(newDynamic);
      }

      clearDraft();
      setLastSavedDynamic(newDynamic);
      setPublished(true);
    } catch (e) {
      console.error("[Chapter8] 发布失败:", e);
      // 这里不使用 Toast，保持 Chapter7 同风格的纯页面体验
      alert(`发布失败：${e?.message || "未知错误"}`);
    } finally {
      setIsPublishing(false);
    }
  }, [writerText, directoryHandle, onDynamicAdd, saveToLocalStorage, clearDraft]);

  const isPublishDisabled = useMemo(() => {
    const text = String(writerText || "").trim();
    return isPublishing || !text;
  }, [writerText, isPublishing]);

  return (
    <div className={styles.chapter8Content}>
      <div
        className={`${styles.chapter8Title} ${showTitle ? styles.fadeIn : styles.hidden}`}
      >
        为这段回忆，续写一笔
      </div>

      {showTitle && (
        <div
          className={`${styles.chapter8Subtitle} ${showGuide ? styles.fadeIn : styles.hidden}`}
        >
          看完这些过往，你此刻是否想说些什么？
        </div>
      )}

      <div className={`${styles.guideSection} ${showGuide ? styles.fadeIn : styles.hidden}`}>
        <div className={styles.guideText}>
          也许是感慨，是对旧日的回应，或是一个新的开始。
        </div>
        <div className={styles.guideText}>
          请写下任何你想留下的字句，它将作为一条全新的“动态”，安全地保存在你的设备本地，
          与你的旧记忆一起，完成这次完整的告别。
        </div>
      </div>

      <button
        type="button"
        className={`${styles.startWriteButton} ${showButton ? styles.fadeIn : styles.hidden}`}
        onClick={openWriter}
      >
        开始书写
      </button>

      {showWriter && (
        <div className={styles.writerOverlay} onClick={closeWriter}>
          <div className={styles.writerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.writerHeader}>
              <div className={styles.writerTitle}>写下你的“此刻”</div>
              <button
                type="button"
                className={styles.writerClose}
                onClick={closeWriter}
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            {!published ? (
              <>
                <div className={styles.writerBody}>
                  <textarea
                    className={styles.writerTextarea}
                    value={writerText}
                    onChange={(e) => setWriterText(e.target.value)}
                    placeholder={
                      "例如：\n\n“再见，谢谢曾经的陪伴。”\n\n“原来那年，我经历过这些。”\n\n“带着这些回忆，我要继续往前走了。”\n\n（或任何你想对自己说的话）"
                    }
                    rows={10}
                    autoFocus
                  />
                </div>

                <div className={styles.writerFooter}>
                  <button
                    type="button"
                    className={styles.publishButton}
                    disabled={isPublishDisabled}
                    onClick={handlePublish}
                  >
                    {isPublishing ? "发布中..." : "发布这条仅自己可见的动态"}
                  </button>

                  {!directoryHandle && (
                    <div className={styles.publishHint}>
                      当前未选择数据文件夹，本次发布将保存到浏览器本地存储。
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.successBody}>
                <div className={styles.successTitle}>✨ 已为你妥善保存。</div>
                <div className={styles.successText}>
                  这条全新的动态，已与你过往的 {totalDynamicsCount} 条记录一起，安放在时光里。
                </div>

                {lastSavedDynamic?.date && (
                  <div className={styles.successMeta}>
                    <span className={styles.successMetaKey}>保存时间</span>
                    <span className={styles.successMetaValue}>
                      {lastSavedDynamic.date} {lastSavedDynamic.time}
                    </span>
                  </div>
                )}

                <div className={styles.successActions}>
                  <button type="button" className={styles.doneButton} onClick={closeWriter}>
                    完成
                  </button>
                  <button
                    type="button"
                    className={styles.writeAgainButton}
                    onClick={() => {
                      setPublished(false);
                      setWriterText("");
                      setLastSavedDynamic(null);
                    }}
                  >
                    再写一条
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

Chapter8.propTypes = {
  dynamics: PropTypes.array,
  directoryHandle: PropTypes.object,
  onDynamicAdd: PropTypes.func,
};

export default Chapter8;
