const analyticsService = require('../../services/analyticsService');

describe('Analytics Service', () => {
    describe('calculateMovingAverage', () => {
        it('should calculate 7-day moving average correctly', () => {
            const data = [
                { date: '2026-01-01', value: 80 },
                { date: '2026-01-02', value: 85 },
                { date: '2026-01-03', value: 90 },
                { date: '2026-01-04', value: 75 },
                { date: '2026-01-05', value: 88 },
                { date: '2026-01-06', value: 92 },
                { date: '2026-01-07', value: 87 }
            ];

            const result = analyticsService.calculateMovingAverage(data, 7);

            expect(result).toHaveLength(7);
            expect(result[6].movingAvg).toBeCloseTo(85.29, 1);
        });

        it('should return null for insufficient data points', () => {
            const data = [
                { date: '2026-01-01', value: 80 },
                { date: '2026-01-02', value: 85 }
            ];

            const result = analyticsService.calculateMovingAverage(data, 7);

            expect(result[0].movingAvg).toBeNull();
            expect(result[1].movingAvg).toBeNull();
        });
    });

    describe('detectAnomalies', () => {
        it('should detect outliers using Z-score', () => {
            const data = [
                { date: '2026-01-01', value: 80 },
                { date: '2026-01-02', value: 82 },
                { date: '2026-01-03', value: 81 },
                { date: '2026-01-04', value: 50 }, // Outlier
                { date: '2026-01-05', value: 79 },
                { date: '2026-01-06', value: 83 }
            ];

            const anomalies = analyticsService.detectAnomalies(data, 2);

            expect(anomalies).toHaveLength(1);
            expect(anomalies[0].date).toBe('2026-01-04');
        });
    });

    describe('forecastLinear', () => {
        it('should forecast future values using linear regression', () => {
            const data = [
                { date: '2026-01-01', value: 80 },
                { date: '2026-01-02', value: 82 },
                { date: '2026-01-03', value: 84 },
                { date: '2026-01-04', value: 86 }
            ];

            const forecast = analyticsService.forecastLinear(data, 3);

            expect(forecast).toHaveLength(3);
            expect(forecast[0].value).toBeGreaterThan(86);
            expect(forecast[0].type).toBe('forecast');
        });
    });
});
