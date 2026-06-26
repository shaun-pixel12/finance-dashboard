import { useState } from 'react';
import { MarketProvider, useMarket } from './context/MarketContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './views/Overview';
import { Heatmap } from './views/Heatmap';
import { Sentiment } from './views/Sentiment';
import { Valuation } from './views/Valuation';
import { News } from './views/News';
import { Calendar } from './views/Calendar';
import { Portfolio } from './views/Portfolio';
import { TickerChartModal } from './components/TickerChartModal';
import { TickerTape } from './components/TickerTape';
import './App.css';

function AppContent() {
  const { simulatedMarketOpen, toggleMarketOpen } = useMarket();
  const [currentView, setCurrentView] = useState<string>('overview');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Render active view
  const renderActiveView = () => {
    switch (currentView) {
      case 'overview':
        return <Overview onStockSelect={setSelectedStockSymbol} onNavigate={setCurrentView} />;
      case 'heatmap':
        return <Heatmap onStockSelect={setSelectedStockSymbol} />;
      case 'sentiment':
        return <Sentiment />;
      case 'valuation':
        return <Valuation onStockSelect={setSelectedStockSymbol} />;
      case 'news':
        return <News onStockSelect={setSelectedStockSymbol} />;
      case 'calendar':
        return <Calendar onStockSelect={setSelectedStockSymbol} />;
      case 'portfolio':
        return <Portfolio onStockSelect={setSelectedStockSymbol} />;
      default:
        return <Overview onStockSelect={setSelectedStockSymbol} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        marketOpen={simulatedMarketOpen}
        onToggleMarket={toggleMarketOpen}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Header Search & Global Stats */}
        <Header 
          onStockSelect={setSelectedStockSymbol} 
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        {/* Real-time Ticker Tape */}
        <TickerTape />

        {/* View Page */}
        {renderActiveView()}
      </div>

      {/* Mobile Sidebar overlay backdrop */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Interactive Stock Detail Modal */}
      {selectedStockSymbol && (
        <TickerChartModal 
          symbol={selectedStockSymbol} 
          onClose={() => setSelectedStockSymbol(null)} 
        />
      )}
    </div>
  );
}

function App() {
  return (
    <MarketProvider>
      <AppContent />
    </MarketProvider>
  );
}

export default App;
