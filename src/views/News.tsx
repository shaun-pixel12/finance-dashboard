import React, { useState } from 'react';
import { useMarket, NewsItem } from '../context/MarketContext';
import { Sparkles, Search, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';

export const News: React.FC<{ onStockSelect: (symbol: string) => void }> = ({ onStockSelect }) => {
  const { news } = useMarket();
  const [filter, setFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter(x => x !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  // Filter & Search logic
  const filteredNews = news.filter(item => {
    // 1. Sentiment filter
    if (filter === 'POSITIVE' && item.sentiment !== 'positive') return false;
    if (filter === 'NEGATIVE' && item.sentiment !== 'negative') return false;
    if (filter === 'NEUTRAL' && item.sentiment !== 'neutral') return false;
    
    // 2. Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query) ||
        (item.symbol && item.symbol.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  return (
    <div className="page-container">
      {/* View Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 className="view-title">실시간 AI 뉴스 속보</h1>
          <p className="text-sm text-muted">국내외 주요 투자 속보를 실시간 모니터링하고 AI가 요약한 핵심 포인트를 제공합니다.</p>
        </div>

        {/* Live indicator */}
        <div className="live-pill">
          <span className="live-dot" />
          <span className="text-xs font-bold text-us-down uppercase tracking-wider mr-1">LIVE</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="news-control-bar card mb-6">
        <div className="news-search-box">
          <Search size={16} className="text-muted mr-2" />
          <input 
            type="text" 
            placeholder="뉴스 제목, 출처 또는 관련 티커 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="news-filters">
          <button 
            className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            전체 속보
          </button>
          <button 
            className={`filter-btn ${filter === 'POSITIVE' ? 'active' : ''}`}
            onClick={() => setFilter('POSITIVE')}
          >
            호재성 속보
          </button>
          <button 
            className={`filter-btn ${filter === 'NEGATIVE' ? 'active' : ''}`}
            onClick={() => setFilter('NEGATIVE')}
          >
            악재성 속보
          </button>
          <button 
            className={`filter-btn ${filter === 'NEUTRAL' ? 'active' : ''}`}
            onClick={() => setFilter('NEUTRAL')}
          >
            시황/중립
          </button>
        </div>
      </div>

      {/* News List */}
      <div className="news-list-container">
        {filteredNews.length === 0 ? (
          <div className="card flex-center flex-direction-column p-8">
            <AlertCircle size={36} className="text-muted mb-2" />
            <p className="text-muted">해당하는 조건의 뉴스가 없습니다.</p>
          </div>
        ) : (
          filteredNews.map(item => {
            const isExpanded = expandedIds.includes(item.id);
            let badgeClass = 'stock-flat';
            let badgeText = '중립';
            if (item.sentiment === 'positive') {
              badgeClass = 'stock-up-us';
              badgeText = '시장 호재';
            } else if (item.sentiment === 'negative') {
              badgeClass = 'stock-down-us';
              badgeText = '시장 악재';
            }

            return (
              <div key={item.id} className="news-card card mb-4">
                <div className="news-card-header flex-between">
                  <div className="news-card-meta">
                    <span className="news-source font-semibold">{item.source}</span>
                    <span className="news-time text-muted">• {item.time}</span>
                    
                    {item.symbol && (
                      <button 
                        onClick={() => onStockSelect(item.symbol!)}
                        className="badge-ticker ml-2"
                      >
                        {item.symbol}
                      </button>
                    )}
                  </div>
                  <span className={`badge ${badgeClass} text-xs`}>{badgeText}</span>
                </div>

                <h3 className="news-title font-bold mt-2 mb-3">
                  {item.title}
                </h3>

                {/* Collapsible AI Summary Area */}
                <div className="ai-summary-wrapper">
                  <button 
                    onClick={() => toggleExpand(item.id)}
                    className={`btn-ai-toggle flex-between ${isExpanded ? 'active' : ''}`}
                  >
                    <div className="flex-center text-xs font-semibold">
                      <Sparkles size={14} className="mr-1 sparkle-icon" />
                      <span>AI 3줄 핵심 요약 보기</span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isExpanded && (
                    <div className="ai-summary-content">
                      <ul className="summary-bullets">
                        {item.summary.map((point, index) => (
                          <li key={index} className="text-sm font-medium">
                            <span className="bullet-num">{index + 1}</span>
                            <span className="bullet-text">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .view-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .live-pill {
          display: flex;
          align-items: center;
          background-color: #fee2e2;
          border: 1px solid #fca5a5;
          padding: 6px 12px;
          border-radius: 9999px;
          gap: 6px;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ef4444;
          animation: blink 1.2s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }

        /* News Control Bar Styling */
        .news-control-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          gap: 16px;
        }

        .news-search-box {
          display: flex;
          align-items: center;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 8px 14px;
          flex: 1;
          max-width: 400px;
        }

        .news-search-box input {
          border: none;
          background: none;
          outline: none;
          width: 100%;
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .news-filters {
          display: flex;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 3px;
          gap: 3px;
        }

        /* News Card Styling */
        .news-card {
          padding: 20px 24px;
        }

        .news-card-meta {
          display: flex;
          align-items: center;
          font-size: 0.8rem;
        }

        .news-source {
          color: var(--text-secondary);
        }

        .news-time {
          margin-left: 6px;
        }

        .news-title {
          font-size: 1.15rem;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .badge-ticker {
          border: 1px solid var(--primary-border);
          background-color: var(--primary-light);
          color: var(--primary);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .badge-ticker:hover {
          background-color: #dbeafe;
        }

        /* AI Summary Wrap Styling */
        .ai-summary-wrapper {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          background-color: var(--bg-app);
        }

        .btn-ai-toggle {
          width: 100%;
          border: none;
          background: none;
          padding: 10px 16px;
          display: flex;
          cursor: pointer;
          color: var(--text-secondary);
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .btn-ai-toggle:hover {
          background-color: #f1f5f9;
          color: var(--text-primary);
        }

        .btn-ai-toggle.active {
          border-bottom: 1px solid var(--border-color);
          background-color: var(--accent-light);
          color: var(--accent);
        }

        .sparkle-icon {
          color: var(--accent);
        }

        .btn-ai-toggle.active .sparkle-icon {
          animation: rotate-sparkle 1s infinite alternate;
        }

        @keyframes rotate-sparkle {
          0% { transform: rotate(0deg) scale(1); }
          100% { transform: rotate(15deg) scale(1.15); }
        }

        .ai-summary-content {
          padding: 16px;
          background-color: #fff;
          animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .summary-bullets {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .summary-bullets li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .bullet-num {
          background-color: var(--accent-light);
          color: var(--accent);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .bullet-text {
          color: var(--text-secondary);
          line-height: 1.45;
        }

        @media (max-width: 768px) {
          .news-control-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .news-search-box {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
