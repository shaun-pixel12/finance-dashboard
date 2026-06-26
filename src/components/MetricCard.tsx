import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MarketIndex } from '../context/MarketContext';

interface MetricCardProps {
  index: MarketIndex;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ index, onClick }) => {
  const { name, symbol, price, change, changePercent, history } = index;
  const isUp = change >= 0;
  
  // Dynamic color coding: index is global, let's look at the symbol to decide US vs KR color.
  // SPY, QQQ are US. KOSPI, KOSDAQ are KR.
  const isUS = symbol === 'SPY' || symbol === 'QQQ';
  const colorClass = isUS 
    ? (isUp ? 'stock-up-us' : 'stock-down-us')
    : (isUp ? 'stock-up-kr' : 'stock-down-kr');
  
  const textClass = isUS 
    ? (isUp ? 'text-us-up' : 'text-us-down')
    : (isUp ? 'text-kr-up' : 'text-kr-down');

  const strokeColor = isUS 
    ? (isUp ? '#10b981' : '#ef4444') // green vs red
    : (isUp ? '#ef4444' : '#3b82f6'); // red vs blue

  // Render SVG Sparkline
  const renderSparkline = () => {
    if (!history || history.length < 2) return null;
    
    const width = 120;
    const height = 40;
    const padding = 2;
    
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min === 0 ? 1 : max - min;
    
    const points = history.map((val, index) => {
      const x = (index / (history.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((val - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="sparkline">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="metric-card card" onClick={onClick}>
      <div className="metric-header">
        <div>
          <span className="metric-symbol text-xs text-muted">{symbol}</span>
          <h3 className="metric-name text-sm font-semibold">{name}</h3>
        </div>
        <div className={`metric-badge badge ${colorClass}`}>
          {isUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
          {isUp ? '+' : ''}{changePercent}%
        </div>
      </div>
      
      <div className="metric-body">
        <div className="metric-value-box">
          <span className="metric-price font-bold">
            {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`metric-change text-xs font-semibold ${textClass}`}>
            {isUp ? '+' : ''}{change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="metric-chart-box">
          {renderSparkline()}
        </div>
      </div>

      <style>{`
        .metric-card {
          cursor: pointer;
          min-width: 220px;
          flex: 1;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .metric-symbol {
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .metric-name {
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .metric-badge {
          display: flex;
          align-items: center;
        }

        .metric-body {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: auto;
        }

        .metric-value-box {
          display: flex;
          flex-direction: column;
        }

        .metric-price {
          font-family: var(--font-display);
          font-size: 1.5rem;
          color: var(--text-primary);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .metric-change {
          margin-top: 2px;
        }

        .text-us-up { color: var(--color-us-up); }
        .text-us-down { color: var(--color-us-down); }
        .text-kr-up { color: var(--color-kr-up); }
        .text-kr-down { color: var(--color-kr-down); }

        .metric-chart-box {
          display: flex;
          align-items: flex-end;
        }

        .sparkline {
          overflow: visible;
        }
      `}</style>
    </div>
  );
};
