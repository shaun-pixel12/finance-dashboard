import React from 'react';
import { useMarket, Stock } from '../context/MarketContext';
import { MetricCard } from '../components/MetricCard';
import { ArrowUpRight, ArrowDownRight, Newspaper, Eye, ShieldAlert } from 'lucide-react';

interface OverviewProps {
  onStockSelect: (symbol: string) => void;
  onNavigate: (view: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onStockSelect, onNavigate }) => {
  const { indices, stocks, news, fearGreedScore, vixPrice, watchlist } = useMarket();

  // Find top gainers and losers
  const sortedByChange = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
  const topGainers = sortedByChange.slice(0, 4);
  const topLosers = sortedByChange.slice(-4).reverse();

  // Watchlist stock objects
  const watchlistStocks = stocks.filter(s => watchlist.includes(s.symbol));

  const getFearGreedText = (score: number) => {
    if (score <= 25) return { text: '극도의 공포 (Extreme Fear)', color: 'var(--color-extreme-fear)' };
    if (score <= 45) return { text: '공포 (Fear)', color: 'var(--color-fear)' };
    if (score <= 55) return { text: '중립 (Neutral)', color: 'var(--color-neutral)' };
    if (score <= 75) return { text: '탐욕 (Greed)', color: 'var(--color-greed)' };
    return { text: '극도의 탐욕 (Extreme Greed)', color: 'var(--color-extreme-greed)' };
  };

  const sentimentInfo = getFearGreedText(fearGreedScore);

  return (
    <div className="page-container">
      {/* 1. Market Indices Row */}
      <div className="indices-container">
        <MetricCard index={indices.SPY} onClick={() => onStockSelect('SPY')} />
        <MetricCard index={indices.QQQ} onClick={() => onStockSelect('QQQ')} />
        <MetricCard index={indices.KOSPI} onClick={() => onStockSelect('KOSPI')} />
        <MetricCard index={indices.KOSDAQ} onClick={() => onStockSelect('KOSDAQ')} />
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid-layout mt-6">
        
        {/* Watchlist Summary */}
        <div className="card span-8">
          <div className="card-header flex-between mb-4">
            <h2 className="card-title-text font-bold">나의 관심 종목 (Watchlist)</h2>
            <button className="btn-text" onClick={() => onNavigate('portfolio')}>가상 포트폴리오 관리 ➔</button>
          </div>
          {watchlistStocks.length === 0 ? (
            <div className="empty-state flex-center flex-direction-column">
              <Eye size={36} className="text-muted mb-2" />
              <p className="text-sm text-muted">관심 종목이 비어 있습니다.</p>
              <p className="text-xs text-muted mt-1">상단에서 종목을 검색하여 관심 종목에 추가해 보세요.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>종목명</th>
                    <th>티커</th>
                    <th style={{ textAlign: 'right' }}>현재가</th>
                    <th style={{ textAlign: 'right' }}>대비</th>
                    <th style={{ textAlign: 'right' }}>등락률</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlistStocks.map(stock => {
                    const isUS = stock.market === 'US';
                    const isUp = stock.change >= 0;
                    const badgeClass = isUS 
                      ? (isUp ? 'stock-up-us' : 'stock-down-us')
                      : (isUp ? 'stock-up-kr' : 'stock-down-kr');
                    const textClass = isUS 
                      ? (isUp ? 'text-us-up' : 'text-us-down')
                      : (isUp ? 'text-kr-up' : 'text-kr-down');

                    return (
                      <tr key={stock.symbol} onClick={() => onStockSelect(stock.symbol)} className="hover-row">
                        <td>
                          <span className="font-semibold text-primary-text">{stock.name}</span>
                        </td>
                        <td><span className="badge-ticker">{stock.symbol}</span></td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                          {isUS ? `$${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${stock.price.toLocaleString()}원`}
                        </td>
                        <td style={{ textAlign: 'right' }} className={`font-semibold ${textClass}`}>
                          {isUp ? '+' : ''}{isUS ? stock.change.toFixed(2) : stock.change.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge ${badgeClass}`}>
                            {isUp ? '+' : ''}{stock.changePercent}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sentiment / Fear & Greed Card */}
        <div className="card span-4 flex-direction-column">
          <div className="card-header mb-4">
            <h2 className="card-title-text font-bold">시장 심리 지표</h2>
          </div>
          
          <div className="sentiment-body flex-1 flex-center flex-direction-column">
            <div className="gauge-outer">
              <svg width="160" height="90" viewBox="0 0 100 55">
                {/* Gauge Background track */}
                <path 
                  d="M10,50 A40,40 0 0,1 90,50" 
                  fill="none" 
                  stroke="#e2e8f0" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                />
                {/* Gauge Colored Value track */}
                <path 
                  d="M10,50 A40,40 0 0,1 90,50" 
                  fill="none" 
                  stroke={sentimentInfo.color} 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  strokeDasharray="126" 
                  strokeDashoffset={126 - (126 * fearGreedScore) / 100}
                  className="gauge-path"
                />
                {/* Needle */}
                <g transform={`rotate(${(fearGreedScore / 100) * 180 - 90} 50 50)`}>
                  <line x1="50" y1="50" x2="50" y2="15" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="4" fill="#0f172a" />
                </g>
              </svg>
              <div className="gauge-score-display">{fearGreedScore}</div>
            </div>

            <p className="text-sm font-semibold mt-4 text-center">
              Fear & Greed Index: <span style={{ color: sentimentInfo.color }}>{sentimentInfo.text}</span>
            </p>
            
            <div className="vix-summary-box mt-6">
              <div className="flex-between">
                <span className="text-xs font-semibold text-muted">변동성 VIX 지수</span>
                <span className="badge stock-down-us text-xs">안정</span>
              </div>
              <div className="flex-between mt-2">
                <span className="vix-value">{vixPrice.toFixed(2)}</span>
                <span className="text-xs text-us-down font-medium">-1.24%</span>
              </div>
            </div>
            
            <button className="btn-outline-full mt-6" onClick={() => onNavigate('sentiment')}>
              공포탐욕 상세 분석 보기
            </button>
          </div>
        </div>

        {/* Top Movers (Gainers / Losers) */}
        <div className="card span-6">
          <h2 className="card-title-text font-bold mb-4">시장 급등락 종목</h2>
          <div className="movers-tabs">
            <div className="mover-section">
              <div className="mover-section-title green-title flex-between">
                <span>급등 종목</span>
                <ArrowUpRight size={16} />
              </div>
              <div className="mover-list">
                {topGainers.map(stock => {
                  const isUS = stock.market === 'US';
                  return (
                    <div key={stock.symbol} onClick={() => onStockSelect(stock.symbol)} className="mover-item">
                      <div className="mover-info">
                        <span className="mover-name">{stock.name}</span>
                        <span className="mover-symbol text-xs text-muted">{stock.symbol}</span>
                      </div>
                      <span className={`badge ${isUS ? 'stock-up-us' : 'stock-up-kr'}`}>
                        +{stock.changePercent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mover-divider" />

            <div className="mover-section">
              <div className="mover-section-title red-title flex-between">
                <span>급락 종목</span>
                <ArrowDownRight size={16} />
              </div>
              <div className="mover-list">
                {topLosers.map(stock => {
                  const isUS = stock.market === 'US';
                  return (
                    <div key={stock.symbol} onClick={() => onStockSelect(stock.symbol)} className="mover-item">
                      <div className="mover-info">
                        <span className="mover-name">{stock.name}</span>
                        <span className="mover-symbol text-xs text-muted">{stock.symbol}</span>
                      </div>
                      <span className={`badge ${isUS ? 'stock-down-us' : 'stock-down-kr'}`}>
                        {stock.changePercent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time News Brief */}
        <div className="card span-6">
          <div className="card-header flex-between mb-4">
            <h2 className="card-title-text font-bold">실시간 주요 뉴스</h2>
            <button className="btn-text" onClick={() => onNavigate('news')}>전체 뉴스 보기 ➔</button>
          </div>
          <div className="brief-news-list">
            {news.slice(0, 3).map(item => {
              let badgeColor = 'stock-flat';
              let badgeText = '중립';
              if (item.sentiment === 'positive') {
                badgeColor = 'stock-up-us';
                badgeText = '호재';
              } else if (item.sentiment === 'negative') {
                badgeColor = 'stock-down-us';
                badgeText = '악재';
              }
              
              return (
                <div key={item.id} className="news-brief-item">
                  <div className="flex-between">
                    <div className="news-brief-meta">
                      <span className="news-brief-source">{item.source}</span>
                      <span className="news-brief-time text-muted">• {item.time}</span>
                    </div>
                    <span className={`badge ${badgeColor} text-xs`}>{badgeText}</span>
                  </div>
                  <h4 className="news-brief-title font-semibold mt-1">
                    {item.title}
                  </h4>
                  <p className="news-brief-desc text-xs text-muted mt-1">
                    {item.summary[0].slice(0, 80)}...
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <style>{`
        .indices-container {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .badge-ticker {
          background-color: var(--bg-app);
          color: var(--text-secondary);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid var(--border-color);
        }

        /* Gauge Styling */
        .gauge-outer {
          position: relative;
          width: 160px;
          height: 90px;
          display: flex;
          justify-content: center;
        }

        .gauge-path {
          transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .gauge-score-display {
          position: absolute;
          bottom: 0;
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .vix-summary-box {
          background-color: var(--bg-app);
          padding: 12px;
          border-radius: var(--radius-md);
          width: 100%;
          border: 1px solid var(--border-color);
        }

        .vix-value {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
        }

        .btn-outline-full {
          width: 100%;
          border: 1px solid var(--border-color);
          background: none;
          color: var(--text-secondary);
          padding: 10px;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .btn-outline-full:hover {
          background-color: var(--bg-app);
          color: var(--text-primary);
        }

        /* Movers Styling */
        .movers-tabs {
          display: flex;
          gap: 16px;
        }

        .mover-section {
          flex: 1;
        }

        .mover-divider {
          width: 1px;
          background-color: var(--border-color);
          align-self: stretch;
        }

        .mover-section-title {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-bottom: 8px;
          border-bottom: 2px solid transparent;
          margin-bottom: 12px;
        }

        .green-title {
          color: var(--color-us-up);
          border-color: var(--color-us-up);
        }

        .red-title {
          color: var(--color-us-down);
          border-color: var(--color-us-down);
        }

        .mover-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mover-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: transform var(--transition-fast), border-color var(--transition-fast);
        }

        .mover-item:hover {
          transform: translateX(2px);
          border-color: #cbd5e1;
        }

        .mover-name {
          font-size: 0.85rem;
          font-weight: 600;
          display: block;
        }

        /* News brief list */
        .brief-news-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .news-brief-item {
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .news-brief-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .news-brief-meta {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .news-brief-title {
          font-size: 0.88rem;
          color: var(--text-primary);
          line-height: 1.35;
        }

        .news-brief-desc {
          line-height: 1.4;
        }

        @media (max-width: 1200px) {
          .span-8, .span-6, .span-4 {
            grid-column: span 12;
          }
          .movers-tabs {
            flex-direction: column;
          }
          .mover-divider {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
