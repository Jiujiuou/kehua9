import { useState, useEffect } from "react";
import styles from "./index.module.less";
import logoImage from "@/assets/images/logo_transparent.png";
import Switch from "@/components/Basic/Switch";
import { FiSun, FiMoon } from "react-icons/fi";
import { loadSettings, saveSetting } from "@/utils/storage";

function Header() {
  // 夜间模式切换 - 从 localStorage 读取初始值
  const [theme, setTheme] = useState(() => {
    const settings = loadSettings();
    return settings.theme || "light";
  });

  // 初始化时应用主题
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    // 设置 data-theme 属性到 html 元素
    document.documentElement.setAttribute("data-theme", newTheme);
    // 保存到 localStorage
    saveSetting("theme", newTheme);
  };

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <img src={logoImage} alt="可话 logo" className={styles.logo} />
      </div>
      <div className={styles.right}>
        <Switch
          options={[
            { value: "light", icon: <FiSun /> },
            { value: "dark", icon: <FiMoon /> },
          ]}
          value={theme}
          onChange={handleThemeChange}
          // size="small"
        />
      </div>
    </div>
  );
}

export default Header;
