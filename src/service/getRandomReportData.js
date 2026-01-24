import cloud from '@lafjs/cloud'
const db = cloud.mongo.db

export default async function getRandomReportData(ctx) {
  const { limit = 10 } = ctx.body || {};
  
  try {
    // 获取 reportData 表中的所有数据
    const allData = await db.collection("reportData").find({}).toArray();

    if (allData.length === 0) {
      return {
        success: true,
        data: [],
        message: "暂无祝福数据",
      };
    }

    // 随机选择指定数量的数据
    const count = Math.min(limit, allData.length);
    const randomData = [];
    const usedIndices = new Set();

    while (randomData.length < count) {
      const randomIndex = Math.floor(Math.random() * allData.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        randomData.push(allData[randomIndex]);
      }
    }

    // 将数据转换为前端需要的格式（适配 DynamicCard）
    const formattedData = randomData.map((item, index) => {
      // 解析时间字符串，格式: "2025-12-15 20:42"
      const [date, time] = item.time ? item.time.split(" ") : ["", ""];
      
      // 创建时间戳（用于排序）
      const timestamp = item.createdAt 
        ? new Date(item.createdAt).toISOString()
        : new Date().toISOString();

      return {
        timestamp,
        date: date || "",
        time: time || "",
        text: item.content || "",
        images: [],
        videos: [],
        _resonanceId: item._id?.toString() || `random-${index}`,
        userName: item.userName || "一位可话告别者", // 添加用户名字段
      };
    });

    // 按时间倒序排列
    formattedData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log("随机祝福数据查询成功，返回", formattedData.length, "条记录");

    return {
      success: true,
      data: formattedData,
    };
  } catch (error) {
    console.error("获取随机祝福数据失败:", error);

    return {
      success: false,
      message: "获取随机祝福数据失败",
      error: error.message,
      code: "DATA_ERROR",
    };
  }
}
