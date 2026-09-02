export interface EconomicEvent {
  id: string;
  timestamp: number;
  currency: 'USD' | 'EUR' | 'GBP';
  event: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  previous: string;
  forecast: string;
  actual: string;
  note?: string;
}

export const MOCK_ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: 'eco-1',
    timestamp: Date.parse('2024-01-11T13:30:00Z'),
    currency: 'USD',
    event: 'US Core CPI (MoM)',
    impact: 'HIGH',
    previous: '0.3%',
    forecast: '0.3%',
    actual: '0.3%',
    note: 'In line with consensus.',
  },
  {
    id: 'eco-2',
    timestamp: Date.parse('2024-01-11T13:30:00Z'),
    currency: 'USD',
    event: 'US CPI (YoY)',
    impact: 'HIGH',
    previous: '3.1%',
    forecast: '3.2%',
    actual: '3.4%',
    note: 'Higher inflation print spurred market volatility.',
  },
  {
    id: 'eco-3',
    timestamp: Date.parse('2024-01-18T13:30:00Z'),
    currency: 'USD',
    event: 'Initial Jobless Claims',
    impact: 'MEDIUM',
    previous: '203K',
    forecast: '206K',
    actual: '187K',
    note: 'Tight labor market indicated.',
  },
  {
    id: 'eco-4',
    timestamp: Date.parse('2024-01-25T13:30:00Z'),
    currency: 'USD',
    event: 'US GDP Growth Rate (QoQ)',
    impact: 'HIGH',
    previous: '4.9%',
    forecast: '2.0%',
    actual: '3.3%',
    note: 'Resilient economic expansion.',
  },
  {
    id: 'eco-5',
    timestamp: Date.parse('2024-01-31T19:00:00Z'),
    currency: 'USD',
    event: 'Fed Interest Rate Decision (FOMC)',
    impact: 'HIGH',
    previous: '5.50%',
    forecast: '5.50%',
    actual: '5.50%',
    note: 'Federal Reserve held benchmark rate steady.',
  },
  {
    id: 'eco-6',
    timestamp: Date.parse('2024-02-02T13:30:00Z'),
    currency: 'USD',
    event: 'Non-Farm Payrolls (NFP)',
    impact: 'HIGH',
    previous: '216K',
    forecast: '185K',
    actual: '353K',
    note: 'Massive upside surprise on US hiring.',
  },
  {
    id: 'eco-7',
    timestamp: Date.parse('2024-02-13T13:30:00Z'),
    currency: 'USD',
    event: 'US CPI (YoY)',
    impact: 'HIGH',
    previous: '3.4%',
    forecast: '2.9%',
    actual: '3.1%',
    note: 'Sticky shelter prices drove hotter CPI.',
  },
  {
    id: 'eco-8',
    timestamp: Date.parse('2024-03-08T13:30:00Z'),
    currency: 'USD',
    event: 'Non-Farm Payrolls (NFP)',
    impact: 'HIGH',
    previous: '353K',
    forecast: '200K',
    actual: '275K',
    note: 'Strong payroll additions with downward revisions.',
  },
  {
    id: 'eco-9',
    timestamp: Date.parse('2024-03-20T18:00:00Z'),
    currency: 'USD',
    event: 'FOMC Statement & Projections',
    impact: 'HIGH',
    previous: '5.50%',
    forecast: '5.50%',
    actual: '5.50%',
    note: 'Dot plot maintained three anticipated cuts for 2024.',
  },
];

/**
 * Returns strictly historical economic events up to the current replay timestamp T.
 * Eliminates lookahead bias by hiding all future economic calendar entries.
 */
export function getRevealedEconomicEvents(currentTimestamp: number): EconomicEvent[] {
  return MOCK_ECONOMIC_EVENTS.filter((e) => e.timestamp <= currentTimestamp).sort(
    (a, b) => b.timestamp - a.timestamp
  );
}
