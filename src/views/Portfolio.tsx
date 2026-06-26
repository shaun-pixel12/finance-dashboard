import React, { useState, useMemo } from 'react';
import { useMarket, Stock, PortfolioHolding } from '../context/MarketContext';
import { Briefcase, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Plus, Minus, Trash2 } from 'lucide-react';

export const Portfolio: React.FC<{ onStockSelect: (symbol: string) => void }> = ({ onStockSelect }) => {
  const { 
    stocks, 
    watchlist, 
    holdings, 
    balanceUsd, 
    balanceKrw, 
    removeFromWatchlist, 
    addToWatchlist,
    buyStock, 
    sellStock 
  } = useMarket();

  // Trade form state
  const [tradeSymbol, setTradeSymbol] = useState<string>(stocks[0]?.symbol || '');
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [sharesInput, setSharesInput] = useState<number>(10);
  const [tradeMessage, setTradeMessage] = useState<{ text: string; error: boolean } | null>(null);

  const selectedStockForTrade = useMemo(() => {
    return stocks.find(s => s.symbol === tradeSymbol);
  }, [stocks, tradeSymbol]);

  // Calculations for USD Portfolio
  const usdHoldings = useMemo(() => holdings.filter(h => h.market === 'US'), [holdings]);
  const usdHoldingsVal = usdHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const usdHoldingsCost = usdHoldings.reduce((sum, h) => sum + h.totalCost, 0);
  const usdTotalVal = balanceUsd + usdHoldingsVal;
  const usdTotalProfitLoss = usdHoldingsVal - usdHoldingsCost;
  const usdProfitLossPercent = usdHoldingsCost === 0 ? 0 : (usdTotalProfitLoss / usdHoldingsCost) * 100;

  // Calculations for KRW Portfolio
  const krwHoldings = useMemo(() => holdings.filter(h => h.market === 'KR'), [holdings]);
  const krwHoldingsVal = krwHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const krwHoldingsCost = krwHoldings.reduce((sum, h) => sum + h.totalCost, 0);
  const krwTotalVal = balanceKrw + krwHoldingsVal;
  const krwTotalProfitLoss = krwHoldingsVal - krwHoldingsCost;
  const krwProfitLossPercent = krwHoldingsCost === 0 ? 0 : (krwTotalProfitLoss / krwHoldingsCost) * 100;

  // Filter out watchlist stocks
  const watchlistedStocks = useMemo(() => {
    return stocks.filter(s => watchlist.includes(s.symbol));
  }, [stocks, watchlist]);

  // Execute Trade
  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    setTradeMessage(null);

    if (sharesInput <= 0) {
      setTradeMessage({ text: '수량은 1주 이상이어야 합니다.', error: true });
      return;
    }

    if (tradeAction === 'BUY') {
      const success = buyStock(tradeSymbol, sharesInput);
      if (success) {
        setTradeMessage({ text: `성공적으로 ${selectedStockForTrade?.name} ${sharesInput}주를 매수했습니다.`, error: false });
        // Automatically add to watchlist if bought
        addToWatchlist(tradeSymbol);
      } else {
        setTradeMessage({ text: '예수금이 부족하여 매수할 수 없습니다.', error: true });
      }
    } else {
      const success = sellStock(tradeSymbol, sharesInput);
      if (success) {
        setTradeMessage({ text: `성공적으로 ${selectedStockForTrade?.name} ${sharesInput}주를 매도했습니다.`, error: false });
      } else {
        setTradeMessage({ text: '보유 수량이 부족하여 매도할 수 없습니다.', error: true });
      }
    }
  };

  const handleQuickTrade = (symbol: string, action: 'BUY' | 'SELL') => {
    setTradeSymbol(symbol);
    setTradeAction(action);
    setTradeMessage(null);
    // Scroll trade panel into view for mobile if needed
    const panel = document.getElementById('trade-panel');
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Render SVG Donut Chart for Assets
  const renderAssetAllocation = () => {
    // Combine holding weights
    const allHoldings = holdings.map(h => {
      // For display weight, let's normalize everything into a simulated value (e.g. converting USD to KRW)
      const mockRate = 1380;
      const valInKrw = h.market === 'US' ? h.currentValue * mockRate : h.currentValue;
      return {
        symbol: h.symbol.split('.')[0],
        value: valInKrw
      };
    });

    const totalHoldingVal = allHoldings.reduce((sum, h) => sum + h.value, 0);
    if (totalHoldingVal === 0) {
      return (
        <div className="flex-center flex-direction-column py-6">
          <p className="text-xs text-muted">보유 주식이 없습니다.</p>
        </div>
      );
    }

    // Pie chart colors
    const colors = ['#2563eb', '#10b981', '#7c3aed', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

    let cumulativePercent = 0;
    const slices = allHoldings.map((h, i) => {
      const percent = h.value / totalHoldingVal;
      const slice = {
        symbol: h.symbol,
        percent,
        color: colors[i % colors.length],
        startPercent: cumulativePercent
      };
      cumulativePercent += percent;
      return slice;
    });

    // Draw SVG circle components using stroke-dasharray
    const radius = 50;
    const circ = 2 * Math.PI * radius; // ~314.15

    return (
      <div className="allocation-box">
        <svg viewBox="0 0 140 140" width="140" height="140" className="donut-chart">
          <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
          {slices.map((slice, i) => {
            const strokeDashOffset = circ - (slice.percent * circ);
            const rotation = slice.startPercent * 360 - 90; // Start from top
            return (
              <circle
                key={slice.symbol}
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth="16"
                strokeDasharray={`${slice.percent * circ} ${circ}`}
                strokeDashoffset={0}
                transform={`rotate(${rotation} 70 70)`}
                className="donut-segment"
              />
            );
          })}
          <circle cx="70" cy="70" r="38" fill="#fff" />
        </svg>
        
        <div className="allocation-legend mt-4">
          {slices.map(slice => (
            <div key={slice.symbol} className="legend-item flex-between text-xs">
              <div className="flex-center">
                <span className="legend-dot" style={{ backgroundColor: slice.color }} />
                <span className="font-semibold">{slice.symbol}</span>
              </div>
              <span className="text-muted font-medium">{(slice.percent * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      {/* View Header */}
      <div className="mb-6">
        <h1 className="view-title">가상 포트폴리오 &amp; 관심종목</h1>
        <p className="text-sm text-muted">가상의 투자 자금으로 포트폴리오 자산 배분을 시뮬레이션하고 보유 주식 성과를 실시간 추적합니다.</p>
      </div>

      <div className="grid-layout">
        
        {/* Left Column: Tables (span 8) */}
        <div className="span-8 flex-direction-column" style={{ gap: '24px' }}>
          
          {/* Account Balance Card Grid */}
          <div className="balances-row">
            <div className="card balance-card">
              <div className="flex-between">
                <span className="text-xs text-muted font-semibold">미국 주식 포트폴리오</span>
                <DollarSign size={16} className="text-muted" />
              </div>
              <div className="mt-2">
                <h4 className="balance-val font-bold">${usdTotalVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h4>
                <div className="flex-between text-xs mt-2">
                  <span className="text-muted">예수금: ${balanceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span className={`font-semibold ${usdTotalProfitLoss >= 0 ? 'text-us-up' : 'text-us-down'}`}>
                    평가손익: {usdTotalProfitLoss >= 0 ? '+' : ''}{usdTotalProfitLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({usdProfitLossPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="card balance-card">
              <div className="flex-between">
                <span className="text-xs text-muted font-semibold">한국 주식 포트폴리오</span>
                <Wallet size={16} className="text-muted" />
              </div>
              <div className="mt-2">
                <h4 className="balance-val font-bold">{krwTotalVal.toLocaleString()}원</h4>
                <div className="flex-between text-xs mt-2">
                  <span className="text-muted">예수금: {balanceKrw.toLocaleString()}원</span>
                  <span className={`font-semibold ${krwTotalProfitLoss >= 0 ? 'text-kr-up' : 'text-kr-down'}`}>
                    평가손익: {krwTotalProfitLoss >= 0 ? '+' : ''}{krwTotalProfitLoss.toLocaleString()}원 ({krwProfitLossPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="card">
            <h2 className="card-title-text font-bold mb-4">보유 종목 현황</h2>
            
            {holdings.length === 0 ? (
              <div className="empty-state flex-center flex-direction-column py-8">
                <Briefcase size={36} className="text-muted mb-2" />
                <p className="text-muted text-sm">보유 중인 주식이 없습니다.</p>
                <p className="text-xs text-muted mt-1">오른쪽의 주문 패널에서 매수 거래를 시작해 보세요.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>종목명 (티커)</th>
                      <th style={{ textAlign: 'right' }}>수량</th>
                      <th style={{ textAlign: 'right' }}>평균 단가</th>
                      <th style={{ textAlign: 'right' }}>현재가</th>
                      <th style={{ textAlign: 'right' }}>평가 손익</th>
                      <th style={{ textAlign: 'center' }}>거래</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map(h => {
                      const isUS = h.market === 'US';
                      const isUp = h.profitLoss >= 0;
                      const textClass = isUS 
                        ? (isUp ? 'text-us-up' : 'text-us-down')
                        : (isUp ? 'text-kr-up' : 'text-kr-down');
                      const badgeClass = isUS 
                        ? (isUp ? 'stock-up-us' : 'stock-down-us')
                        : (isUp ? 'stock-up-kr' : 'stock-down-kr');

                      return (
                        <tr key={h.symbol} className="hover-row">
                          <td onClick={() => onStockSelect(h.symbol)}>
                            <div className="flex-direction-column">
                              <span className="font-semibold text-primary-text">{h.name}</span>
                              <span className="text-xs text-muted">{h.symbol}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{h.shares}주</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)' }}>
                            {isUS ? `$${h.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${Math.round(h.avgPrice).toLocaleString()}원`}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                            {isUS ? `$${(h.currentValue / h.shares).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${Math.round(h.currentValue / h.shares).toLocaleString()}원`}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex-direction-column" style={{ alignItems: 'flex-end' }}>
                              <span className={`font-bold ${textClass}`}>
                                {isUp ? '+' : ''}{isUS ? `$${h.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${Math.round(h.profitLoss).toLocaleString()}원`}
                              </span>
                              <span className={`badge ${badgeClass} text-xs mt-1`}>
                                {isUp ? '+' : ''}{h.profitLossPercent.toFixed(2)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="flex-center" style={{ gap: '4px' }}>
                              <button onClick={() => handleQuickTrade(h.symbol, 'BUY')} className="btn-trade-action buy" title="추가 매수">
                                <Plus size={12} />
                              </button>
                              <button onClick={() => handleQuickTrade(h.symbol, 'SELL')} className="btn-trade-action sell" title="일부 매도">
                                <Minus size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Watchlist Section */}
          <div className="card">
            <h2 className="card-title-text font-bold mb-4">관심 종목 모니터링</h2>
            {watchlistedStocks.length === 0 ? (
              <div className="empty-state flex-center py-6 text-muted text-sm">
                관심 등록한 종목이 없습니다.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>종목명 (티커)</th>
                      <th style={{ textAlign: 'right' }}>현재가</th>
                      <th style={{ textAlign: 'right' }}>대비 (등락률)</th>
                      <th style={{ textAlign: 'center' }}>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlistedStocks.map(stock => {
                      const isUS = stock.market === 'US';
                      const isUp = stock.change >= 0;
                      const textClass = isUS 
                        ? (isUp ? 'text-us-up' : 'text-us-down')
                        : (isUp ? 'text-kr-up' : 'text-kr-down');
                      const badgeClass = isUS 
                        ? (isUp ? 'stock-up-us' : 'stock-down-us')
                        : (isUp ? 'stock-up-kr' : 'stock-down-kr');

                      return (
                        <tr key={stock.symbol} className="hover-row">
                          <td onClick={() => onStockSelect(stock.symbol)}>
                            <div className="flex-direction-column">
                              <span className="font-semibold text-primary-text">{stock.name}</span>
                              <span className="text-xs text-muted">{stock.symbol}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                            {isUS ? `$${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${stock.price.toLocaleString()}원`}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex-direction-column" style={{ alignItems: 'flex-end' }}>
                              <span className={`font-semibold ${textClass}`}>
                                {isUp ? '+' : ''}{isUS ? stock.change.toFixed(2) : stock.change.toLocaleString()}
                              </span>
                              <span className={`badge ${badgeClass} text-xs mt-1`}>
                                {isUp ? '+' : ''}{stock.changePercent}%
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="flex-center" style={{ gap: '6px' }}>
                              <button onClick={() => handleQuickTrade(stock.symbol, 'BUY')} className="btn-outline text-xs py-1 px-2 font-bold">
                                거래
                              </button>
                              <button onClick={() => removeFromWatchlist(stock.symbol)} className="btn-icon-delete" title="관심 제외">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Order Panel & Donut Chart (span 4) */}
        <div className="span-4 flex-direction-column" style={{ gap: '24px' }}>
          
          {/* Donut Allocation Card */}
          <div className="card">
            <h3 className="card-title-text font-bold mb-4">보유 자산 비중</h3>
            {renderAssetAllocation()}
          </div>

          {/* Trade Order Panel */}
          <div className="card" id="trade-panel">
            <h3 className="card-title-text font-bold mb-4">모의 주식 주문 패널</h3>
            
            <form onSubmit={handleExecuteTrade} className="trade-form flex-direction-column">
              {/* Select Stock */}
              <div className="form-group mb-3">
                <label className="text-xs text-muted font-bold block mb-1">거래 종목</label>
                <select 
                  value={tradeSymbol} 
                  onChange={(e) => {
                    setTradeSymbol(e.target.value);
                    setTradeMessage(null);
                  }}
                  className="trade-select"
                >
                  {stocks.map(stock => (
                    <option key={stock.symbol} value={stock.symbol}>
                      {stock.name} ({stock.symbol}) - {stock.market === 'US' ? `$${stock.price}` : `${stock.price.toLocaleString()}원`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trade Action (Buy/Sell Toggle) */}
              <div className="form-group mb-3">
                <label className="text-xs text-muted font-bold block mb-1">주문 유형</label>
                <div className="action-toggle-bar">
                  <button 
                    type="button" 
                    className={`toggle-btn buy ${tradeAction === 'BUY' ? 'active' : ''}`}
                    onClick={() => {
                      setTradeAction('BUY');
                      setTradeMessage(null);
                    }}
                  >
                    매수 (BUY)
                  </button>
                  <button 
                    type="button" 
                    className={`toggle-btn sell ${tradeAction === 'SELL' ? 'active' : ''}`}
                    onClick={() => {
                      setTradeAction('SELL');
                      setTradeMessage(null);
                    }}
                  >
                    매도 (SELL)
                  </button>
                </div>
              </div>

              {/* Number of Shares Input */}
              <div className="form-group mb-4">
                <label className="text-xs text-muted font-bold block mb-1">주문 수량</label>
                <input 
                  type="number" 
                  min="1" 
                  value={sharesInput} 
                  onChange={(e) => {
                    setSharesInput(Math.max(1, parseInt(e.target.value) || 0));
                    setTradeMessage(null);
                  }}
                  className="shares-input"
                />
              </div>

              {/* Calculations Box */}
              {selectedStockForTrade && (
                <div className="trade-calc-box mb-4 text-xs">
                  <div className="flex-between">
                    <span className="text-muted">현재가</span>
                    <span className="font-semibold">
                      {selectedStockForTrade.market === 'US' ? `$${selectedStockForTrade.price}` : `${selectedStockForTrade.price.toLocaleString()}원`}
                    </span>
                  </div>
                  <div className="flex-between mt-1">
                    <span className="text-muted">주문 금액</span>
                    <span className="font-bold text-primary">
                      {selectedStockForTrade.market === 'US' 
                        ? `$${(selectedStockForTrade.price * sharesInput).toLocaleString(undefined, { maximumFractionDigits: 2 })}` 
                        : `${(selectedStockForTrade.price * sharesInput).toLocaleString()}원`}
                    </span>
                  </div>
                </div>
              )}

              {/* Execute Button */}
              <button 
                type="submit" 
                className={`btn-trade-execute ${tradeAction === 'BUY' ? 'buy' : 'sell'}`}
              >
                {tradeAction === 'BUY' ? '매수 주문 전송' : '매도 주문 전송'}
              </button>

              {/* Feedback messages */}
              {tradeMessage && (
                <div className={`trade-feedback mt-3 text-xs p-2 rounded ${tradeMessage.error ? 'error' : 'success'}`}>
                  {tradeMessage.text}
                </div>
              )}
            </form>
          </div>

        </div>

      </div>

      <style>{`
        .balances-row {
          display: flex;
          gap: 16px;
        }

        .balance-card {
          flex: 1;
          padding: 20px;
        }

        .balance-val {
          font-family: var(--font-display);
          font-size: 1.6rem;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .btn-trade-action {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color var(--transition-fast);
        }

        .btn-trade-action.buy {
          background-color: var(--primary-light);
          color: var(--primary);
        }

        .btn-trade-action.buy:hover {
          background-color: #cbd5e1;
        }

        .btn-trade-action.sell {
          background-color: #fee2e2;
          color: #ef4444;
        }

        .btn-trade-action.sell:hover {
          background-color: #fca5a5;
        }

        .btn-icon-delete {
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: color var(--transition-fast), background-color var(--transition-fast);
        }

        .btn-icon-delete:hover {
          color: #ef4444;
          background-color: #fee2e2;
        }

        /* Order Form Styling */
        .trade-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          outline: none;
          font-size: 0.85rem;
          cursor: pointer;
          background-color: #fff;
        }

        .action-toggle-bar {
          display: flex;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 3px;
        }

        .toggle-btn {
          flex: 1;
          border: none;
          background: none;
          padding: 8px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .toggle-btn.buy.active {
          background-color: #e6fbf4;
          color: #10b981;
        }

        .toggle-btn.sell.active {
          background-color: #fee2e2;
          color: #ef4444;
        }

        .shares-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          outline: none;
          font-size: 0.9rem;
        }

        .trade-calc-box {
          background-color: var(--bg-app);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .btn-trade-execute {
          border: none;
          padding: 12px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 0.9rem;
          color: #fff;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .btn-trade-execute.buy {
          background-color: #10b981;
        }

        .btn-trade-execute.buy:hover {
          background-color: #059669;
        }

        .btn-trade-execute.sell {
          background-color: #ef4444;
        }

        .btn-trade-execute.sell:hover {
          background-color: #dc2626;
        }

        .trade-feedback {
          text-align: center;
          font-weight: 600;
        }

        .trade-feedback.success {
          background-color: #ecfdf5;
          color: #10b981;
          border: 1px solid #a7f3d0;
        }

        .trade-feedback.error {
          background-color: #fdf2f2;
          color: #ef4444;
          border: 1px solid #fca5a5;
        }

        /* Donut allocation styling */
        .allocation-box {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .donut-chart {
          overflow: visible;
        }

        .donut-segment {
          transition: stroke-width 0.2s ease;
        }

        .donut-segment:hover {
          stroke-width: 20;
        }

        .allocation-legend {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
          display: inline-block;
        }

        @media (max-width: 1024px) {
          .balances-row {
            flex-direction: column;
          }
          .span-8, .span-4 {
            grid-column: span 12;
          }
        }
      `}</style>
    </div>
  );
};
