const fs = require("fs");
const path = require("path");

// 源文件路径
const sourcePath = path.resolve(__dirname, "dist", "template.html");
// 目标文件路径
const targetPath = path.resolve(__dirname, "index.html");

// 复制文件
fs.copyFile(sourcePath, targetPath, (err) => {
  if (err) {
    console.error("Error copying file:", err);
    return;
  }
  console.log("File copied successfully!");

  // 删除 dist 文件夹
  const distPath = path.resolve(__dirname, "dist");
  fs.rmdir(distPath, { recursive: true }, (err) => {
    if (err) {
      console.error("Error removing dist folder:", err);
      return;
    }
    console.log("Dist folder removed successfully!");
  });
});
