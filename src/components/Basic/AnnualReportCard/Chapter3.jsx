import PropTypes from "prop-types";
import styles from "./Chapter3.module.less";
import WordCloud from "./WordCloud";

const Chapter3 = ({ dynamics = [] }) => {
  return (
    <div className={styles.chapter3Content}>
      <div className={styles.content}>
        <div className={styles.wordCloudWrapper}>
          <WordCloud dynamics={dynamics} />
        </div>
      </div>
    </div>
  );
};

Chapter3.propTypes = {
  dynamics: PropTypes.array,
};

export default Chapter3;
