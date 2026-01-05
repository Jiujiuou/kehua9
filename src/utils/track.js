/**
 * 埋点追踪工具
 * 用于收集用户行为数据
 */

const USER_ID_KEY = "kehua-user-id";
const CITY_KEY = "kehua-user-city";

// 埋点 API 地址
const API_URL = "https://v9fq463tb8.hzh.sealos.run/updateAnalytics";

/**
 * 生成浏览器指纹作为 userId
 * @returns {string} 用户ID
 */
function generateUserId() {
  try {
    // 检查 localStorage 中是否已有 userId
    const storedUserId = localStorage.getItem(USER_ID_KEY);
    if (storedUserId) {
      return storedUserId;
    }

    // 生成浏览器指纹
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.hardwareConcurrency || 0,
      navigator.deviceMemory || 0,
    ].join("|");

    // 简单的哈希函数生成固定长度的 ID
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }

    // 生成最终的 userId（32位十六进制字符串）
    const userId = Math.abs(hash).toString(16).padStart(8, "0") +
      Date.now().toString(16).slice(-8);

    // 存储到 localStorage
    localStorage.setItem(USER_ID_KEY, userId);
    return userId;
  } catch (error) {
    console.error("生成 userId 失败:", error);
    // 如果 localStorage 不可用，使用临时 ID
    return "temp-" + Date.now().toString(36);
  }
}

/**
 * 获取用户城市信息
 * @returns {Promise<string>} 城市名称（如 hangzhou, shanghai）
 */
async function getUserCity() {
  try {
    // 尝试通过 IP 定位获取城市（使用免费的 IP 定位服务）
    try {
      // 使用 AbortController 实现超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // 使用 ipapi.co 免费服务（每天 1000 次请求）
      const response = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('data', data)
        // 组合 country_name-region-city
        const location = (data.country_name || "") + "-" + (data.region || "") + "-" + (data.city || "");
        if (location) {
          localStorage.setItem(CITY_KEY, location);
          return location;
        }
      }
    } catch (error) {
      console.warn("IP 定位失败，使用默认城市:", error);
    }

    // 如果定位失败，使用默认值
    const defaultCity = "unknown";
    localStorage.setItem(CITY_KEY, defaultCity);
    return defaultCity;
  } catch (error) {
    console.error("获取城市信息失败:", error);
    return "unknown";
  }
}

/**
 * 生成当前时间（东八区，格式: YYYY-MM-DD hh:mm:ss）
 * @returns {string} 时间字符串
 */
function getCurrentTime() {
  const now = new Date();

  // 使用 Intl.DateTimeFormat 获取东八区时间
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hours = parts.find(p => p.type === 'hour').value;
  const minutes = parts.find(p => p.type === 'minute').value;
  const seconds = parts.find(p => p.type === 'second').value;

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 发送埋点数据到服务器
 * @param {Array} events - 事件数据数组
 * @returns {Promise<void>}
 */
async function sendAnalytics(events) {
  // 验证数据格式
  if (!Array.isArray(events) || events.length === 0) {
    console.warn("埋点数据为空，跳过发送");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: events,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    if (result.success) {
      console.log("埋点数据发送成功:", result);
    } else {
      console.error("埋点数据发送失败:", result);
    }
  } catch (error) {
    console.error("发送埋点数据失败:", error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 追踪事件
 * @param {string} eventName - 事件名称（如 "导入数据", "添加动态"）
 * @param {Object} params - 额外参数对象（可选）
 * @returns {Promise<void>}
 */
export async function track(eventName, params = {}) {

  // 检查 URL 参数，如果有 analyticsData=true 则不上报埋点
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const analyticsData = urlParams.get("analyticsData");
    if (analyticsData === "true") {
      return; // 不发送埋点
    }
  } catch {
    // 如果无法获取 URL 参数，继续执行
  }

  try {
    // 获取用户信息
    const userId = generateUserId();
    const city = await getUserCity();
    const time = getCurrentTime();

    // 构建事件数据
    const eventData = {
      eventName,
      params,
      city,
      userId,
      time,
    };

    // 发送到服务器
    await sendAnalytics([eventData]);
  } catch (error) {
    console.error("追踪事件失败:", error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 批量追踪事件
 * @param {Array<Object>} events - 事件数组，每个事件包含 eventName 和 params
 * @returns {Promise<void>}
 */
export async function trackBatch(events) {
  // 检查是否是开发环境（localhost），开发环境不发送埋点
  try {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
      console.log("开发环境，跳过批量埋点");
      return; // 不发送埋点
    }
  } catch {
    // 如果无法获取 hostname，继续执行
  }

  try {
    const userId = generateUserId();
    const city = await getUserCity();
    const time = getCurrentTime();

    // 为每个事件添加用户信息
    const eventDataList = events.map((event) => ({
      eventName: event.eventName,
      params: event.params || {},
      city,
      userId,
      time: event.time || time, // 允许每个事件有自己的时间
    }));

    // 发送到服务器
    await sendAnalytics(eventDataList);
  } catch (error) {
    console.error("批量追踪事件失败:", error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 获取当前用户 ID
 * @returns {string} 用户ID
 */
export function getUserId() {
  return generateUserId();
}

/**
 * 获取当前用户城市
 * @returns {Promise<string>} 城市名称
 */
export function getCity() {
  return getUserCity();
}

