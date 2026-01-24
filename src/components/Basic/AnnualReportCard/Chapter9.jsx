import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicCard from "@/components/Basic/DynamicCard";
import { ANNUAL_REPORT_STORAGE_KEYS } from "@/constant/annualReport";
import { formatDateTimeParts, loadJSON, saveJSON } from "@/utils/annualReport";
import { getUserId } from "@/utils/track";
import { useToastHelpers } from "@/components/Basic/Toast";
import PropTypes from "prop-types";
import styles from "./Chapter9.module.less";

const { chapter9SubmissionMock: SUBMISSION_STORAGE_KEY } =
  ANNUAL_REPORT_STORAGE_KEYS;

// API 地址（需要用户提供后替换）
const ADD_TO_PRESTORE_API = "https://v9fq463tb8.hzh.sealos.run/addToPreStore";
const GET_RANDOM_REPORT_DATA_API =
  "https://v9fq463tb8.hzh.sealos.run/getRandomReportData";

// 轻量可复现随机数（基于种子）
const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const buildMockResonanceDynamics = (seed = Date.now()) => {
  const rand = mulberry32(seed);
  const samples = [
    "我们曾在这里，把不敢发在朋友圈的矫情、深夜的崩溃、没来由的快乐，都轻轻放下。谢谢这个空间，让我们无需解释，就能被懂得。",
    "再见啦。我会记得，世界上曾有这样一个角落，盛放过我所有不必‘正确’的情绪。",
    "给所有点过‘共鸣’的陌生人：虽然我们从未交谈，但那些被点亮的瞬间，都是真实存在过的温暖信号。感谢这份沉默的陪伴。",
    "往前走吧。",
    "也许有一天，我们会彻底忘记‘可话’这个名字。但希望我们都不会忘记，那个曾经认真记录、诚实体察生活的自己。你真的很棒。",
    "数据会清空，服务器会关闭，但那些你独自对着屏幕打下文字的夜晚，你按下发布键时的勇气，你读到共鸣时心中一动的瞬间——所有这些，都真切地塑造过你。",
    "别怕，你的感受很重要。",
    "这是一个无法被搜索到的告别。正因为如此，它才如此纯粹和自由。谢谢所有在此留下痕迹的人，你们让这段共同记忆有了温度。",
    "我们像是一群乘坐同一艘夜航船的旅客，船靠岸了，各自散去。但共赏过同一片漆黑海面上星光的那段旅程，我会一直记得。祝你我此后的人生，天高海阔。",
    "如果未来的某天，你偶然想起这里，希望泛起的不是遗憾，而是一种温柔的肯定——肯定自己曾如此珍重地对待过内心的波澜。你值得。",
  ];

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const list = new Array(10).fill(null).map((_, i) => {
    const backDays = Math.floor(rand() * 420) + 1;
    const hour = Math.floor(rand() * 24);
    const minute = Math.floor(rand() * 60);
    const dt = new Date(now - backDays * dayMs);
    dt.setHours(hour, minute, 0, 0);

    const { date, time } = formatDateTimeParts(dt);
    const text = samples[Math.floor(rand() * samples.length)];

    return {
      timestamp: dt.toISOString(),
      date,
      time,
      text,
      images: [],
      videos: [],
      _resonanceId: `${seed}-${i}`,
    };
  });

  // 时间倒序看起来更“即时”
  return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const Chapter9 = ({ userNickname = "" }) => {
  const toast = useToastHelpers();
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showBody, setShowBody] = useState(false);

  // intro | editor | resonance
  const [step, setStep] = useState("intro");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingResonance, setIsLoadingResonance] = useState(false);

  const [resonanceSeed, setResonanceSeed] = useState(() => Date.now());
  const [resonanceList, setResonanceList] = useState([]);
  const [useRealData, setUseRealData] = useState(false);
  const [randomViewCount, setRandomViewCount] = useState(0); // 记录随机查看次数

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 300);
    const t2 = setTimeout(() => setShowSubtitle(true), 800);
    const t3 = setTimeout(() => setShowBody(true), 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // 尝试恢复上次输入（仅 mock，本地保存；真实版本应提交到服务端）
  useEffect(() => {
    const parsed = loadJSON(SUBMISSION_STORAGE_KEY, null);
    if (parsed?.text && typeof parsed.text === "string") {
      setText(parsed.text);
    }
  }, []);

  const persistDraft = useCallback((nextText) => {
    saveJSON(SUBMISSION_STORAGE_KEY, {
      text: String(nextText || ""),
      timestamp: Date.now(),
    });
  }, []);

  const goEditor = useCallback(() => {
    setStep("editor");
  }, []);

  // 获取随机祝福数据
  const fetchRandomResonance = useCallback(async () => {
    setIsLoadingResonance(true);
    try {
      const response = await fetch(GET_RANDOM_REPORT_DATA_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setResonanceList(result.data);
        setUseRealData(true);
      } else {
        // 如果获取失败，使用 mock 数据
        setResonanceSeed(Date.now());
        setUseRealData(false);
      }
    } catch (error) {
      console.error("[Chapter9] 获取祝福数据失败:", error);
      // 如果获取失败，使用 mock 数据
      setResonanceSeed(Date.now());
      setUseRealData(false);
    } finally {
      setIsLoadingResonance(false);
    }
  }, []);

  const goResonanceOnly = useCallback(async () => {
    await fetchRandomResonance();
    setStep("resonance");
    setRandomViewCount(0); // 重置查看次数（首次查看不计数）
  }, [fetchRandomResonance]);

  // 当使用 mock 数据时，生成 mock 列表
  const mockResonanceList = useMemo(
    () => buildMockResonanceDynamics(resonanceSeed),
    [resonanceSeed],
  );

  // 根据 useRealData 决定使用真实数据还是 mock 数据
  const displayResonanceList = useRealData ? resonanceList : mockResonanceList;

  const handleSubmit = useCallback(async () => {
    const content = String(text || "").trim();
    if (!content) return;

    if (!userNickname || !userNickname.trim()) {
      toast.warning("请先输入昵称");
      return;
    }

    setIsSubmitting(true);
    try {
      // 生成时间格式：2025-12-15 20:42（与发布动态组件保持一致）
      const now = new Date();
      const year = now.getFullYear().toString();
      const date = `${year}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate(),
      ).padStart(2, "0")}`;
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`;
      const timeStr = `${date} ${time}`;

      // 获取用户 ID
      const userId = getUserId();

      // 提交留言到 preStore
      const submitResponse = await fetch(ADD_TO_PRESTORE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            userName: userNickname.trim(),
            content: content,
            time: timeStr,
            userId: userId, // 添加 userId 用于限制
          },
        }),
      });

      if (!submitResponse.ok) {
        throw new Error(`HTTP error! status: ${submitResponse.status}`);
      }

      const submitResult = await submitResponse.json();
      if (!submitResult.success) {
        throw new Error(submitResult.message || "提交失败");
      }

      // 保存本地记录
      saveJSON(SUBMISSION_STORAGE_KEY, {
        text: content,
        timestamp: Date.now(),
        submitted: true,
      });

      // 获取随机祝福数据
      await fetchRandomResonance();
      setStep("resonance");
    } catch (e) {
      console.error("[Chapter9] 提交失败:", e);
      toast.error(`发布失败：${e?.message || "未知错误"}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [text, userNickname, fetchRandomResonance]);

  const isSubmitDisabled = useMemo(() => {
    const content = String(text || "").trim();
    return isSubmitting || !content;
  }, [text, isSubmitting]);

  return (
    <div className={styles.chapter9Content}>
      <div
        className={`${styles.chapter9Title} ${showTitle ? styles.fadeIn : styles.hidden}`}
      >
        最终回响
      </div>

      {showTitle && (
        <div
          className={`${styles.chapter9Subtitle} ${
            showSubtitle ? styles.fadeIn : styles.hidden
          }`}
        >
          发布你的最终动态，接收最后一次共鸣
        </div>
      )}

      {step === "intro" && (
        <div
          className={`${styles.introSection} ${showBody ? styles.fadeIn : styles.hidden}`}
        >
          <div className={styles.introText}>
            可话之旅，始于发布，归于共鸣。你可以在此写下最后一刻想对其他用户说的话，作为正式的告别。
          </div>
          <div className={styles.introText}>
            我们将为你随机推送 10 条其他告别者的动态，完成最后一次「共鸣」。
          </div>

          <div className={styles.noticeCard}>
            <div className={styles.noticeTitle}>⚠️ 请知悉</div>
            <ol className={styles.noticeList}>
              <li>
                你的这段内容将匿名存入公开数据库，用于为其他用户提供共鸣。
              </li>
              <li>它将无法删除，请避免包含任何个人身份信息。</li>
              <li>发布后，你将随机看到 10 条他人留下的话。</li>
            </ol>
          </div>

          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={goEditor}
            >
              我已知悉，并开始书写
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={goResonanceOnly}
            >
              仅看看他人的话
            </button>
          </div>
        </div>
      )}

      {step === "editor" && (
        <div
          className={`${styles.editorSection} ${showBody ? styles.fadeIn : styles.hidden}`}
        >
          <div className={styles.editorHeader}>
            <div className={styles.editorTitle}>你的最终动态</div>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => setStep("intro")}
            >
              返回
            </button>
          </div>

          <textarea
            className={styles.editorTextarea}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              persistDraft(e.target.value);
            }}
            placeholder="写下一句告别、一份感慨，或任何你想在此刻定格的话…"
            rows={10}
            autoFocus
          />

          <div className={styles.editorButtons}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={isSubmitDisabled}
              onClick={handleSubmit}
            >
              {isSubmitting ? "发布中..." : "发布并接收最终共鸣"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={goResonanceOnly}
            >
              仅看看他人的话
            </button>
          </div>

          <div className={styles.editorHint}>
            ⚠️
            你的这段内容将匿名存入公开数据库，并且无法删除，请勿包含个人身份信息。
          </div>
        </div>
      )}

      {step === "resonance" && (
        <div className={styles.resonanceSection}>
          <div className={styles.resonanceHeader}>
            <div className={styles.resonanceTitle}>
              为你推送的 10 条最终回响
            </div>
            <div className={styles.resonanceSubtitle}>
              以下内容，来自与你同样在此告别的陌生人。
            </div>
          </div>

          {isLoadingResonance ? (
            <div className={styles.loading}>加载中...</div>
          ) : (
            <div className={styles.resonanceList}>
              {displayResonanceList.length > 0 ? (
                displayResonanceList.map((item, idx) => (
                  <div
                    key={item._resonanceId || idx}
                    className={styles.resonanceItem}
                  >
                    <DynamicCard
                      dynamic={item}
                      index={idx}
                      showPreviewButton={false}
                      showDeleteButton={false}
                      allowContentClickToPreview={false}
                    />
                    <div className={styles.resonanceFooter}>
                      —— {item.userName || "一位可话告别者"}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyHint}>暂无祝福数据</div>
              )}
            </div>
          )}

          <div className={styles.resonanceActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={async () => {
                // 限制最多再随机查看 1 次
                if (randomViewCount >= 1) {
                  toast.warning("最多只能再随机查看 1 次");
                  return;
                }

                if (useRealData) {
                  await fetchRandomResonance();
                } else {
                  setResonanceSeed(Date.now());
                }
                setRandomViewCount((prev) => prev + 1);
              }}
              disabled={isLoadingResonance || randomViewCount >= 1}
            >
              {isLoadingResonance
                ? "加载中..."
                : randomViewCount >= 1
                  ? "已达查看上限"
                  : "再随机看看"}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setStep("intro")}
            >
              去写一条
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

Chapter9.propTypes = {
  userNickname: PropTypes.string,
};

export default Chapter9;
