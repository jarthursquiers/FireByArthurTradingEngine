import { IDataLoader } from "../brokerage/data-loader-interface";
import { TestDataLoader } from "../brokerage/test-data-loader";
import { TradingEngine } from "../engine/trading-engine";
import { Portfolio } from "../portfolio/portfolio";
import { OptionsPosition } from '../portfolio/optionsposition';
import { AlertConfig, AlertType } from '../alerts/alert-config';
import { TradeAlert } from '../alerts/trade-alert';
import { OpenPositionsSheet, OpenPositionsColumn } from '../sheets/open-positions-sheet';
import { ClosedPositionsSheet } from '../sheets/closed-positions-sheet';
import { EngineStateSheet } from '../sheets/engine-state-sheet';
import { EngineState, EngineStateProperty } from '../engine/engine-state';
import { compareDates, HashMap } from '../utils/util-classes';
import { TaskManager } from "../tasks/task-manager";
import { TestTask } from '../tasks/test-task';
import { ITask } from '../tasks/task-interface';
import { EngineConfigSheet } from '../sheets/engine-config-sheet';
import { EngineConfig, EngineConfigProperty } from '../engine/engine-config';
import { Constants } from "../utils/constants";
import { JLog, JLogLevel } from '../utils/jlog';
import { TDAmeritradeHub } from '../brokerage/tdameritrade/tdameritrade-hub';
import { TestData } from '../brokerage/testing/test-data';
import { TradeFinderData } from '../market/trade-finder-data';




export function googleSheetsTestSuite() : HashMap {
    let tPortfolio: Portfolio = getLoadedAndRefreshedPortfolio();
    let tOpenSheet: OpenPositionsSheet = new OpenPositionsSheet();
    let tClosedSheet: ClosedPositionsSheet = new ClosedPositionsSheet();
    JLog.setLogLevel(JLogLevel.DEBUG);
    JLog.setLoggingMethod((text) => {Logger.log(text)});

    tOpenSheet.deleteSheet();
    tClosedSheet.deleteSheet();

    tOpenSheet.write(tPortfolio);

    let passed: string[] = [];
    let failed: string[] = [];

    testOpenPositionSheetValues(passed, failed);
    testEngineStateSheet(passed, failed);
    testEngineConfigSheet(passed, failed);
    testEngineConfigSheet(passed, failed);


    runStandaloneTests(passed, failed);

    console.log(`======= TESTS RUN ON ${new Date()} =========`);
    console.log(`Tests PASSED: ${passed.length}`);
    console.log(`Tests FAILED: ${failed.length}`);

    for (let msg of failed) {
        console.log(`Failure Message: ${msg}`);
    }

    let testResults : HashMap = new HashMap();
    testResults.put("passed",passed);
    testResults.put("failed",failed);

    return testResults;
}

export function standaloneTestSuite() {
    let passed: string[] = [];
    let failed: string[] = [];

    runStandaloneTests(passed, failed);

    console.log(`Tests PASSED: ${passed.length}`);
    console.log(`Tests FAILED: ${failed.length}`);

    for (let msg of failed) {
        console.log(`Failure Message: ${msg}`);
    }

}

function testEngineStateSheet(passed: string[], failed: string[]) {
    let engineStateSheet : EngineStateSheet = new EngineStateSheet();
    engineStateSheet.deleteSheet();

    let engineState : EngineState = EngineState.instance();
    let now : Date = new Date();
    engineState.setState(EngineStateProperty.DateLastCSVLoad,now);
    engineStateSheet.write(engineState);

    let freshEngineState : EngineState = EngineState.instance();
    engineStateSheet.read(freshEngineState);

    let csvDate = new Date(freshEngineState.getState(EngineStateProperty.DateLastCSVLoad));

    if (compareDates(now, csvDate) === 0) {
        passed.push(`Engine state saved and read Date properly`);
    }
    else {
        failed.push(`Engine date dates did not match: ${now.getTime()} | ${csvDate.getTime()}`);
    }

}

