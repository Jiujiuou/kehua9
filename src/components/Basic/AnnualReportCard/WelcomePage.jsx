import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./WelcomePage.module.less";

const WelcomePage = ({ userNickname = "" }) => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showNickname, setShowNickname] = useState(false);

  useEffect(() => {
    // 调试：打印接收到的 userNickname
    console.log("WelcomePage received userNickname:", userNickname);

    // 先显示"欢迎回来"
    const timer1 = setTimeout(() => {
      setShowWelcome(true);
    }, 300);

    // 然后显示昵称
    const timer2 = setTimeout(() => {
      setShowNickname(true);
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [userNickname]);

  return (
    <div className={styles.welcomeContent}>
      <div className={styles.welcomeText}>
        <span className={showWelcome ? styles.fadeIn : styles.hidden}>
          欢迎回来，
        </span>
        {showWelcome && (
          <span className={showNickname ? styles.fadeIn : styles.hidden}>
            {userNickname || "朋友"}。
          </span>
        )}
      </div>
    </div>
  );
};

WelcomePage.propTypes = {
  userNickname: PropTypes.string,
};

export default WelcomePage;
