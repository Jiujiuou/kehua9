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

  // 将 index.html 复制到 dist 文件夹
  const distIndexPath = path.resolve(__dirname, "dist", "index.html");
  fs.copyFile(targetPath, distIndexPath, (err) => {
    if (err) {
      console.error("Error copying index.html to dist:", err);
      return;
    }
    console.log("index.html copied to dist successfully!");
  });
});