function testEngineConfigSheet(passed: string[], failed: string[]) {
    let engineConfigSheet : EngineConfigSheet = new EngineConfigSheet();
    engineConfigSheet.deleteSheet();

    let engineConfig : EngineConfig = EngineConfig.instance();
    let now : Date = new Date();
    engineConfig.setConfig(EngineConfigProperty.CSVLoadFormat,Constants.TASTYWORKS_BROKERAGE);
    engineConfigSheet.write(engineConfig);

    let freshEngineConfig : EngineConfig = EngineConfig.instance();
    engineConfigSheet.read(freshEngineConfig);

    

    if (engineConfig.getConfig(EngineConfigProperty.CSVLoadFormat) === Constants.TASTYWORKS_BROKERAGE) {
        passed.push(`Engine config saved properly`);
    }
    else {
        failed.push(`Engine config did not match ${Constants.TASTYWORKS_BROKERAGE}: ${engineConfig.getConfig(EngineConfigProperty.CSVLoadFormat)}`);
    }

}


function testOpenPositionSheetValues(passed: string[], failed: string[]) {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Open Positions");
    let delta: number = Number(sheet.getRange(12, OpenPositionsColumn.BiggestDelta).getValue());

    if (delta === 16) {
        passed.push(`Incorrect delta on open sheet ${delta}`);
    }
    else {
        failed.push(`Incorrect biggest delta on open sheet ${delta}`);
    }

    Portfolio.clean();
    let tPortfolio: Portfolio = Portfolio.instance();
    let tOpenSheet: OpenPositionsSheet = new OpenPositionsSheet();
    tOpenSheet.deleteSheet();
    let testDataLoader: TestDataLoader = new TestDataLoader();
    testDataLoader.loadCSVData(tPortfolio, true);
    //Populate portfolio with what is already in the Open Sheet (to get original position values)
    tOpenSheet.write(tPortfolio);
    //Now refresh the portfolio with fresh data
    JLog.debug(`testOpenPositionSheetValues(): just read portfolio: ${tPortfolio}`);
    refreshPortfolioWithTestData(tPortfolio);
    // Write it back out to the sheets

    if (JLog.isDebug()) JLog.debug("testPopenPositionSheetValue: Portfolio before writing, and the FXI getliq is:"+tPortfolio.getPosition("FXI").getOpenNetLiq());
    tOpenSheet.write(tPortfolio);

    let tClosedSheet: ClosedPositionsSheet = new ClosedPositionsSheet();
    let tPL = Number(tClosedSheet.getSheet().getRange(2, OpenPositionsColumn.ProfitLoss).getValue());

    if (tPL == -78) {
        passed.push(`Correct PL for closed item ${tPL}`);
    }
    else {
        failed.push(`Incorrect PL for closed item ${tPL}`);
    }


}

function runStandaloneTests(passed: string[], failed: string[]) {
    Portfolio.clean();

    testPortfolioLoad(passed, failed);
    testAlertsSystem(passed, failed);
    testTaskManager(passed, failed);
    testTradeFinder(passed, failed);

}

function testTradeFinder(passed : string[], failed: string[]) {
    let tdaHub = new TDAmeritradeHub();
    let prefDate = tdaHub.getPreferredExpirationDate(TestData.TDAOptionChainString);
    let targetDate = "2019-06-28";
    if (prefDate === targetDate) passed.push("Passed the getPreferredExpirationDate");
    else failed.push("Failed getPreferredExpiration date");

    let tradeData : TradeFinderData = tdaHub.getTradeDataFromFullChain(TestData.TDA_FULL_CHAIN);
    if (tradeData.bidAskSpread === 4) passed.push("Passed full trade data");
    else failed.push("Failed full data chain");
}

