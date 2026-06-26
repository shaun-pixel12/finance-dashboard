import React, { useState, useRef, useEffect } from 'react';
import { Search, DollarSign, Activity, TrendingUp, X, Menu } from 'lucide-react';
import { useMarket } from '../context/MarketContext';

interface HeaderProps {
  onStockSelect: (symbol: string) => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onStockSelect, onToggleSidebar }) => {
  const { 
    stocks, 
    usdKrw, 
    usdKrwChangePercent, 
    us10yYield, 
    us10yYieldChangePercent, 
    vixPrice, 
    vixChangePercent 
  } = useMarket();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter stocks based on query
  const filteredStocks = searchQuery.trim() === '' 
    ? [] 
    : stocks.filter(stock => 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.sector.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleSelect = (symbol: string) => {
    onStockSelect(symbol);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="btn-menu-mobile" onClick={onToggleSidebar} aria-label="메뉴 열기">
          <Menu size={20} />
        </button>

        <div className="search-wrapper" ref={searchRef}>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="종목명, 티커(AAPL, 삼성전자 등) 또는 섹터 검색..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
            />
            {searchQuery && (
              <button className="btn-clear-search" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>

          {showResults && filteredStocks.length > 0 && (
            <div className="search-results shadow-lg">
              <div className="search-results-header">검색 결과 ({filteredStocks.length})</div>
              <ul className="search-results-list">
                {filteredStocks.map(stock => {
                  const isUS = stock.market === 'US';
                  const sign = stock.change >= 0 ? '+' : '';
                  const changeClass = isUS 
                    ? (stock.changePercent >= 0 ? 'color-us-up' : 'color-us-down')
                    : (stock.changePercent >= 0 ? 'color-kr-up' : 'color-kr-down');

                  return (
                    <li key={stock.symbol} onClick={() => handleSelect(stock.symbol)} className="search-result-item">
                      <div className="result-info">
                        <span className="result-symbol">{stock.symbol}</span>
                        <span className="result-name">{stock.name}</span>
                        <span className="result-sector">{stock.sector}</span>
                      </div>
                      <div className="result-price-box">
                        <span className="result-price">
                          {isUS ? `$${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${stock.price.toLocaleString()}원`}
                        </span>
                        <span className={`result-change text-xs ${changeClass}`}>
                          {sign}{stock.changePercent}%
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          
          {showResults && searchQuery.trim() !== '' && filteredStocks.length === 0 && (
            <div className="search-results flex-center p-4 text-muted text-sm shadow-lg">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Macro Indicators Bar */}
        <div className="macro-bar">
          <div className="macro-item card-sm">
            <div className="macro-label">
              <DollarSign size={14} className="text-muted mr-1" />
              <span>원/달러 환율</span>
            </div>
            <div className="macro-value-box">
              <span className="macro-value">{usdKrw.toLocaleString()}원</span>
              <span className={`badge ${usdKrwChangePercent >= 0 ? 'stock-up-kr' : 'stock-down-kr'} text-xs ml-1`}>
                {usdKrwChangePercent >= 0 ? '+' : ''}{usdKrwChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="macro-item card-sm">
            <div className="macro-label">
              <TrendingUp size={14} className="text-muted mr-1" />
              <span>미 10년 국채금리</span>
            </div>
            <div className="macro-value-box">
              <span className="macro-value">{us10yYield.toFixed(3)}%</span>
              <span className={`badge ${us10yYieldChangePercent >= 0 ? 'stock-up-us' : 'stock-down-us'} text-xs ml-1`}>
                {us10yYieldChangePercent >= 0 ? '+' : ''}{us10yYieldChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="macro-item card-sm">
            <div className="macro-label">
              <Activity size={14} className="text-muted mr-1" />
              <span>VIX 지수</span>
            </div>
            <div className="macro-value-box">
              <span className="macro-value">{vixPrice.toFixed(2)}</span>
              <span className={`badge ${vixChangePercent >= 0 ? 'stock-up-us' : 'stock-down-us'} text-xs ml-1`}>
                {vixChangePercent >= 0 ? '+' : ''}{vixChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .app-header {
          height: var(--header-height);
          background-color: var(--bg-card);
          border-bottom: 1px solid var(--border-color);
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .header-left {
          flex: 1;
          max-width: 480px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-menu-mobile {
          display: none;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-primary);
          padding: 8px;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }

        .btn-menu-mobile:hover {
          background-color: var(--bg-app);
        }

        .search-wrapper {
          position: relative;
          width: 100%;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 8px 14px;
          gap: 10px;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .search-bar:focus-within {
          border-color: var(--primary-border);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
          background-color: #fff;
        }

        .search-icon {
          color: var(--text-muted);
        }

        .search-bar input {
          border: none;
          background: none;
          width: 100%;
          outline: none;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .btn-clear-search {
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }

        .btn-clear-search:hover {
          color: var(--text-primary);
        }

        .search-results {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 100%;
          background-color: #fff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          max-height: 400px;
          overflow-y: auto;
          z-index: 110;
        }

        .search-results-header {
          padding: 10px 16px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          background-color: var(--bg-app);
          border-bottom: 1px solid var(--border-color);
        }

        .search-results-list {
          list-style: none;
        }

        .search-result-item {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          border-bottom: 1px solid #f1f5f9;
          transition: background-color var(--transition-fast);
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .search-result-item:hover {
          background-color: var(--bg-app);
        }

        .result-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .result-symbol {
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--primary);
        }

        .result-name {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .result-sector {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .result-price-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .result-price {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .color-us-up { color: var(--color-us-up); }
        .color-us-down { color: var(--color-us-down); }
        .color-kr-up { color: var(--color-kr-up); }
        .color-kr-down { color: var(--color-kr-down); }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .macro-bar {
          display: flex;
          gap: 12px;
        }

        .macro-item {
          display: flex;
          flex-direction: column;
          padding: 8px 14px;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          min-width: 140px;
        }

        .macro-label {
          display: flex;
          align-items: center;
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 600;
          margin-bottom: 2px;
        }

        .macro-value-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .macro-value {
          font-family: var(--font-display);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .ml-1 { margin-left: 4px; }
        .p-4 { padding: 16px; }

        @media (max-width: 1024px) {
          .btn-menu-mobile {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .header-left {
            max-width: 100%;
          }
          .macro-bar {
            display: none;
          }
          .app-header {
            padding: 0 16px;
          }
        }
      `}</style>
    </header>
  );
};
