// This file is not actually a Jest script so we don't automatically get `jest` as a global
const jest = require('jest'); // eslint-disable-line jest/no-jest-import
const minilog = require('minilog');

const packageJson = require('../../package.json');
const BenchmarkLogger = require('./benchmark-logger.js');

minilog.enable();
const log = minilog('gui-bench');

const formatDuration = x => {
    if (Math.abs(x) >= 1000) {
        return `${(x / 1000).toFixed(2)}s`;
    }
    return `${x.toFixed(1)}ms`;
};

const runJest = () => {
    const jestConfig = Object.assign({}, packageJson.jest);

    // default: ["**/__tests__/**/*.js?(x)", "**/?(*.)(spec|test).js?(x)"]
    jestConfig.testMatch = ['**/?(*.)bench.js?(x)'];

    const jestArgs = [
        '--config', JSON.stringify(jestConfig)
    ];

    return jest.run(jestArgs);
};

const reportStatistics = samples => {
    for (const [tag, durationStrings] of Object.entries(samples)) {
        const durations = durationStrings.map(x => Number(x));
        const minDuration = formatDuration(Math.min.apply(null, durations));
        const maxDuration = formatDuration(Math.max.apply(null, durations));
        const avgDuration = formatDuration(durations.reduce((a, c) => a + c) / durations.length);
        log.info(`${tag} | min=${minDuration}, max=${maxDuration}, avg=${avgDuration}, runs=${durations.length}`);
    }
};

(async () => {
    await runJest();
    BenchmarkLogger.end();
    const samples = BenchmarkLogger.getLoggedSamples();
    log.info('Benchmark results:');
    log.info('==================');
    reportStatistics(samples);
})();
