export interface EconomicEvent {
  id: string;
  timestamp: number;          // UTC epoch ms
  timezone: string;           // 'America/New_York'
  currency: 'USD' | 'EUR' | 'GBP';
  event: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  previous: string;
  forecast: string;
  actual: string;             // True historical value
  note?: string;
}

export interface EconomicReleaseViewItem extends EconomicEvent {
  status: 'UPCOMING' | 'RELEASED';
  displayedActual: string;    // '—' if UPCOMING, actual if RELEASED
  isReleased: boolean;
}

export const HISTORICAL_ECONOMIC_EVENTS: EconomicEvent[] = [
  // ── January 2024 ──
  {
    id: 'eco-2024-01-05',
    timestamp: Date.parse('2024-01-05T13:30:00Z'), // 08:30 ET
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'Non-Farm Payrolls (NFP)',
    impact: 'HIGH',
    previous: '199K',
    forecast: '170K',
    actual: '216K',
    note: 'US economy added 216K jobs, surpassing forecasts.',
  },
  {
    id: 'eco-2024-01-11',
    timestamp: Date.parse('2024-01-11T13:30:00Z'),
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'US CPI (YoY)',
    impact: 'HIGH',
    previous: '3.1%',
    forecast: '3.2%',
    actual: '3.4%',
    note: 'Headline inflation accelerated slightly to 3.4%.',
  },
  {
    id: 'eco-2024-01-31',
    timestamp: Date.parse('2024-01-31T19:00:00Z'), // 14:00 ET
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'FOMC Rate Decision',
    impact: 'HIGH',
    previous: '5.50%',
    forecast: '5.50%',
    actual: '5.50%',
    note: 'Fed funds rate maintained at 5.25% - 5.50%.',
  },

  // ── March 2024 ──
  {
    id: 'eco-2024-03-08',
    timestamp: Date.parse('2024-03-08T13:30:00Z'),
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'Non-Farm Payrolls (NFP)',
    impact: 'HIGH',
    previous: '229K',
    forecast: '200K',
    actual: '275K',
    note: 'Hiring surged but wage growth cooled.',
  },
  {
    id: 'eco-2024-03-20',
    timestamp: Date.parse('2024-03-20T18:00:00Z'),
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'FOMC Statement & Economic Projections',
    impact: 'HIGH',
    previous: '5.50%',
    forecast: '5.50%',
    actual: '5.50%',
    note: 'Dot plot maintained expectation for 3 rate cuts in 2024.',
  },

  // ── August 2024 ──
  {
    id: 'eco-2024-08-02',
    timestamp: Date.parse('2024-08-02T12:30:00Z'), // 08:30 EDT
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'Non-Farm Payrolls (NFP)',
    impact: 'HIGH',
    previous: '179K',
    forecast: '175K',
    actual: '114K',
    note: 'Cooling labor market triggered recession fears.',
  },
  {
    id: 'eco-2024-08-14',
    timestamp: Date.parse('2024-08-14T12:30:00Z'),
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'US CPI (YoY)',
    impact: 'HIGH',
    previous: '3.0%',
    forecast: '2.9%',
    actual: '2.9%',
    note: 'CPI slowed under 3.0% for the first time since 2021.',
  },
  {
    id: 'eco-2024-08-23',
    timestamp: Date.parse('2024-08-23T14:00:00Z'), // 10:00 EDT
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'Fed Chair Powell Speech (Jackson Hole)',
    impact: 'HIGH',
    previous: '—',
    forecast: '—',
    actual: 'Dovish',
    note: 'Powell announced "the time has come for policy to adjust".',
  },

  // ── September 2024 (Replay Focus Week) ──
  {
    id: 'eco-2024-09-06',
    timestamp: Date.parse('2024-09-06T12:30:00Z'), // 08:30 EDT
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'US Non-Farm Payrolls (August)',
    impact: 'HIGH',
    previous: '114K',
    forecast: '161K',
    actual: '142K',
    note: 'Mixed report with prior months revised down.',
  },
  {
    id: 'eco-2024-09-11',
    timestamp: Date.parse('2024-09-11T12:30:00Z'), // 08:30 EDT
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'US Core CPI (MoM)',
    impact: 'HIGH',
    previous: '0.2%',
    forecast: '0.2%',
    actual: '0.3%',
    note: 'Core CPI slightly firmer at 0.3% due to shelter costs.',
  },
  {
    id: 'eco-2024-09-12',
    timestamp: Date.parse('2024-09-12T12:30:00Z'), // 08:30 EDT
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'US Initial Jobless Claims',
    impact: 'MEDIUM',
    previous: '228K',
    forecast: '227K',
    actual: '230K',
    note: 'Claims remained steady in 230K range.',
  },
  {
    id: 'eco-2024-09-16',
    timestamp: Date.parse('2024-09-16T12:30:00Z'), // 08:30 EDT
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'NY Empire State Manufacturing Index',
    impact: 'MEDIUM',
    previous: '-4.7',
    forecast: '-3.9',
    actual: '11.5',
    note: 'Surprise positive expansion in NY regional manufacturing.',
  },
  {
    id: 'eco-2024-09-17',
    timestamp: Date.parse('2024-09-17T12:30:00Z'), // 08:30 EDT
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'US Retail Sales (MoM)',
    impact: 'HIGH',
    previous: '1.1%',
    forecast: '-0.2%',
    actual: '0.1%',
    note: 'Resilient consumer spending surprised to upside.',
  },
  {
    id: 'eco-2024-09-18-rate',
    timestamp: Date.parse('2024-09-18T18:00:00Z'), // 14:00 EDT
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'FOMC Interest Rate Decision',
    impact: 'HIGH',
    previous: '5.50%',
    forecast: '5.25%',
    actual: '5.00%',
    note: 'Federal Reserve delivered supersized 50 bps rate cut to 4.75%-5.00%.',
  },
  {
    id: 'eco-2024-09-18-press',
    timestamp: Date.parse('2024-09-18T18:30:00Z'), // 14:30 EDT
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'FOMC Press Conference (Chair Powell)',
    impact: 'HIGH',
    previous: '—',
    forecast: '—',
    actual: 'Accommodative',
    note: 'Powell framed 50 bps cut as "recalibration" to defend strong labor market.',
  },
  {
    id: 'eco-2024-09-19',
    timestamp: Date.parse('2024-09-19T12:30:00Z'), // 08:30 EDT
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'US Initial Jobless Claims',
    impact: 'MEDIUM',
    previous: '231K',
    forecast: '230K',
    actual: '219K',
    note: 'Jobless claims fell to 4-month low of 219K.',
  },
  {
    id: 'eco-2024-09-27',
    timestamp: Date.parse('2024-09-27T12:30:00Z'), // 08:30 EDT
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'US Core PCE Price Index (MoM)',
    impact: 'HIGH',
    previous: '0.2%',
    forecast: '0.2%',
    actual: '0.1%',
    note: 'Fed preferred inflation gauge rose just 0.1%, confirming disinflation.',
  },

  // ── October / November 2024 ──
  {
    id: 'eco-2024-10-04',
    timestamp: Date.parse('2024-10-04T12:30:00Z'),
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'Non-Farm Payrolls (NFP)',
    impact: 'HIGH',
    previous: '159K',
    forecast: '140K',
    actual: '254K',
    note: 'Blowout jobs report crushed recession fears.',
  },
  {
    id: 'eco-2024-11-07',
    timestamp: Date.parse('2024-11-07T19:00:00Z'),
    timezone: 'America/New_York',
    currency: 'USD',
    event: 'FOMC Rate Decision',
    impact: 'HIGH',
    previous: '5.00%',
    forecast: '4.75%',
    actual: '4.75%',
    note: 'Fed enacted 25 bps rate cut following presidential election.',
  },
];

