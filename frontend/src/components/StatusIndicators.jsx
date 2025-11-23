import { Server, Radio, Database, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

const StatusBadge = ({ label, status, icon }) => {
  const statusColors = {
    active: 'border-neon-cyan text-neon-cyan',
    idle: 'border-muted text-muted-foreground',
    error: 'border-destructive text-destructive',
  };

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg border-2 backdrop-blur-sm',
      'transition-all duration-300',
      statusColors[status],
      status === 'active' && 'animate-glow-pulse'
    )}>
      <div className="relative">
        {icon}
        {status === 'active' && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
        )}
      </div>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
};

const DataPacket = ({ from, to, active }) => {
  if (!active) return null;

  return (
    <div className="relative flex items-center gap-2 p-2 rounded-lg bg-card/30 border border-neon-blue/30">
      <div className="text-xs text-muted-foreground">{from}</div>
      <div className="flex-1 h-px bg-gradient-to-r from-neon-blue to-neon-cyan relative overflow-hidden">
        <div className="absolute inset-0 w-4 h-full bg-neon-cyan animate-slide-in" 
          style={{ 
            boxShadow: '0 0 10px rgba(0, 255, 242, 0.8)',
          }} 
        />
      </div>
      <div className="text-xs text-neon-cyan">{to}</div>
      <div className="text-xs text-muted-foreground bg-card px-2 py-1 rounded">
        28×28 array
      </div>
    </div>
  );
};

export const StatusIndicators = ({ isProcessing }) => {
  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-bold neon-glow mb-4">System Status</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatusBadge
          label="Node.js Backend"
          status={isProcessing ? 'active' : 'idle'}
          icon={<Server className="h-4 w-4" />}
        />
        <StatusBadge
          label="WebSocket Stream"
          status={isProcessing ? 'active' : 'idle'}
          icon={<Radio className="h-4 w-4" />}
        />
        <StatusBadge
          label="ML Microservice"
          status={isProcessing ? 'active' : 'idle'}
          icon={<Cpu className="h-4 w-4" />}
        />
        <StatusBadge
          label="MongoDB"
          status="active"
          icon={<Database className="h-4 w-4" />}
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground mb-2">Network Activity</div>
        <DataPacket 
          from="Canvas" 
          to="Backend" 
          active={isProcessing}
        />
      </div>
    </div>
  );
};
