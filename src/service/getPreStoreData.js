import cloud from '@lafjs/cloud'
const db = cloud.mongo.db

export default async function getPreStoreData(ctx) {
  try {
    // 获取所有待审核的数据，按创建时间倒序排列
    const data = await db
      .collection("preStore")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log("待审核数据查询成功，返回", data.length, "条记录");

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("获取待审核数据失败:", error);

    return {
      success: false,
      message: "获取待审核数据失败",
      error: error.message,
      code: "DATA_ERROR",
    };
  }
}
