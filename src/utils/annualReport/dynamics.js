import { ANNUAL_REPORT_END_DATE } from "@/constant/annualReport";

export const filterDynamicsToAnnualReportRange = (
  dynamics = [],
  { endDateStr = ANNUAL_REPORT_END_DATE, sort = false } = {}
) => {
  if (!Array.isArray(dynamics) || dynamics.length === 0) return [];

  const endDate = new Date(endDateStr);
  // 统一以“当天最后一刻”为截止，避免毫秒级误差导致漏算
  endDate.setHours(23, 59, 59, 999);

  const filtered = dynamics.filter((dynamic) => {
    const ts = dynamic?.timestamp;
    if (!ts) return false;

    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return false;

    return date <= endDate;
  });

  if (!sort) return filtered;

  return filtered.slice().sort((a, b) => {
    const ta = new Date(a?.timestamp || 0).getTime();
    const tb = new Date(b?.timestamp || 0).getTime();
    return ta - tb;
  });
};

export const getDynamicType = (dynamic) => {
  const hasText =
    typeof dynamic?.text === "string" ? dynamic.text.trim().length > 0 : false;
  const hasImages = Array.isArray(dynamic?.images) && dynamic.images.length > 0;
  const hasVideos = Array.isArray(dynamic?.videos) && dynamic.videos.length > 0;

  const flags = [hasText, hasImages, hasVideos].filter(Boolean).length;

  if (flags >= 2) return "mixed";
  if (hasImages) return "image";
  if (hasVideos) return "video";
  if (hasText) return "text";
  return "text";
};
