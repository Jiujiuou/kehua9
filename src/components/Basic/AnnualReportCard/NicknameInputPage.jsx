import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./NicknameInputPage.module.less";

const FULL_TEXT =
  "你的私人回忆影片即将启幕。\n请输入你在可话的昵称，\n我将以此名，呼唤彼时的你。";

const NicknameInputPage = ({
  userNickname = "",
  onNicknameChange,
  onStartMemory,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showInput, setShowInput] = useState(false);

  // 打字机效果
  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 100; // 每个字符的延迟（毫秒）

    const typeText = () => {
      if (currentIndex < FULL_TEXT.length) {
        setDisplayedText(FULL_TEXT.slice(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeText, typingSpeed);
      } else {
        // 文字显示完成后，延迟一点再显示输入框
        setTimeout(() => {
          setShowInput(true);
        }, 300);
      }
    };

    typeText();
  }, []);

  const handleStartMemory = () => {
    console.log(
      "NicknameInputPage handleStartMemory, userNickname:",
      userNickname
    );
    if (userNickname.trim() && onStartMemory) {
      onStartMemory(userNickname.trim());
    }
  };

  return (
    <>
      <div className={styles.cardText}>
        {displayedText.split("\n").map((line, index, array) => (
          <span key={index}>
            {line}
            {index < array.length - 1 && <br />}
          </span>
        ))}
        {displayedText.length < FULL_TEXT.length && (
          <span className={styles.cursor}>|</span>
        )}
      </div>
      {showInput && (
        <div className={styles.inputRow}>
          <input
            type="text"
            className={styles.input}
            placeholder="请输入那个熟悉的名字"
            value={userNickname}
            onChange={(e) => {
              if (onNicknameChange) {
                onNicknameChange(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && userNickname.trim()) {
                handleStartMemory();
              }
            }}
            autoFocus
          />
          <button
            className={styles.startButton}
            onClick={handleStartMemory}
            disabled={!userNickname.trim()}
          >
            开始回忆之旅
          </button>
        </div>
      )}
    </>
  );
};

NicknameInputPage.propTypes = {
  userNickname: PropTypes.string,
  onNicknameChange: PropTypes.func,
  onStartMemory: PropTypes.func,
};

export default NicknameInputPage;
