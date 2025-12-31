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
        images: []
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
  
  // 保存最后一个动态
  if (currentDynamic) {
    dynamics.push(currentDynamic);
  }
  
  return dynamics;
}

