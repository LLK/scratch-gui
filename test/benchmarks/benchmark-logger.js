const fs = require('fs');
const path = require('path');

const benchLogPath = path.resolve(__dirname, '../../build/scratch-benchmark.log');
const logEncoding = 'utf8';

class BenchmarkLogger {
    constructor () {
        this._stream = fs.createWriteStream(benchLogPath, {encoding: logEncoding});
    }

    /**
     * Close the log stream, flushing any buffered output.
     */
    end () {
        this._stream.end();
        this._stream = null;
    }

    /**
     * Record an action/sample to the log.
     * @param {number} duration - the duration of the action/sample.
     * @param {string} tag - a string to associate with this action/sample. Multiple samples of the same action should
     * use the same string.
     */
    log (duration, tag) {
        // this format must match what getLoggedSamples() expects below
        this._stream.write(`${duration}\t${tag}\n`);
    }

    /**
     * Retrieve samples from log. Must call end() first!
     * @returns {object.<array>} an object with keys representing the "tag" used in calls to `log`. Each key's value
     * is an array of numeric durations. For example: {'operation1': [2.1, 2.3, 2.2], 'operation2': [1.2, 1.4, 1.1]}
     */
    getLoggedSamples () {
        const benchmarkLog = this.getLogContents();
        const samples = {};
        // the use of split() and indexOf() here must match the format used by log() above
        for (const line of benchmarkLog.split('\n')) {
            const firstTabIndex = line.indexOf('\t');
            if (firstTabIndex < 0) continue;
            const duration = line.substr(0, firstTabIndex);
            const tag = line.substr(firstTabIndex + 1);
            if (samples[tag]) {
                samples[tag].push(duration);
            } else {
                samples[tag] = [duration];
            }
        }
        return samples;
    }

    /**
     * Retrieve raw contents of the log file. Must call end() first!
     * @returns {string} - log file contents.
     */
    getLogContents () {
        return fs.readFileSync(benchLogPath, {encoding: logEncoding});
    }
}

module.exports = new BenchmarkLogger();
