import React from 'react';
import { SimulationParams } from '../types';
import { 
  MIN_FERTILITY, MAX_FERTILITY, STEP_FERTILITY,
  MIN_GEN_TIME, MAX_GEN_TIME, STEP_GEN_TIME,
  MIN_YEARS, MAX_YEARS, STEP_YEARS
} from '../constants';
import { Users, Clock, Calendar, RefreshCcw } from 'lucide-react';

interface ControlPanelProps {
  params: SimulationParams;
  onChange: (newParams: SimulationParams) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ params, onChange, onAnalyze, isAnalyzing }) => {
  
  const handleChange = (key: keyof SimulationParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="p-6 bg-slate-900 border-r border-slate-800 h-full flex flex-col gap-8 overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
          人口模拟器
        </h1>
        <p className="text-xs text-slate-500">
          可视化生育率和生育时间对人口结构的影响。
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Fertility Rate Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Users size={16} className="text-pink-400" />
              总和生育率 (TFR)
            </label>
            <span className="text-sm font-bold text-pink-400 bg-pink-900/30 px-2 py-0.5 rounded">
              {params.fertilityRate.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={MIN_FERTILITY}
            max={MAX_FERTILITY}
            step={STEP_FERTILITY}
            value={params.fertilityRate}
            onChange={(e) => handleChange('fertilityRate', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>{MIN_FERTILITY}</span>
            <span>世代更替水平 ~2.1</span>
            <span>{MAX_FERTILITY}</span>
          </div>
        </div>

        {/* Generation Time Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Clock size={16} className="text-blue-400" />
              平均生育年龄 (代际时间)
            </label>
            <span className="text-sm font-bold text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">
              {params.generationTime} 岁
            </span>
          </div>
          <input
            type="range"
            min={MIN_GEN_TIME}
            max={MAX_GEN_TIME}
            step={STEP_GEN_TIME}
            value={params.generationTime}
            onChange={(e) => handleChange('generationTime', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <p className="text-[10px] text-slate-500">
            母亲生育时的平均年龄。推迟生育会减缓人口更替和衰减的速度。
          </p>
        </div>

        {/* Years Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Calendar size={16} className="text-emerald-400" />
              模拟时长
            </label>
            <span className="text-sm font-bold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded">
              {params.yearsToSimulate} 年后
            </span>
          </div>
          <input
            type="range"
            min={MIN_YEARS}
            max={MAX_YEARS}
            step={STEP_YEARS}
            value={params.yearsToSimulate}
            onChange={(e) => handleChange('yearsToSimulate', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

      </div>

      <div className="mt-auto">
         <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={`w-full py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all
              ${isAnalyzing 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'
              }`}
          >
            {isAnalyzing ? (
              <RefreshCcw className="animate-spin" size={18} />
            ) : (
              <span className="flex items-center gap-2">✨ AI 智能分析报告</span>
            )}
          </button>
      </div>
    </div>
  );
};

export default ControlPanel;