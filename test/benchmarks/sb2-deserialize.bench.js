import fs from 'fs';
import path from 'path';
import {until} from 'selenium-webdriver';

import BenchmarkLogger from './benchmark-logger';
import SeleniumHelper from '../helpers/selenium-helper';

const {
    clickText,
    findByText,
    findByXpath,
    getDriver,
    loadUri
} = new SeleniumHelper();

const LOAD_TIMEOUT_MS = 10 * 60 * 1000;

const uri = path.resolve(__dirname, '../../build/index.html');

let driver;

describe('Benchmark SB2 deserialization', () => {
    beforeAll(() => {
        driver = getDriver();
    });

    afterAll(async () => {
        await driver.quit();
    });

    const projectFiles = fs.readdirSync(__dirname)
        .filter(f => f.match(/\.sb2$/i));

    test('Nonzero number of projects to benchmark', () => {
        expect(projectFiles.length).toBeGreaterThan(0);
    });

    const getLastPerformanceEntryByName = name =>
        driver.executeScript(
            innerName => performance
                .getEntriesByName(innerName)
                .slice(-1)
                // The return value of getEntries() contains DOM elements or other complex objects, so use `toJSON` to
                // filter problematic properties out. If you don't filter, you'll probably get an error like this:
                // WebDriverError: unknown error: unhandled inspector error:
                // {"code":-32000,"message":"Object reference chain is too long"}
                .map(entry => entry.toJSON())[0],
            name
        );

    const benchmarkOneFile = async filename => {
        expect(filename).toBeTruthy();

        await loadUri(uri);
        await clickText('File');

        // If headless mode is turned OFF this will pop up a file browser that will stay up, at least on Windows.
        // Ignore it: the `sendKeys` call below will choose a file to load but won't close the file browser.
        await clickText('Load from your computer');

        // Choose the file to load
        const fileInput = await findByXpath('//input[@accept=".sb,.sb2,.sb3"]');
        await fileInput.sendKeys(path.resolve(__dirname, filename));

        // Wait for load to start
        const loadingIndicator = await findByText('Loading Project');

        // Wait for load to finish
        await driver.wait(until.stalenessOf(loadingIndicator), LOAD_TIMEOUT_MS);
        await findByText('File');

        // Assume scratch-vm makes performance entries for project deserialization
        const {duration} = await getLastPerformanceEntryByName('scratch-vm-deserialize');
        BenchmarkLogger.log(duration, `Deserialize SB2: ${filename}`);
    };

    for (const filename of projectFiles) {
        const SAMPLE_COUNT = 5;
        for (let i = 1; i <= SAMPLE_COUNT; ++i) {
            test(`Benchmark deserialization run ${i}/${SAMPLE_COUNT} for: ${filename}`,
                async () => await benchmarkOneFile(filename),
                LOAD_TIMEOUT_MS
            );
        }
    }
});
