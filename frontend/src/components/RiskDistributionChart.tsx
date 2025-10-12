'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';

interface RiskDistributionChartProps {
  data: {
    Minimal: number;
    Low: number;
    Medium: number;
    High?: number;
  };
}

const COLORS = {
  Minimal: '#22c55e',
  Low: '#3b82f6',
  Medium: '#f59e0b',
  High: '#ef4444',
};

const DESCRIPTIONS = {
  Minimal: 'Very low risk - Normal consumption patterns',
  Low: 'Low risk - Minor anomalies detected',
  Medium: 'Medium risk - Suspicious patterns identified',
  High: 'High risk - Strong theft indicators present',
};

// Custom active shape for interactive pie chart
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} style={{ fontSize: '20px', fontWeight: 'bold' }}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 18}
        fill={fill}
        opacity={0.6}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" style={{ fontSize: '14px', fontWeight: '600' }}>
        {`${value} consumers`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" style={{ fontSize: '12px' }}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

export default function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  const onPieClick = (data: any, index: number) => {
    setSelectedSegment(data.name);
  };

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={activeIndex === undefined ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            onClick={onPieClick}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name as keyof typeof COLORS]}
                style={{ 
                  filter: activeIndex === index ? 'brightness(1.2)' : 'none',
                  transition: 'filter 0.3s ease'
                }}
              />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0];
                const name = data.name as keyof typeof DESCRIPTIONS;
                return (
                  <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-800">{data.name}</p>
                    <p className="text-sm text-gray-600">{data.value} consumers ({((data.value as number / total) * 100).toFixed(1)}%)</p>
                    <p className="text-xs text-gray-500 mt-1">{DESCRIPTIONS[name]}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Click details popup */}
      {selectedSegment && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-md animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <span 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: COLORS[selectedSegment as keyof typeof COLORS] }}
                />
                {selectedSegment} Risk Level
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {DESCRIPTIONS[selectedSegment as keyof typeof DESCRIPTIONS]}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-white rounded p-2">
                  <div className="text-xs text-gray-600">Consumers</div>
                  <div className="text-xl font-bold text-gray-800">
                    {data[selectedSegment as keyof typeof data]}
                  </div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-xs text-gray-600">Percentage</div>
                  <div className="text-xl font-bold text-gray-800">
                    {(((data[selectedSegment as keyof typeof data] || 0) / total) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedSegment(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2 text-center">
        💡 Hover over segments for details, click to pin information
      </p>
    </div>
  );
}
