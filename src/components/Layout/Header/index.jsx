import styles from "./index.module.less";
import logoImage from "@/assets/images/logo.png";

function Header() {
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <img src={logoImage} alt="可话 logo" className={styles.logo} />
      </div>
    </div>
  );
}

export default Header;
