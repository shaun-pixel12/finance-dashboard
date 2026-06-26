import React, { useState, useMemo } from 'react';
import { useMarket, EarningsEvent } from '../context/MarketContext';
import { Sunrise, Moon, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';

export const Calendar: React.FC<{ onStockSelect: (symbol: string) => void }> = ({ onStockSelect }) => {
  const { earnings } = useMarket();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // July by default as mock data is in July

  // Generate days in month for July 2026
  // July 2026 starts on a Wednesday (3 blank days at start: Sun, Mon, Tue)
  // July has 31 days.
  const calendarDays = useMemo(() => {
    // Dynamically calculate days in selected month and year
    const totalDays = new Date(currentYear, currentMonth, 0).getDate();
    const startDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
    
    const days: { dayNumber: number | null; dateString: string | null }[] = [];
    
    // Add prefix blank days
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ dayNumber: null, dateString: null });
    }
    
    // Add real days
    for (let day = 1; day <= totalDays; day++) {
      const padMonth = currentMonth.toString().padStart(2, '0');
      const padDay = day.toString().padStart(2, '0');
      days.push({
        dayNumber: day,
        dateString: `${currentYear}-${padMonth}-${padDay}`
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Map earnings events to dates
  const earningsMap = useMemo(() => {
    const map: Record<string, EarningsEvent[]> = {};
    earnings.forEach(event => {
      if (!map[event.date]) {
        map[event.date] = [];
      }
      map[event.date].push(event);
    });
    return map;
  }, [earnings]);

  // Navigate months (just simulated limits since our mock is July)
  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  return (
    <div className="page-container">
      {/* View Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 className="view-title">실적 발표 캘린더</h1>
          <p className="text-sm text-muted">주요 기업들의 분기 실적 발표 발표 예정일과 예상 EPS 주당 순이익을 확인합니다.</p>
        </div>

        {/* Calendar Nav */}
        <div className="calendar-nav flex-center card-sm">
          <button className="nav-arrow" onClick={prevMonth}><ChevronLeft size={16} /></button>
          <span className="calendar-month-year font-bold text-sm mx-4">
            {currentYear}년 {currentMonth}월
          </span>
          <button className="nav-arrow" onClick={nextMonth}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid-layout">
        
        {/* The Monthly Calendar Grid */}
        <div className="card span-9">
          <div className="calendar-grid-header">
            <div>일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div>토</div>
          </div>
          
          <div className="calendar-days-grid">
            {calendarDays.map((cell, idx) => {
              const dayEvents = cell.dateString ? earningsMap[cell.dateString] : null;
              const isToday = cell.dateString === '2026-07-26'; // Mocking today's date as 2026-07-26
              
              return (
                <div 
                  key={idx} 
                  className={`calendar-cell ${cell.dayNumber === null ? 'empty-cell' : ''} ${isToday ? 'today-cell' : ''}`}
                >
                  {cell.dayNumber && (
                    <div className="cell-header">
                      <span className={`cell-day-num ${isToday ? 'badge-today' : ''}`}>{cell.dayNumber}</span>
                    </div>
                  )}

                  {dayEvents && (
                    <div className="cell-events">
                      {dayEvents.map(event => (
                        <div 
                          key={event.id} 
                          onClick={() => onStockSelect(event.symbol)}
                          className="calendar-event-pill"
                        >
                          <div className="flex-between">
                            <span className="event-symbol font-bold">{event.symbol.split('.')[0]}</span>
                            {event.reportingTime === 'BMO' ? (
                              <span title="개장 전 발표"><Sunrise size={10} className="text-neutral" /></span>
                            ) : (
                              <span title="장 마감 후 발표"><Moon size={10} className="text-muted" /></span>
                            )}
                          </div>
                          <span className="event-eps text-xxs text-muted">예상 EPS: {event.expectedEps}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Information panel */}
        <div className="card span-3 flex-direction-column">
          <h3 className="card-title-text font-bold mb-4 flex-between">
            <span>캘린더 범례 & 안내</span>
            <Info size={16} className="text-muted" />
          </h3>
          
          <div className="calendar-guide-content flex-direction-column flex-1">
            <div className="guide-indicator-row mt-2">
              <Sunrise size={18} className="text-neutral mr-2" />
              <div className="flex-direction-column">
                <span className="text-xs font-bold">BMO (Before Market Open)</span>
                <span className="text-xxs text-muted">정규 주식 장 시작 전 실적 발표 (한국 시간 밤 8~9시경)</span>
              </div>
            </div>

            <div className="guide-indicator-row mt-4">
              <Moon size={18} className="text-muted mr-2" />
              <div className="flex-direction-column">
                <span className="text-xs font-bold">AMC (After Market Close)</span>
                <span className="text-xxs text-muted">정규 주식 장 마감 후 실적 발표 (한국 시간 다음 날 새벽 5~6시경)</span>
              </div>
            </div>

            <div className="earnings-info-note mt-6">
              <h4 className="text-xs font-bold text-secondary">어닝 시즌 주요 체크 포인트</h4>
              <ul className="text-xxs text-secondary mt-2 list-style-disc pl-4 leading-relaxed">
                <li>실적 발표 후 **EPS 어닝 서프라이즈** 여부에 따라 변동성이 확대됩니다.</li>
                <li>발표 당일 실적 수치보다 향후 분기 **가이던스(전망치)** 상하향 여부가 주가 흐름에 더 크게 영향을 미칩니다.</li>
                <li>캘린더 내 상기된 종목을 클릭하시면, 해당 종목의 실시간 상세 호가 차트를 바로 띄워 확인할 수 있습니다.</li>
              </ul>
            </div>
            
            {/* Quick list of upcoming releases */}
            <div className="upcoming-list-box mt-6">
              <h4 className="text-xs font-bold mb-2">실적 발표 임박 대표 기업</h4>
              <div className="upcoming-scroller">
                {earnings.slice(0, 4).map(event => (
                  <div key={event.id} className="upcoming-item flex-between" onClick={() => onStockSelect(event.symbol)}>
                    <div>
                      <span className="font-bold text-xs">{event.symbol.split('.')[0]}</span>
                      <span className="text-xxs text-muted block">{event.companyName}</span>
                    </div>
                    <div className="text-right">
                      <span className="badge stock-flat text-xxs font-semibold">{event.date.slice(5)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .mx-4 { margin-left: 16px; margin-right: 16px; }
        .text-xxs { font-size: 0.7rem; }
        .text-neutral { color: var(--color-neutral); }
        
        .calendar-nav {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: #fff;
        }

        .nav-arrow {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          padding: 2px;
          border-radius: 4px;
          transition: background-color var(--transition-fast);
        }

        .nav-arrow:hover {
          background-color: var(--bg-app);
          color: var(--text-primary);
        }

        /* Calendar Grid Styling */
        .calendar-grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
          margin-bottom: 10px;
        }

        .calendar-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-auto-rows: 100px;
          gap: 6px;
        }

        .calendar-cell {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 6px;
          display: flex;
          flex-direction: column;
          background-color: #fff;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .calendar-cell:hover:not(.empty-cell) {
          border-color: #cbd5e1;
          box-shadow: var(--shadow-sm);
        }

        .empty-cell {
          background-color: #fafbfc;
          border-color: #f1f5f9;
        }

        .today-cell {
          border: 2px solid var(--primary);
          background-color: var(--primary-light);
        }

        .cell-header {
          display: flex;
          margin-bottom: 4px;
        }

        .cell-day-num {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .badge-today {
          background-color: var(--primary);
          color: #fff;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
        }

        .cell-events {
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          flex: 1;
        }

        .calendar-event-pill {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 3px 6px;
          cursor: pointer;
          transition: transform var(--transition-fast), border-color var(--transition-fast);
        }

        .calendar-event-pill:hover {
          transform: translateY(-1px);
          border-color: var(--primary-border);
          background-color: var(--primary-light);
        }

        .event-symbol {
          font-size: 0.72rem;
          color: var(--text-primary);
        }

        /* Right panel info */
        .guide-indicator-row {
          display: flex;
          align-items: center;
        }

        .earnings-info-note {
          background-color: var(--bg-app);
          padding: 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .upcoming-list-box {
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }

        .upcoming-scroller {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .upcoming-item {
          padding: 8px 10px;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: transform var(--transition-fast);
        }

        .upcoming-item:hover {
          transform: translateX(2px);
          background-color: var(--primary-light);
          border-color: var(--primary-border);
        }
      `}</style>
    </div>
  );
};
