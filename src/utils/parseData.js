/**
 * 解析上传的动态数据
 * 将文件列表解析为结构化的动态数据
 */

/**
 * 解析动态数据
 * @param {FileList} files - 上传的文件列表
 * @returns {Promise<Array>} 解析后的动态数据数组
 */
export async function parseDynamicData(files) {
  // 将 FileList 转换为数组
  const fileArray = Array.from(files);

  console.log("开始解析，文件总数:", fileArray.length);

  // 按年份分组文件
  const yearGroups = {};

  // 先找出所有年份文件夹
  // 支持多种路径格式：
  // 1. 我的动态/2021年/2021年-动态内容.txt (选择父文件夹)
  // 2. 2021年/2021年-动态内容.txt (直接选择"我的动态"文件夹)
  // 3. 彩虹绿/我的动态/2021年/2021年-动态内容.txt (选择包含"我的动态"的父文件夹)
  fileArray.forEach(file => {
    const pathParts = file.webkitRelativePath.split('/');
    console.log("文件路径:", file.webkitRelativePath, "路径部分:", pathParts);

    let yearFolder = null;

    // 查找"我的动态"在路径中的位置
    const myDynamicIndex = pathParts.findIndex(part => part === '我的动态');

    if (myDynamicIndex !== -1) {
      // 找到了"我的动态"，年份文件夹应该在它后面
      if (pathParts.length > myDynamicIndex + 1) {
        yearFolder = pathParts[myDynamicIndex + 1];
      }
    }
    // 如果没有找到"我的动态"，检查是否直接以年份文件夹开头
    else if (pathParts.length >= 1 && pathParts[0].endsWith('年')) {
      yearFolder = pathParts[0];
    }

      if (yearFolder && yearFolder.endsWith('年')) {
        const year = yearFolder.replace('年', '');
        if (!yearGroups[year]) {
          yearGroups[year] = {
            year,
            contentFile: null,
            images: [],
            videos: []
          };
          console.log("找到年份文件夹:", year);
        }
      }
  });

  console.log("找到的年份:", Object.keys(yearGroups));

  // 处理每个年份的文件
  for (const file of fileArray) {
    const pathParts = file.webkitRelativePath.split('/');

    let yearFolder = null;
    let year = null;
    let yearIndex = -1; // 年份文件夹在路径中的索引

    // 查找"我的动态"在路径中的位置
    const myDynamicIndex = pathParts.findIndex(part => part === '我的动态');

    if (myDynamicIndex !== -1) {
      // 找到了"我的动态"，年份文件夹应该在它后面
      if (pathParts.length > myDynamicIndex + 1) {
        yearFolder = pathParts[myDynamicIndex + 1];
        yearIndex = myDynamicIndex + 1;
      }
    }
    // 如果没有找到"我的动态"，检查是否直接以年份文件夹开头
    else if (pathParts.length >= 1 && pathParts[0].endsWith('年')) {
      yearFolder = pathParts[0];
      yearIndex = 0;
    }

    if (!yearFolder || !yearFolder.endsWith('年')) {
      continue;
    }

    year = yearFolder.replace('年', '');

    if (!yearGroups[year]) {
      continue;
    }

    // 处理动态内容文件
    // 路径格式：.../2021年/2021年-动态内容.txt
    const expectedContentFileName = `${yearFolder}-动态内容.txt`;
    const actualFileName = pathParts[yearIndex + 1];

    if (pathParts.length === yearIndex + 2 && actualFileName === expectedContentFileName) {
      console.log("找到动态内容文件:", file.webkitRelativePath);
      const content = await readFileAsText(file);
      yearGroups[year].contentFile = {
        content,
        year
      };
    }

    // 处理图片和视频文件
    // 路径格式：.../2021年/图片&视频/月份/文件名
    const imageFolderIndex = yearIndex + 1;
    if (pathParts.length > imageFolderIndex && pathParts[imageFolderIndex] === '图片&视频') {
      const fileName = pathParts[pathParts.length - 1];
      // 处理图片文件
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const isImage = imageExtensions.some(ext =>
        fileName.toLowerCase().endsWith(ext)
      );

      if (isImage) {
        console.log("找到图片文件:", file.webkitRelativePath);
        const imagePath = pathParts.slice(imageFolderIndex + 1).join('/');
        const imageUrl = await readFileAsDataURL(file);
        yearGroups[year].images.push({
          name: fileName,
          path: imagePath,
          url: imageUrl,
          file: file
        });
      }

      // 处理视频文件
      const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv'];
      const isVideo = videoExtensions.some(ext =>
        fileName.toLowerCase().endsWith(ext)
      );

      if (isVideo) {
        console.log("找到视频文件:", file.webkitRelativePath);
        const videoPath = pathParts.slice(imageFolderIndex + 1).join('/');
        const videoUrl = await readFileAsDataURL(file);
        yearGroups[year].videos.push({
          name: fileName,
          path: videoPath,
          url: videoUrl,
          file: file
        });
      }
    }
  }

  // 解析每个年份的动态内容
  const allDynamics = [];

  for (const year in yearGroups) {
    const group = yearGroups[year];
    console.log(`处理年份 ${year}:`, {
      hasContentFile: !!group.contentFile,
      imageCount: group.images.length,
      videoCount: group.videos.length
    });

    if (!group.contentFile) {
      console.warn(`年份 ${year} 没有找到动态内容文件`);
      continue;
    }

    const dynamics = parseYearContent(group.contentFile.content, group.images, group.videos);
    console.log(`年份 ${year} 解析出 ${dynamics.length} 条动态`);
    allDynamics.push(...dynamics);
  }

  // 按时间排序
  allDynamics.sort((a, b) => {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });

  console.log("最终解析结果:", {
    totalDynamics: allDynamics.length,
    years: Object.keys(yearGroups)
  });

  return allDynamics;
}

