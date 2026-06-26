import React from 'react';
import { 
  LayoutDashboard, 
  Grid, 
  Activity, 
  BarChart3, 
  Newspaper, 
  Calendar as CalendarIcon, 
  Briefcase, 
  TrendingUp, 
  AlertCircle,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  marketOpen: boolean;
  onToggleMarket: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  marketOpen, 
  onToggleMarket,
  isOpen,
  onClose
}) => {
  const menuItems = [
    { id: 'overview', name: '종합 대시보드', icon: LayoutDashboard },
    { id: 'heatmap', name: '섹터 히트맵', icon: Grid },
    { id: 'sentiment', name: '시장 감성 지표', icon: Activity },
    { id: 'valuation', name: '상대가치 평가', icon: BarChart3 },
    { id: 'news', name: '실시간 속보', icon: Newspaper },
    { id: 'calendar', name: '실적 발표 일정', icon: CalendarIcon },
    { id: 'portfolio', name: '가상 포트폴리오', icon: Briefcase },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="logo-container">
        <div className="logo-icon">
          <TrendingUp size={24} color="#2563eb" />
        </div>
        <span className="logo-text">Premium Finance</span>
        <button className="btn-close-sidebar" onClick={onClose} aria-label="메뉴 닫기">
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                onClose(); // Auto-close on mobile selection
              }}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="nav-icon" />
              <span className="nav-text">{item.name}</span>
              {isActive && <div className="active-indicator" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="market-status-box">
          <div className="flex-between">
            <span className="text-xs text-muted">네이버 실시간 시세</span>
            <div className={`status-dot ${marketOpen ? 'active' : 'inactive'}`} />
          </div>
          <p className="text-sm font-semibold mt-1">
            {marketOpen ? '실시간 데이터 연동 중' : '실시간 연동 정지됨'}
          </p>
          <button 
            onClick={onToggleMarket}
            className={`btn-toggle-engine ${marketOpen ? 'stop' : 'start'}`}
          >
            {marketOpen ? '실시간 연동 일시정지' : '실시간 연동 재개'}
          </button>
        </div>
        
        <div className="app-version">
          <AlertCircle size={12} className="text-muted mr-1" />
          <span>Antigravity Build v1.0</span>
        </div>
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          z-index: 100;
          padding: 24px 16px;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px 24px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 24px;
        }

        .logo-icon {
          background-color: var(--primary-light);
          padding: 8px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .btn-close-sidebar {
          display: none;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-muted);
          margin-left: auto;
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .btn-close-sidebar:hover {
          background-color: var(--bg-app);
          color: var(--text-primary);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: none;
          background: none;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.95rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
          position: relative;
          text-align: left;
          width: 100%;
        }

        .nav-item:hover {
          background-color: var(--bg-app);
          color: var(--text-primary);
        }

        .nav-item.active {
          background-color: var(--primary-light);
          color: var(--primary);
          font-weight: 600;
        }

        .nav-icon {
          transition: transform var(--transition-fast);
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.05);
        }

        .nav-item.active .nav-icon {
          color: var(--primary);
        }

        .active-indicator {
          position: absolute;
          right: 0;
          top: 25%;
          height: 50%;
          width: 4px;
          background-color: var(--primary);
          border-radius: 4px 0 0 4px;
        }

        .sidebar-footer {
          border-top: 1px solid var(--border-color);
          padding-top: 20px;
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .market-status-box {
          background-color: var(--bg-app);
          padding: 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.active {
          background-color: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .status-dot.inactive {
          background-color: #ef4444;
        }

        .mt-1 {
          margin-top: 4px;
        }

        .btn-toggle-engine {
          width: 100%;
          border: none;
          padding: 8px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
          transition: background-color var(--transition-fast);
        }

        .btn-toggle-engine.stop {
          background-color: #fee2e2;
          color: #ef4444;
        }

        .btn-toggle-engine.stop:hover {
          background-color: #fca5a5;
        }

        .btn-toggle-engine.start {
          background-color: var(--primary-light);
          color: var(--primary);
        }

        .btn-toggle-engine.start:hover {
          background-color: #dbeafe;
        }

        .app-version {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .mr-1 {
          margin-right: 4px;
        }

        @media (max-width: 1024px) {
          .sidebar {
            left: calc(-1 * var(--sidebar-width));
            transition: left var(--transition-normal);
            box-shadow: none;
          }
          .sidebar.open {
            left: 0;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15);
          }
          .btn-close-sidebar {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </aside>
  );
};
