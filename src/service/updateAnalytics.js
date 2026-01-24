import cloud from '@lafjs/cloud'
const db = cloud.mongo.db

function validateEventData(eventData) {
  const errors = [];

  // 必填字段验证
  const requiredFields = ["eventName", "city", "time", "userId"];
  for (const field of requiredFields) {
    if (!eventData[field]) {
      errors.push(`缺少必填字段: ${field}`);
    }
  }

  // 字段类型验证
  if (eventData.eventName && typeof eventData.eventName !== "string") {
    errors.push("eventName 必须是字符串类型");
  }

  if (eventData.city && typeof eventData.city !== "string") {
    errors.push("city 必须是字符串类型");
  }

  if (eventData.userId && typeof eventData.userId !== "string") {
    errors.push("userId 必须是字符串类型");
  }

  if (eventData.time && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(eventData.time)) {
    errors.push("time 格式必须是 YYYY-MM-DD hh:mm:ss");
  }

  if (eventData.params && typeof eventData.params !== "object") {
    errors.push("params 必须是对象类型");
  }

  // 事件名称验证
  const validEventNames = [
    "导入数据",
    "添加动态",
    "点击添加动态",  // 新增
    "发布新动态",
    "发布新动态成功",  // 新增 - 这是当前报错的原因
    "页面访问",
    "修改配置",
    "导出数据",
    "搜索",
    "切换日期",
    "预览动态",
    "预览动态卡片",  // 新增
    "切换主题",  // 新增（如果前端使用了）
  ];

  if (eventData.eventName && !validEventNames.includes(eventData.eventName)) {
    errors.push(`不支持的事件类型: ${eventData.eventName}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default async function updateAnalytics(ctx) {
  const analyticsData = ctx.body.data;
  try {
    // 验证数据格式
    if (!Array.isArray(analyticsData) || analyticsData.length === 0) {
      return {
        success: false,
        message: "数据格式无效，需要非空数组",
        code: "INVALID_DATA_FORMAT",
      };
    }

    // 验证每条数据的格式
    const validationErrors = [];
    for (let i = 0; i < analyticsData.length; i++) {
      const validation = validateEventData(analyticsData[i]);
      if (!validation.isValid) {
        validationErrors.push(
          `第${i + 1}条数据: ${validation.errors.join(", ")}`
        );
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        message: "数据验证失败",
        errors: validationErrors,
        code: "DATA_VALIDATION_ERROR",
      };
    }

    // 为每条数据添加服务器时间戳和处理字段
    const processedData = analyticsData.map((item) => {
      // 生成东八区时间
      const now = new Date();
      const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);

      // 如果客户端没有提供时间，使用服务器时间（格式: YYYY-MM-DD hh:mm:ss）
      let time = item.time;
      if (!time) {
        const year = chinaTime.getFullYear();
        const month = String(chinaTime.getMonth() + 1).padStart(2, "0");
        const day = String(chinaTime.getDate()).padStart(2, "0");
        const hours = String(chinaTime.getHours()).padStart(2, "0");
        const minutes = String(chinaTime.getMinutes()).padStart(2, "0");
        const seconds = String(chinaTime.getSeconds()).padStart(2, "0");
        time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      return {
        eventName: item.eventName,
        params: item.params || {},
        city: item.city,
        userId: item.userId,
        time: time,
        // 保留其他可能存在的字段
        ...(item.sessionId && { sessionId: item.sessionId }),
      };
    });

    // 批量插入数据到 analytics 集合
    const result = await db.collection("analytics").insertMany(processedData);

    console.log("埋点数据保存成功:", {
      count: processedData.length,
      insertedIds: result.insertedIds,
    });

    return {
      success: true,
      message: `成功保存 ${processedData.length} 条埋点记录`,
      count: processedData.length,
      insertedIds: result.insertedIds,
    };
  } catch (error) {
    console.error("保存埋点数据失败:", error);

    return {
      success: false,
      message: "服务器内部错误",
      error: error.message,
      code: "SERVER_ERROR",
    };
  }
}