/**
 * 解析单个年份的动态内容
 * @param {string} content - 文本内容
 * @param {Array} images - 该年份的图片数组
 * @param {Array} videos - 该年份的视频数组
 * @returns {Array} 动态数组
 */
function parseYearContent(content, images, videos) {
  const dynamics = [];
  const lines = content.split('\n');

  let currentDynamic = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 匹配时间戳：2021年08月15日 01:02:18
    const timestampMatch = line.match(/^(\d{4})年(\d{2})月(\d{2})日\s+(\d{2}):(\d{2}):(\d{2})$/);

    if (timestampMatch) {
      // 保存上一个动态
      if (currentDynamic) {
        dynamics.push(currentDynamic);
      }

      // 创建新动态
      const [, yearStr, month, day, hour, minute, second] = timestampMatch;
      const timestamp = new Date(
        parseInt(yearStr),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      );

      currentDynamic = {
        timestamp: timestamp.toISOString(),
        date: `${yearStr}-${month}-${day}`,
        time: `${hour}:${minute}`,
        text: '',
        images: [],
        videos: []
      };
    } else if (currentDynamic) {
      // 匹配图片引用：[图片：20210822-181756-1.jpeg]
      const imageMatch = line.match(/\[图片：(.+?)\]/);

      if (imageMatch) {
        const imageName = imageMatch[1];
        // 查找对应的图片
        const image = images.find(img => img.name === imageName);
        if (image) {
          currentDynamic.images.push({
            name: imageName,
            url: image.url,
            path: image.path
          });
        }
      } else {
        // 匹配视频引用：[视频：20210814-170000-1.mp4]
        const videoMatch = line.match(/\[视频：(.+?)\]/);

        if (videoMatch) {
          const videoName = videoMatch[1];
          // 查找对应的视频
          const video = videos.find(vid => vid.name === videoName);
          if (video) {
            currentDynamic.videos.push({
              name: videoName,
              url: video.url,
              path: video.path
            });
          }
        } else if (line) {
          // 文本内容
          if (currentDynamic.text) {
            currentDynamic.text += '\n' + line;
          } else {
            currentDynamic.text = line;
          }
        }
      }
    }
  }

  // 保存最后一个动态
  if (currentDynamic) {
    dynamics.push(currentDynamic);
  }

  return dynamics;
}

/**
 * 读取文件为文本
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 文件文本内容
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * 读取文件为 Data URL
 * @param {File} file - 文件对象
 * @returns {Promise<string>} Data URL
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