export const MOCK_ECONOMIC_EVENTS: EconomicEvent[] = HISTORICAL_ECONOMIC_EVENTS;

/**
 * Returns economic events synchronized to current replay timestamp T.
 * 
 * Rules:
 * 1. An upcoming calendar window (up to 7 days after T) is visible to the trader,
 *    since scheduled event dates, forecasts, and previous values are known in advance.
 * 2. CRITICAL ZERO-LOOKAHEAD: For any event where event.timestamp > T:
 *    - status is 'UPCOMING'
 *    - displayedActual is hidden ('—')
 * 3. Once T >= event.timestamp:
 *    - status is 'RELEASED'
 *    - displayedActual reveals the historical 'actual' print.
 */
export function getSynchronizedEconomicTimeline(currentTimestamp: number): {
  upcoming: EconomicReleaseViewItem[];
  released: EconomicReleaseViewItem[];
  allVisible: EconomicReleaseViewItem[];
} {
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const upcoming: EconomicReleaseViewItem[] = [];
  const released: EconomicReleaseViewItem[] = [];
  const allVisible: EconomicReleaseViewItem[] = [];

  for (const event of HISTORICAL_ECONOMIC_EVENTS) {
    const isReleased = event.timestamp <= currentTimestamp;

    if (isReleased) {
      // Released event: happened in the past relative to T
      // Include events up to 30 days prior to T for immediate context
      if (currentTimestamp - event.timestamp <= THIRTY_DAYS_MS || HISTORICAL_ECONOMIC_EVENTS.length <= 15) {
        const item: EconomicReleaseViewItem = {
          ...event,
          status: 'RELEASED',
          displayedActual: event.actual,
          isReleased: true,
        };
        released.push(item);
        allVisible.push(item);
      }
    } else {
      // Upcoming event: scheduled in the future relative to T
      // Show events scheduled within the upcoming 7 days
      if (event.timestamp - currentTimestamp <= ONE_WEEK_MS) {
        const item: EconomicReleaseViewItem = {
          ...event,
          status: 'UPCOMING',
          displayedActual: '—', // Strictly hidden to eliminate lookahead bias
          isReleased: false,
        };
        upcoming.push(item);
        allVisible.push(item);
      }
    }
  }

  // Sort upcoming chronologically (closest first)
  upcoming.sort((a, b) => a.timestamp - b.timestamp);

  // Sort released reverse-chronologically (newest first)
  released.sort((a, b) => b.timestamp - a.timestamp);

  // Combined: upcoming first (asc), then released (desc)
  const combined = [...upcoming, ...released];

  return { upcoming, released, allVisible: combined };
}

/**
 * Backward compatibility helper for existing callers
 */
export function getRevealedEconomicEvents(currentTimestamp: number): EconomicEvent[] {
  const { allVisible } = getSynchronizedEconomicTimeline(currentTimestamp);
  return allVisible.map((item) => ({
    id: item.id,
    timestamp: item.timestamp,
    timezone: item.timezone,
    currency: item.currency,
    event: item.event,
    impact: item.impact,
    previous: item.previous,
    forecast: item.forecast,
    actual: item.displayedActual, // strictly uses displayedActual ('—' if upcoming)
    note: item.note,
  }));
}
