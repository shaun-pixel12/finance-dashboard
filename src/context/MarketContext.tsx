import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types Definitions
export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  market: 'US' | 'KR';
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  cap: number; // In Billions USD (for US) or Trillions KRW (for KR)
  volume: number;
  per: number;
  peg: number;
  pbr: number;
  evEbitda: number;
  history: number[];
  description: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  history: number[];
}

export interface NewsItem {
  id: string;
  time: string;
  title: string;
  source: string;
  summary: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  symbol?: string;
}

export interface EarningsEvent {
  id: string;
  date: string;
  symbol: string;
  companyName: string;
  expectedEps: number;
  actualEps?: number;
  reportingTime: 'BMO' | 'AMC'; // Before Market Open, After Market Close
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  market: 'US' | 'KR';
  shares: number;
  avgPrice: number;
  totalCost: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface MarketContextType {
  indices: Record<string, MarketIndex>;
  stocks: Stock[];
  news: NewsItem[];
  earnings: EarningsEvent[];
  fearGreedScore: number;
  vixPrice: number;
  vixHistory: number[];
  usdKrw: number;
  usdKrwChangePercent: number;
  us10yYield: number;
  us10yYieldChangePercent: number;
  vixChangePercent: number;
  watchlist: string[];
  holdings: PortfolioHolding[];
  balanceUsd: number;
  balanceKrw: number;
  simulatedMarketOpen: boolean;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  buyStock: (symbol: string, shares: number) => boolean;
  sellStock: (symbol: string, shares: number) => boolean;
  toggleMarketOpen: () => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

// Initial Stock Database
const INITIAL_STOCKS: Stock[] = [
  // 1. 메모리 반도체
  {
    symbol: '005930.KS',
    name: '삼성전자',
    sector: '메모리 반도체',
    market: 'KR',
    price: 331000,
    prevClose: 344000,
    change: -13000,
    changePercent: -3.78,
    cap: 442.9,
    volume: 14203400,
    per: 15.4,
    peg: 1.1,
    pbr: 1.25,
    evEbitda: 7.2,
    history: Array.from({ length: 20 }, () => 331000 + Math.floor((Math.random() - 0.5) * 5000)),
    description: '대한민국을 대표하는 글로벌 종합 반도체 및 전자 기기 제조 기업.'
  },
  {
    symbol: '000660.KS',
    name: 'SK하이닉스',
    sector: '메모리 반도체',
    market: 'KR',
    price: 2663000,
    prevClose: 2917000,
    change: -254000,
    changePercent: -8.71,
    cap: 161.2,
    volume: 3820100,
    per: 18.2,
    peg: 0.95,
    pbr: 2.1,
    evEbitda: 8.5,
    history: Array.from({ length: 20 }, () => 2663000 + Math.floor((Math.random() - 0.5) * 50000)),
    description: 'HBM(고대역폭 메모리) 분야 세계 1위 기술력을 자랑하는 메모리 반도체 제조 기업.'
  },
  {
    symbol: 'MU',
    name: 'Micron Technology',
    sector: '메모리 반도체',
    market: 'US',
    price: 138.45,
    prevClose: 135.2,
    change: 3.25,
    changePercent: 2.4,
    cap: 153.2,
    volume: 8520000,
    per: 22.4,
    peg: 1.3,
    pbr: 2.45,
    evEbitda: 9.8,
    history: Array.from({ length: 20 }, () => 138.45 + (Math.random() - 0.5) * 4),
    description: '미국의 D램 및 낸드 플래시 메모리 설계·제조 대기업.'
  },

  // 2. 비메모리 반도체
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    sector: '비메모리 반도체',
    market: 'US',
    price: 124.5,
    prevClose: 120.4,
    change: 4.1,
    changePercent: 3.41,
    cap: 3062.5,
    volume: 45200000,
    per: 65.2,
    peg: 0.85,
    pbr: 32.4,
    evEbitda: 42.1,
    history: Array.from({ length: 20 }, () => 124.5 + (Math.random() - 0.5) * 5),
    description: 'AI 가속기 및 GPU 칩 설계 분야에서 전 세계 90% 이상의 시장 점유율을 기록 중인 지배적 기업.'
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    sector: '비메모리 반도체',
    market: 'US',
    price: 158.32,
    prevClose: 160.1,
    change: -1.78,
    changePercent: -1.11,
    cap: 255.8,
    volume: 18500000,
    per: 45.8,
    peg: 1.25,
    pbr: 4.1,
    evEbitda: 25.4,
    history: Array.from({ length: 20 }, () => 158.32 + (Math.random() - 0.5) * 4),
    description: 'CPU 및 GPU 반도체 설계 전문 팹리스 기업으로 고성능 컴퓨팅 및 AI 솔루션 제공.'
  },
  {
    symbol: 'TSM',
    name: 'TSMC ADR',
    sector: '비메모리 반도체',
    market: 'US',
    price: 172.8,
    prevClose: 170.2,
    change: 2.6,
    changePercent: 1.53,
    cap: 896.2,
    volume: 12400000,
    per: 28.5,
    peg: 1.15,
    pbr: 6.8,
    evEbitda: 14.2,
    history: Array.from({ length: 20 }, () => 172.8 + (Math.random() - 0.5) * 4),
    description: '대만의 전 세계 최대 반도체 위탁생산(파운드리) 선도 기업.'
  },

  // 3. 빅테크
  {
    symbol: 'AAPL',
    name: 'Apple Inc',
    sector: '빅테크',
    market: 'US',
    price: 215.68,
    prevClose: 214.5,
    change: 1.18,
    changePercent: 0.55,
    cap: 3307.2,
    volume: 38400000,
    per: 31.2,
    peg: 2.1,
    pbr: 44.5,
    evEbitda: 22.8,
    history: Array.from({ length: 20 }, () => 215.68 + (Math.random() - 0.5) * 3),
    description: '아이폰, 맥북 등을 제조하며 자체 반도체 생태계(Apple Silicon)와 거대한 서비스 플랫폼을 보유한 글로벌 시총 1위권 빅테크.'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp',
    sector: '빅테크',
    market: 'US',
    price: 452.12,
    prevClose: 450.05,
    change: 2.07,
    changePercent: 0.46,
    cap: 3362.4,
    volume: 16500000,
    per: 36.4,
    peg: 1.8,
    pbr: 13.2,
    evEbitda: 25.1,
    history: Array.from({ length: 20 }, () => 452.12 + (Math.random() - 0.5) * 4),
    description: 'Windows, Office 및 클라우드(Azure)와 함께 OpenAI와의 강력한 파트너십을 통해 생성형 AI 비즈니스를 주도하는 공룡 기업.'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc',
    sector: '빅테크',
    market: 'US',
    price: 182.2,
    prevClose: 187.3,
    change: -5.1,
    changePercent: -2.72,
    cap: 580.4,
    volume: 68500000,
    per: 58.0,
    peg: 1.95,
    pbr: 8.4,
    evEbitda: 31.0,
    history: Array.from({ length: 20 }, () => 182.2 + (Math.random() - 0.5) * 6),
    description: '전기차 및 에너지 저장장치(ESS), 자율주행(FSD) 및 휴머노이드 로봇(Optimus)을 개발하는 기술 혁신 기업.'
  },

  // 4. 조선
  {
    symbol: '329180.KS',
    name: 'HD현대중공업',
    sector: '조선',
    market: 'KR',
    price: 138500,
    prevClose: 136000,
    change: 2500,
    changePercent: 1.84,
    cap: 12.3,
    volume: 185000,
    per: 34.2,
    peg: 1.1,
    pbr: 1.85,
    evEbitda: 14.8,
    history: Array.from({ length: 20 }, () => 138500 + Math.floor((Math.random() - 0.5) * 3000)),
    description: '전 세계 조선 시장을 선도하는 고부가가치 선박(LNG선, LPG선) 특화 조선 기업.'
  },
  {
    symbol: '010140.KS',
    name: '삼성중공업',
    sector: '조선',
    market: 'KR',
    price: 9240,
    prevClose: 9350,
    change: -110,
    changePercent: -1.18,
    cap: 8.1,
    volume: 4500000,
    per: 24.5,
    peg: 0.8,
    pbr: 1.92,
    evEbitda: 11.2,
    history: Array.from({ length: 20 }, () => 9240 + Math.floor((Math.random() - 0.5) * 200)),
    description: '해양 플랜트 및 대형 컨테이너선 건조 기술력을 기반으로 흑자 구조로 안착한 대표 조선사.'
  },
  {
    symbol: '042660.KS',
    name: '한화오션',
    sector: '조선',
    market: 'KR',
    price: 28450,
    prevClose: 27900,
    change: 550,
    changePercent: 1.97,
    cap: 8.7,
    volume: 1203000,
    per: 42.1,
    peg: 1.4,
    pbr: 2.15,
    evEbitda: 18.5,
    history: Array.from({ length: 20 }, () => 28450 + Math.floor((Math.random() - 0.5) * 800)),
    description: '구 대우조선해양이 한화그룹에 인수되어 군함 및 특수선, 가스 운반선 중심 기업으로 재도약.'
  },

  // 5. 방산
  {
    symbol: '012450.KS',
    name: '한화에어로스페이스',
    sector: '방산',
    market: 'KR',
    price: 1078000,
    prevClose: 1069000,
    change: 9000,
    changePercent: 0.84,
    cap: 12.5,
    volume: 452000,
    per: 22.1,
    peg: 0.72,
    pbr: 3.4,
    evEbitda: 12.0,
    history: Array.from({ length: 20 }, () => 1078000 + Math.floor((Math.random() - 0.5) * 15000)),
    description: 'K9 자주포, 레드백 장갑차 등 글로벌 지상무기 수출 호황을 누리고 있는 한국 대표 방위산업체.'
  },
  {
    symbol: 'LMT',
    name: 'Lockheed Martin',
    sector: '방산',
    market: 'US',
    price: 472.5,
    prevClose: 475.2,
    change: -2.7,
    changePercent: -0.57,
    cap: 112.5,
    volume: 1240000,
    per: 17.5,
    peg: 2.2,
    pbr: 12.4,
    evEbitda: 11.5,
    history: Array.from({ length: 20 }, () => 472.5 + (Math.random() - 0.5) * 8),
    description: '스텔스 전투기 F-35와 첨단 미사일 요격 시스템 등을 제조하는 전 세계 매출 1위 방산 대기업.'
  },

  // 6. 에너지 / 원자력
  {
    symbol: 'XOM',
    name: 'Exxon Mobil Corp',
    sector: '에너지',
    market: 'US',
    price: 112.45,
    prevClose: 111.8,
    change: 0.65,
    changePercent: 0.58,
    cap: 504.2,
    volume: 15400000,
    per: 12.4,
    peg: 1.85,
    pbr: 2.1,
    evEbitda: 7.4,
    history: Array.from({ length: 20 }, () => 112.45 + (Math.random() - 0.5) * 2),
    description: '정유, 가스 채굴, 정제 등 석유 경제를 이끄는 서방 최대의 오일 메이저.'
  },
  {
    symbol: '034020.KS',
    name: '두산에너빌리티',
    sector: '원자력',
    market: 'KR',
    price: 21500,
    prevClose: 20950,
    change: 550,
    changePercent: 2.63,
    cap: 13.8,
    volume: 8520000,
    per: 38.5,
    peg: 1.35,
    pbr: 1.45,
    evEbitda: 15.2,
    history: Array.from({ length: 20 }, () => 21500 + Math.floor((Math.random() - 0.5) * 500)),
    description: '원전 주기기 제조 및 대형·소형 원자로(SMR) 수주 혜택을 받는 글로벌 원자력 주기기 대기업.'
  },
  {
    symbol: 'CEG',
    name: 'Constellation Energy',
    sector: '원자력',
    market: 'US',
    price: 210.8,
    prevClose: 205.4,
    change: 5.4,
    changePercent: 2.63,
    cap: 66.8,
    volume: 2850000,
    per: 29.8,
    peg: 1.1,
    pbr: 5.2,
    evEbitda: 16.5,
    history: Array.from({ length: 20 }, () => 210.8 + (Math.random() - 0.5) * 6),
    description: '미국 최대의 청정에너지 원자력 발전 공급사로, AI 데이터 센터용 안정적 전력 공급 파트너십 주목.'
  },

  // 7. 전력
  {
    symbol: '267260.KS',
    name: 'HD현대일렉트릭',
    sector: '전력',
    market: 'KR',
    price: 324500,
    prevClose: 318000,
    change: 6500,
    changePercent: 2.04,
    cap: 11.7,
    volume: 242000,
    per: 28.2,
    peg: 0.55,
    pbr: 7.2,
    evEbitda: 14.5,
    history: Array.from({ length: 20 }, () => 324500 + Math.floor((Math.random() - 0.5) * 7000)),
    description: '글로벌 변압기 및 배전기 시장 슈퍼 사이클에 따라 이익이 폭증하고 있는 전력 인프라 대장주.'
  },
  {
    symbol: 'GEV',
    name: 'GE Vernova Inc',
    sector: '전력',
    market: 'US',
    price: 172.5,
    prevClose: 168.3,
    change: 4.2,
    changePercent: 2.5,
    cap: 46.5,
    volume: 3200000,
    per: 32.0,
    peg: 1.2,
    pbr: 3.8,
    evEbitda: 18.0,
    history: Array.from({ length: 20 }, () => 172.5 + (Math.random() - 0.5) * 5),
    description: 'GE에서 분사된 글로벌 발전 설비 및 가스터빈, 송배전 그리드 특화 에너지·전력 대기업.'
  },

  // 8. 원자재 / 희토류
  {
    symbol: '005490.KS',
    name: 'POSCO홀딩스',
    sector: '원자재',
    market: 'KR',
    price: 362000,
    prevClose: 365000,
    change: -3000,
    changePercent: -0.82,
    cap: 30.6,
    volume: 320000,
    per: 16.5,
    peg: 1.8,
    pbr: 0.52,
    evEbitda: 8.4,
    history: Array.from({ length: 20 }, () => 362000 + Math.floor((Math.random() - 0.5) * 5000)),
    description: '철강 비즈니스 경쟁력을 넘어, 리튬 및 니켈 등 미래 배터리 핵심 원자재 지주사 변모.'
  },
  {
    symbol: 'MP',
    name: 'MP Materials Corp',
    sector: '희토류',
    market: 'US',
    price: 15.32,
    prevClose: 15.1,
    change: 0.22,
    changePercent: 1.46,
    cap: 2.5,
    volume: 1850000,
    per: 32.4,
    peg: 2.1,
    pbr: 1.65,
    evEbitda: 12.8,
    history: Array.from({ length: 20 }, () => 15.32 + (Math.random() - 0.5) * 0.5),
    description: '북미 최대 희토류 채굴 및 정제 광산을 직접 보유한 미국의 안보 가치 핵심 희귀 원자재 기업.'
  },

  // 9. 일본상사
  {
    symbol: '8058.T',
    name: 'Mitsubishi Corp',
    sector: '일본상사',
    market: 'US', // Using simulated US ticker for simplicity in UI matching or display
    price: 20.45,
    prevClose: 20.3,
    change: 0.15,
    changePercent: 0.74,
    cap: 82.5,
    volume: 850000,
    per: 11.2,
    peg: 1.1,
    pbr: 1.15,
    evEbitda: 6.8,
    history: Array.from({ length: 20 }, () => 20.45 + (Math.random() - 0.5) * 0.5),
    description: '워런 버핏이 투자한 일본 5대 종합상사 중 시총 1위로, 자원 개발, 원자재 유통, 무역 등 다양한 비즈니스 수행.'
  },
  {
    symbol: '8001.T',
    name: 'Itochu Corp',
    sector: '일본상사',
    market: 'US',
    price: 45.12,
    prevClose: 44.8,
    change: 0.32,
    changePercent: 0.71,
    cap: 68.2,
    volume: 520000,
    per: 12.8,
    peg: 1.25,
    pbr: 1.42,
    evEbitda: 7.2,
    history: Array.from({ length: 20 }, () => 45.12 + (Math.random() - 0.5) * 1.0),
    description: '소비재, 에너지, 금속 무역을 비롯해 패밀리마트 등의 유통 생태계까지 장악한 일본의 초대형 종합상사.'
  }
];

// Initial Market Indices
const INITIAL_INDICES: Record<string, MarketIndex> = {
  SPY: {
    symbol: 'SPY',
    name: 'S&P 500 Index',
    price: 7304.0,
    prevClose: 7357.0,
    change: -53.0,
    changePercent: -0.72,
    history: Array.from({ length: 20 }, () => 7304.0 + (Math.random() - 0.5) * 40)
  },
  QQQ: {
    symbol: 'QQQ',
    name: 'Nasdaq 100 Index',
    price: 25358.6,
    prevClose: 25480.0,
    change: -121.4,
    changePercent: -0.48,
    history: Array.from({ length: 20 }, () => 25358.6 + (Math.random() - 0.5) * 180)
  },
  KOSPI: {
    symbol: 'KOSPI',
    name: '코스피 지수',
    price: 8930.3,
    prevClose: 8850.0,
    change: 80.3,
    changePercent: 0.91,
    history: Array.from({ length: 20 }, () => 8930.3 + (Math.random() - 0.5) * 60)
  },
  KOSDAQ: {
    symbol: 'KOSDAQ',
    name: '코스닥 지수',
    price: 865.6,
    prevClose: 884.4,
    change: -18.8,
    changePercent: -2.13,
    history: Array.from({ length: 20 }, () => 865.6 + (Math.random() - 0.5) * 10)
  }
};

// Initial News Feed (Realistic & Korean focused for KR stocks)
const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    time: '방금 전',
    title: '삼성전자, 차세대 CXL D램 제품 검증 완료... 연내 양산 돌입',
    source: '한국금융경제',
    summary: [
      '삼성전자가 업계 최초로 Compute Express Link(CXL) 2.0 기반 D램의 동작 검증을 주요 반도체 파트너사와 마쳤습니다.',
      'AI 연산 속도와 확장 비용을 획기적으로 개선하며 HBM과 함께 차세대 AI 메모리 시장 주도권을 확보할 것으로 보입니다.',
      '하반기 대량 양산 및 주요 서버 기업 공급이 가시화되면서 반도체 관련 섹터 전반에 긍정적인 기대감이 커지고 있습니다.'
    ],
    sentiment: 'positive',
    symbol: '005930.KS'
  },
  {
    id: 'news-2',
    time: '5분 전',
    title: 'NVIDIA, 차세대 Blackwell 칩 전력 소모 개선 완료... 하반기 출하 정상화',
    source: 'Bloomberg Tech',
    summary: [
      '엔비디아가 블랙웰 AI 아키텍처 일부에서 발생했던 전력 과부하 이슈 설계를 완벽하게 보완한 버전의 테스트를 완료했다고 알렸습니다.',
      '세계 최대 파운드리 TSMC를 통한 3나노 공정 양산이 탄력을 받을 전망입니다.',
      '주요 빅테크(MSFT, GOOGL, AMZN)들의 데이터 센터 선주문량 소화가 예정대로 진행되어 하반기 매출 전망이 상향 조정되었습니다.'
    ],
    sentiment: 'positive',
    symbol: 'NVDA'
  },
  {
    id: 'news-3',
    time: '12분 전',
    title: 'HD현대중공업, 중동 선사로부터 메탄올 추진 컨테이너선 4척 추가 수주',
    source: '해양비즈니스신문',
    summary: [
      '친환경 선박 시장의 장기 호황 속에 HD현대중공업이 총 8,600억 원 규모의 대형 가스 운반선 및 컨테이너 수주 계약에 성공했습니다.',
      '조선 업종의 올해 수주 목표액의 92%를 상반기 만에 조기 달성하며 강력한 이익 모멘텀을 증명했습니다.',
      '고부가가치선 도크 선점이 이어지면서 조선 3사의 선가(선박 가격) 상승 트렌드도 고착화되고 있습니다.'
    ],
    sentiment: 'positive',
    symbol: '329180.KS'
  },
  {
    id: 'news-4',
    time: '25분 전',
    title: '미국 10년물 국채 금리 연 4.25%대 소폭 하락... 물가 지표 안도감 반영',
    source: 'Wall Street Journal',
    summary: [
      '예상치에 부합하는 근원 개인소비지출(PCE) 물가지수 발표 이후 채권 시장이 하향 안정 흐름을 이어가고 있습니다.',
      '금리에 민감한 나스닥 지수 및 빅테크 종목군으로의 자금 유입이 강화되며 시장 전체의 위험자산 선호 심리가 가중되는 모습입니다.',
      '채권 전문가들은 연방준비제도(Fed)의 9월 금리 인하 확률이 현 68%에서 더욱 오를 것으로 보고 있습니다.'
    ],
    sentiment: 'neutral'
  },
  {
    id: 'news-5',
    time: '45분 전',
    title: '한화에어로스페이스, 루마니아와 K9 자주포 54문 공급 조인식... 1.3조원 잭팟',
    source: '방위산업저널',
    summary: [
      '한화에어로스페이스가 폴란드에 이어 루마니아 방위 계약을 최종 체결하며 유럽 시장 점유율을 더욱 견고히 다졌습니다.',
      '이번 계약에는 탄약 운반차, 지원 장비 및 탄약이 대규모 포함되어 있어 후속 유통 매출 구조도 크게 개선될 예정입니다.',
      '올해 2분기 연결 영업이익이 컨센서스를 대폭 상회할 것이라는 관측 속에 방산주 전반이 일제히 상승 중입니다.'
    ],
    sentiment: 'positive',
    symbol: '012450.KS'
  },
  {
    id: 'news-6',
    time: '1시간 전',
    title: 'POSCO홀딩스, 리튬 염호 상업 생산 연기로 목표주가 소폭 하향 조정 제시',
    source: '대신증권 리서치',
    summary: [
      '아르헨티나 리튬 염호 1단계 상업 설비의 인프라 공사 지연 소식에 양산 시점이 당초 3분기에서 내년 1분기로 미뤄졌습니다.',
      '최근 리튬 가격 약세 기조와 맞물려 단기 수익성 회복은 제한적일 것으로 평가받고 있습니다.',
      '다만 중장기 리튬 가격 반등 시점 및 본업인 철강 마진 회복 감안 시 현재 주가는 역사적 저평가 상태라는 분석이 지배적입니다.'
    ],
    sentiment: 'negative',
    symbol: '005490.KS'
  }
];

