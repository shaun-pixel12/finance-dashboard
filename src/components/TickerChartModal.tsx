import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMarket } from '../context/MarketContext';
import { X, Check, Star, ShoppingCart, Newspaper, Sunrise, Moon } from 'lucide-react';

interface TickerChartModalProps {
  symbol: string;
  onClose: () => void;
}

// ----------------------------------------------------------------------------
// TradingView Real-Time Chart Component
// ----------------------------------------------------------------------------
const TradingViewChart: React.FC<{ symbol: string; market: string }> = ({ symbol, market }) => {
  const containerId = `tv_chart_${symbol.replace('.', '_')}`;

  const getTvSymbol = (sym: string, mkt: string) => {
    if (mkt === 'KR') {
      const code = sym.split('.')[0];
      return `KRX:${code}`;
    }
    if (sym.endsWith('.T')) {
      const code = sym.split('.')[0];
      return `TSE:${code}`;
    }
    // Handle indices mapping for TradingView
    if (sym === 'SPY') return 'NYSE:SPY';
    if (sym === 'QQQ') return 'NASDAQ:QQQ';
    if (sym === 'KOSPI') return 'KRX:KOSPI';
    if (sym === 'KOSDAQ') return 'KRX:KOSDAQ';
    
    return sym;
  };

  useEffect(() => {
    const scriptId = 'tradingview-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initWidget = () => {
      if ((window as any).TradingView) {
        new (window as any).TradingView.widget({
          width: '100%',
          height: '100%',
          symbol: getTvSymbol(symbol, market),
          interval: 'D',
          timezone: 'Asia/Seoul',
          theme: 'light',
          style: '1',
          locale: 'ko',
          toolbar_bg: '#f1f5f9',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: containerId,
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      if ((window as any).TradingView) {
        const timer = setTimeout(initWidget, 100);
        return () => clearTimeout(timer);
      } else {
        script.addEventListener('load', initWidget);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener('load', initWidget);
      }
    };
  }, [symbol, market]);

  return (
    <div id={containerId} style={{ width: '100%', height: '100%', minHeight: '260px' }} />
  );
};

// ----------------------------------------------------------------------------
// TickerChartModal Component
// ----------------------------------------------------------------------------
export const TickerChartModal: React.FC<TickerChartModalProps> = ({ symbol, onClose }) => {
  const { stocks, indices, news, watchlist, addToWatchlist, removeFromWatchlist, buyStock } = useMarket();
  
  // Korean and Japanese markets are restricted in embedded TradingView widgets
  const isRestricted = useMemo(() => {
    return symbol.endsWith('.KS') || symbol.endsWith('.KQ') || symbol.endsWith('.T') || symbol === 'KOSPI' || symbol === 'KOSDAQ';
  }, [symbol]);

  const [chartType, setChartType] = useState<'LINE' | 'CANDLE' | 'REAL'>(
    (symbol.endsWith('.KS') || symbol.endsWith('.KQ') || symbol.endsWith('.T') || symbol === 'KOSPI' || symbol === 'KOSDAQ') ? 'LINE' : 'REAL'
  );
  const [hoveredPoint, setHoveredPoint] = useState<{ price: number; index: number } | null>(null);

  // Trade state inside modal
  const [shares, setShares] = useState<number>(10);
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);

  // Find the stock or index object
  const stockOrIndex = useMemo(() => {
    const foundStock = stocks.find(s => s.symbol === symbol);
    if (foundStock) return { ...foundStock, isIndex: false };
    
    // Check if it is a market index
    const foundIndex = indices[symbol];
    if (foundIndex) {
      return {
        symbol: foundIndex.symbol,
        name: foundIndex.name,
        sector: '시장 지수',
        market: (symbol === 'SPY' || symbol === 'QQQ') ? 'US' : ('KR' as const),
        price: foundIndex.price,
        prevClose: foundIndex.prevClose,
        change: foundIndex.change,
        changePercent: foundIndex.changePercent,
        cap: 0,
        volume: 0,
        per: 0,
        peg: 0,
        pbr: 0,
        evEbitda: 0,
        history: foundIndex.history,
        description: `${foundIndex.name} 시장 종합 주가 지수 정보입니다.`,
        isIndex: true
      };
    }
    
    return null;
  }, [stocks, indices, symbol]);

  const isWatchlisted = useMemo(() => {
    return watchlist.includes(symbol);
  }, [watchlist, symbol]);

  // Filter news related to this stock
  const relatedNews = useMemo(() => {
    return news.filter(n => n.symbol === symbol || (symbol === 'SPY' && !n.symbol) || (symbol === 'KOSPI' && !n.symbol)).slice(0, 3);
  }, [news, symbol]);

  if (!stockOrIndex) return null;

  const isUS = stockOrIndex.market === 'US';
  const isUp = stockOrIndex.change >= 0;
  const badgeClass = isUS 
    ? (isUp ? 'stock-up-us' : 'stock-down-us')
    : (isUp ? 'stock-up-kr' : 'stock-down-kr');
  const textClass = isUS 
    ? (isUp ? 'text-us-up' : 'text-us-down')
    : (isUp ? 'text-kr-up' : 'text-kr-down');

  // Handle Watchlist toggle
  const handleWatchlistToggle = () => {
    if (isWatchlisted) {
      removeFromWatchlist(symbol);
    } else {
      addToWatchlist(symbol);
    }
  };

  // Handle Buy
  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    const success = buyStock(symbol, shares);
    if (success) {
      setTradeStatus('매수 주문 체결 완료!');
      setTimeout(() => setTradeStatus(null), 3000);
    } else {
      setTradeStatus('예수금 부족으로 체결 실패');
      setTimeout(() => setTradeStatus(null), 3000);
    }
  };

  // Render SVG Candlestick or Line Chart (for simulated historical view)
  const renderSimulatedChart = () => {
    const history = stockOrIndex.history;
    if (history.length < 2) return null;

    const width = 600;
    const height = 240;
    const paddingLeft = 45;
    const paddingRight = 10;
    const paddingTop = 20;
    const paddingBottom = 20;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    const min = Math.min(...history) * 0.995;
    const max = Math.max(...history) * 1.005;
    const range = max - min === 0 ? 1 : max - min;

    const getX = (idx: number) => {
      return paddingLeft + (idx / (history.length - 1)) * chartW;
    };

    const getY = (price: number) => {
      return height - paddingBottom - ((price - min) / range) * chartH;
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      
      const relativeX = clientX - paddingLeft;
      const pct = relativeX / (rect.width * (chartW / width));
      let idx = Math.round(pct * (history.length - 1));
      idx = Math.max(0, Math.min(history.length - 1, idx));
      
      setHoveredPoint({
        price: history[idx],
        index: idx
      });
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
    };

    if (chartType === 'LINE') {
      const points = history.map((val, idx) => `${getX(idx)},${getY(val)}`);
      const pathData = `M ${points.join(' L ')}`;
      const areaData = `${pathData} L ${getX(history.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`;
      
      const strokeColor = isUS 
        ? (isUp ? '#10b981' : '#ef4444') 
        : (isUp ? '#ef4444' : '#3b82f6');
        
      const fillGradient = isUS 
        ? (isUp ? 'url(#usUpGradModal)' : 'url(#usDownGradModal)') 
        : (isUp ? 'url(#krUpGradModal)' : 'url(#krDownGradModal)');

      return (
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="modal-chart-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="usUpGradModal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="usDownGradModal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="krUpGradModal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="krDownGradModal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingLeft} y1={getY(min)} x2={width - paddingRight} y2={getY(min)} stroke="#e2e8f0" strokeDasharray="3" />
          <line x1={paddingLeft} y1={getY((min+max)/2)} x2={width - paddingRight} y2={getY((min+max)/2)} stroke="#e2e8f0" strokeDasharray="3" />
          <line x1={paddingLeft} y1={getY(max)} x2={width - paddingRight} y2={getY(max)} stroke="#e2e8f0" strokeDasharray="3" />

          {/* Area under line */}
          <path d={areaData} fill={fillGradient} />

          {/* Line stroke */}
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Y Axis price labels */}
          <text x={paddingLeft - 8} y={getY(min) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontWeight="600">
            {isUS ? `$${min.toFixed(1)}` : `${Math.round(min).toLocaleString()}`}
          </text>
          <text x={paddingLeft - 8} y={getY((min+max)/2) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontWeight="600">
            {isUS ? `$${((min+max)/2).toFixed(1)}` : `${Math.round((min+max)/2).toLocaleString()}`}
          </text>
          <text x={paddingLeft - 8} y={getY(max) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontWeight="600">
            {isUS ? `$${max.toFixed(1)}` : `${Math.round(max).toLocaleString()}`}
          </text>

          {/* Tooltip vertical cursor line and dot */}
          {hoveredPoint && (
            <g>
              <line 
                x1={getX(hoveredPoint.index)} 
                y1={paddingTop} 
                x2={getX(hoveredPoint.index)} 
                y2={height - paddingBottom} 
                stroke="var(--text-muted)" 
                strokeDasharray="2" 
              />
              <circle 
                cx={getX(hoveredPoint.index)} 
                cy={getY(hoveredPoint.price)} 
                r="5" 
                fill={strokeColor} 
                stroke="#fff" 
                strokeWidth="1.5" 
              />
            </g>
          )}
        </svg>
      );
    } else {
      // CANDLESTICK CHART
      return (
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="modal-chart-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          <line x1={paddingLeft} y1={getY(min)} x2={width - paddingRight} y2={getY(min)} stroke="#e2e8f0" strokeDasharray="3" />
          <line x1={paddingLeft} y1={getY((min+max)/2)} x2={width - paddingRight} y2={getY((min+max)/2)} stroke="#e2e8f0" strokeDasharray="3" />
          <line x1={paddingLeft} y1={getY(max)} x2={width - paddingRight} y2={getY(max)} stroke="#e2e8f0" strokeDasharray="3" />

          {history.map((val, idx) => {
            if (idx === 0) return null;
            
            const prev = history[idx - 1];
            const open = prev;
            const close = val;
            const high = Math.max(open, close) + (Math.abs(open - close) * 0.3);
            const low = Math.min(open, close) - (Math.abs(open - close) * 0.3);

            const x = getX(idx);
            const yOpen = getY(open);
            const yClose = getY(close);
            const yHigh = getY(high);
            const yLow = getY(low);

            const isCandleUp = close >= open;
            
            let color = '#7c3aed';
            if (isUS) {
              color = isCandleUp ? '#10b981' : '#ef4444';
            } else {
              color = isCandleUp ? '#ef4444' : '#3b82f6';
            }

            const candleW = Math.max(4, Math.floor(chartW / history.length) - 3);

            return (
              <g key={`candle-${idx}`}>
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.5" />
                <rect
                  x={x - candleW / 2}
                  y={Math.min(yOpen, yClose)}
                  width={candleW}
                  height={Math.max(1.5, Math.abs(yOpen - yClose))}
                  fill={color}
                  stroke={color}
                  strokeWidth="0.5"
                  rx="1"
                />
              </g>
            );
          })}

          {/* Y Axis price labels */}
          <text x={paddingLeft - 8} y={getY(min) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontWeight="600">
            {isUS ? `$${min.toFixed(1)}` : `${Math.round(min).toLocaleString()}`}
          </text>
          <text x={paddingLeft - 8} y={getY((min+max)/2) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontWeight="600">
            {isUS ? `$${((min+max)/2).toFixed(1)}` : `${Math.round((min+max)/2).toLocaleString()}`}
          </text>
          <text x={paddingLeft - 8} y={getY(max) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontWeight="600">
            {isUS ? `$${max.toFixed(1)}` : `${Math.round(max).toLocaleString()}`}
          </text>

          {/* Vertical cursor on hover */}
          {hoveredPoint && (
            <line 
              x1={getX(hoveredPoint.index)} 
              y1={paddingTop} 
              x2={getX(hoveredPoint.index)} 
              y2={height - paddingBottom} 
              stroke="var(--text-muted)" 
              strokeDasharray="2" 
            />
          )}
        </svg>
      );
    }
  };

  return (
    <div className="modal-backdrop flex-center" onClick={onClose}>
      <div className="modal-content card shadow-lg" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Close Button */}
        <button className="btn-close-modal" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Body Grid */}
        <div className="modal-grid">
          
          {/* Left Panel: Ticker Info & Chart (span 8) */}
          <div className="modal-left span-8 flex-direction-column">
            
            {/* Header: Stock Info */}
            <div className="modal-stock-header flex-between mb-4">
              <div>
                <div className="flex-center" style={{ gap: '8px', justifyContent: 'flex-start' }}>
                  <h2 className="modal-stock-name font-bold">{stockOrIndex.name}</h2>
                  <span className="badge-ticker">{stockOrIndex.symbol}</span>
                  <span className="text-xs text-muted font-semibold">{stockOrIndex.sector}</span>
                </div>
                <p className="text-xs text-muted mt-1">{stockOrIndex.description}</p>
              </div>

              <div className="modal-price-box text-right">
                <h3 className="modal-price font-bold">
                  {isUS ? `$${stockOrIndex.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${stockOrIndex.price.toLocaleString()}원`}
                </h3>
                <span className={`badge ${badgeClass} text-xs mt-1`}>
                  {isUp ? '+' : ''}{isUS ? stockOrIndex.change.toFixed(2) : stockOrIndex.change.toLocaleString()} ({isUp ? '+' : ''}{stockOrIndex.changePercent}%)
                </span>
              </div>
            </div>

            {/* Quick Action bar */}
            <div className="modal-actions-bar mb-4 flex-between">
              <div className="chart-toggles flex-center">
                {!isRestricted && (
                  <button 
                    className={`toggle-btn-sm ${chartType === 'REAL' ? 'active' : ''}`}
                    onClick={() => setChartType('REAL')}
                    style={{ marginRight: '6px' }}
                  >
                    실제 실시간 차트
                  </button>
                )}
                <button 
                  className={`toggle-btn-sm ${chartType === 'LINE' ? 'active' : ''}`}
                  onClick={() => setChartType('LINE')}
                  style={{ marginRight: '6px' }}
                >
                  시뮬레이션 (선)
                </button>
                <button 
                  className={`toggle-btn-sm ${chartType === 'CANDLE' ? 'active' : ''}`}
                  onClick={() => setChartType('CANDLE')}
                >
                  시뮬레이션 (캔들)
                </button>
              </div>

              {!stockOrIndex.isIndex && (
                <button 
                  onClick={handleWatchlistToggle}
                  className={`btn-watchlist-toggle flex-center text-xs font-semibold ${isWatchlisted ? 'added' : ''}`}
                >
                  {isWatchlisted ? <Check size={14} className="mr-1" /> : <Star size={14} className="mr-1" />}
                  {isWatchlisted ? '관심 해제' : '관심 등록'}
                </button>
              )}
            </div>

            {/* Chart Area */}
            <div className="modal-chart-viewport card-sm mb-4" style={{ height: '270px', padding: '10px' }}>
              {chartType === 'REAL' ? (
                <TradingViewChart symbol={symbol} market={stockOrIndex.market} />
              ) : (
                renderSimulatedChart()
              )}
              
              {/* Tooltip data bar */}
              <div className="chart-tooltip-bar flex-between text-xs text-muted mt-2">
                <span>
                  {chartType === 'REAL' 
                    ? 'TradingView 실시간 인프라 연동 (실제 호가 및 거래대금 반영)' 
                    : isRestricted
                      ? '※ 국내외 거래소 데이터 라이선스 정책상 실제 차트 조회가 불가능하여 시뮬레이션 차트가 노출됩니다.'
                      : '실시간 분 단위 모의 시세 추이'}
                </span>
                {hoveredPoint && chartType !== 'REAL' && (
                  <span className="font-bold text-primary-text">
                    선택가: {isUS ? `$${hoveredPoint.price.toLocaleString()}` : `${hoveredPoint.price.toLocaleString()}원`}
                  </span>
                )}
              </div>
            </div>

            {/* Key Valuation Stats Grid */}
            {!stockOrIndex.isIndex && (
              <div className="stock-fundamentals">
                <div className="fund-item">
                  <span className="text-xxs text-muted font-bold block">시가총액</span>
                  <span className="text-sm font-semibold">{isUS ? `$${stockOrIndex.cap}B` : `${stockOrIndex.cap}조원`}</span>
                </div>
                <div className="fund-item">
                  <span className="text-xxs text-muted font-bold block">PER (배)</span>
                  <span className="text-sm font-semibold">{stockOrIndex.per}배</span>
                </div>
                <div className="fund-item">
                  <span className="text-xxs text-muted font-bold block">PEG (배)</span>
                  <span className="text-sm font-semibold">{stockOrIndex.peg}배</span>
                </div>
                <div className="fund-item">
                  <span className="text-xxs text-muted font-bold block">PBR (배)</span>
                  <span className="text-sm font-semibold">{stockOrIndex.pbr}배</span>
                </div>
              </div>
            )}

          </div>

          {/* Right Panel: Trade & Specific News (span 4) */}
          <div className="modal-right span-4 flex-direction-column" style={{ gap: '16px' }}>
            
            {/* Quick Buy Order Panel - Only for Tradeable Stocks */}
            {!stockOrIndex.isIndex ? (
              <div className="card-sm order-panel flex-direction-column">
                <h3 className="text-sm font-bold mb-3 flex-center" style={{ justifyContent: 'flex-start' }}>
                  <ShoppingCart size={14} className="mr-1 text-primary" />
                  <span>간편 모의 주문</span>
                </h3>
                
                <form onSubmit={handleBuy} className="flex-direction-column">
                  <div className="flex-between mb-2">
                    <span className="text-xs text-muted">주문 유형</span>
                    <span className="badge stock-up-us text-xs font-bold">지정가 매수 (BUY)</span>
                  </div>
                  
                  <div className="flex-between items-center mb-3">
                    <label className="text-xs text-muted">주문 수량</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={shares} 
                      onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 0))}
                      className="order-shares-input"
                    />
                  </div>

                  <div className="trade-total-box flex-between mb-3 p-2 bg-app rounded">
                    <span className="text-xs text-muted">총 주문액</span>
                    <span className="text-sm font-bold text-primary">
                      {isUS ? `$${(stockOrIndex.price * shares).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `${(stockOrIndex.price * shares).toLocaleString()}원`}
                    </span>
                  </div>

                  <button type="submit" className="btn-primary py-2 text-xs font-bold w-full">
                    즉시 매수 체결
                  </button>

                  {tradeStatus && (
                    <div className={`trade-status mt-2 text-xs text-center font-bold p-1 rounded ${tradeStatus.includes('성공') || tradeStatus.includes('완료') ? 'stock-up-us' : 'stock-down-us'}`}>
                      {tradeStatus}
                    </div>
                  )}
                </form>
              </div>
            ) : (
              <div className="card-sm flex-direction-column text-xs text-muted bg-app p-4 rounded border">
                <strong>지수 정보 안내:</strong>
                <p className="mt-1">상기 지수는 모의 주식 거래가 불가능하며, 시장 동향 및 시황 파악을 돕기 위해 실시간 종합 시세 차트 정보만 제공됩니다.</p>
              </div>
            )}

            {/* Related News list */}
            <div className="card-sm related-news flex-1 flex-direction-column">
              <h3 className="text-sm font-bold mb-3 flex-center" style={{ justifyContent: 'flex-start' }}>
                <Newspaper size={14} className="mr-1 text-muted" />
                <span>관련 속보</span>
              </h3>

              {relatedNews.length === 0 ? (
                <div className="flex-center flex-1 text-muted text-xs">
                  등록된 관련 뉴스가 없습니다.
                </div>
              ) : (
                <div className="modal-news-scroller">
                  {relatedNews.map(item => (
                    <div key={item.id} className="modal-news-item pb-2 mb-2 border-b-dash">
                      <div className="flex-between text-xxs text-muted">
                        <span>{item.source}</span>
                        <span>{item.time}</span>
                      </div>
                      <h4 className="font-semibold text-xs mt-1 text-primary-text leading-snug">
                        {item.title}
                      </h4>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          z-index: 1000;
        }

        .modal-content {
          width: 920px;
          max-width: 95vw;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          padding: 24px;
          background-color: #fff;
          border-radius: var(--radius-lg);
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .btn-close-modal {
          position: absolute;
          top: 16px;
          right: 16px;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
          border-radius: 50%;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .btn-close-modal:hover {
          background-color: var(--bg-app);
          color: var(--text-primary);
        }

        /* Modal Grid Layout */
        .modal-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 20px;
        }

        .modal-stock-name {
          font-family: var(--font-display);
          font-size: 1.35rem;
          color: var(--text-primary);
        }

        .modal-price {
          font-family: var(--font-display);
          font-size: 1.75rem;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .toggle-btn-sm {
          border: 1px solid var(--border-color);
          background: none;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .toggle-btn-sm.active {
          background-color: var(--bg-app);
          color: var(--primary);
          border-color: var(--primary-border);
        }

        .btn-watchlist-toggle {
          border: 1px solid var(--border-color);
          background: none;
          padding: 6px 12px;
          border-radius: var(--radius-md);
          cursor: pointer;
          color: var(--text-secondary);
          transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
        }

        .btn-watchlist-toggle:hover {
          background-color: var(--bg-app);
          border-color: #cbd5e1;
        }

        .btn-watchlist-toggle.added {
          background-color: #fef08a; /* soft yellow */
          color: #a16207;
          border-color: #fde047;
        }

        /* Chart Port */
        .modal-chart-viewport {
          padding: 12px;
          background-color: #fafbfc;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }

        .modal-chart-svg {
          width: 100%;
          height: auto;
          display: block;
          overflow: visible;
        }

        .chart-tooltip-bar {
          margin-top: 6px;
          border-top: 1px solid rgba(15,23,42,0.05);
          padding-top: 4px;
        }

        /* Fundamentals */
        .stock-fundamentals {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .fund-item {
          background-color: var(--bg-app);
          padding: 10px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          text-align: center;
        }

        /* Right Panel quick order */
        .card-sm {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
        }

        .order-shares-input {
          width: 70px;
          padding: 4px 8px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          outline: none;
          font-weight: 600;
          text-align: right;
        }

        .bg-app { background-color: var(--bg-app); }
        .rounded { border-radius: 4px; }
        .w-full { width: 100%; }

        .border-b-dash {
          border-bottom: 1px dashed var(--border-color);
        }

        .modal-news-scroller {
          max-height: 180px;
          overflow-y: auto;
        }

        .trade-status {
          padding: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          text-align: center;
        }

        @media (max-width: 768px) {
          .modal-grid {
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
