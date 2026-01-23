// 年度报告相关的日期/时间工具函数

export const pad2 = (n) => String(n).padStart(2, "0");

export const toDateString = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const getDateStringFromDynamic = (dynamic) => {
  if (dynamic?.date) return dynamic.date;
  if (!dynamic?.timestamp) return null;

  const d = new Date(dynamic.timestamp);
  if (Number.isNaN(d.getTime())) return null;

  return toDateString(d);
};

export const getTimeStringFromDynamic = (dynamic) => {
  if (dynamic?.time) return String(dynamic.time);
  if (!dynamic?.timestamp) return "";

  const d = new Date(dynamic.timestamp);
  if (Number.isNaN(d.getTime())) return "";

  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export const parseDateStringToUTC = (dateStr) => {
  const [y, m, d] = String(dateStr).split("-").map((x) => parseInt(x, 10));
  if ([y, m, d].some((n) => Number.isNaN(n))) return null;
  return Date.UTC(y, m - 1, d);
};

export const calculateInclusiveDays = (startDateStr, endDateStr) => {
  const start = parseDateStringToUTC(startDateStr);
  const end = parseDateStringToUTC(endDateStr);
  if (start === null || end === null) return 0;
  if (end < start) return 0;

  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((end - start) / dayMs) + 1;
};

export const formatChineseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return "—";
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  if ([y, m, d].some((n) => Number.isNaN(n))) return "—";
  return `${y}年${m}月${d}日`;
};

export const formatMonthDay = (dateStr, { alwaysShowYear = false } = {}) => {
  if (!dateStr) return "—";
  const [y, m, d] = String(dateStr).split("-").map((x) => parseInt(x, 10));
  if ([y, m, d].some((n) => Number.isNaN(n))) return "—";

  if (alwaysShowYear) return `${y}年${m}月${d}日`;
  return `${m}月${d}日`;
};

export const formatDateTimeParts = (d) => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());

  return {
    date: `${y}-${m}-${day}`,
    time: `${hh}:${mm}`,
  };
};
