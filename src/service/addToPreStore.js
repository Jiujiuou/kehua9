import cloud from '@lafjs/cloud'
const db = cloud.mongo.db

function validatePreStoreData(data) {
  const errors = [];

  // 必填字段验证（time 是必填的，由客户端生成）
  const requiredFields = ["userName", "content", "time", "userId"];
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`缺少必填字段: ${field}`);
    }
  }

  // 字段类型验证
  if (data.userName && typeof data.userName !== "string") {
    errors.push("userName 必须是字符串类型");
  }

  if (data.content && typeof data.content !== "string") {
    errors.push("content 必须是字符串类型");
  }

  if (data.time && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(data.time)) {
    errors.push("time 格式必须是 YYYY-MM-DD hh:mm");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default async function addToPreStore(ctx) {
  const preStoreData = ctx.body.data;
  try {
    // 验证数据格式
    if (!preStoreData) {
      return {
        success: false,
        message: "数据格式无效，需要提供 data 对象",
        code: "INVALID_DATA_FORMAT",
      };
    }

    // 验证数据格式
    const validation = validatePreStoreData(preStoreData);
    if (!validation.isValid) {
      return {
        success: false,
        message: "数据验证失败",
        errors: validation.errors,
        code: "DATA_VALIDATION_ERROR",
      };
    }

    // 直接使用客户端传递的时间，不进行服务器端计算
    const time = preStoreData.time;
    const userId = preStoreData.userId;

    // 检查用户今天已经发布了几条内容（限制每天最多 3 条）
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayCount = await db.collection("preStore").countDocuments({
      userId: userId,
      createdAt: {
        $gte: todayStart,
        $lt: todayEnd,
      },
    });

    if (todayCount >= 3) {
      return {
        success: false,
        message: "今天已发布 3 条内容，请明天再试",
        code: "DAILY_LIMIT_EXCEEDED",
        todayCount: todayCount,
      };
    }

    const processedData = {
      userName: preStoreData.userName,
      content: preStoreData.content,
      time: time,
      userId: userId, // 添加 userId 用于限制
      createdAt: new Date(), // 添加创建时间戳用于排序和限制
    };

    // 插入数据到 preStore 集合
    const result = await db.collection("preStore").insertOne(processedData);

    console.log("留言数据保存成功:", {
      insertedId: result.insertedId,
    });

    return {
      success: true,
      message: "成功保存留言记录",
      insertedId: result.insertedId,
    };
  } catch (error) {
    console.error("保存留言数据失败:", error);

    return {
      success: false,
      message: "服务器内部错误",
      error: error.message,
      code: "SERVER_ERROR",
    };
  }
}
