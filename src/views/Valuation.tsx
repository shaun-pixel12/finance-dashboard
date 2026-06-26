import React, { useState, useMemo } from 'react';
import { useMarket, Stock } from '../context/MarketContext';
import { BarChart, HelpCircle, ArrowDown, ArrowUp, AlertCircle } from 'lucide-react';

export const Valuation: React.FC<{ onStockSelect: (symbol: string) => void }> = ({ onStockSelect }) => {
  const { stocks } = useMarket();
  
  // Extract all unique sectors
  const sectors = useMemo(() => {
    const allSectors = stocks.map(s => s.sector);
    return Array.from(new Set(allSectors));
  }, [stocks]);

  const [selectedSector, setSelectedSector] = useState<string>(sectors[0] || '메모리 반도체');
  const [sortKey, setSortKey] = useState<keyof Stock>('per');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Filter stocks by sector
  const sectorStocks = useMemo(() => {
    return stocks.filter(s => s.sector === selectedSector);
  }, [stocks, selectedSector]);

  // Compute sector averages
  const averages = useMemo(() => {
    if (sectorStocks.length === 0) return { per: 0, peg: 0, pbr: 0, evEbitda: 0 };
    const sum = sectorStocks.reduce(
      (acc, s) => {
        acc.per += s.per;
        acc.peg += s.peg;
        acc.pbr += s.pbr;
        acc.evEbitda += s.evEbitda;
        return acc;
      },
      { per: 0, peg: 0, pbr: 0, evEbitda: 0 }
    );
    const count = sectorStocks.length;
    return {
      per: Number((sum.per / count).toFixed(1)),
      peg: Number((sum.peg / count).toFixed(2)),
      pbr: Number((sum.pbr / count).toFixed(2)),
      evEbitda: Number((sum.evEbitda / count).toFixed(1))
    };
  }, [sectorStocks]);

  // Handle sorting
  const sortedStocks = useMemo(() => {
    return [...sectorStocks].sort((a, b) => {
      const valA = a[sortKey] as number;
      const valB = b[sortKey] as number;
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [sectorStocks, sortKey, sortAsc]);

  const changeSort = (key: keyof Stock) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Determine Valuation Tag
  const getValuationStatus = (stock: Stock, avgPer: number) => {
    // Under 85% of average -> Undervalued
    if (stock.per < avgPer * 0.85) {
      return { label: '저평가 (Undervalued)', class: 'undervalued-badge' };
    }
    // Over 115% of average -> Overvalued
    if (stock.per > avgPer * 1.15) {
      return { label: '고평가 (Overvalued)', class: 'overvalued-badge' };
    }
    return { label: '적정가 (Fair)', class: 'fair-badge' };
  };

  return (
    <div className="page-container">
      {/* View Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 className="view-title">업종별 상대 가치 평가</h1>
          <p className="text-sm text-muted">선택한 업종 내 기업들의 주요 밸류에이션 멀티플(PER, PEG, PBR, EV/EBITDA)을 평균값과 대조하여 분석합니다.</p>
        </div>
        
        {/* Sector Selector Dropdown */}
        <div className="select-wrapper">
          <select 
            value={selectedSector} 
            onChange={(e) => setSelectedSector(e.target.value)}
            className="sector-select"
          >
            {sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid-layout">
        
        {/* Sector Averages Summary Cards */}
        <div className="card span-12">
          <h3 className="card-title-text font-bold mb-4">
            &apos;{selectedSector}&apos; 업종 평균 멀티플 요약
          </h3>
          <div className="averages-grid">
            <div className="avg-card">
              <span className="avg-label text-xs text-muted">평균 PER (배)</span>
              <span className="avg-value">{averages.per}</span>
              <span className="avg-desc text-xs mt-1">주가수익비율</span>
            </div>
            <div className="avg-card">
              <span className="avg-label text-xs text-muted">평균 PEG (배)</span>
              <span className="avg-value">{averages.peg}</span>
              <span className="avg-desc text-xs mt-1">이익성장비율</span>
            </div>
            <div className="avg-card">
              <span className="avg-label text-xs text-muted">평균 PBR (배)</span>
              <span className="avg-value">{averages.pbr}</span>
              <span className="avg-desc text-xs mt-1">주가순자산비율</span>
            </div>
            <div className="avg-card">
              <span className="avg-label text-xs text-muted">평균 EV/EBITDA (배)</span>
              <span className="avg-value">{averages.evEbitda}</span>
              <span className="avg-desc text-xs mt-1">기업가치대비 상각전영업이익</span>
            </div>
          </div>
        </div>

        {/* Valuation Comparison Bar Chart */}
        <div className="card span-12">
          <h2 className="card-title-text font-bold mb-4 flex-between">
            <span>PER(주가수익비율) 상대 비교 차트</span>
            <span className="text-xs text-muted font-medium">점선: 업종 평균 ({averages.per}배)</span>
          </h2>
          
          <div className="bar-chart-container mt-6">
            {sectorStocks.map(stock => {
              const maxVal = Math.max(...sectorStocks.map(s => s.per), averages.per) * 1.1; // scale max
              const widthPct = (stock.per / maxVal) * 100;
              const avgPct = (averages.per / maxVal) * 100;
              
              const isUS = stock.market === 'US';
              const status = getValuationStatus(stock, averages.per);
              let barColor = 'var(--primary)';
              if (status.class === 'undervalued-badge') {
                barColor = isUS ? '#10b981' : '#3b82f6'; // Green (US) or Blue (KR) indicating positive undervalued signal
              } else if (status.class === 'overvalued-badge') {
                barColor = '#ef4444'; // Red for high PER
              }

              return (
                <div key={stock.symbol} className="chart-bar-row flex-between" onClick={() => onStockSelect(stock.symbol)}>
                  <div className="chart-label-box flex-direction-column">
                    <span className="chart-stock-name font-semibold">{stock.name}</span>
                    <span className="chart-stock-symbol text-xs text-muted">{stock.symbol}</span>
                  </div>
                  
                  <div className="chart-bar-viewport">
                    {/* The Stock's Bar */}
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${widthPct}%`,
                        backgroundColor: barColor
                      }}
                    >
                      <span className="bar-value-label font-bold">{stock.per}배</span>
                    </div>

                    {/* Sector Average Vertical Dotted Line */}
                    <div 
                      className="chart-average-line" 
                      style={{ left: `${avgPct}%` }}
                    />
                  </div>
                  
                  <div className="chart-tag-box">
                    <span className={`badge ${status.class} text-xs`}>{status.label.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Comparison Table */}
        <div className="card span-12">
          <h2 className="card-title-text font-bold mb-4">상세 멀티플 매트릭스</h2>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>종목명 (티커)</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => changeSort('per')}>
                    PER (배) {sortKey === 'per' && (sortAsc ? <ArrowDown size={14} className="sort-icon" /> : <ArrowUp size={14} className="sort-icon" />)}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => changeSort('peg')}>
                    PEG (배) {sortKey === 'peg' && (sortAsc ? <ArrowDown size={14} className="sort-icon" /> : <ArrowUp size={14} className="sort-icon" />)}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => changeSort('pbr')}>
                    PBR (배) {sortKey === 'pbr' && (sortAsc ? <ArrowDown size={14} className="sort-icon" /> : <ArrowUp size={14} className="sort-icon" />)}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => changeSort('evEbitda')}>
                    EV/EBITDA (배) {sortKey === 'evEbitda' && (sortAsc ? <ArrowDown size={14} className="sort-icon" /> : <ArrowUp size={14} className="sort-icon" />)}
                  </th>
                  <th>평가 상태</th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map(stock => {
                  const status = getValuationStatus(stock, averages.per);
                  const isUS = stock.market === 'US';
                  
                  return (
                    <tr key={stock.symbol} className="hover-row" onClick={() => onStockSelect(stock.symbol)}>
                      <td>
                        <div className="flex-direction-column">
                          <span className="font-semibold text-primary-text">{stock.name}</span>
                          <span className="text-xs text-muted">{stock.symbol}</span>
                        </div>
                      </td>
                      <td className="font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                        {stock.per} <span className="text-xs text-muted">({(stock.per / (averages.per || 1) * 100).toFixed(0)}%)</span>
                      </td>
                      <td className="font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                        {stock.peg}
                      </td>
                      <td className="font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                        {stock.pbr}
                      </td>
                      <td className="font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                        {stock.evEbitda}
                      </td>
                      <td>
                        <span className={`badge ${status.class}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Valuation Notes */}
        <div className="card span-12 flex-center alert-box">
          <AlertCircle size={18} className="text-secondary" />
          <p className="text-xs text-secondary ml-3">
            <strong>참고:</strong> PEG(주가수익성장비율)는 PER을 기업의 이익 성장률로 나눈 값으로, 보통 <strong>1.0배 이하</strong>일 때 성장을 감안한 훌륭한 매수 기회로 평가됩니다. 반도체 및 빅테크 등 고성장 기업 밸류에이션 시 PER과 함께 PEG를 확인하면 과도한 고밸류 착시를 방지할 수 있습니다.
          </p>
        </div>

      </div>

      <style>{`
        .sector-select {
          padding: 8px 16px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: #fff;
          font-weight: 600;
          color: var(--text-primary);
          outline: none;
          cursor: pointer;
          font-size: 0.9rem;
          transition: border-color var(--transition-fast);
        }

        .sector-select:focus {
          border-color: var(--primary);
        }

        /* Averages Grid Layout */
        .averages-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .avg-card {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
        }

        .avg-value {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary);
          margin-top: 4px;
          line-height: 1.1;
        }

        /* Bar Chart Styling */
        .bar-chart-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .chart-bar-row {
          align-items: center;
          gap: 16px;
          cursor: pointer;
          padding: 6px;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }

        .chart-bar-row:hover {
          background-color: var(--bg-app);
        }

        .chart-label-box {
          min-width: 140px;
        }

        .chart-stock-name {
          font-size: 0.88rem;
          color: var(--text-primary);
        }

        .chart-bar-viewport {
          flex: 1;
          height: 32px;
          background-color: var(--bg-app);
          border-radius: var(--radius-sm);
          position: relative;
          overflow: hidden;
        }

        .chart-bar {
          height: 100%;
          border-radius: var(--radius-sm) 0 0 var(--radius-sm);
          display: flex;
          align-items: center;
          padding-left: 12px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bar-value-label {
          color: #fff;
          font-size: 0.75rem;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .chart-average-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          border-left: 2px dashed rgba(15, 23, 42, 0.45);
          z-index: 5;
        }

        .chart-tag-box {
          min-width: 80px;
          text-align: right;
        }

        /* Badges Styling */
        .undervalued-badge {
          background-color: #e6fbf4;
          color: #10b981;
        }

        .overvalued-badge {
          background-color: #fdf2f2;
          color: #ef4444;
        }

        .fair-badge {
          background-color: #f1f5f9;
          color: var(--text-secondary);
        }

        .sort-icon {
          display: inline-block;
          vertical-align: middle;
          margin-left: 4px;
        }

        @media (max-width: 768px) {
          .averages-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .chart-label-box {
            min-width: 100px;
          }
        }
      `}</style>
    </div>
  );
};
