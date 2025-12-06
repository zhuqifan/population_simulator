import { AgeGroup, SimulationParams, SimulationResult, YearlyStats } from '../types';
import { MAX_AGE } from '../constants';

/**
 * Calculates the probability of death for a given age using a dynamic Gompertz-Makeham model.
 * 动态计算死亡率：基于 Gompertz-Makeham 模型，并根据社会抚养比（Dependency Ratio）进行动态调整。
 * 
 * 核心逻辑：
 * 1. 基础模型：使用标准的 Gompertz-Makeham 曲线模拟人类死亡风险随年龄的指数增长。
 * 2. 压力因子：当人口结构严重老龄化（抚养比过高）时，模拟社会医疗/照护资源面临的压力。
 * 
 * 更新：
 * - 调整参数以模拟预期寿命约 82 岁的环境。
 * - 放宽了社会压力阈值，避免在模拟中期死亡率过高。
 * 
 * @param age 当前年龄
 * @param dependencyRatioPercent 当前社会的抚养比百分数 ( (0-14 + 65+) / 15-64 ) * 100
 */
const getMortalityRate = (age: number, dependencyRatioPercent: number): number => {
  // Absolute limit
  if (age >= 120) return 1.0;

  // --- Healthcare Stress Factor (医疗资源压力因子) ---
  // 将阈值提高到 70%，模拟一个适应能力更强、自动化程度更高的未来社会。
  // 只有当抚养比极高（>70%）时，医疗质量才会开始受影响。
  const stressThreshold = 70.0;
  let stressMultiplier = 1.0;

  if (dependencyRatioPercent > stressThreshold) {
    // 降低惩罚系数：每超过阈值 1%，死亡风险仅增加 0.2% (原为 0.5%)
    stressMultiplier = 1.0 + (dependencyRatioPercent - stressThreshold) * 0.002;
  }

  // 1. Infant Mortality (婴儿死亡率因子)
  // 降低至 0.3% (3 per 1000)，接近顶尖发达国家水平。
  const infantRisk = 0.003 * Math.exp(-2.5 * age) * stressMultiplier;

  // 2. Base Risk (基础/意外风险因子 - Makeham term)
  // 降低至 0.00025，模拟非常安全的社会环境。
  const baseRisk = 0.00025 * stressMultiplier;

  // 3. Aging Risk (衰老风险因子 - Gompertz term)
  // 参数调整目标：80岁存活率显著提高。
  // alpha: 0.000035 (基础衰老易感性)
  // beta: 0.093 (衰老速率)
  // 示例: Age 80 => ~3% 死亡率 (之前版本约为 8%)
  const agingRisk = 0.000035 * Math.exp(0.093 * age) * stressMultiplier;

  // 组合风险，上限为 1.0
  return Math.min(1.0, infantRisk + baseRisk + agingRisk);
};

// --- Pre-calculate Fertility Distribution (Normalized) ---
// 为了保证 TFR 的准确性，必须确保生育概率分布曲线在整个育龄期（15-55岁）的积分为 1。
// 这样设定 TFR=2.1 时，一个活过育龄期的女性就严格期望生育 2.1 个孩子。

const PRECALC_DISTRIBUTIONS = new Map<number, number[]>();

const getNormalizedFertilityDistribution = (generationTime: number): number[] => {
  if (PRECALC_DISTRIBUTIONS.has(generationTime)) {
    return PRECALC_DISTRIBUTIONS.get(generationTime)!;
  }

  const dist: number[] = new Array(MAX_AGE + 1).fill(0);
  
  // 使用 Beta 分布的变体或偏态正态分布来模拟生育曲线
  // 生育曲线通常是左偏的（年轻时上升快，年老后下降慢，直到绝经）
  // generationTime 是平均生育年龄
  
  // 设定最小生育年龄和最大生育年龄
  const minAge = 14;
  const maxAge = 55;
  
  // 这里的 spread 控制曲线的宽度。晚育时（generationTime大），通常生育窗口也较宽。
  // 早育时（generationTime小），生育往往更集中。
  const spread = 4.5 + (generationTime - 18) * 0.1; 

  let sum = 0;

  for (let age = minAge; age <= maxAge; age++) {
    // Skewed Normal Distribution logic
    // 使用偏度参数让曲线形状更自然
    const skew = (age < generationTime) ? 1.0 : 1.3; // 后面拖尾稍微长一点
    const diff = age - generationTime;
    const exponent = -(diff * diff) / (2 * spread * spread * skew);
    const val = Math.exp(exponent);
    dist[age] = val;
    sum += val;
  }

  // Normalize so the sum is exactly 1.0
  const normalized = dist.map(v => sum > 0 ? v / sum : 0);
  
  PRECALC_DISTRIBUTIONS.set(generationTime, normalized);
  return normalized;
};


