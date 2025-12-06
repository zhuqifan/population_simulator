import React, { useState, useMemo } from 'react';
import ControlPanel from './components/ControlPanel';
import PyramidChart from './components/PyramidChart';
import TrendChart from './components/TrendChart';
import { runSimulation } from './utils/simulation';
import { analyzeDemographics } from './services/geminiService';
import { SimulationParams } from './types';
import { INITIAL_POPULATION_BILLIONS } from './constants';
import { User, Activity, TrendingDown, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    fertilityRate: 1.1, // Adjusted default to be more like current China
    generationTime: 30,
    yearsToSimulate: 50,
    initialPopulation: INITIAL_POPULATION_BILLIONS,
  });

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Run simulation whenever params change
  const simulationResult = useMemo(() => {
    return runSimulation(params);
  }, [params]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    setShowAnalysisModal(true);
    
    // Find peak population for context
    const peakPop = Math.max(...simulationResult.yearlyTrends.map(y => y.totalPopulation));
    
    const result = await analyzeDemographics(
      params, 
      simulationResult.finalStats, 
      peakPop
    );
    
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // Convert to 亿 (100 million) for Chinese display. 
  // Initial population is stored as Billions in constants (1.0 = 10 亿)
  const finalPop = (simulationResult.finalStats.totalPopulation / 100_000_000).toFixed(2);
  const startPop = (INITIAL_POPULATION_BILLIONS * 10).toFixed(2); 
  const isGrowing = simulationResult.finalStats.totalPopulation > params.initialPopulation * 1_000_000_000;

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar Controls */}
      <div className="w-80 flex-shrink-0 h-full z-10">
        <ControlPanel 
          params={params} 
          onChange={setParams} 
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col h-full overflow-hidden relative">
        
        {/* Header Stats */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">初始人口</span>
                    <span className="font-mono text-lg text-slate-300">{startPop}亿</span>
                </div>
                <div className={`flex flex-col ${isGrowing ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">预测总人口</span>
                    <div className="flex items-center gap-1">
                        <span className="font-mono text-2xl font-bold">{finalPop}亿</span>
                        {isGrowing ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-8">
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">抚养比</span>
                    <span className="font-mono text-lg text-amber-400">{simulationResult.finalStats.dependencyRatio.toFixed(1)}%</span>
                </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">平均年龄</span>
                    <span className="font-mono text-lg text-blue-400">{simulationResult.finalStats.medianAge.toFixed(1)} 岁</span>
                </div>
            </div>
        </header>

        {/* Charts Grid */}
        <main className="flex-grow p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          
          {/* Left: Population Pyramid */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex flex-col shadow-inner">
            <div className="flex items-center justify-between mb-2">
                 <h2 className="font-semibold text-slate-300 flex items-center gap-2">
                    <User size={18} className="text-slate-500"/> 人口结构
                 </h2>
                 <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">第 {params.yearsToSimulate} 年</span>
            </div>
            <div className="flex-grow min-h-0">
                <PyramidChart data={simulationResult.finalStructure} />
            </div>
          </div>

          {/* Right: Trend Line */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex flex-col shadow-inner">
             <div className="flex items-center justify-between mb-2">
                 <h2 className="font-semibold text-slate-300 flex items-center gap-2">
                    <Activity size={18} className="text-slate-500"/> 人口趋势
                 </h2>
                 <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">0 - {params.yearsToSimulate} 年</span>
            </div>
            <div className="flex-grow min-h-0">
                 <TrendChart 
                    data={simulationResult.yearlyTrends} 
                    currentYear={params.yearsToSimulate}
                 />
            </div>
          </div>
          
        </main>
      </div>

      {/* AI Analysis Modal Overlay */}
      {showAnalysisModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                    <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        AI 人口学分析
                    </h3>
                    <button 
                        onClick={() => setShowAnalysisModal(false)}
                        className="text-slate-400 hover:text-white transition-colors p-1"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400 animate-pulse">正在咨询 AI 模型...</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                             <ReactMarkdown>{aiAnalysis || ""}</ReactMarkdown>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-800/30 rounded-b-2xl flex justify-end">
                     <button 
                        onClick={() => setShowAnalysisModal(false)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;