import React, { useEffect, useRef } from 'react';

export const TickerTape: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';

      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container__widget';
      containerRef.current.appendChild(widgetContainer);

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        symbols: [
          { proName: "FOREXCOM:SPX500", title: "S&P 500" },
          { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
          { proName: "KRX:KOSPI", title: "코스피 지수" },
          { proName: "KRX:KOSDAQ", title: "코스닥 지수" },
          { proName: "FX_IDC:USDKRW", title: "원/달러 환율" },
          { proName: "US10Y", title: "미 10년물 국채금리" }
        ],
        showSymbolLogo: true,
        colorTheme: "light",
        isTransparent: false,
        displayMode: "adaptive",
        locale: "ko"
      });
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div ref={containerRef} className="tradingview-widget-container" style={{ width: '100%' }} />
  );
};