// Helper to get approximate relative weight and sex ratio for China's population structure
const getChinaDemographics = (age: number) => {
  // Approximate relative weights based on typical recent data (peaks around 35 and 55, low around 0-10)
  // Control points: {a: age, w: weight, r: sexRatio (M/F)}
  const points = [
    {a: 0, w: 0.7, r: 1.15},
    {a: 5, w: 0.8, r: 1.15},
    {a: 10, w: 0.9, r: 1.15},
    {a: 20, w: 1.0, r: 1.12},
    {a: 35, w: 1.6, r: 1.08}, // Millennial peak
    {a: 45, w: 1.3, r: 1.05},
    {a: 55, w: 1.7, r: 1.02}, // Boomer peak
    {a: 65, w: 1.2, r: 0.98},
    {a: 75, w: 0.7, r: 0.90},
    {a: 85, w: 0.3, r: 0.80},
    {a: 100, w: 0.05, r: 0.70}
  ];

  // Linear interpolation
  let lower = points[0];
  let upper = points[points.length - 1];
  
  for (let i = 0; i < points.length - 1; i++) {
    if (age >= points[i].a && age <= points[i+1].a) {
      lower = points[i];
      upper = points[i+1];
      break;
    }
  }
  
  if (age > 100) return { weight: 0, sexRatio: 0.7 };

  const t = (age - lower.a) / (upper.a - lower.a);
  const weight = lower.w + t * (upper.w - lower.w);
  const sexRatio = lower.r + t * (upper.r - lower.r);
  
  return { weight, sexRatio };
};

export const runSimulation = (params: SimulationParams): SimulationResult => {
  const { fertilityRate, generationTime, yearsToSimulate, initialPopulation } = params;
  
  // Get the normalized fertility probabilities for this generation time
  const fertilityDist = getNormalizedFertilityDistribution(generationTime);

  // 1. Initialize Population (China's approximate structure)
  let currentPop: AgeGroup[] = [];
  
  // Calculate total weight to normalize initial population
  let totalWeight = 0;
  const initialDistribution: { age: number; weight: number; sexRatio: number }[] = [];

  for (let age = 0; age <= MAX_AGE + 10; age++) {
    const demog = getChinaDemographics(age);
    initialDistribution.push({ age, ...demog });
    totalWeight += demog.weight;
  }

  // Factor to scale relative weights to actual population counts
  // initialPopulation is in Billions
  const popPerWeightUnit = (initialPopulation * 1_000_000_000) / totalWeight;

  currentPop = initialDistribution.map(d => {
    const totalForAge = d.weight * popPerWeightUnit;
    // Solve: Male + Female = Total, Male/Female = Ratio
    // Ratio*Female + Female = Total => Female = Total / (1 + Ratio)
    const female = totalForAge / (1 + d.sexRatio);
    const male = totalForAge - female;
    
    return {
      age: d.age,
      male,
      female,
      total: totalForAge
    };
  });

  const yearlyTrends: YearlyStats[] = [];

  // 2. Simulation Loop
  for (let year = 0; year <= yearsToSimulate; year++) {
    // Calculate stats for current year
    let totalPop = 0;
    let dependents = 0;
    let workingAge = 0;
    let totalAgeSum = 0;

    currentPop.forEach(group => {
      totalPop += group.total;
      totalAgeSum += group.age * group.total;
      if (group.age < 15 || group.age >= 65) {
        dependents += group.total;
      } else {
        workingAge += group.total;
      }
    });

    // Calculate Dependency Ratio for this year
    const dependencyRatio = workingAge > 0 ? (dependents / workingAge) * 100 : 0;

    yearlyTrends.push({
      year,
      totalPopulation: totalPop,
      births: 0, // Filled below
      deaths: 0, // Filled below
      dependencyRatio: dependencyRatio,
      medianAge: totalPop > 0 ? totalAgeSum / totalPop : 0
    });

    if (year === yearsToSimulate) break; // Stop after recording final state

    // --- Next Year Calculation ---
    
    // 1. Calculate Births
    let totalBirths = 0;
    currentPop.forEach(group => {
      // Use the pre-calculated normalized probability
      const prob = fertilityDist[group.age] || 0;
      
      // Calculate births: Mothers * Probability * TFR
      // This ensures that over a lifetime, if TFR is 2.0, the sum of probabilities is 1.0, 
      // so she produces 2.0 children on average.
      const babies = group.female * prob * fertilityRate; 
      totalBirths += babies;
    });

    // 2. Aging & Mortality
    const nextPop: AgeGroup[] = [];
    let totalDeaths = 0;

    // Create Age 0 (Newborns)
    // Assumed 105 boys per 100 girls natural ratio
    const femaleBirths = totalBirths * (100 / 205);
    const maleBirths = totalBirths * (105 / 205);

    nextPop[0] = {
      age: 0,
      male: maleBirths,
      female: femaleBirths,
      total: maleBirths + femaleBirths
    };

    // Age existing population
    for (let i = 0; i < currentPop.length; i++) {
      const group = currentPop[i];
      
      // If aging goes beyond max tracked age, they die (or we stop tracking)
      // Usually we track up to 100+ but let's just cutoff or apply high mortality
      if (group.age >= MAX_AGE + 20) {
        totalDeaths += group.total;
        continue;
      }
      
      // Pass the current societal dependency ratio to adjust mortality dynamically
      const mortality = getMortalityRate(group.age, dependencyRatio);
      
      const survivorsMale = group.male * (1 - mortality);
      const survivorsFemale = group.female * (1 - mortality);
      
      totalDeaths += (group.male - survivorsMale) + (group.female - survivorsFemale);

      nextPop[i + 1] = {
        age: group.age + 1,
        male: survivorsMale,
        female: survivorsFemale,
        total: survivorsMale + survivorsFemale
      };
    }

    // Update stats for the *transition*
    yearlyTrends[year].births = totalBirths;
    yearlyTrends[year].deaths = totalDeaths;

    currentPop = nextPop;
  }

  // Final Stats
  const lastTrend = yearlyTrends[yearlyTrends.length - 1];

  return {
    finalStructure: currentPop.filter(g => g.age <= MAX_AGE), // Trim for display
    yearlyTrends,
    finalStats: lastTrend
  };
};