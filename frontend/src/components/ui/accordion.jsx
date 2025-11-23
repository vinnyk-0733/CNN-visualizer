import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export const ConfidenceTrend = ({ data }) => {
  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold neon-glow mb-4">Confidence Trend</h2>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />

            <XAxis 
              dataKey="timestamp"
              stroke="#6b7280"
              style={{ fontSize: "10px" }}
            />

            <YAxis 
              domain={[0, 100]}
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(18, 22, 31, 0.95)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                borderRadius: "8px",
                boxShadow: "0 0 20px rgba(0, 212, 255, 0.2)"
              }}
              labelStyle={{ color: "#00d4ff" }}
            />

            <Line 
              type="monotone"
              dataKey="confidence"
              stroke="#00d4ff"
              strokeWidth={3}
              dot={{ fill: "#00d4ff", r: 4 }}
              activeDot={{ r: 6, fill: "#00fff2" }}
              style={{
                filter: "drop-shadow(0 0 8px rgba(0, 212, 255, 0.6))"
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Section */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Latest */}
        <div className="p-3 rounded-lg bg-card/30 border border-primary/10">
          <div className="text-xs text-muted-foreground mb-1">Latest</div>
          <div className="text-lg font-bold text-neon-blue">
            {data.length > 0 
              ? `${data[data.length - 1].confidence.toFixed(1)}%` 
              : "N/A"}
          </div>
        </div>

        {/* Average */}
        <div className="p-3 rounded-lg bg-card/30 border border-primary/10">
          <div className="text-xs text-muted-foreground mb-1">Average</div>
          <div className="text-lg font-bold text-neon-purple">
            {data.length > 0 
              ? `${(data.reduce((sum, d) => sum + d.confidence, 0) / data.length).toFixed(1)}%`
              : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};
