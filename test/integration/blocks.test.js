import path from 'path';
import SeleniumHelper from '../helpers/selenium-helper';

const {
    clickText,
    clickBlocksCategory,
    clickButton,
    clickXpath,
    findByText,
    findByXpath,
    textExists,
    getDriver,
    getLogs,
    Key,
    loadUri,
    rightClickText,
    scope
} = new SeleniumHelper();

const uri = path.resolve(__dirname, '../../build/index.html');

let driver;

describe('Working with the blocks', () => {
    beforeAll(() => {
        driver = getDriver();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test('Blocks report when clicked in the toolbox', async () => {
        await loadUri(uri);
        await clickText('Code');
        await clickBlocksCategory('Operators');
        await clickText('join', scope.blocksTab); // Click "join <hello> <world>" block
        await findByText('apple banana', scope.reportedValue); // Tooltip with result
        const logs = await getLogs();
        await expect(logs).toEqual([]);
    });

    test('Switching sprites updates the block menus', async () => {
        await loadUri(uri);
        await clickBlocksCategory('Sound');
        // "Meow" sound block should be visible
        await findByText('Meow', scope.blocksTab);
        await clickText('Backdrops'); // Switch to the backdrop
        // Now "pop" sound block should be visible and motion blocks hidden
        await findByText('pop', scope.blocksTab);
        await clickBlocksCategory('Motion');
        await findByText('Stage selected: no motion blocks');

        const logs = await getLogs();
        await expect(logs).toEqual([]);
    });

    test('Creating variables', async () => {
        await loadUri(uri);
        await clickText('Code');
        await clickBlocksCategory('Variables');

        // Expect a default variable "my variable" to be visible
        await clickText('my\u00A0variable', scope.blocksTab);
        await findByText('0', scope.reportedValue);

        await clickText('Make a Variable');
        let el = await findByXpath("//input[@name='New variable name:']");
        await el.sendKeys('score');
        await clickButton('OK');
        await clickText('Make a Variable');
        el = await findByXpath("//input[@name='New variable name:']");
        await el.sendKeys('second variable');
        await clickButton('OK');

        // Make sure reporting works on a new variable
        await clickBlocksCategory('Variables');
        await clickText('score', scope.blocksTab);
        await findByText('0', scope.reportedValue); // Tooltip with result

        // And there should be a monitor visible
        await rightClickText('score', scope.monitors);
        await clickText('slider');
        await findByXpath("//input[@step='1']");

        // Changing the slider to a decimal should make it have a step size of 0.01
        await rightClickText('score', scope.monitors);
        await clickText('change slider range');
        el = await findByXpath("//input[@name='Maximum value']");
        await el.sendKeys('.1');
        await clickButton('OK');
        await findByXpath("//input[@step='0.01'][@max='100.1']");

        // Hiding the monitor via context menu should work
        await rightClickText('score', scope.monitors);
        await clickText('hide', scope.contextMenu);
        await driver.sleep(100);
        const monitorExists = await textExists('score', scope.monitors);
        await expect(monitorExists).toBeFalsy();

        const logs = await getLogs();
        await expect(logs).toEqual([]);
    });

    test('Creating a list', async () => {
        await loadUri(uri);
        await clickText('Code');
        await clickBlocksCategory('Variables');

        await clickText('Make a List');
        let el = await findByXpath("//input[@name='New list name:']");
        await el.sendKeys('list1');
        await clickButton('OK');

        // Click the "add <thing> to list" block 3 times
        await clickText('add', scope.blocksTab);
        await clickText('add', scope.blocksTab);
        await clickText('add', scope.blocksTab);
        await clickText('list1', scope.blocksTab);
        await findByText('thing thing thing', scope.reportedValue); // Tooltip with result

        // Interact with the monitor, adding an item
        await findByText('list1', scope.monitors); // Just to be sure it is there
        await clickText('+', scope.monitors);
        el = await findByXpath(`//body//${scope.monitors}//input`);
        await el.sendKeys('thing2');
        await el.click(); // Regression for "clicking active input erases value" bug.
        await clickText('list1', scope.monitors); // Blur the input to submit

        // Check that the list value has been propagated.
        await clickText('list1', scope.blocksTab);
        await findByText('thing thing thing thing2', scope.reportedValue); // Tooltip with result

        // Hiding the monitor via context menu should work
        await rightClickText('list1', scope.monitors);
        await clickText('hide', scope.contextMenu);
        await driver.sleep(100);
        const monitorExists = await textExists('list1', scope.monitors);
        await expect(monitorExists).toBeFalsy();

        const logs = await getLogs();
        await expect(logs).toEqual([]);
    });

    test('Custom procedures', async () => {
        await loadUri(uri);
        await clickBlocksCategory('My Blocks');
        await clickText('Make a Block');
        // Click on the "add an input" buttons
        await clickText('number or text', scope.modal);
        await clickText('boolean', scope.modal);
        await clickText('Add a label', scope.modal);
        await clickText('OK', scope.modal);

        // Make sure a "define" block has been added to the workspace
        await findByText('define', scope.blocksTab);

        const logs = await getLogs();
        await expect(logs).toEqual([]);
    });

    test('Adding an extension', async () => {
        await loadUri(uri);
        await clickXpath('//button[@title="Add Extension"]');

        await clickText('Pen');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for scroll animation
        // Make sure toolbox has been scrolled to the pen extension
        await findByText('stamp', scope.blocksTab);

        const logs = await getLogs();
        await expect(logs).toEqual([]);
    });

    test('Record option from sound block menu opens sound recorder', async () => {
        await loadUri(uri);
        await clickText('Code');
        await clickBlocksCategory('Sound');
        await clickText('Meow', scope.blocksTab); // Click "play sound <Meow> until done" block
        await clickText('record'); // Click "record..." option in the block's sound menu
        // Access has been force denied, so close the alert that comes up
        await driver.sleep(1000); // getUserMedia requests are very slow to fail for some reason
        await driver.switchTo().alert()
            .accept();
        await findByText('Record Sound'); // Sound recorder is open
        const logs = await getLogs();
        await expect(logs).toEqual([]);
    });

    test('Renaming costume changes the default costume name in the toolbox', async () => {
        await loadUri(uri);

        // Rename the costume
        await clickText('Costumes');
        await clickText('costume2', scope.costumesTab);
        const el = await findByXpath("//input[@value='costume2']");
        await el.sendKeys('newname');
        await el.sendKeys(Key.ENTER);
        // wait until the updated costume appears in costume item list panel
        await findByXpath("//div[contains(@class,'sprite-selector-item_is-selected_')]" +
            "//div[contains(text(), 'newname')]");

        // Make sure it is updated in the block menu
        await clickText('Code');
        await clickBlocksCategory('Looks');
        await clickText('newname', scope.blocksTab);
    });

    test('Renaming costume with a special character should not break toolbox', async () => {
        await loadUri(uri);

        // Rename the costume
        await clickText('Costumes');
        await clickText('costume2', scope.costumesTab);
        const el = await findByXpath("//input[@value='costume2']");
        await el.sendKeys('<NewCostume>');
        await el.sendKeys(Key.ENTER);
        // wait until the updated costume appears in costume item list panel
        await findByXpath("//div[contains(@class,'sprite-selector-item_is-selected_')]" +
            "//div[contains(text(), '<NewCostume>')]");

        // Make sure it is updated in the block menu
        await clickText('Code');
        await clickBlocksCategory('Looks');
        await clickText('<NewCostume>', scope.blocksTab);

        await clickBlocksCategory('Sound');
    });

    test('Adding costumes DOES update the default costume name in the toolbox', async () => {
        await loadUri(uri);

        // By default, costume2 is in the costume tab
        await clickBlocksCategory('Looks');
        await clickText('costume2', scope.blocksTab);

        // Also check that adding a new costume does update the list
        await clickText('Costumes');
        const el = await findByXpath('//button[@aria-label="Choose a Costume"]');
        await driver.actions().mouseMove(el)
            .perform();
        await driver.sleep(500); // Wait for thermometer menu to come up
        await clickXpath('//button[@aria-label="Paint"]');
        // wait until the new costume appears in costume item list panel
        await findByXpath("//div[contains(@class,'sprite-selector-item_is-selected_')]" +
            "//div[contains(text(), 'costume3')]");
        await clickText('costume3', scope.costumesTab);
        // Check that the menu has been updated
        await clickText('Code');
        await clickText('costume3', scope.blocksTab);
    });

    // Skipped because it was flakey on travis, but seems to run locally ok
    test('Adding a sound DOES update the default sound name in the toolbox', async () => {
        await loadUri(uri);
        await clickText('Sounds');
        await clickXpath('//button[@aria-label="Choose a Sound"]');
        await clickText('A Bass', scope.modal); // Should close the modal
        // wait until the selected sound appears in sounds item list panel
        await findByXpath("//div[contains(@class,'sprite-selector-item_is-selected_')]" +
            "//div[contains(text(), 'A Bass')]");
        await clickText('Code');
        await clickBlocksCategory('Sound');
        await clickText('A\u00A0Bass', scope.blocksTab); // Need &nbsp; for block text
    });

    // Regression test for switching between editor/player causing toolbox to stop updating
    test('"See inside" after being on project page re-initializing variables', async () => {
        const playerUri = path.resolve(__dirname, '../../build/player.html');
        await loadUri(playerUri);
        await clickText('See inside');
        await clickBlocksCategory('Variables');
        await clickText('my\u00A0variable');

        await clickText('See Project Page');
        await clickText('See inside');

        await clickBlocksCategory('Variables');
        await clickText('my\u00A0variable');
    });

    // Regression test for switching editor tabs causing toolbox to stop updating
    test('Creating variables after adding extensions updates the toolbox', async () => {
        await loadUri(uri);
        await clickText('Costumes');
        await clickText('Code');
        await clickBlocksCategory('Variables');
        await clickText('Make a List');
        const el = await findByXpath("//input[@name='New list name:']");
        await el.sendKeys('list1');
        await clickButton('OK');
        await clickText('list1', scope.blocksTab);
    });
});
