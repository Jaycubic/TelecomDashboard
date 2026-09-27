import { TelecomRecord, ComparisonMetrics } from '../types';

export function calculateComparison(
  airtelData: TelecomRecord[],
  jioData: TelecomRecord[]
): ComparisonMetrics {
  const calcMean = (data: TelecomRecord[], key: keyof TelecomRecord) => {
    if (!data.length) return 0;
    const sum = data.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0);
    return sum / data.length;
  };

  const airtelMos = calcMean(airtelData, 'mos');
  const jioMos = calcMean(jioData, 'mos');

  const airtelDropRate = calcMean(airtelData, 'drop_rate');
  const jioDropRate = calcMean(jioData, 'drop_rate');

  const airtelSetupTime = calcMean(airtelData, 'setup_time');
  const jioSetupTime = calcMean(jioData, 'setup_time');

  const airtelIndoorMos = calcMean(
    airtelData.filter(d => d.environment === 'INDOOR'),
    'mos'
  );
  const jioIndoorMos = calcMean(
    jioData.filter(d => d.environment === 'INDOOR'),
    'mos'
  );

  return {
    airtel: {
      mos: Number(airtelMos.toFixed(2)),
      dropRate: Number(airtelDropRate.toFixed(2)),
      setupTime: Number(airtelSetupTime.toFixed(2)),
      indoorMos: Number(airtelIndoorMos.toFixed(2)),
      sampleSize: airtelData.length
    },
    jio: {
      mos: Number(jioMos.toFixed(2)),
      dropRate: Number(jioDropRate.toFixed(2)),
      setupTime: Number(jioSetupTime.toFixed(2)),
      indoorMos: Number(jioIndoorMos.toFixed(2)),
      sampleSize: jioData.length
    },
    deltas: {
      mosDelta: Number((airtelMos - jioMos).toFixed(2)),
      dropRateDelta: Number((airtelDropRate - jioDropRate).toFixed(2)),
      winner: airtelMos > jioMos ? 'Airtel' : jioMos > airtelMos ? 'Jio' : 'Tie'
    }
  };
}