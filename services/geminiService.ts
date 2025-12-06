import { GoogleGenAI } from "@google/genai";
import { SimulationParams, YearlyStats } from "../types";

// Helper to format large numbers for Chinese (亿 - 100 Million)
const formatNum = (num: number) => (num / 100_000_000).toFixed(2) + " 亿";

export const analyzeDemographics = async (
  params: SimulationParams,
  finalStats: YearlyStats,
  peakPop: number
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "缺少 API 密钥。请配置环境变量。";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      扮演一位专业的人口学家。请分析以下模拟结果。该模拟基于类似中国的人口结构，初始人口设为 ${(params.initialPopulation * 10).toFixed(1)} 亿人。
      
      输入参数：
      - 总和生育率 (TFR): ${params.fertilityRate}
      - 平均生育年龄 (世代间隔): ${params.generationTime} 岁
      - 模拟时长: ${params.yearsToSimulate} 年
      
      ${params.yearsToSimulate} 年后的结果：
      - 最终人口: ${formatNum(finalStats.totalPopulation)}
      - 期间峰值人口: ${formatNum(peakPop)}
      - 老年抚养比 (Dependency Ratio): ${finalStats.dependencyRatio.toFixed(1)}%
      - 平均年龄: ${finalStats.medianAge.toFixed(1)} 岁
      
      请提供一份简明的中文分析报告（约300字），涵盖以下内容：
      1. 人口的可持续性评估。
      2. 抚养比对经济的潜在影响。
      3. 与更替水平生育率的对比。
      4. "生育时间"（晚育）对人口变化速度的具体影响。
      
      请使用清晰的 Markdown 标题。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "暂无分析结果。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "无法生成分析。请检查您的网络或 API 密钥。";
  }
};