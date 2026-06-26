import React, { useEffect, useRef } from 'react';

export const TradingViewHeatmap: React.FC<{ filter: string }> = ({ filter }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Map our filter to TradingView's datasource configuration
  // S&P 500 = SPX500, Nasdaq 100 = NDX, KR Market = KOSPI/KOSDAQ (KRX)
  const getTvSource = (f: string) => {
    switch (f) {
      case 'US':
      case 'SP500':
        return 'SPX500';
      case 'NASDAQ100':
        return 'US_COMP'; // Nasdaq Composite/100 equivalent or total US
      case 'KR':
      case 'KOSPI200':
      case 'KOSDAQ100':
        return 'ALL_KR'; // All Korean Stocks
      case 'ALL':
      default:
        return 'world'; // Global markets overview
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';

      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container__widget';
      containerRef.current.appendChild(widgetContainer);

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        dataSource: getTvSource(filter),
        grouping: "sector",
        blockSize: "marketCap",
        blockColor: "change",
        locale: "ko",
        symbolUrl: "",
        colorTheme: "light",
        hasTopBar: true,
        isTransparent: false,
        width: "100%",
        height: "600"
      });
      containerRef.current.appendChild(script);
    }
  }, [filter]);

  return (
    <div ref={containerRef} className="tradingview-widget-container" style={{ width: '100%', height: '600px' }} />
  );
};
