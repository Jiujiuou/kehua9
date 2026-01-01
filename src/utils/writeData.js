/**
 * 写入动态数据到文件
 * 使用 File System Access API 写入到原始文件夹
 */

/**
 * 格式化日期时间为动态文件格式
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期时间字符串，如 "2021年08月15日 01:02:18"
 */
export function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}年${month}月${day}日 ${hour}:${minute}:${second}`;
}

/**
 * 将动态数据转换为文件内容格式
 * @param {Array} dynamics - 动态数组
 * @returns {string} 文件内容字符串
 */
export function formatDynamicsToContent(dynamics) {
  const lines = [];
  
  dynamics.forEach((dynamic) => {
    // 解析日期和时间
    const date = new Date(dynamic.timestamp);
    const dateTimeStr = formatDateTime(date);
    lines.push(dateTimeStr);
    
    // 添加文本内容
    if (dynamic.text) {
      const textLines = dynamic.text.split('\n');
      textLines.forEach((line) => {
        if (line.trim()) {
          lines.push(line);
        }
      });
    }
    
    // 添加图片引用
    if (dynamic.images && dynamic.images.length > 0) {
      dynamic.images.forEach((image) => {
        lines.push(`[图片：${image.name}]`);
      });
    }
    
    // 添加视频引用
    if (dynamic.videos && dynamic.videos.length > 0) {
      dynamic.videos.forEach((video) => {
        lines.push(`[视频：${video.name}]`);
      });
    }
  });
  
  return lines.join('\n');
}

/**
 * 写入动态到文件
 * @param {FileSystemDirectoryHandle} directoryHandle - 文件夹句柄
 * @param {string} year - 年份，如 "2021"
 * @param {Object} newDynamic - 新动态对象
 * @returns {Promise<void>}
 */
export async function writeDynamicToFile(directoryHandle, year, newDynamic) {
  try {
    // 首先检查是否是"我的动态"文件夹，或者需要进入"我的动态"文件夹
    let targetDirectoryHandle = directoryHandle;
    
    try {
      // 尝试获取"我的动态"文件夹
      const myDynamicHandle = await directoryHandle.getDirectoryHandle('我的动态');
      targetDirectoryHandle = myDynamicHandle;
    } catch (error) {
      // 如果"我的动态"文件夹不存在，直接使用当前文件夹
      // 这意味着用户可能直接选择了"我的动态"文件夹，或者文件夹结构不同
      targetDirectoryHandle = directoryHandle;
    }
    
    // 查找或创建年份文件夹
    const yearFolderName = `${year}年`;
    let yearFolderHandle;
    
    try {
      yearFolderHandle = await targetDirectoryHandle.getDirectoryHandle(yearFolderName);
    } catch (error) {
      // 如果文件夹不存在，创建它
      yearFolderHandle = await targetDirectoryHandle.getDirectoryHandle(yearFolderName, { create: true });
    }
    
    // 读取现有的动态内容文件
    const contentFileName = `${yearFolderName}-动态内容.txt`;
    let existingContent = '';
    
    try {
      const contentFileHandle = await yearFolderHandle.getFileHandle(contentFileName);
      const file = await contentFileHandle.getFile();
      existingContent = await file.text();
    } catch (error) {
      // 文件不存在，创建新文件
      console.log(`文件 ${contentFileName} 不存在，将创建新文件`);
    }
    
    // 解析现有内容，获取所有动态
    const existingDynamics = parseContentToDynamics(existingContent);
    
    // 添加新动态
    existingDynamics.push(newDynamic);
    
    // 按时间排序
    existingDynamics.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // 转换为文件内容格式
    const newContent = formatDynamicsToContent(existingDynamics);
    
    // 写入文件
    const contentFileHandle = await yearFolderHandle.getFileHandle(contentFileName, { create: true });
    const writable = await contentFileHandle.createWritable();
    await writable.write(newContent);
    await writable.close();
    
    console.log(`成功写入动态到 ${contentFileName}`);
  } catch (error) {
    console.error("写入文件失败:", error);
    throw error;
  }
}

/**
 * 解析文件内容为动态数组（简化版，用于读取现有数据）
 * @param {string} content - 文件内容
 * @returns {Array} 动态数组
 */
function parseContentToDynamics(content) {
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
        currentDynamic.images.push({
          name: imageName,
          url: '', // 写入时不需要 URL
          path: ''
        });
      } else {
        // 匹配视频引用：[视频：20210814-170000-1.mp4]
        const videoMatch = line.match(/\[视频：(.+?)\]/);
        
        if (videoMatch) {
          const videoName = videoMatch[1];
          currentDynamic.videos.push({
            name: videoName,
            url: '', // 写入时不需要 URL
            path: ''
          });
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
 * 从文件中删除动态
 * @param {FileSystemDirectoryHandle} directoryHandle - 文件夹句柄
 * @param {string} year - 年份，如 "2026"
 * @param {string} timestamp - 要删除的动态的时间戳（ISO 格式）
 * @returns {Promise<void>}
 */
export async function deleteDynamicFromFile(directoryHandle, year, timestamp) {
  try {
    // 首先检查是否是"我的动态"文件夹，或者需要进入"我的动态"文件夹
    let targetDirectoryHandle = directoryHandle;
    
    try {
      // 尝试获取"我的动态"文件夹
      const myDynamicHandle = await directoryHandle.getDirectoryHandle('我的动态');
      targetDirectoryHandle = myDynamicHandle;
    } catch (error) {
      // 如果"我的动态"文件夹不存在，直接使用当前文件夹
      targetDirectoryHandle = directoryHandle;
    }
    
    // 查找年份文件夹
    const yearFolderName = `${year}年`;
    let yearFolderHandle;
    
    try {
      yearFolderHandle = await targetDirectoryHandle.getDirectoryHandle(yearFolderName);
    } catch (error) {
      throw new Error(`年份文件夹 ${yearFolderName} 不存在`);
    }
    
    // 读取现有的动态内容文件
    const contentFileName = `${yearFolderName}-动态内容.txt`;
    let existingContent = '';
    
    try {
      const contentFileHandle = await yearFolderHandle.getFileHandle(contentFileName);
      const file = await contentFileHandle.getFile();
      existingContent = await file.text();
    } catch (error) {
      throw new Error(`文件 ${contentFileName} 不存在`);
    }
    
    // 解析现有内容，获取所有动态
    const existingDynamics = parseContentToDynamics(existingContent);
    
    // 找到要删除的动态（通过 timestamp 匹配）
    // 由于写入时使用 toISOString() 可能包含毫秒，而解析时只精确到秒，
    // 所以需要比较到秒级别
    const targetTimestamp = new Date(timestamp);
    const targetTimeSeconds = Math.floor(targetTimestamp.getTime() / 1000);
    
    const dynamicIndex = existingDynamics.findIndex((dynamic) => {
      const dynamicTimestamp = new Date(dynamic.timestamp);
      const dynamicTimeSeconds = Math.floor(dynamicTimestamp.getTime() / 1000);
      return dynamicTimeSeconds === targetTimeSeconds;
    });
    
    if (dynamicIndex === -1) {
      console.error("要删除的时间戳:", timestamp);
      console.error("文件中的所有动态:", existingDynamics.map(d => ({
        timestamp: d.timestamp,
        date: d.date,
        time: d.time,
        text: d.text?.substring(0, 20)
      })));
      throw new Error("未找到要删除的动态");
    }
    
    // 删除动态
    existingDynamics.splice(dynamicIndex, 1);
    
    // 转换为文件内容格式
    const newContent = formatDynamicsToContent(existingDynamics);
    
    // 写入文件
    const contentFileHandle = await yearFolderHandle.getFileHandle(contentFileName, { create: true });
    const writable = await contentFileHandle.createWritable();
    await writable.write(newContent);
    await writable.close();
    
    console.log(`成功删除动态从 ${contentFileName}`);
  } catch (error) {
    console.error("删除文件失败:", error);
    throw error;
  }
}

