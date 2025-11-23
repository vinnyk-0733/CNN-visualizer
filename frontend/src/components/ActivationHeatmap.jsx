import { useMemo } from 'react';

export const ActivationHeatmap = ({ data, topNodes }) => {
  const heatmapColors = useMemo(() => {
    return data.map((row) =>
      row.map((value) => {
        const intensity = Math.floor(value * 255);
        return `rgb(0, ${intensity}, ${Math.floor(intensity * 0.8)})`;
      })
    );
  }, [data]);

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold neon-glow mb-4">Activation Analysis</h2>
      
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neon-cyan mb-2">Pixel Influence Heatmap</h3>
        <div className="grid gap-px bg-neon-blue/20 p-1 rounded-lg" style={{ 
          gridTemplateColumns: `repeat(${data[0]?.length || 28}, 1fr)`,
          maxWidth: '280px',
          aspectRatio: '1/1'
        }}>
          {data.map((row, i) =>
            row.map((_, j) => (
              <div
                key={`${i}-${j}`}
                className="aspect-square"
                style={{ backgroundColor: heatmapColors[i][j] }}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-neon-cyan mb-2">Top Contributing Nodes</h3>
        <div className="space-y-2">
          {topNodes.map((node, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-primary/10"
            >
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {node.layer} #{node.node}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Layer contribution
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-neon-purple">
                  {(node.contribution * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-card/30 border border-neon-blue/30">
        <div className="text-xs text-muted-foreground mb-1">Overall Confidence</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-neon-blue to-neon-cyan"
              style={{ 
                width: `${topNodes.length > 0 ? topNodes[0].contribution * 100 : 0}%`,
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.6)'
              }}
            />
          </div>
          <span className="text-sm font-bold text-neon-blue">
            {topNodes.length > 0 ? `${(topNodes[0].contribution * 100).toFixed(1)}%` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
