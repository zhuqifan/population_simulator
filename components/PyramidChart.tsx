import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { AgeGroup } from '../types';
import { COLOR_FEMALE, COLOR_MALE } from '../constants';

interface PyramidChartProps {
  data: AgeGroup[];
}

const PyramidChart: React.FC<PyramidChartProps> = ({ data }) => {
  // Process data for the pyramid (males negative)
  const chartData = data.map(d => ({
    ...d,
    maleNeg: -d.male, // Negative for left side
  }));

  const maxVal = Math.max(
    ...chartData.map(d => Math.max(d.female, d.male))
  );

  const formatTooltip = (value: number) => {
    return (Math.abs(value) / 10_000).toFixed(1) + " 万";
  };

  return (
    <div className="h-full w-full flex flex-col">
      <h3 className="text-center text-slate-400 text-sm mb-2">人口年龄结构 (人口金字塔)</h3>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            stackOffset="sign"
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            barCategoryGap={0.5}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis 
              type="number" 
              hide 
              domain={[-maxVal, maxVal]} 
            />
            <YAxis 
              dataKey="age" 
              type="category" 
              width={40} 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              interval={9} // Show every 10th label
              reversed={false}
            />
            <Tooltip
              formatter={(value: number) => formatTooltip(value)}
              labelFormatter={(label) => `年龄: ${label}岁`}
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
              itemStyle={{ color: '#f3f4f6' }}
            />
            <ReferenceLine x={0} stroke="#4b5563" />
            <Bar dataKey="maleNeg" name="男性" fill={COLOR_MALE} stackId="a" />
            <Bar dataKey="female" name="女性" fill={COLOR_FEMALE} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
          <span>男性</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-pink-400 rounded-sm"></div>
          <span>女性</span>
        </div>
      </div>
    </div>
  );
};

export default PyramidChart;