export interface SimulationParams {
  fertilityRate: number; // TFR: Children per woman
  generationTime: number; // Average age of mother at birth
  yearsToSimulate: number; // How many years into the future
  initialPopulation: number; // In billions
}

export interface AgeGroup {
  age: number;
  male: number;
  female: number;
  total: number;
}

export interface YearlyStats {
  year: number;
  totalPopulation: number;
  births: number;
  deaths: number;
  dependencyRatio: number; // (0-14 + 65+) / (15-64)
  medianAge: number;
}

export interface SimulationResult {
  finalStructure: AgeGroup[];
  yearlyTrends: YearlyStats[];
  finalStats: YearlyStats;
}
