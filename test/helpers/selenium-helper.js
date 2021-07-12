jest.setTimeout(30000); // eslint-disable-line no-undef

import bindAll from 'lodash.bindall';
import 'chromedriver'; // register path
import webdriver from 'selenium-webdriver';

const {By, until, Button} = webdriver;

const USE_HEADLESS = process.env.USE_HEADLESS !== 'no';

// The main reason for this timeout is so that we can control the timeout message and report details;
// if we hit the Jasmine default timeout then we get a terse message that we can't control.
// The Jasmine default timeout is 30 seconds so make sure this is lower.
const DEFAULT_TIMEOUT_MILLISECONDS = 20 * 1000;

class SeleniumHelper {
    constructor () {
        bindAll(this, [
            'clickText',
            'clickButton',
            'clickXpath',
            'clickBlocksCategory',
            'elementIsVisible',
            'findByText',
            'textToXpath',
            'findByXpath',
            'textExists',
            'getDriver',
            'getSauceDriver',
            'getLogs',
            'loadUri',
            'rightClickText'
        ]);

        this.Key = webdriver.Key; // map Key constants, for sending special keys
    }

    elementIsVisible (element, timeoutMessage = 'elementIsVisible timed out') {
        return this.driver.wait(until.elementIsVisible(element), DEFAULT_TIMEOUT_MILLISECONDS, timeoutMessage);
    }

    get scope () {
        // List of useful xpath scopes for finding elements
        return {
            blocksTab: "*[@id='react-tabs-1']",
            costumesTab: "*[@id='react-tabs-3']",
            modal: '*[@class="ReactModalPortal"]',
            reportedValue: '*[@class="blocklyDropDownContent"]',
            soundsTab: "*[@id='react-tabs-5']",
            spriteTile: '*[starts-with(@class,"react-contextmenu-wrapper")]',
            monitors: '*[starts-with(@class,"stage_monitor-wrapper")]',
            contextMenu: '*[starts-with(@class,"react-contextmenu")]'
        };
    }

    getDriver () {
        const chromeCapabilities = webdriver.Capabilities.chrome();
        const args = [];
        if (USE_HEADLESS) {
            args.push('--headless');
        }

        // Stub getUserMedia to always not allow access
        args.push('--use-fake-ui-for-media-stream=deny');

        // Suppress complaints about AudioContext starting before a user gesture
        // This is especially important on Windows, where Selenium directs JS console messages to stdout
        args.push('--autoplay-policy=no-user-gesture-required');

        chromeCapabilities.set('chromeOptions', {args});
        chromeCapabilities.setLoggingPrefs({
            performance: 'ALL'
        });
        this.driver = new webdriver.Builder()
            .forBrowser('chrome')
            .withCapabilities(chromeCapabilities)
            .build();
        return this.driver;
    }

    getSauceDriver (username, accessKey, configs) {
        this.driver = new webdriver.Builder()
            .withCapabilities({
                browserName: configs.browserName,
                platform: configs.platform,
                version: configs.version,
                username: username,
                accessKey: accessKey
            })
            .usingServer(`http://${username}:${accessKey
            }@ondemand.saucelabs.com:80/wd/hub`)
            .build();
        return this.driver;
    }

    findByXpath (xpath, timeoutMessage = `findByXpath timed out for path: ${xpath}`) {
        return this.driver.wait(until.elementLocated(By.xpath(xpath)), DEFAULT_TIMEOUT_MILLISECONDS, timeoutMessage)
            .then(el => (
                this.driver.wait(el.isDisplayed(), DEFAULT_TIMEOUT_MILLISECONDS, `${xpath} is not visible`)
                    .then(() => el)
            ));
    }

    textToXpath (text, scope) {
        return `//body//${scope || '*'}//*[contains(text(), '${text}')]`;
    }

    findByText (text, scope) {
        return this.findByXpath(this.textToXpath(text, scope));
    }

    textExists (text, scope) {
        return this.driver.findElements(By.xpath(this.textToXpath(text, scope)))
            .then(elements => elements.length > 0);
    }

    loadUri (uri) {
        const WINDOW_WIDTH = 1024;
        const WINDOW_HEIGHT = 768;
        return this.driver
            .get(`file://${uri}`)
            .then(() => (
                this.driver.executeScript('window.onbeforeunload = undefined;')
            ))
            .then(() => (
                this.driver.manage()
                    .window()
                    .setSize(WINDOW_WIDTH, WINDOW_HEIGHT)
            ));
    }

    clickXpath (xpath) {
        return this.findByXpath(xpath).then(el => el.click());
    }

    clickText (text, scope) {
        return this.findByText(text, scope).then(el => el.click());
    }

    async clickBlocksCategory (categoryText) {
        // The toolbox is destroyed and recreated several times, so avoid clicking on a nonexistent element and erroring
        // out. First we wait for the block pane itself to appear, then wait 100ms for the toolbox to finish refreshing,
        // then finally click the toolbox text.

        await this.findByXpath('//div[contains(@class, "blocks_blocks")]');
        await this.driver.sleep(100);
        await this.clickText(categoryText, 'div[contains(@class, "blocks_blocks")]');
        await this.driver.sleep(500); // Wait for scroll to finish
    }

    rightClickText (text, scope) {
        return this.findByText(text, scope).then(el => this.driver.actions()
            .click(el, Button.RIGHT)
            .perform());
    }

    clickButton (text) {
        return this.clickXpath(`//button//*[contains(text(), '${text}')]`);
    }

    getLogs (whitelist) {
        if (!whitelist) {
            // Default whitelist
            whitelist = [
                'The play() request was interrupted by a call to pause()'
            ];
        }
        return this.driver.manage()
            .logs()
            .get('browser')
            .then(entries => entries.filter(entry => {
                const message = entry.message;
                for (let i = 0; i < whitelist.length; i++) {
                    if (message.indexOf(whitelist[i]) !== -1) {
                        return false;
                    } else if (entry.level !== 'SEVERE') {
                        return false;
                    }
                }
                return true;
            }));
    }
}

export default SeleniumHelper;
