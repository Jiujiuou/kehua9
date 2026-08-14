/**
 * Supabase 埋点配置
 *
 * 迁移说明：埋点平台已从 Laf(Sealos) 迁移到 Supabase（纯 REST 直连，无云函数）。
 *
 * 使用方法：
 * 1. 在 supabase.com 创建项目
 * 2. 项目 Settings -> API 中复制 Project URL 和 anon public key
 * 3. 填入下方两个占位符
 * 4. 在 SQL Editor 中执行 supabase/init.sql（建表 + RLS 策略）
 *
 * 注意：anon key 是公开的（用于浏览器端），这没问题；
 * 数据安全由数据库 RLS 策略保证，见 supabase/init.sql。
 */

// 你的 Supabase 项目地址，例如: https://abcdefghijk.supabase.co
export const SUPABASE_URL = "https://cwemonaurbnfmlwlbabr.supabase.co";

// 你的 Supabase anon public key（Settings -> API -> Project API keys）
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZW1vbmF1cmJuZm1sd2xiYWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NTc4ODEsImV4cCI6MjEwMjIzMzg4MX0.7V4DXP6OFnFbjG-WW7dFT1_krJIvqP4YrpX7BEhDJT8";

// 埋点数据表名
export const ANALYTICS_TABLE = "analytics";
