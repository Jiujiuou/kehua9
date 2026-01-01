import PropTypes from "prop-types";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import Slider from "@/components/Basic/Slider/Slider";
import ButtonGroup from "@/components/Basic/ButtonGroup";
import Radio from "@/components/Basic/Radio";
import DropdownSelector from "@/components/Basic/DropdownSelector";
import AddDynamicDialog from "@/components/Basic/AddDynamicDialog";
import { getSystemFonts } from "@/utils/fonts";
import styles from "./index.module.less";

function Control({
  sortOrder,
  imageGap,
  previewPadding,
  contentGap,
  borderRadius,
  textIndent,
  paragraphSpacing,
  fontSize,
  fontWeight,
  fontFamily,
  lineHeight,
  contentTypeFilter,
  directoryHandle,
  dynamics,
  onSortOrderChange,
  onImageGapChange,
  onPreviewPaddingChange,
  onContentGapChange,
  onBorderRadiusChange,
  onTextIndentChange,
  onParagraphSpacingChange,
  onFontSizeChange,
  onFontWeightChange,
  onFontFamilyChange,
  onLineHeightChange,
  onContentTypeFilterChange,
  onDynamicsChange,
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddSuccess = (newDynamic) => {
    // 添加到当前动态列表
    if (onDynamicsChange) {
      const updatedDynamics = [...dynamics, newDynamic].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
      onDynamicsChange(updatedDynamics);
    }
  };
  return (
    <div className={styles.control}>
      <AddDynamicDialog
        visible={showAddDialog}
        directoryHandle={directoryHandle}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleAddSuccess}
      />
      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <button
            className={styles.addButton}
            onClick={() => setShowAddDialog(true)}
            disabled={!directoryHandle}
          >
            <FaPlus />
            <span>添加动态</span>
          </button>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <ButtonGroup
            label="时间顺序"
            options={[
              { value: "asc", label: "正序" },
              { value: "desc", label: "倒序" },
            ]}
            value={sortOrder}
            onChange={onSortOrderChange}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.filterControl}>
            <span className={styles.filterLabel}>类型</span>
            <div className={styles.filterOptions}>
              <Radio
                id="filter-all"
                name="contentTypeFilter"
                value="all"
                checked={contentTypeFilter === null}
                onChange={() => {
                  onContentTypeFilterChange(null);
                }}
                label="全部"
              />
              <Radio
                id="filter-text-only"
                name="contentTypeFilter"
                value="textOnly"
                checked={contentTypeFilter === "textOnly"}
                onChange={() => {
                  onContentTypeFilterChange("textOnly");
                }}
                label="纯文字"
              />
              <Radio
                id="filter-with-images"
                name="contentTypeFilter"
                value="withImages"
                checked={contentTypeFilter === "withImages"}
                onChange={() => {
                  onContentTypeFilterChange("withImages");
                }}
                label="含图片"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.gapControl}>
            <span className={styles.gapLabel}>图片间距</span>
            <div className={styles.gapSliderWrapper}>
              <Slider
                min={0}
                max={20}
                step={1}
                value={imageGap}
                onChange={onImageGapChange}
              />
            </div>
            <span className={styles.gapValue}>{imageGap}px</span>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.gapControl}>
            <span className={styles.gapLabel}>预览边距</span>
            <div className={styles.gapSliderWrapper}>
              <Slider
                min={10}
                max={40}
                step={1}
                value={previewPadding}
                onChange={onPreviewPaddingChange}
              />
            </div>
            <span className={styles.gapValue}>{previewPadding}px</span>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.gapControl}>
            <span className={styles.gapLabel}>内容间距</span>
            <div className={styles.gapSliderWrapper}>
              <Slider
                min={6}
                max={40}
                step={1}
                value={contentGap}
                onChange={onContentGapChange}
              />
            </div>
            <span className={styles.gapValue}>{contentGap}px</span>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.gapControl}>
            <span className={styles.gapLabel}>动态圆角</span>
            <div className={styles.gapSliderWrapper}>
              <Slider
                min={4}
                max={20}
                step={1}
                value={borderRadius}
                onChange={onBorderRadiusChange}
              />
            </div>
            <span className={styles.gapValue}>{borderRadius}px</span>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <DropdownSelector
            label="字体族"
            options={getSystemFonts().map((font) => ({
              value: font.value,
              label: font.label,
            }))}
            value={fontFamily}
            onChange={onFontFamilyChange}
            placeholder="请选择字体"
          />
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.gapControl}>
            <span className={styles.gapLabel}>行高</span>
            <div className={styles.gapSliderWrapper}>
              <Slider
                min={1.0}
                max={2.0}
                step={0.1}
                value={lineHeight}
                onChange={onLineHeightChange}
              />
            </div>
            <span className={styles.gapValue}>{lineHeight.toFixed(1)}</span>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <ButtonGroup
            label="段落首行缩进"
            options={[
              { value: false, label: "关闭" },
              { value: true, label: "开启" },
            ]}
            value={textIndent}
            onChange={onTextIndentChange}
          />
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <ButtonGroup
            label="段落后空行"
            options={[
              { value: false, label: "否" },
              { value: true, label: "是" },
            ]}
            value={paragraphSpacing}
            onChange={onParagraphSpacingChange}
          />
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.gapControl}>
            <span className={styles.gapLabel}>字体大小</span>
            <div className={styles.gapSliderWrapper}>
              <Slider
                min={12}
                max={24}
                step={1}
                value={fontSize}
                onChange={onFontSizeChange}
              />
            </div>
            <span className={styles.gapValue}>{fontSize}px</span>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.gapControl}>
            <span className={styles.gapLabel}>字体粗细</span>
            <div className={styles.gapSliderWrapper}>
              <Slider
                min={300}
                max={700}
                step={100}
                value={fontWeight}
                onChange={onFontWeightChange}
              />
            </div>
            <span className={styles.gapValue}>{fontWeight}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Control.propTypes = {
  sortOrder: PropTypes.oneOf(["asc", "desc"]),
  imageGap: PropTypes.number,
  previewPadding: PropTypes.number,
  contentGap: PropTypes.number,
  borderRadius: PropTypes.number,
  textIndent: PropTypes.bool,
  paragraphSpacing: PropTypes.bool,
  fontSize: PropTypes.number,
  fontWeight: PropTypes.number,
  fontFamily: PropTypes.string,
  lineHeight: PropTypes.oneOf([1.4, 1.5, 1.6, 1.8, 2.0]),
  contentTypeFilter: PropTypes.oneOf([null, "textOnly", "withImages"]),
  directoryHandle: PropTypes.object,
  dynamics: PropTypes.array,
  onSortOrderChange: PropTypes.func,
  onImageGapChange: PropTypes.func,
  onPreviewPaddingChange: PropTypes.func,
  onContentGapChange: PropTypes.func,
  onBorderRadiusChange: PropTypes.func,
  onTextIndentChange: PropTypes.func,
  onParagraphSpacingChange: PropTypes.func,
  onFontSizeChange: PropTypes.func,
  onFontWeightChange: PropTypes.func,
  onFontFamilyChange: PropTypes.func,
  onLineHeightChange: PropTypes.func,
  onContentTypeFilterChange: PropTypes.func,
  onDynamicsChange: PropTypes.func,
};

export default Control;
