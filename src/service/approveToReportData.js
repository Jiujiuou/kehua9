import cloud from '@lafjs/cloud'
const db = cloud.mongo.db

export default async function approveToReportData(ctx) {
  const { id, approved } = ctx.body;
  
  try {
    // 验证参数
    if (!id) {
      return {
        success: false,
        message: "缺少必填参数: id",
        code: "MISSING_PARAM",
      };
    }

    // 调试日志
    console.log("接收到的 id:", id, "类型:", typeof id);
    
    // 尝试多种方式创建 ObjectId
    let objectId = id;
    
    // 方法1: 尝试使用 require('mongodb').ObjectId
    try {
      const mongodb = require('mongodb');
      if (mongodb && mongodb.ObjectId && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
        objectId = new mongodb.ObjectId(id);
        console.log("使用 mongodb.ObjectId 转换成功:", objectId);
      }
    } catch (e) {
      console.warn("require('mongodb') 失败:", e);
    }
    
    // 方法2: 尝试使用 cloud.mongo.ObjectId
    if (objectId === id && cloud.mongo && cloud.mongo.ObjectId && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        objectId = new cloud.mongo.ObjectId(id);
        console.log("使用 cloud.mongo.ObjectId 转换成功:", objectId);
      } catch (e) {
        console.warn("cloud.mongo.ObjectId 转换失败:", e);
      }
    }
    
    // 方法3: 尝试使用 db.ObjectId（如果可用）
    if (objectId === id && db.ObjectId && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        objectId = new db.ObjectId(id);
        console.log("使用 db.ObjectId 转换成功:", objectId);
      } catch (e) {
        console.warn("db.ObjectId 转换失败:", e);
      }
    }
    
    console.log("最终使用的 objectId:", objectId, "类型:", typeof objectId, "constructor:", objectId?.constructor?.name);

    // 从 preStore 中查找该条数据
    let preStoreItem = await db.collection("preStore").findOne({ _id: objectId });
    
    // 如果使用 ObjectId 查询失败，尝试直接使用字符串查询
    if (!preStoreItem && typeof id === 'string') {
      console.log("尝试使用字符串直接查询");
      preStoreItem = await db.collection("preStore").findOne({ _id: id });
    }
    
    // 如果还是找不到，尝试通过字符串匹配查找（备用方案）
    if (!preStoreItem && typeof id === 'string') {
      console.log("尝试通过字符串匹配查找所有数据");
      const allItems = await db.collection("preStore").find({}).toArray();
      preStoreItem = allItems.find(item => {
        const itemId = item._id?.toString ? item._id.toString() : String(item._id);
        return itemId === id;
      });
      console.log("通过字符串匹配查找结果:", preStoreItem ? "找到数据" : "未找到数据");
    }
    
    console.log("最终查询结果:", preStoreItem ? "找到数据" : "未找到数据");

    if (!preStoreItem) {
      return {
        success: false,
        message: "未找到待审核的数据",
        code: "NOT_FOUND",
      };
    }

    // 如果审核通过，将数据添加到 reportData
    if (approved === true) {
      const reportData = {
        userName: preStoreItem.userName,
        content: preStoreItem.content,
        time: preStoreItem.time,
        createdAt: new Date(),
      };

      await db.collection("reportData").insertOne(reportData);
      console.log("审核通过，数据已添加到 reportData:", id);
    }

    // 无论通过还是拒绝，都从 preStore 中删除该条数据
    // 使用找到的数据的原始 _id 进行删除
    const deleteId = preStoreItem?._id || objectId;
    let deleteResult = await db.collection("preStore").deleteMany({ _id: deleteId });
    
    // 如果删除失败，尝试使用字符串删除
    if (deleteResult.deletedCount === 0 && typeof id === 'string') {
      console.log("尝试使用字符串删除");
      deleteResult = await db.collection("preStore").deleteMany({ _id: id });
    }
    
    // 如果还是删除失败，尝试使用找到的数据的 _id
    if (deleteResult.deletedCount === 0 && preStoreItem?._id) {
      console.log("尝试使用找到的数据的 _id 删除");
      deleteResult = await db.collection("preStore").deleteMany({ _id: preStoreItem._id });
    }

    console.log("审核完成，已从 preStore 删除:", {
      id,
      approved,
      deletedCount: deleteResult.deletedCount,
    });

    return {
      success: true,
      message: approved ? "审核通过，数据已添加到 reportData" : "审核拒绝，数据已删除",
      deletedCount: deleteResult.deletedCount,
    };
  } catch (error) {
    console.error("审核操作失败:", error);

    return {
      success: false,
      message: "审核操作失败",
      error: error.message,
      code: "SERVER_ERROR",
    };
  }
}
