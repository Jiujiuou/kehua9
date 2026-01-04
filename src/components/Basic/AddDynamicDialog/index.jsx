import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { FaPlus } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { writeDynamicToFile } from "@/utils/writeData";
import { useToastHelpers } from "@/components/Basic/Toast";
import { track } from "@/utils/track";
import styles from "./index.module.less";

function SortableImageItem({ imageItem, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${imageItem.file.name}-${imageItem.file.size}-${imageItem.file.lastModified}`,
  });

  // 限制拖拽只在水平方向
  const limitedTransform = transform
    ? {
        ...transform,
        y: 0, // 限制垂直方向移动为0
      }
    : null;

  const style = {
    transform: CSS.Transform.toString(limitedTransform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.imagePreviewItem}
      {...attributes}
      {...listeners}
    >
      <img
        src={imageItem.preview}
        alt={imageItem.name}
        className={styles.imagePreview}
        draggable={false}
      />
      <IoMdClose
        className={styles.removeIcon}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
      />
    </div>
  );
}

SortableImageItem.propTypes = {
  imageItem: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onRemove: PropTypes.func.isRequired,
};

function AddDynamicDialog({ visible, directoryHandle, onClose, onSuccess }) {
  const [newDynamicText, setNewDynamicText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToastHelpers();

  const handleAddDynamic = async () => {
    if (!directoryHandle) {
      toast.warning("请先选择数据文件夹");
      return;
    }

    if (
      !newDynamicText.trim() &&
      selectedImages.length === 0 &&
      !selectedVideo
    ) {
      toast.warning("请输入动态内容或添加图片/视频");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const year = now.getFullYear().toString();

      // 上传图片
      const uploadedImages = [];
      for (const imageItem of selectedImages) {
        try {
          const imageData = await uploadImageToFolder(imageItem.file, year);
          uploadedImages.push(imageData);
        } catch (error) {
          console.error("上传图片失败:", error);
          toast.error(`上传图片 ${imageItem.name} 失败：${error.message}`);
        }
      }

      // 上传视频
      let uploadedVideo = null;
      if (selectedVideo) {
        try {
          uploadedVideo = await uploadVideoToFolder(selectedVideo.file, year);
        } catch (error) {
          console.error("上传视频失败:", error);
          toast.error(`上传视频 ${selectedVideo.name} 失败：${error.message}`);
        }
      }

      // 创建新动态对象
      const newDynamic = {
        timestamp: now.toISOString(),
        date: `${year}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
          now.getDate()
        ).padStart(2, "0")}`,
        time: `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`,
        text: newDynamicText.trim(),
        images: uploadedImages,
        videos: uploadedVideo ? [uploadedVideo] : [],
      };

      // 写入文件
      await writeDynamicToFile(directoryHandle, year, newDynamic);

      // 通知父组件成功
      if (onSuccess) {
        onSuccess(newDynamic);
      }

      // 清空输入并关闭对话框
      setNewDynamicText("");
      setSelectedImages([]);
      if (selectedVideo) {
        URL.revokeObjectURL(selectedVideo.preview);
      }
      setSelectedVideo(null);
      onClose();
      toast.success("动态发布成功");

      // 埋点：发布新动态
      track("发布新动态成功");
    } catch (error) {
      console.error("添加动态失败:", error);
      toast.error("添加动态失败：" + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    setNewDynamicText("");
    // Revoke all object URLs before closing
    selectedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setSelectedImages([]);
    if (selectedVideo) {
      URL.revokeObjectURL(selectedVideo.preview);
    }
    setSelectedVideo(null);
    onClose();
  }, [selectedImages, selectedVideo, onClose]);

  // 监听 ESC 键关闭弹窗
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" || event.keyCode === 27) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, handleClose]);

  const handleMediaSelect = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    // 分离图片和视频文件
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const videoFiles = files.filter((file) => file.type.startsWith("video/"));

    // 如果既没有图片也没有视频，提示用户
    if (imageFiles.length === 0 && videoFiles.length === 0) {
      toast.warning("请选择图片或视频文件");
      event.target.value = "";
      return;
    }

    // 限制：如果已添加图片，不能再添加视频；如果已添加视频，不能再添加图片
    if (selectedImages.length > 0 && videoFiles.length > 0) {
      toast.warning(
        "已添加图片，不能再添加视频。请先删除所有图片后再添加视频。"
      );
      event.target.value = "";
      return;
    }

    if (selectedVideo && imageFiles.length > 0) {
      toast.warning("已添加视频，不能再添加图片。请先删除视频后再添加图片。");
      event.target.value = "";
      return;
    }

    // 检查图片文件大小（限制为 20MB）
    const maxImageSize = 20 * 1024 * 1024; // 20MB
    const oversizedImages = imageFiles.filter(
      (file) => file.size > maxImageSize
    );
    if (oversizedImages.length > 0) {
      toast.warning(
        `图片文件大小不能超过 20MB，已跳过 ${oversizedImages.length} 个文件`
      );
      // 移除过大的图片文件
      imageFiles.splice(
        0,
        imageFiles.length,
        ...imageFiles.filter((file) => file.size <= maxImageSize)
      );
    }

    // 检查视频文件大小（限制为 100MB）
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const oversizedVideos = videoFiles.filter(
      (file) => file.size > maxVideoSize
    );
    if (oversizedVideos.length > 0) {
      toast.warning(
        `视频文件大小不能超过 100MB，已跳过 ${oversizedVideos.length} 个文件`
      );
      // 移除过大的视频文件
      videoFiles.splice(
        0,
        videoFiles.length,
        ...videoFiles.filter((file) => file.size <= maxVideoSize)
      );
    }

    // 如果所有文件都被过滤掉了，直接返回
    if (imageFiles.length === 0 && videoFiles.length === 0) {
      event.target.value = "";
      return;
    }

    // 处理视频文件（限制为1个）
    if (videoFiles.length > 0) {
      // 检查视频格式，只允许 MP4 格式
      const nonMp4Videos = videoFiles.filter((file) => {
        const fileName = file.name.toLowerCase();
        return !fileName.endsWith(".mp4");
      });

      if (nonMp4Videos.length > 0) {
        const fileNames = nonMp4Videos
          .map((file) => file.name)
          .slice(0, 3)
          .join("、");
        const moreText =
          nonMp4Videos.length > 3 ? `等 ${nonMp4Videos.length} 个文件` : "";
        toast.error(
          `不支持非 MP4 格式的视频文件（${fileNames}${moreText}），请先转换为 MP4 格式后再上传`
        );
        // 移除非 MP4 格式的视频文件
        videoFiles.splice(
          0,
          videoFiles.length,
          ...videoFiles.filter((file) => {
            const fileName = file.name.toLowerCase();
            return fileName.endsWith(".mp4");
          })
        );
      }

      // 如果所有视频文件都被过滤掉了，直接返回
      if (videoFiles.length === 0) {
        event.target.value = "";
        return;
      }

      if (selectedVideo) {
        toast.warning("最多只能上传 1 个视频，已存在视频将被替换");
        URL.revokeObjectURL(selectedVideo.preview);
      }

      const videoFile = videoFiles[0];
      const videoPreview = {
        file: videoFile,
        preview: URL.createObjectURL(videoFile),
        name: videoFile.name,
      };
      setSelectedVideo(videoPreview);

      if (videoFiles.length > 1) {
        toast.info(`选择了 ${videoFiles.length} 个视频文件，只使用第一个`);
      }
    }

    // 处理图片文件（最多9张）
    if (imageFiles.length > 0) {
      // 检查当前已选择的图片数量
      const currentCount = selectedImages.length;
      const maxCount = 9;

      if (currentCount >= maxCount) {
        toast.warning(`最多只能上传 ${maxCount} 张图片`);
        event.target.value = "";
        return;
      }

      // 检测重复文件（通过文件名、大小和最后修改时间判断）
      const existingFiles = new Set(
        selectedImages.map(
          (img) => `${img.file.name}-${img.file.size}-${img.file.lastModified}`
        )
      );

      const newFiles = imageFiles.filter((file) => {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        return !existingFiles.has(fileKey);
      });

      const duplicateCount = imageFiles.length - newFiles.length;
      if (duplicateCount > 0) {
        toast.info(`检测到 ${duplicateCount} 张重复图片，已自动跳过`);
      }

      if (newFiles.length > 0) {
        // 计算还能添加多少张
        const remainingSlots = maxCount - currentCount;
        const filesToAdd = newFiles.slice(0, remainingSlots);

        if (newFiles.length > remainingSlots) {
          toast.info(
            `最多只能上传 ${maxCount} 张图片，已选择 ${currentCount} 张，将只添加前 ${remainingSlots} 张`
          );
        }

        // 创建预览 URL
        const imagePreviews = filesToAdd.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
        }));

        setSelectedImages((prev) => [...prev, ...imagePreviews]);
      }
    }

    // 清空 input 值，以便可以重复选择同一文件
    event.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prev) => {
      const newImages = [...prev];
      // 释放预览 URL
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleRemoveVideo = () => {
    if (selectedVideo) {
      URL.revokeObjectURL(selectedVideo.preview);
      setSelectedVideo(null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedImages((items) => {
        const oldIndex = items.findIndex(
          (item) =>
            `${item.file.name}-${item.file.size}-${item.file.lastModified}` ===
            active.id
        );
        const newIndex = items.findIndex(
          (item) =>
            `${item.file.name}-${item.file.size}-${item.file.lastModified}` ===
            over.id
        );

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const uploadImageToFolder = async (imageFile, year) => {
    try {
      // 查找或创建年份文件夹
      let targetDirectoryHandle = directoryHandle;

      try {
        const myDynamicHandle = await directoryHandle.getDirectoryHandle(
          "我的动态"
        );
        targetDirectoryHandle = myDynamicHandle;
      } catch {
        targetDirectoryHandle = directoryHandle;
      }

      const yearFolderName = `${year}年`;
      let yearFolderHandle;

      try {
        yearFolderHandle = await targetDirectoryHandle.getDirectoryHandle(
          yearFolderName
        );
      } catch {
        yearFolderHandle = await targetDirectoryHandle.getDirectoryHandle(
          yearFolderName,
          { create: true }
        );
      }

      // 创建或获取"图片&视频"文件夹
      const imageVideoFolderName = "图片&视频";
      let imageVideoFolderHandle;

      try {
        imageVideoFolderHandle = await yearFolderHandle.getDirectoryHandle(
          imageVideoFolderName
        );
      } catch {
        imageVideoFolderHandle = await yearFolderHandle.getDirectoryHandle(
          imageVideoFolderName,
          { create: true }
        );
      }

      // 生成文件名（使用历史格式：YYYYMMDD-HHMMSS-序号.扩展名）
      const now = new Date();
      const yearStr = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hour = String(now.getHours()).padStart(2, "0");
      const minute = String(now.getMinutes()).padStart(2, "0");
      const second = String(now.getSeconds()).padStart(2, "0");

      // 获取文件扩展名
      const fileExtension = imageFile.name.split(".").pop() || "jpg";

      // 检查是否有同名文件，如果有则添加序号
      let fileName = `${yearStr}${month}${day}-${hour}${minute}${second}-1.${fileExtension}`;
      let counter = 1;

      // 检查文件是否已存在，如果存在则递增序号
      while (true) {
        try {
          await imageVideoFolderHandle.getFileHandle(fileName);
          // 文件存在，递增序号
          counter++;
          fileName = `${yearStr}${month}${day}-${hour}${minute}${second}-${counter}.${fileExtension}`;
        } catch {
          // 文件不存在，可以使用这个文件名
          break;
        }
      }

      // 写入图片文件
      const fileHandle = await imageVideoFolderHandle.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(await imageFile.arrayBuffer());
      await writable.close();

      // 读取刚写入的文件，生成 data URL
      const uploadedFile = await fileHandle.getFile();
      const imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });

      return {
        name: fileName,
        url: imageUrl,
        path: imageVideoFolderName,
      };
    } catch (error) {
      console.error("上传图片失败:", error);
      throw error;
    }
  };

  const uploadVideoToFolder = async (videoFile, year) => {
    try {
      // 查找或创建年份文件夹
      let targetDirectoryHandle = directoryHandle;

      try {
        const myDynamicHandle = await directoryHandle.getDirectoryHandle(
          "我的动态"
        );
        targetDirectoryHandle = myDynamicHandle;
      } catch {
        targetDirectoryHandle = directoryHandle;
      }

      const yearFolderName = `${year}年`;
      let yearFolderHandle;

      try {
        yearFolderHandle = await targetDirectoryHandle.getDirectoryHandle(
          yearFolderName
        );
      } catch {
        yearFolderHandle = await targetDirectoryHandle.getDirectoryHandle(
          yearFolderName,
          { create: true }
        );
      }

      // 创建或获取"图片&视频"文件夹
      const imageVideoFolderName = "图片&视频";
      let imageVideoFolderHandle;

      try {
        imageVideoFolderHandle = await yearFolderHandle.getDirectoryHandle(
          imageVideoFolderName
        );
      } catch {
        imageVideoFolderHandle = await yearFolderHandle.getDirectoryHandle(
          imageVideoFolderName,
          { create: true }
        );
      }

      // 生成文件名（使用历史格式：YYYYMMDD-HHMMSS-序号.扩展名）
      const now = new Date();
      const yearStr = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hour = String(now.getHours()).padStart(2, "0");
      const minute = String(now.getMinutes()).padStart(2, "0");
      const second = String(now.getSeconds()).padStart(2, "0");

      // 获取文件扩展名
      const fileExtension = videoFile.name.split(".").pop() || "mp4";

      // 检查是否有同名文件，如果有则添加序号
      let fileName = `${yearStr}${month}${day}-${hour}${minute}${second}-1.${fileExtension}`;
      let counter = 1;

      // 检查文件是否已存在，如果存在则递增序号
      while (true) {
        try {
          await imageVideoFolderHandle.getFileHandle(fileName);
          // 文件存在，递增序号
          counter++;
          fileName = `${yearStr}${month}${day}-${hour}${minute}${second}-${counter}.${fileExtension}`;
        } catch {
          // 文件不存在，可以使用这个文件名
          break;
        }
      }

      // 写入视频文件
      const fileHandle = await imageVideoFolderHandle.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(await videoFile.arrayBuffer());
      await writable.close();

      // 读取刚写入的文件，生成 data URL
      const uploadedFile = await fileHandle.getFile();
      const videoUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });

      return {
        name: fileName,
        url: videoUrl,
        path: imageVideoFolderName,
      };
    } catch (error) {
      console.error("上传视频失败:", error);
      throw error;
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.dialogOverlay} onClick={handleClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <button className={styles.closeButton} onClick={handleClose}>
            <span className={styles.closeIcon}>×</span>
          </button>
          <button
            className={styles.publishButton}
            onClick={handleAddDynamic}
            disabled={
              isSubmitting ||
              (!newDynamicText.trim() &&
                selectedImages.length === 0 &&
                !selectedVideo)
            }
          >
            发布
          </button>
        </div>
        <div className={styles.dialogContent}>
          <textarea
            className={styles.textarea}
            value={newDynamicText}
            onChange={(e) => setNewDynamicText(e.target.value)}
            placeholder="我想说..."
            rows={8}
            autoFocus
          />
        </div>
        <div className={styles.dialogFooter}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4"
            multiple
            onChange={handleMediaSelect}
            style={{ display: "none" }}
          />
          <button
            className={styles.addMediaButton}
            onClick={() => fileInputRef.current?.click()}
            type="button"
            title="添加图片或视频"
          >
            <FaPlus className={styles.addMediaIcon} />
          </button>
          {selectedImages.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedImages.map(
                  (item) =>
                    `${item.file.name}-${item.file.size}-${item.file.lastModified}`
                )}
                strategy={horizontalListSortingStrategy}
              >
                <div className={styles.imagePreviewList}>
                  {selectedImages.map((imageItem, index) => (
                    <SortableImageItem
                      key={`${imageItem.file.name}-${imageItem.file.size}-${imageItem.file.lastModified}`}
                      imageItem={imageItem}
                      index={index}
                      onRemove={handleRemoveImage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          {selectedVideo && (
            <div className={styles.videoPreviewWrapper}>
              <div className={styles.videoPreviewItem}>
                <video
                  src={selectedVideo.preview}
                  className={styles.videoPreview}
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    e.target.currentTime = 0.1;
                  }}
                />
                <div className={styles.videoPlayIcon}>▶</div>
                <IoMdClose
                  className={styles.removeIcon}
                  onClick={handleRemoveVideo}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

AddDynamicDialog.propTypes = {
  visible: PropTypes.bool.isRequired,
  directoryHandle: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default AddDynamicDialog;
