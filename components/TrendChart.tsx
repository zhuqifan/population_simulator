import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import { YearlyStats } from '../types';
import { COLOR_TOTAL } from '../constants';

interface TrendChartProps {
  data: YearlyStats[];
  currentYear: number;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, currentYear }) => {
  const formatYAxis = (val: number) => {
    return (val / 100_000_000).toFixed(1) + "亿";
  };

  return (
    <div className="h-full w-full flex flex-col">
       <h3 className="text-center text-slate-400 text-sm mb-2">总人口预测趋势</h3>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="year" 
              tick={{ fill: '#9ca3af', fontSize: 10 }} 
              label={{ value: '年份', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 10 }}
            />
            <YAxis 
              tickFormatter={formatYAxis} 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              width={40}
            />
            <Tooltip
              labelFormatter={(label) => `第 ${label} 年`}
              formatter={(value: number) => [(value / 100_000_000).toFixed(3) + " 亿", "总人口"]}
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
            />
            <ReferenceArea x1={0} x2={currentYear} fill="#10b981" fillOpacity={0.1} />
            <Line 
              type="monotone" 
              dataKey="totalPopulation" 
              stroke={COLOR_TOTAL} 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;