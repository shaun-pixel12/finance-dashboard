import React, { useMemo } from 'react';
import { useMarket } from '../context/MarketContext';
import { HelpCircle, ShieldAlert, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';

export const Sentiment: React.FC = () => {
  const { fearGreedScore, vixPrice, vixHistory } = useMarket();

  // Categories mapping
  const sentimentCategories = [
    { label: 'Extreme Fear (극도의 공포)', range: '0 - 25', color: 'var(--color-extreme-fear)', bg: '#fef2f2' },
    { label: 'Fear (공포)', range: '26 - 45', color: 'var(--color-fear)', bg: '#fff7ed' },
    { label: 'Neutral (중립)', range: '46 - 55', color: 'var(--color-neutral)', bg: '#fefebc' },
    { label: 'Greed (탐욕)', range: '56 - 75', color: 'var(--color-greed)', bg: '#f7fee7' },
    { label: 'Extreme Greed (극도의 탐욕)', range: '76 - 100', color: 'var(--color-extreme-greed)', bg: '#ecfdf5' }
  ];

  const currentCategory = useMemo(() => {
    if (fearGreedScore <= 25) return sentimentCategories[0];
    if (fearGreedScore <= 45) return sentimentCategories[1];
    if (fearGreedScore <= 55) return sentimentCategories[2];
    if (fearGreedScore <= 75) return sentimentCategories[3];
    return sentimentCategories[4];
  }, [fearGreedScore]);

  // Generate historical Fear & Greed simulated line data
  const fgHistory = useMemo(() => {
    // Generate a fixed but slightly shifting set of 20 historical points ending with fearGreedScore
    const base = [48, 52, 50, 47, 45, 42, 38, 41, 44, 48, 52, 55, 58, 62, 60, 57, 54, 53, 56];
    return [...base, fearGreedScore];
  }, [fearGreedScore]);

  // SVG dimensions for VIX & Fear/Greed history
  const renderLineChart = (data: number[], stroke: string, fill: string, height = 80) => {
    if (!data || data.length < 2) return null;
    
    const width = 500;
    const padding = 10;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min === 0 ? 1 : max - min;
    
    const points = data.map((val, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((val - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;
    const areaData = `${pathData} L ${width - padding},${height} L ${padding},${height} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="sentiment-chart-svg">
        <defs>
          <linearGradient id={`grad-${fill}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity="0.4" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Shaded Area */}
        <path d={areaData} fill={`url(#grad-${fill})`} />
        
        {/* Stroke Line */}
        <path
          d={pathData}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots on line */}
        {points.map((pt, idx) => {
          if (idx !== points.length - 1) return null; // Only draw for last element
          const [x, y] = pt.split(',');
          return (
            <g key={`dot-${idx}`}>
              <circle cx={x} cy={y} r="6" fill={stroke} />
              <circle cx={x} cy={y} r="10" stroke={stroke} strokeWidth="1.5" fill="none" className="pulse-dot" />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="page-container">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="view-title">시장 감성 지표 (Market Sentiment)</h1>
        <p className="text-sm text-muted">투자자들의 공포와 탐욕 심리 및 시장 변동성을 통해 현재 시장이 과열 혹은 패닉 구간인지 판별합니다.</p>
      </div>

      {/* Main Sentiment Grid */}
      <div className="grid-layout">
        
        {/* Fear & Greed Large Gauge */}
        <div className="card span-7 flex-direction-column">
          <h2 className="card-title-text font-bold mb-4 flex-between">
            <span>Fear & Greed Index</span>
            <Compass size={18} className="text-muted" />
          </h2>

          <div className="sentiment-details flex-center flex-direction-column flex-1">
            
            {/* Massive Custom SVG Gauge */}
            <div className="gauge-large-container">
              <svg width="280" height="160" viewBox="0 0 100 55">
                {/* Arc Background */}
                <path 
                  d="M10,50 A40,40 0 0,1 90,50" 
                  fill="none" 
                  stroke="#f1f5f9" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                />
                
                {/* Color Zones */}
                <path d="M10,50 A40,40 0 0,1 26,26" fill="none" stroke="var(--color-extreme-fear)" strokeWidth="8" />
                <path d="M26,26 A40,40 0 0,1 46,12" fill="none" stroke="var(--color-fear)" strokeWidth="8" />
                <path d="M46,12 A40,40 0 0,1 54,12" fill="none" stroke="var(--color-neutral)" strokeWidth="8" />
                <path d="M54,12 A40,40 0 0,1 74,26" fill="none" stroke="var(--color-greed)" strokeWidth="8" />
                <path d="M74,26 A40,40 0 0,1 90,50" fill="none" stroke="var(--color-extreme-greed)" strokeWidth="8" />

                {/* Animated Needle */}
                <g transform={`rotate(${(fearGreedScore / 100) * 180 - 90} 50 50)`} className="needle-g">
                  <line x1="50" y1="50" x2="50" y2="12" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="4.5" fill="#0f172a" />
                </g>
              </svg>
              <div className="gauge-score-large font-bold">{fearGreedScore}</div>
            </div>

            {/* Current State Indicator Box */}
            <div className="status-indicator-box mt-4" style={{ backgroundColor: currentCategory.bg, border: `1px solid ${currentCategory.color}` }}>
              <span className="status-indicator-dot" style={{ backgroundColor: currentCategory.color }} />
              <span className="font-semibold text-sm" style={{ color: currentCategory.color }}>
                현재 시장은 &apos;{currentCategory.label}&apos; 상태입니다.
              </span>
            </div>

            {/* Under-the-hood Metrics list */}
            <div className="sentiment-submetrics mt-6">
              <div className="submetric-item">
                <span className="text-xs text-secondary">주가 강도 (Stock Strength)</span>
                <span className="badge stock-up-us font-semibold">탐욕</span>
              </div>
              <div className="submetric-item">
                <span className="text-xs text-secondary">풋/콜 비율 (Put/Call Options Ratio)</span>
                <span className="badge stock-flat font-semibold">중립</span>
              </div>
              <div className="submetric-item">
                <span className="text-xs text-secondary">채권 대비 주가 (Stock/Bond Relative Return)</span>
                <span className="badge stock-down-us font-semibold">공포</span>
              </div>
              <div className="submetric-item">
                <span className="text-xs text-secondary">시장 거래량 (Market Volume)</span>
                <span className="badge stock-up-us font-semibold">탐욕</span>
              </div>
            </div>
          </div>
        </div>

        {/* VIX Volatility Card */}
        <div className="card span-5 flex-direction-column">
          <h2 className="card-title-text font-bold mb-4 flex-between">
            <span>변동성 지수 (VIX)</span>
            <span className="text-xs text-muted">CBOE Volatility Index</span>
          </h2>
          
          <div className="vix-body flex-direction-column flex-1">
            <div className="vix-value-section flex-between">
              <div>
                <span className="vix-large-value font-bold">{vixPrice.toFixed(2)}</span>
                <span className="badge stock-down-us text-xs ml-2">-1.24%</span>
              </div>
              <div className="vix-market-comment font-medium text-xs text-muted">
                현재 시장 변동성이 낮아 안정적인 위험자산 선호 심리가 지배적입니다.
              </div>
            </div>

            {/* VIX Chart Area */}
            <div className="vix-chart-container mt-4 flex-1">
              <div className="chart-label-box flex-between text-xs text-muted">
                <span>실시간 변동 추이</span>
                <span>정상 범위: 12.00 - 20.00</span>
              </div>
              {renderLineChart(vixHistory, '#3b82f6', '#3b82f6', 160)}
            </div>

            <div className="alert-box mt-4">
              <ShieldAlert size={16} className="text-secondary" />
              <p className="text-xs text-secondary ml-2 font-medium">
                VIX 지수가 20 이상으로 급증할 경우 단기 지수 낙폭이 확대될 수 있으므로 포트폴리오 헤지 비중을 확보해야 합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Sentiment History Line Chart */}
        <div className="card span-12">
          <h2 className="card-title-text font-bold mb-2">공포와 탐욕 지수 역사적 추이</h2>
          <p className="text-xs text-muted mb-4">최근 20일간의 Fear & Greed Index 심리 추세선입니다. (50 기준선 이상은 과열, 이하는 패닉 영역)</p>
          <div className="fg-history-chart">
            {renderLineChart(fgHistory, 'var(--primary)', 'var(--primary)', 180)}
            
            {/* Guide Grid Lines */}
            <div className="fg-grid-guide">
              <div className="guide-line extreme-greed-line"><span>75 (극도의 탐욕)</span></div>
              <div className="guide-line neutral-line"><span>50 (중립)</span></div>
              <div className="guide-line extreme-fear-line"><span>25 (극도의 공포)</span></div>
            </div>
          </div>
        </div>

        {/* Educational Content */}
        <div className="card span-12">
          <h2 className="card-title-text font-bold mb-4">투자자 노트: 감성 지표 해석법</h2>
          <div className="note-columns">
            <div className="note-col">
              <h4 className="font-semibold text-sm flex-between pb-2 border-b">
                <span>공포 탐욕 지수 활용법</span>
                <HelpCircle size={14} className="text-muted" />
              </h4>
              <p className="text-xs text-secondary mt-2">
                워런 버핏의 명언 <strong>&quot;남들이 탐욕을 부릴 때 두려워하고, 남들이 두려워할 때 탐욕을 부려라&quot;</strong>가 이 지수의 핵심 철학입니다.
              </p>
              <ul className="text-xs text-secondary mt-2 list-style-disc pl-4">
                <li><strong>극도의 공포 (0-25)</strong>: 시장 과매도 상태로, 우량 종목의 매력적인 저가 매수(Buy) 기회가 많아집니다.</li>
                <li><strong>극도의 탐욕 (75-100)</strong>: 시장 과열 국면으로, 조정을 대비하여 현금 비중을 늘리고 포트폴리오를 재조정해야 합니다.</li>
              </ul>
            </div>

            <div className="mover-divider" />

            <div className="note-col">
              <h4 className="font-semibold text-sm flex-between pb-2 border-b">
                <span>VIX 지수와의 상관관계</span>
                <HelpCircle size={14} className="text-muted" />
              </h4>
              <p className="text-xs text-secondary mt-2">
                VIX(변동성 지수)는 시장의 불안감을 측정하기에 흔히 <strong>&apos;공포지수&apos;</strong>라고 불립니다.
              </p>
              <ul className="text-xs text-secondary mt-2 list-style-disc pl-4">
                <li><strong>VIX 하락 (&lt;15)</strong>: 시장 변동성 축소로 주식 시장이 완만하게 상승 랠리를 펼치기 쉬운 조건입니다.</li>
                <li><strong>VIX 급등 (&gt;25)</strong>: 주가 폭락의 신호탄 역할을 하며, 안전자산(달러, 국채)으로 자금이 대이동합니다.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .span-7 { grid-column: span 7; }
        .span-5 { grid-column: span 5; }
        
        .border-b {
          border-bottom: 1px solid var(--border-color);
        }

        .pb-2 { padding-bottom: 8px; }

        /* Gauge Large Styling */
        .gauge-large-container {
          position: relative;
          width: 280px;
          height: 160px;
          display: flex;
          justify-content: center;
        }

        .needle-g {
          transition: transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .gauge-score-large {
          position: absolute;
          bottom: 0;
          font-family: var(--font-display);
          font-size: 3.5rem;
          color: var(--text-primary);
          line-height: 1;
        }

        .status-indicator-box {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          gap: 8px;
        }

        .status-indicator-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }

        .sentiment-submetrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          width: 100%;
          border-top: 1px solid var(--border-color);
          padding-top: 20px;
        }

        .submetric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--bg-app);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        /* VIX Styling */
        .vix-large-value {
          font-family: var(--font-display);
          font-size: 2.25rem;
          color: var(--text-primary);
          line-height: 1;
        }

        .vix-value-section {
          align-items: flex-end;
        }

        .vix-market-comment {
          max-width: 180px;
          text-align: right;
          line-height: 1.4;
        }

        .vix-chart-container {
          position: relative;
        }

        .chart-label-box {
          margin-bottom: 6px;
        }

        .alert-box {
          display: flex;
          background-color: var(--primary-light);
          padding: 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--primary-border);
          align-items: flex-start;
        }

        .ml-2 { margin-left: 8px; }

        /* Sentiment History Chart */
        .fg-history-chart {
          position: relative;
          width: 100%;
          height: 180px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: #fafbfc;
          overflow: hidden;
        }

        .sentiment-chart-svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .pulse-dot {
          animation: pulse 2s infinite;
          transform-origin: center;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        .fg-grid-guide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .guide-line {
          position: absolute;
          width: 100%;
          border-top: 1px dashed rgba(15, 23, 42, 0.08);
          display: flex;
          justify-content: flex-end;
          padding-right: 12px;
        }

        .guide-line span {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 600;
          transform: translateY(-50%);
          background-color: #fff;
          padding: 0 4px;
          border-radius: 2px;
        }

        .extreme-greed-line { top: 25%; border-color: rgba(16, 185, 129, 0.2); }
        .extreme-greed-line span { color: var(--color-extreme-greed); }
        .neutral-line { top: 50%; }
        .extreme-fear-line { top: 75%; border-color: rgba(239, 68, 68, 0.2); }
        .extreme-fear-line span { color: var(--color-extreme-fear); }

        /* Educational Note Columns */
        .note-columns {
          display: flex;
          gap: 24px;
        }

        .note-col {
          flex: 1;
        }

        .list-style-disc {
          list-style-type: disc;
        }

        @media (max-width: 1024px) {
          .span-7, .span-5 {
            grid-column: span 12;
          }
          .note-columns {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