// Mock Earnings Calendar
const INITIAL_EARNINGS: EarningsEvent[] = [
  { id: 'e-1', date: '2026-07-08', symbol: '005930.KS', companyName: '삼성전자', expectedEps: 1250, reportingTime: 'BMO' },
  { id: 'e-2', date: '2026-07-15', symbol: 'TSM', companyName: 'TSMC', expectedEps: 1.48, reportingTime: 'BMO' },
  { id: 'e-3', date: '2026-07-22', symbol: '000660.KS', companyName: 'SK하이닉스', expectedEps: 4200, reportingTime: 'BMO' },
  { id: 'e-4', date: '2026-07-23', symbol: 'MSFT', companyName: 'Microsoft', expectedEps: 2.93, reportingTime: 'AMC' },
  { id: 'e-5', date: '2026-07-24', symbol: 'AAPL', companyName: 'Apple', expectedEps: 1.34, reportingTime: 'AMC' },
  { id: 'e-6', date: '2026-07-25', symbol: 'GOOGL', companyName: 'Alphabet (Google)', expectedEps: 1.84, reportingTime: 'AMC' },
  { id: 'e-7', date: '2026-07-26', symbol: 'TSLA', companyName: 'Tesla', expectedEps: 0.62, reportingTime: 'AMC' },
  { id: 'e-8', date: '2026-07-28', symbol: 'MU', companyName: 'Micron', expectedEps: 0.95, reportingTime: 'BMO' },
  { id: 'e-9', date: '2026-07-30', symbol: '012450.KS', companyName: '한화에어로스페이스', expectedEps: 2850, reportingTime: 'BMO' }
];

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [indices, setIndices] = useState<Record<string, MarketIndex>>(INITIAL_INDICES);
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [earnings] = useState<EarningsEvent[]>(INITIAL_EARNINGS);
  const [fearGreedScore, setFearGreedScore] = useState<number>(55); // Neutral -> starting value
  const [vixPrice, setVixPrice] = useState<number>(18.44);
  const [vixChangePercent, setVixChangePercent] = useState<number>(-1.24);
  const [vixHistory, setVixHistory] = useState<number[]>(Array.from({ length: 20 }, () => 18.44 + (Math.random() - 0.5) * 2));
  const [usdKrw, setUsdKrw] = useState<number>(1544.20);
  const [usdKrwChangePercent, setUsdKrwChangePercent] = useState<number>(0.12);
  const [us10yYield, setUs10yYield] = useState<number>(4.40);
  const [us10yYieldChangePercent, setUs10yYieldChangePercent] = useState<number>(-0.05);
  
  // Watchlist & Portfolio state
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', '005930.KS', 'NVDA', '000660.KS']);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [balanceUsd, setBalanceUsd] = useState<number>(100000); // Starter $100k USD
  const [balanceKrw, setBalanceKrw] = useState<number>(100000000); // Starter 100M KRW
  const [simulatedMarketOpen, setSimulatedMarketOpen] = useState<boolean>(true);

  // Dynamic news templates to generate during simulation
  const NEWS_TEMPLATES = [
    {
      title: "메모리 반도체, 고대역폭 메모리(HBM4) 조기 양산 소식에 강세",
      source: "금융인사이트",
      sentiment: "positive",
      summary: [
        "차세대 HBM4 12단 적층 패키징의 수율이 당초 예상치보다 10% 이상 높게 확인되면서 조기 양산 가능성이 높아졌습니다.",
        "엔비디아로의 전량 공급 소식이 전해지면서 국내 반도체 제조 기업들의 연말 수익성 개선 기조에 강한 부스터로 작동할 예정입니다.",
        "미국 반도체 장비 공급사들 또한 장비 신규 발주량이 늘어나 연일 강세를 띠고 있습니다."
      ]
    },
    {
      title: "전력 인프라 대장주, 초대형 북미 변압기 추가 장기 공급 계약 수주 성공",
      source: "산업전망통신",
      sentiment: "positive",
      summary: [
        "미국 남동부 주요 전력 그리드 리모델링 사업에 약 4억 5천만 달러 규모의 대형 수주를 따냈습니다.",
        "최근 AI 데이터 센터 전력 대란으로 전 세계 변압기 수급 기간(Lead Time)이 4년 이상으로 최대로 누적되었습니다.",
        "업체들은 공장 풀 가동 상황을 유지하며 생산 물량 기준 판가를 대폭 인상하고 있는 상태입니다."
      ]
    },
    {
      title: "방산 섹터, 글로벌 국방 예산 상향 트렌드 속 무기 수출 다변화",
      source: "방산수출데일리",
      sentiment: "positive",
      summary: [
        "지정학적 리스크 확대로 인해 중동 및 동유럽 우방국들의 군수물자 수입 규모가 작년 대비 32% 급증한 것으로 추계되었습니다.",
        "한국 방산 제품의 빠른 인도 속도(Lead Time Advantage)와 탁월한 가격대 성능비가 수주 성공 비결로 꼽힙니다.",
        "후속 정비 물자 공급선까지 독점 보장받으면서 향후 10년간의 안정적 로열티 캐시플로우가 확보되었습니다."
      ]
    },
    {
      title: "연방준비제도 인사 발언: 금리 인하에 서두를 필요는 없으나 하반기 적절한 조정은 필요",
      source: "Reuters",
      sentiment: "neutral",
      summary: [
        "연준 이사가 물가지표가 2%를 향해 일관되게 둔화하고 있다는 신호가 충분히 관측될 시 하반기 인하가 적합할 것이라고 발표했습니다.",
        "인플레이션 둔화 여부에 의구심을 표명하는 일부 강경 매파 발언과는 달리 비교적 온화하고 유연한 입장 표명으로 평가받습니다.",
        "글로벌 증시는 즉각적인 변동보다는 관망세를 보이며 거래량이 일시적으로 소폭 축소되는 양상입니다."
      ]
    },
    {
      title: "유가 및 원자재 원가 반등세로 원자재 관련주 강보합세",
      source: "에너지미디어",
      sentiment: "neutral",
      summary: [
        "서부 텍사스산 원유(WTI) 가격이 배럴당 82달러 선을 상회하며 단기 공급 긴장 가능성을 고조시켰습니다.",
        "광산 수급 불안정이 제기된 구리 및 원자재 시장도 선물 가격이 2%대 상승 마감했습니다.",
        "원자재를 수입 가공하는 중공업 업종의 단기 원가 압박 우려와 채굴 업계의 매출 증가가 엇갈리는 국면입니다."
      ]
    },
    {
      title: "기술주 전반에 단기 매물 차익 실현 출회... 단기 기술적 조정 국면 진입",
      source: "주식모니터",
      sentiment: "negative",
      summary: [
        "최근 3주간 랠리를 펼치던 주요 빅테크 종목을 중심으로 고점 부담을 느낀 기관계 차익 매물이 대거 출회되었습니다.",
        "대형 호재 소멸에 따른 일시적 물량 소화 과정으로 큰 악재 요인이 발생한 것은 아니라는 의견이 다수입니다.",
        "지수가 주요 이평선을 터치함에 따라 신규 진입 대기 자금이 유입될 수 있는 양질의 눌림목이 형성되고 있습니다."
      ]
    }
  ];

  // Watchlist functions
  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s !== symbol));
  };

  // Buy & Sell Portfolio functions
  const buyStock = (symbol: string, shares: number): boolean => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock || shares <= 0) return false;

    const totalCost = stock.price * shares;
    if (stock.market === 'US') {
      if (balanceUsd < totalCost) return false; // Insufficient funds
      setBalanceUsd(prev => prev - totalCost);
    } else {
      if (balanceKrw < totalCost) return false;
      setBalanceKrw(prev => prev - totalCost);
    }

    setHoldings(prev => {
      const existing = prev.find(h => h.symbol === symbol);
      if (existing) {
        const newShares = existing.shares + shares;
        const newTotalCost = existing.totalCost + totalCost;
        const newAvgPrice = newTotalCost / newShares;
        const newValue = stock.price * newShares;
        return prev.map(h => h.symbol === symbol ? {
          ...h,
          shares: newShares,
          avgPrice: newAvgPrice,
          totalCost: newTotalCost,
          currentValue: newValue,
          profitLoss: newValue - newTotalCost,
          profitLossPercent: ((newValue - newTotalCost) / newTotalCost) * 100
        } : h);
      } else {
        return [...prev, {
          symbol: stock.symbol,
          name: stock.name,
          market: stock.market,
          shares,
          avgPrice: stock.price,
          totalCost,
          currentValue: totalCost,
          profitLoss: 0,
          profitLossPercent: 0
        }];
      }
    });

    return true;
  };

  const sellStock = (symbol: string, shares: number): boolean => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return false;

    let success = false;
    setHoldings(prev => {
      const existing = prev.find(h => h.symbol === symbol);
      if (!existing || existing.shares < shares) {
        success = false;
        return prev;
      }

      success = true;
      const proceeds = stock.price * shares;
      if (stock.market === 'US') {
        setBalanceUsd(b => b + proceeds);
      } else {
        setBalanceKrw(b => b + proceeds);
      }

      const remainingShares = existing.shares - shares;
      if (remainingShares === 0) {
        return prev.filter(h => h.symbol !== symbol);
      }

      const newTotalCost = existing.avgPrice * remainingShares;
      const newValue = stock.price * remainingShares;

      return prev.map(h => h.symbol === symbol ? {
        ...h,
        shares: remainingShares,
        totalCost: newTotalCost,
        currentValue: newValue,
        profitLoss: newValue - newTotalCost,
        profitLossPercent: ((newValue - newTotalCost) / newTotalCost) * 100
      } : h);
    });

    return success;
  };

  const toggleMarketOpen = () => {
    setSimulatedMarketOpen(prev => !prev);
  };

  // Helper to fetch and catch errors
  const fetchWithCatch = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error("Fetch failed for " + url, e);
      return null;
    }
  };

  // Helper to map DB stock symbols to Naver symbols
  const getNaverSymbol = (symbol: string): string => {
    if (symbol === 'SPY') return 'SPY';
    if (symbol === 'QQQ') return 'QQQ.O';
    if (['NVDA', 'AMD', 'MU', 'AAPL', 'MSFT', 'TSLA', 'CEG'].includes(symbol)) {
      return `${symbol}.O`;
    }
    return symbol; // TSM, LMT, XOM, GEV, MP, 8058.T, 8001.T are already correct
  };

  // Helper to analyze news sentiment based on title keywords
  const analyzeSentiment = (title: string): 'positive' | 'negative' | 'neutral' => {
    const posKeywords = ['상승', '급등', '최고', '호재', '수주', '흑자', '우상향', '강세', '개선', '계약', '체결', '성공', '돌입', '호황', '매수', '안도', '반등', '속도', '출하', '정상화', '기대', '연합군', '역전'];
    const negKeywords = ['하락', '급락', '최저', '악재', '적자', '우하향', '약세', '지연', '실패', '불안', '우려', '타격', '폐지', '차질', '매도', '붕괴', '폭락', '멘붕', '패닉', '강제청산', '날벼락', '정정', '중단'];
    
    let score = 0;
    posKeywords.forEach(k => { if (title.includes(k)) score += 1; });
    negKeywords.forEach(k => { if (title.includes(k)) score -= 1; });
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  };

  // Helper to generate 3 points summary
  const generateAISummary = (title: string, body: string): string[] => {
    const cleanBody = body.replace(/<[^>]*>/g, '').replace(/\.\.\.\s*$/, '').trim();
    const sentences = cleanBody
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 5);
    
    const summary: string[] = [];
    if (sentences.length >= 1) summary.push(sentences[0]);
    if (sentences.length >= 2) summary.push(sentences[1]);
    if (sentences.length >= 3) summary.push(sentences[2]);
    
    while (summary.length < 3) {
      if (summary.length === 0) {
        summary.push(title);
      } else if (summary.length === 1) {
        summary.push("시장 상황 변화에 따라 해당 분야 투자 심리가 민감하게 반응하고 있습니다.");
      } else {
        summary.push("거래량 변화와 외국인/기관 매매 동향을 실시간 모니터링하여 변동성에 유의하십시오.");
      }
    }
    return summary;
  };

  // Main real-time data sync function
  const syncRealTimeData = async () => {
    try {
      // 1. Fetch Domestic Indices (KOSPI, KOSDAQ)
      const indexRes = await fetchWithCatch('/naver-polling/api/realtime?query=SERVICE_INDEX:KOSPI,KOSDAQ');
      if (indexRes && indexRes.result?.areas?.[0]?.datas) {
        const datas = indexRes.result.areas[0].datas;
        setIndices(prev => {
          const updated = { ...prev };
          datas.forEach((item: any) => {
            const cd = item.cd;
            if (updated[cd]) {
              const price = item.nv / 100;
              const change = item.cv / 100;
              const changePercent = item.cr;
              updated[cd] = {
                ...updated[cd],
                price,
                change,
                changePercent,
                history: [...(updated[cd].history || []).slice(1), price]
              };
            }
          });
          return updated;
        });
      }

      // 2. Fetch Domestic Stocks
      const domesticRes = await fetchWithCatch('/naver-polling/api/realtime?query=SERVICE_ITEM:005930,000660,329180,010140,042660,012450,034020,267260,005490');
      if (domesticRes && domesticRes.result?.areas?.[0]?.datas) {
        const datas = domesticRes.result.areas[0].datas;
        setStocks(prevStocks => {
          return prevStocks.map(stock => {
            if (stock.market === 'KR') {
              const code = stock.symbol.replace('.KS', '');
              const item = datas.find((d: any) => d.cd === code);
              if (item) {
                const price = item.nv;
                const isFalling = item.rf === '4' || item.rf === '5';
                const change = isFalling ? -Math.abs(item.cv) : Math.abs(item.cv);
                const changePercent = isFalling ? -Math.abs(item.cr) : Math.abs(item.cr);
                const prevClose = item.pcv;
                const volume = item.aq;
                
                return {
                  ...stock,
                  price,
                  change,
                  changePercent,
                  prevClose,
                  volume,
                  history: [...stock.history.slice(1), price]
                };
              }
            }
            return stock;
          });
        });
      }

      // 3. Fetch USD/KRW Exchange Rate
      const fxRes = await fetchWithCatch('/naver-api/marketindex/exchange/FX_USDKRW/prices?page=1&pageSize=1');
      if (fxRes && fxRes[0]) {
        const item = fxRes[0];
        const rate = parseFloat(item.closePrice.replace(/,/g, ''));
        const changeRatio = parseFloat(item.fluctuationsRatio);
        setUsdKrw(rate);
        setUsdKrwChangePercent(changeRatio);
      }

      // 4. Fetch US / JPN Stocks & ETFs basic info
      const targetStocks = INITIAL_STOCKS.filter(s => s.market === 'US' || s.symbol.endsWith('.T'));
      const usPromises = targetStocks.map(async (stock) => {
        const naverSymbol = getNaverSymbol(stock.symbol);
        const data = await fetchWithCatch(`/naver-api/stock/${naverSymbol}/basic`);
        return { symbol: stock.symbol, data };
      });
      const spyPromise = fetchWithCatch('/naver-api/stock/SPY/basic');
      const qqqPromise = fetchWithCatch('/naver-api/stock/QQQ.O/basic');

      const [usResults, spyData, qqqData] = await Promise.all([
        Promise.all(usPromises),
        spyPromise,
        qqqPromise
      ]);

      // Update US/JPN Stocks
      setStocks(prevStocks => {
        return prevStocks.map(stock => {
          const res = usResults.find(r => r.symbol === stock.symbol);
          if (res && res.data) {
            const d = res.data;
            const price = parseFloat(d.closePrice.replace(/,/g, ''));
            const change = parseFloat(d.compareToPreviousClosePrice.replace(/,/g, ''));
            const changePercent = parseFloat(d.fluctuationsRatio);
            const prevClose = price - change;
            
            const volumeInfo = d.stockItemTotalInfos?.find((info: any) => info.code === 'accumulatedTradingVolume');
            const volume = volumeInfo ? parseInt(volumeInfo.value.replace(/,/g, ''), 10) : stock.volume;
            
            const perInfo = d.stockItemTotalInfos?.find((info: any) => info.code === 'per');
            const per = perInfo && perInfo.value !== 'N/A' ? parseFloat(perInfo.value.replace(/배/g, '').replace(/,/g, '')) : stock.per;
            
            const pbrInfo = d.stockItemTotalInfos?.find((info: any) => info.code === 'pbr');
            const pbr = pbrInfo && pbrInfo.value !== 'N/A' ? parseFloat(pbrInfo.value.replace(/배/g, '').replace(/,/g, '')) : stock.pbr;
            
            return {
              ...stock,
              price,
              change,
              changePercent,
              prevClose,
              volume,
              per,
              pbr,
              history: [...stock.history.slice(1), price]
            };
          }
          return stock;
        });
      });

      // Update SPY & QQQ indices
      setIndices(prev => {
        const updated = { ...prev };
        if (spyData) {
          const price = parseFloat(spyData.closePrice.replace(/,/g, ''));
          const change = parseFloat(spyData.compareToPreviousClosePrice.replace(/,/g, ''));
          const changePercent = parseFloat(spyData.fluctuationsRatio);
          updated['SPY'] = {
            ...updated['SPY'],
            price,
            change,
            changePercent,
            history: [...(updated['SPY'].history || []).slice(1), price]
          };
        }
        if (qqqData) {
          const price = parseFloat(qqqData.closePrice.replace(/,/g, ''));
          const change = parseFloat(qqqData.compareToPreviousClosePrice.replace(/,/g, ''));
          const changePercent = parseFloat(qqqData.fluctuationsRatio);
          updated['QQQ'] = {
            ...updated['QQQ'],
            price,
            change,
            changePercent,
            history: [...(updated['QQQ'].history || []).slice(1), price]
          };
        }
        return updated;
      });

      // 5. Fetch News (General market news)
      const newsRes = await fetchWithCatch('/naver-api/news/integration/KOSPI');
      if (newsRes && newsRes.rankNews) {
        const parsedNews: NewsItem[] = newsRes.rankNews.map((item: any, idx: number) => {
          let timeStr = '방금 전';
          if (item.dt) {
            const y = item.dt.substring(0, 4);
            const m = item.dt.substring(4, 6);
            const d = item.dt.substring(6, 8);
            const h = item.dt.substring(8, 10);
            const min = item.dt.substring(10, 12);
            timeStr = `${y}-${m}-${d} ${h}:${min}`;
          }

          return {
            id: `news-live-${item.aid || idx}`,
            time: timeStr,
            title: item.tit,
            source: item.ohnm || '네이버뉴스',
            summary: generateAISummary(item.tit, item.subcontent || ''),
            sentiment: analyzeSentiment(item.tit),
            symbol: undefined
          };
        });
        setNews(parsedNews);
      }

    } catch (error) {
      console.error("Error syncing real-time data:", error);
    }
  };

  // 1. Initial fetch on mount
  useEffect(() => {
    syncRealTimeData();
  }, []);

  // 2. Real-time market tick and sync loop
  useEffect(() => {
    if (!simulatedMarketOpen) return;

    const interval = setInterval(() => {
      // Fetch fresh Naver data
      syncRealTimeData();

      // Update Portfolio Holdings values based on latest prices
      setHoldings(prevHoldings => {
        return prevHoldings.map(h => {
          const currentStock = stocks.find(s => s.symbol === h.symbol);
          if (!currentStock) return h;
          const currentValue = currentStock.price * h.shares;
          const profitLoss = currentValue - h.totalCost;
          const profitLossPercent = h.totalCost > 0 ? (profitLoss / h.totalCost) * 100 : 0;
          return {
            ...h,
            currentValue,
            profitLoss,
            profitLossPercent
          };
        });
      });

      // Simulating minor changes for other macro stats
      setUs10yYield(prev => {
        const nextVal = Number((prev + (Math.random() - 0.5) * 0.005).toFixed(4));
        const prevClose = 4.45; // baseline
        setUs10yYieldChangePercent(Number(((nextVal - prevClose) / prevClose * 100).toFixed(2)));
        return nextVal;
      });

      setVixPrice(prev => {
        const nextVix = Number((prev + (Math.random() - 0.5) * 0.15).toFixed(2));
        const prevClose = 18.66; // baseline
        setVixChangePercent(Number(((nextVix - prevClose) / prevClose * 100).toFixed(2)));
        setVixHistory(h => [...h.slice(1), nextVix]);
        return nextVix;
      });

      // Slowly shift Fear & Greed index
      setFearGreedScore(prev => {
        const change = Math.random() > 0.55 ? 1 : -1;
        const nextVal = prev + change;
        return Math.max(1, Math.min(99, nextVal));
      });

    }, 12000); // 12 seconds sync interval

    return () => clearInterval(interval);
  }, [simulatedMarketOpen, stocks]);

  return (
    <MarketContext.Provider value={{
      indices,
      stocks,
      news,
      earnings,
      fearGreedScore,
      vixPrice,
      vixHistory,
      usdKrw,
      usdKrwChangePercent,
      us10yYield,
      us10yYieldChangePercent,
      vixChangePercent,
      watchlist,
      holdings,
      balanceUsd,
      balanceKrw,
      simulatedMarketOpen,
      addToWatchlist,
      removeFromWatchlist,
      buyStock,
      sellStock,
      toggleMarketOpen
    }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};
