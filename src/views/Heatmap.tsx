import React, { useState, useMemo } from 'react';
import { useMarket, Stock } from '../context/MarketContext';
import { RefreshCw } from 'lucide-react';
import { TradingViewHeatmap } from '../components/TradingViewHeatmap';

// Custom interface for positioned rectangles
interface TreemapRect {
  id: string;
  name: string;
  symbol?: string;
  weight: number;
  value: number; // change percent
  market?: 'US' | 'KR';
  x: number; // percentage
  y: number; // percentage
  w: number; // percentage
  h: number; // percentage
}

export const Heatmap: React.FC<{ onStockSelect: (symbol: string) => void }> = ({ onStockSelect }) => {
  const { stocks } = useMarket();
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'US' | 'KR' | 'SP500' | 'NASDAQ100' | 'KOSPI200' | 'KOSDAQ100'>('ALL');
  const [heatmapSource, setHeatmapSource] = useState<'SIMULATED' | 'REAL'>('SIMULATED');

  // Filter stocks based on selection
  const filteredStocks = useMemo(() => {
    switch (marketFilter) {
      case 'US':
        return stocks.filter(s => s.market === 'US');
      case 'KR':
        return stocks.filter(s => s.market === 'KR');
      case 'SP500':
        // Mock S&P 500 stocks
        return stocks.filter(s => s.market === 'US' && s.symbol !== '8058.T' && s.symbol !== '8001.T');
      case 'NASDAQ100':
        // Tech heavy US stocks
        return stocks.filter(s => s.market === 'US' && (s.sector.includes('반도체') || s.sector === '빅테크' || s.sector === '원자력'));
      case 'KOSPI200':
        // Big KR stocks
        return stocks.filter(s => s.market === 'KR' && s.cap > 10);
      case 'KOSDAQ100':
        // Smaller/medium KR stocks
        return stocks.filter(s => s.market === 'KR' && s.cap <= 10);
      case 'ALL':
      default:
        return stocks;
    }
  }, [stocks, marketFilter]);

  // Group stocks by sector
  const sectorGroups = useMemo(() => {
    const groups: Record<string, Stock[]> = {};
    filteredStocks.forEach(stock => {
      if (!groups[stock.sector]) {
        groups[stock.sector] = [];
      }
      groups[stock.sector].push(stock);
    });
    return groups;
  }, [filteredStocks]);

  // Treemap Layout Algorithm (Binary Split)
  const computeTreemap = (
    items: { id: string; name: string; symbol?: string; weight: number; value: number; market?: 'US' | 'KR' }[],
    x: number,
    y: number,
    w: number,
    h: number
  ): TreemapRect[] => {
    if (items.length === 0) return [];
    if (items.length === 1) {
      return [{ ...items[0], x, y, w, h }];
    }

    // Sort descending by weight
    const sorted = [...items].sort((a, b) => b.weight - a.weight);
    const totalWeight = sorted.reduce((sum, item) => sum + item.weight, 0);

    // Split into two groups as evenly as possible
    let leftWeight = 0;
    let splitIndex = 0;
    for (let i = 0; i < sorted.length; i++) {
      leftWeight += sorted[i].weight;
      if (leftWeight >= totalWeight / 2) {
        splitIndex = i + 1;
        break;
      }
    }
    
    // Ensure both groups have items
    if (splitIndex === 0) splitIndex = 1;
    if (splitIndex >= sorted.length) splitIndex = sorted.length - 1;

    const leftGroup = sorted.slice(0, splitIndex);
    const rightGroup = sorted.slice(splitIndex);

    const leftGroupWeight = leftGroup.reduce((sum, item) => sum + item.weight, 0);
    const ratio = leftGroupWeight / totalWeight;

    const rects: TreemapRect[] = [];
    
    // Split vertically if width is greater, horizontally if height is greater
    if (w > h) {
      const leftW = w * ratio;
      rects.push(...computeTreemap(leftGroup, x, y, leftW, h));
      rects.push(...computeTreemap(rightGroup, x + leftW, y, w - leftW, h));
    } else {
      const leftH = h * ratio;
      rects.push(...computeTreemap(leftGroup, x, y, w, leftH));
      rects.push(...computeTreemap(rightGroup, x, y + leftH, w, h - leftH));
    }

    return rects;
  };

  // Compute Layout for sectors first, then layout stocks inside sectors
  const treemapLayout = useMemo(() => {
    // 1. Prepare sector items
    const sectorItems = Object.entries(sectorGroups).map(([sectorName, stocksInSector]) => {
      const weight = stocksInSector.reduce((sum, s) => sum + s.cap, 0);
      const avgChange = stocksInSector.reduce((sum, s) => sum + s.changePercent, 0) / stocksInSector.length;
      return {
        id: sectorName,
        name: sectorName,
        weight,
        value: avgChange
      };
    });

    const sectorRects = computeTreemap(sectorItems, 0, 0, 100, 100);

    // 2. For each sector, layout its stocks inside its rectangle
    const finalRects: TreemapRect[] = [];
    sectorRects.forEach(secRect => {
      const sectorStocks = sectorGroups[secRect.name] || [];
      const stockItems = sectorStocks.map(stock => ({
        id: stock.symbol,
        name: stock.name,
        symbol: stock.symbol,
        weight: stock.cap,
        value: stock.changePercent,
        market: stock.market
      }));

      // Compute sub-treemap using the parent sector's dimensions (x, y, w, h)
      const subRects = computeTreemap(stockItems, secRect.x, secRect.y, secRect.w, secRect.h);
      finalRects.push(...subRects);
    });

    return { sectors: sectorRects, stocks: finalRects };
  }, [sectorGroups, computeTreemap]);

  // Color mapping based on market and stock change
  const getColorStyle = (rect: TreemapRect) => {
    const val = rect.value;
    const isUS = rect.market === 'US';
    
    if (val === 0) return { backgroundColor: '#f1f5f9', color: 'var(--text-secondary)' };

    if (isUS) {
      // US stock: Positive = Green, Negative = Red
      if (val > 0) {
        const opacity = Math.min(0.9, 0.15 + (val / 4.0)); // scale green
        return { 
          backgroundColor: `rgba(16, 185, 129, ${opacity})`, 
          color: opacity > 0.55 ? '#fff' : 'var(--text-primary)',
          borderColor: 'rgba(16, 185, 129, 0.8)'
        };
      } else {
        const opacity = Math.min(0.9, 0.15 + (Math.abs(val) / 4.0)); // scale red
        return { 
          backgroundColor: `rgba(239, 68, 68, ${opacity})`, 
          color: opacity > 0.55 ? '#fff' : 'var(--text-primary)',
          borderColor: 'rgba(239, 68, 68, 0.8)'
        };
      }
    } else {
      // KR stock: Positive = Red, Negative = Blue
      if (val > 0) {
        const opacity = Math.min(0.9, 0.15 + (val / 4.0)); // scale red
        return { 
          backgroundColor: `rgba(239, 68, 68, ${opacity})`, 
          color: opacity > 0.55 ? '#fff' : 'var(--text-primary)',
          borderColor: 'rgba(239, 68, 68, 0.8)'
        };
      } else {
        const opacity = Math.min(0.9, 0.15 + (Math.abs(val) / 4.0)); // scale blue
        return { 
          backgroundColor: `rgba(59, 130, 246, ${opacity})`, 
          color: opacity > 0.55 ? '#fff' : 'var(--text-primary)',
          borderColor: 'rgba(59, 130, 246, 0.8)'
        };
      }
    }
  };

  return (
    <div className="page-container">
      {/* View Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 className="view-title">테마 및 섹터 히트맵</h1>
          <div className="heatmap-source-toggle mt-2">
            <button 
              className={`toggle-btn-sm ${heatmapSource === 'SIMULATED' ? 'active' : ''}`}
              onClick={() => setHeatmapSource('SIMULATED')}
              style={{ marginRight: '8px' }}
            >
              모의 시뮬레이션
            </button>
            <button 
              className={`toggle-btn-sm ${heatmapSource === 'REAL' ? 'active' : ''}`}
              onClick={() => setHeatmapSource('REAL')}
            >
              실제 실시간 시장 (TradingView)
            </button>
          </div>
        </div>
        
        {/* Market Filter Buttons */}
        <div className="filter-group">
          <button 
            className={`filter-btn ${marketFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setMarketFilter('ALL')}
          >
            전체
          </button>
          <button 
            className={`filter-btn ${marketFilter === 'US' ? 'active' : ''}`}
            onClick={() => setMarketFilter('US')}
          >
            미국 전체
          </button>
          <button 
            className={`filter-btn ${marketFilter === 'KR' ? 'active' : ''}`}
            onClick={() => setMarketFilter('KR')}
          >
            한국 전체
          </button>
          <button 
            className={`filter-btn ${marketFilter === 'SP500' ? 'active' : ''}`}
            onClick={() => setMarketFilter('SP500')}
          >
            S&P 500
          </button>
          <button 
            className={`filter-btn ${marketFilter === 'NASDAQ100' ? 'active' : ''}`}
            onClick={() => setMarketFilter('NASDAQ100')}
          >
            Nasdaq 100
          </button>
          <button 
            className={`filter-btn ${marketFilter === 'KOSPI200' ? 'active' : ''}`}
            onClick={() => setMarketFilter('KOSPI200')}
          >
            Kospi 200
          </button>
          <button 
            className={`filter-btn ${marketFilter === 'KOSDAQ100' ? 'active' : ''}`}
            onClick={() => setMarketFilter('KOSDAQ100')}
          >
            Kosdaq 100
          </button>
        </div>
      </div>

      {/* Heatmap Legend - Only show for simulated */}
      {heatmapSource === 'SIMULATED' && (
        <div className="heatmap-legend mb-4 flex-between card">
          <div className="legend-items">
            <span className="legend-label text-xs font-semibold text-muted mr-3">배색 기준:</span>
            
            <div className="legend-market-group mr-6">
              <span className="text-xs font-bold mr-2">미국 시장 (US):</span>
              <span className="badge legend-box stock-down-us text-xs mr-1">-3% 이상</span>
              <span className="legend-dash mr-1">—</span>
              <span className="badge legend-box stock-flat text-xs mr-1">0%</span>
              <span className="legend-dash mr-1">—</span>
              <span className="badge legend-box stock-up-us text-xs">+3% 이상</span>
            </div>

            <div className="legend-market-group">
              <span className="text-xs font-bold mr-2">한국 시장 (KR):</span>
              <span className="badge legend-box stock-down-kr text-xs mr-1">-3% 이상</span>
              <span className="legend-dash mr-1">—</span>
              <span className="badge legend-box stock-flat text-xs mr-1">0%</span>
              <span className="legend-dash mr-1">—</span>
              <span className="badge legend-box stock-up-kr text-xs">+3% 이상</span>
            </div>
          </div>
          <div className="legend-info text-xs text-muted flex-center">
            <RefreshCw size={12} className="mr-1 rotate-anim" /> 2초마다 자동 갱신 중
          </div>
        </div>
      )}

      {/* Heatmap Container */}
      <div className="heatmap-container card">
        {heatmapSource === 'REAL' ? (
          <TradingViewHeatmap filter={marketFilter} />
        ) : treemapLayout.stocks.length === 0 ? (
          <div className="flex-center" style={{ height: '500px' }}>
            <p className="text-muted">해당하는 종목이 없습니다.</p>
          </div>
        ) : (
          <div className="treemap-viewport">
            {/* 1. Draw Sector labels */}
            {treemapLayout.sectors.map(sec => {
              if (sec.w < 6 || sec.h < 6) return null; // don't draw tiny labels
              return (
                <div
                  key={`sec-${sec.id}`}
                  className="sector-outline"
                  style={{
                    left: `${sec.x}%`,
                    top: `${sec.y}%`,
                    width: `${sec.w}%`,
                    height: `${sec.h}%`
                  }}
                >
                  <span className="sector-label">{sec.name}</span>
                </div>
              );
            })}

            {/* 2. Draw Stock Tiles */}
            {treemapLayout.stocks.map(rect => {
              const colorStyle = getColorStyle(rect);
              const sign = rect.value >= 0 ? '+' : '';
              
              // Hide label if tile is too small
              const showText = rect.w > 4 && rect.h > 4;
              const showDetail = rect.w > 7 && rect.h > 7;

              return (
                <div
                  key={rect.id}
                  onClick={() => onStockSelect(rect.id)}
                  className="stock-tile"
                  style={{
                    left: `${rect.x}%`,
                    top: `${rect.y}%`,
                    width: `${rect.w}%`,
                    height: `${rect.h}%`,
                    ...colorStyle
                  }}
                  title={`${rect.name} (${rect.symbol}): ${sign}${rect.value}%`}
                >
                  {showText && (
                    <div className="tile-content">
                      <span className="tile-symbol font-bold">{rect.symbol?.split('.')[0]}</span>
                      {showDetail && <span className="tile-name text-xs">{rect.name}</span>}
                      {showDetail && (
                        <span className="tile-percent font-semibold text-xs mt-1">
                          {sign}{rect.value}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .view-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .filter-group {
          display: flex;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 4px;
          gap: 4px;
        }

        .filter-btn {
          border: none;
          background: none;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .filter-btn:hover {
          color: var(--text-primary);
        }

        .filter-btn.active {
          background-color: #fff;
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        /* Legend Styling */
        .heatmap-legend {
          padding: 12px 20px;
        }

        .legend-items {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .legend-market-group {
          display: flex;
          align-items: center;
        }

        .legend-box {
          padding: 3px 6px;
          min-width: 50px;
          text-align: center;
          display: inline-block;
        }

        .legend-dash {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .mr-3 { margin-right: 12px; }
        .mr-6 { margin-right: 24px; }
        .mr-2 { margin-right: 8px; }

        /* Treemap Viewport Styling */
        .heatmap-container {
          padding: 16px;
          background-color: #fff;
          overflow: hidden;
        }

        .treemap-viewport {
          position: relative;
          width: 100%;
          height: 600px;
          background-color: #f8fafc;
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .sector-outline {
          position: absolute;
          border: 1px dashed rgba(15, 23, 42, 0.15);
          pointer-events: none;
          box-sizing: border-box;
          z-index: 5;
        }

        .sector-label {
          position: absolute;
          left: 8px;
          top: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(15, 23, 42, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background-color: rgba(255, 255, 255, 0.8);
          padding: 1px 6px;
          border-radius: 4px;
        }

        .stock-tile {
          position: absolute;
          border: 1.5px solid #fff;
          box-sizing: border-box;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease, left 0.4s ease, top 0.4s ease, width 0.4s ease, height 0.4s ease;
          z-index: 10;
        }

        .stock-tile:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
          z-index: 20;
          border-color: #1e293b;
        }

        .tile-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4px;
        }

        .tile-symbol {
          font-size: 0.85rem;
          letter-spacing: -0.01em;
        }

        .tile-name {
          opacity: 0.85;
          font-size: 0.7rem;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 90px;
        }

        .tile-percent {
          font-size: 0.75rem;
        }

        .rotate-anim {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
