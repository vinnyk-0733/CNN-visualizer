import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

export const OutputVisualization = ({ predictions, onClassClick }) => {
  const chartData = useMemo(() => {
    return predictions.map((p) => ({
      name: p.class,
      value: p.probability * 100,
    }));
  }, [predictions]);

  const maxProbability = useMemo(() => {
    return Math.max(...predictions.map((p) => p.probability));
  }, [predictions]);

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold neon-glow mb-4">Predictions</h2>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Bar 
              dataKey="value" 
              onClick={(data) => onClassClick(data.name)}
              cursor="pointer"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.value / 100 === maxProbability ? '#00d4ff' : '#b847ff'}
                  style={{
                    filter: entry.value / 100 === maxProbability 
                      ? 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.6))' 
                      : 'none',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {predictions.slice(0, 5).map((pred, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between p-2 rounded-lg bg-card/30 border border-primary/10"
          >
            <span className="text-sm font-semibold text-neon-cyan">
              {pred.class}
            </span>
            <span className="text-sm text-muted-foreground">
              {(pred.probability * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
