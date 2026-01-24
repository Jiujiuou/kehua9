import cloud from '@lafjs/cloud'
const db = cloud.mongo.db

export default async function getAnalyticsStats(ctx) {
  const options = ctx.body?.options || {};
  try {
    let {
      startDate,
      endDate,
    } = options;

    // 如果没有传递任何参数，默认获取最近7天的数据
    if (!startDate && !endDate) {
      const now = new Date();
      // 转换为东八区时间
      const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);

      // 计算结束日期（今天）
      const endYear = chinaTime.getFullYear();
      const endMonth = String(chinaTime.getMonth() + 1).padStart(2, "0");
      const endDay = String(chinaTime.getDate()).padStart(2, "0");
      endDate = `${endYear}-${endMonth}-${endDay}`;

      // 计算开始日期（7天前）
      const startTime = new Date(chinaTime);
      startTime.setDate(startTime.getDate() - 6); // 减去6天，加上今天共7天
      const startYear = startTime.getFullYear();
      const startMonth = String(startTime.getMonth() + 1).padStart(2, "0");
      const startDay = String(startTime.getDate()).padStart(2, "0");
      startDate = `${startYear}-${startMonth}-${startDay}`;
    }

    // 构建时间过滤条件
    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.time = {};

      if (startDate) {
        // 格式: YYYY-MM-DD hh:mm:ss，开始时间设为 00:00:00
        matchFilter.time.$gte = `${startDate} 00:00:00`;
      }

      if (endDate) {
        // 格式: YYYY-MM-DD hh:mm:ss，结束时间设为 23:59:59
        matchFilter.time.$lte = `${endDate} 23:59:59`;
      }
    }

    // 获取所有符合条件的原始数据
    const data = await db
      .collection("analytics")
      .find(matchFilter)
      .toArray();

    console.log("数据查询成功，返回", data.length, "条记录");

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("获取数据失败:", error);

    return {
      success: false,
      message: "获取数据失败",
      error: error.message,
      code: "DATA_ERROR",
    };
  }
}