function testTaskManager(passed : string[], failed: string[]) {
    let taskManager : TaskManager = new TaskManager();
    //Some tasks require Google Drive, so standalone tests can load them
 //   taskManager.loadTasks();
    let testTask : TestTask = new TestTask();
    testTask.setFrequency(5);
    taskManager.addTask(testTask);
    taskManager.runTasks();

    if (taskManager.getTaskRunCount() === 1) {
        passed.push(`Correct number of tasks ran ${taskManager.getTaskRunCount()}`);
    }
    else {
        failed.push(`Incorrect number of tasks ran ${taskManager.getTaskRunCount()}`);
    }

    //Shouldn't run when the frequency is 0
    testTask.setFrequency(0);
    taskManager.resetRunCount();
    taskManager.runTasks();

    if (taskManager.getTaskRunCount() === 0) {
        passed.push(`Correct number of tasks ran ${taskManager.getTaskRunCount()}`);
    }
    else {
        failed.push(`Incorrect number of tasks ran ${taskManager.getTaskRunCount()}`);
    }
}

export function testAlertsSystem(passed: string[], failed: string[]) {
    let tPortfolio = getLoadedAndRefreshedPortfolio();
    let tradeEngine: TradingEngine = new TradingEngine();
    let tAlertConfig: AlertConfig = new AlertConfig(AlertType.MaxLoss, -50);
    tradeEngine.addAlertConfig(tAlertConfig);

    let alerts: TradeAlert[] = tradeEngine.processAlerts(tPortfolio);

    if (alerts.length === 5) {
        passed.push("Correct alerts number");
    }
    else {
        failed.push(`Failed alert count ${alerts.length}`);
    }
}

export function testPortfolioLoad(passed: string[], failed: string[]) {
    Portfolio.setInstantiateLoadFunction((portfolio) => {
        let testDataLoader: TestDataLoader = new TestDataLoader();
        testDataLoader.loadCSVData(portfolio,true);
    });
    let tPortfolio = Portfolio.instance();

   
    tPortfolio.addCreditForRoll(55, "EEM");
    let aPosition: OptionsPosition = tPortfolio.getPosition("EEM");
    if (aPosition.getTotalPositionCreditReceived() === 157) {
        passed.push("Credit for rolling.");
    }
    else {
        failed.push("EEM total credit receieved didn't match 157: " + aPosition.getTotalPositionCreditReceived());
    }

    Portfolio.clean();
    tPortfolio = Portfolio.instance();
    let testDataLoader = new TestDataLoader();
    testDataLoader.loadCSVData(tPortfolio, true);

    aPosition = tPortfolio.getPosition("GLD");
    if (aPosition.options.length === 2) {
        passed.push("Got 2 GLD baack");
    }
    else {
        failed.push("GLD count got back was wrong");
    }

    aPosition = tPortfolio.getPosition("GLD");
    if (aPosition.getBiggestDelta() === 15) {
        passed.push("Got correct biggest Delta back for GLD");
    }
    else {
        failed.push("Biggest Delta value was wrong");
    }

    aPosition = tPortfolio.getPosition("TLT");
    if (aPosition.getQuantity() === 2) {
        passed.push("Got correct quantity for TLT");
    }
    else {
        failed.push(`Quantity for TLT is wrong ${aPosition.getQuantity()}`);
    }


    aPosition = tPortfolio.getPosition("FXI");
    if (aPosition.originalDTE === 123) {
        passed.push("Got correct original DTE");
    }
    else {
        failed.push(`Original DTE for FXI is wrong ${aPosition.originalDTE}`);
    }

    aPosition = tPortfolio.getPosition("GDX");
    if (aPosition.getStatus() === "Closed") {
        passed.push("GDX was closed.");
    }
    else {
        failed.push(`GDX is supposed to be closed, but it's ${aPosition.getStatus()}`);
    }
}

function getLoadedAndRefreshedPortfolio(): Portfolio {
    let tPortfolio = Portfolio.instance();
    let testDataLoader: TestDataLoader = new TestDataLoader();
    testDataLoader.loadCSVData(tPortfolio, true);
    tPortfolio.addCreditForRoll(55, "EEM");
    refreshPortfolioWithTestData(tPortfolio);

    return tPortfolio;
}

function refreshPortfolioWithTestData(portfolio: Portfolio) {
    let testDataLoader: TestDataLoader = new TestDataLoader();
    testDataLoader.loadCSVData(portfolio, false);
}

export function helloTests() {
    console.log("Hello Tests");
}