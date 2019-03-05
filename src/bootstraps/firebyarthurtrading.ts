import { OpenPositionsSheet } from '../sheets/open-positions-sheet';
import { Portfolio } from '../portfolio/portfolio';
import { IDataLoader } from '../brokerage/data-loader-interface';
import { TastyworksHub } from '../brokerage/tastyworks/tastyworks-hub';
import { HashMap } from '../utils/util-classes';
import { googleSheetsTestSuite } from './testing-engine';
import { TradingEngine } from '../engine/trading-engine';
import { TaskManager } from '../tasks/task-manager';
import { EngineStateSheet } from '../sheets/engine-state-sheet';
import { EngineState, DataChangedType, EngineStateProperty } from '../engine/engine-state';
import { EngineConfigSheet } from '../sheets/engine-config-sheet';
import { TradeFinderSheet } from '../sheets/trade-finder-sheet';
import { EngineConfig, EngineConfigProperty } from '../engine/engine-config';
import { TradeAlert } from '../alerts/trade-alert';
import { NotificationSender } from '../alerts/notification-sender';
import { JLog, JLogLevel } from '../utils/jlog';
import { TotalsSheet } from '../sheets/totals-sheet';
import { tdaLogin, authCallback, testTDAmeritrade } from '../brokerage/tdameritrade/tda-api';
import { TDAmeritradeHub } from '../brokerage/tdameritrade/tdameritrade-hub';
import { TradeFinderData } from '../market/trade-finder-data';
import { OptionsPosition } from '../portfolio/optionsposition';

export function FBATEOnOpen() {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Fire By Arthur Trading Engine')
      .addItem('Run','FBATERun')
      .addItem('Load CSV','FBATELoadCSVData')
      .addItem('Run Trade Finder','FBATERunTradeFinder')
      .addToUi();
}


export function FBATERun() {

      //setting it for Google Apps logging
    JLog.setLoggingMethod((text) => {console.log(text)});
    JLog.info("Starting the J. Arthur Trading Engine.");
    

    //All geared around the task manager. If there are no tasks,
    //We don't really want to do anything unless a task initiates it.
    // The state and config are singletons, we need them loaded first
    let engineConfigSheet : EngineConfigSheet = new EngineConfigSheet();
    let engineConfig : EngineConfig = EngineConfig.instance();
    engineConfigSheet.read(engineConfig);

    JLog.setLogLevel(JLogLevel[engineConfig.getConfig(EngineConfigProperty.DebugLevel)]);

    let engineStateSheet : EngineStateSheet = new EngineStateSheet();
    let engineState : EngineState = EngineState.instance();
    engineStateSheet.read(engineState);
    EngineState.setPersistStateFunction((engineState) => {
        engineStateSheet.write(engineState);
    });
    engineState.setDataChangedType(DataChangedType.NotChanged);

    Portfolio.setInstantiateLoadFunction((portfolio) => {
        let openSheet: OpenPositionsSheet = new OpenPositionsSheet();
        openSheet.read(portfolio);
    });

    Portfolio.setPersistPortfolioFunction((portfolio) => {
        let openSheet: OpenPositionsSheet = new OpenPositionsSheet();
        openSheet.write(portfolio);
        let totalsSheet: TotalsSheet = new TotalsSheet();
        totalsSheet.write(portfolio);
    });

    TastyworksHub.csvParseFunction = (csvString, delim) => {
        if (JLog.isDebug()) JLog.debug("Parsing the csvString with Utilities.parseCSV");
        let dataArray = Utilities.parseCsv(csvString);
        
        return dataArray;
    }


    let taskManager = new TaskManager();
    taskManager.loadTasks();
    taskManager.runTasks();

    //If there were tasks that ran and changed data)
    if (EngineState.instance().getDataChangedType() !== DataChangedType.NotChanged) {  
        //Data was updated in the portfolio, so persist it:
        Portfolio.instance().persist();

        let tradingEngine : TradingEngine = new TradingEngine();
        let openSheet: OpenPositionsSheet = new OpenPositionsSheet();
        tradingEngine.setHighlightFunction((symbol, alertType, highlightType, noteText) => {
            openSheet.highlightAlertedField(symbol, alertType, highlightType, noteText);    
        });
        tradingEngine.loadAlerts();

       let tradeAlerts : TradeAlert[] =  tradingEngine.processAlerts(Portfolio.instance());

       let notificationSender : NotificationSender = new NotificationSender();
       notificationSender.sendAlerts(tradeAlerts);

    }


    //We may have had to load default configs during this process. We'll persist out the total
    //Configuration we now have.
    engineConfigSheet.write(engineConfig);

}

export function FBATERunTradeFinder() {
    let engineConfigSheet : EngineConfigSheet = new EngineConfigSheet();
    let engineConfig : EngineConfig = EngineConfig.instance();
    engineConfigSheet.read(engineConfig);

    Portfolio.setInstantiateLoadFunction((portfolio) => {
        let openSheet: OpenPositionsSheet = new OpenPositionsSheet();
        openSheet.read(portfolio);
    });


    let tradeFinderSheet : TradeFinderSheet = new TradeFinderSheet();
    let tfSymbols : string[] = tradeFinderSheet.readSymbols();
    let tickerHash : HashMap = new HashMap();
    let tdHub : TDAmeritradeHub = new TDAmeritradeHub();
    for (let symbol of tfSymbols) {
        try {
            let tradeFinderData : TradeFinderData = tdHub.getTradeFinderData(symbol,true);
            let pos : OptionsPosition = Portfolio.instance().getPosition(symbol);
            if (pos != null) {
                tradeFinderData.positionHeld = true;
            }
            else {
                tradeFinderData.positionHeld = false;
            }
            tickerHash.put(symbol,tradeFinderData);
        }
        catch (e) {
            JLog.error(`Failed to get tradefinder data for symbol ${symbol}: ${e}`);
        }
  
    }

    tradeFinderSheet.write(tickerHash);
}


export function runCIProcess() {
    let testResults : HashMap = googleSheetsTestSuite();
    let passed : string[] = testResults.get("passed");
    let failed : string[] = testResults.get("failed");

    let msgString = `======= TESTS RUN ON ${new Date()} =========
    Tests PASSED: ${passed.length}
    Tests FAILED: ${failed.length}
    `;

    let subject = "All Tests Passed!";
    if (failed.length > 0) subject = `${failed.length} test failures!`;

    for (let msg of failed) {
        msgString += `Failure Message: ${msg}
        `
    }

    //TOTO: Change hard coding of CI contact method to a cofiguration object
    MailApp.sendEmail(EngineConfig.instance().getConfig(EngineConfigProperty.NotificationEmails),subject , msgString);
}

export function FBATELoadCSVData() {

    let engineConfigSheet : EngineConfigSheet = new EngineConfigSheet();
    let engineConfig : EngineConfig = EngineConfig.instance();
    engineConfigSheet.read(engineConfig);
    
    let engineStateSheet : EngineStateSheet = new EngineStateSheet();
    let engineState : EngineState = EngineState.instance();
    engineStateSheet.read(engineState);
    EngineState.setPersistStateFunction((engineState) => {
        engineStateSheet.write(engineState);
    });
    engineState.setDataChangedType(DataChangedType.NotChanged);

    let tOpenSheet: OpenPositionsSheet = new OpenPositionsSheet();
    let portfolio = Portfolio.instance();
    tOpenSheet.read(portfolio);
    let dataLoader : IDataLoader = new TastyworksHub();
    dataLoader.loadCSVData(portfolio);
    Logger.log("Loaded CSV data into portfolio");
    tOpenSheet.write(portfolio);

    engineState.persist();
}

export function tdAmeritradeLogin() {
       //setting it for Google Apps logging
    JLog.setLoggingMethod((text) => {console.log(text)});
    JLog.info("Starting the J. Arthur Trading Engine.");
    let engineConfigSheet : EngineConfigSheet = new EngineConfigSheet();
    let engineConfig : EngineConfig = EngineConfig.instance();
    engineConfigSheet.read(engineConfig);
    tdaLogin();
}

export function tdAmeritradeTest() {
    let engineConfigSheet : EngineConfigSheet = new EngineConfigSheet();
    let engineConfig : EngineConfig = EngineConfig.instance();
    engineConfigSheet.read(engineConfig);
    testTDAmeritrade();
}

export function testTDAGetTradeFinderData() {
       //Temporary testing out of getting the option chain
       let engineConfigSheet : EngineConfigSheet = new EngineConfigSheet();
       let engineConfig : EngineConfig = EngineConfig.instance();
       engineConfigSheet.read(engineConfig);
       let tdameritradeHub = new TDAmeritradeHub();
       tdameritradeHub.getTradeFinderData("SPY", true);
}

export function tdaCallback(request) {
       //setting it for Google Apps logging
    JLog.setLoggingMethod((text) => {console.log(text)});
    JLog.info("Starting the J. Arthur Trading Engine for tdaCallback.");
    let engineConfigSheet : EngineConfigSheet = new EngineConfigSheet();
    let engineConfig : EngineConfig = EngineConfig.instance();
    engineConfigSheet.read(engineConfig);
    return authCallback(request);
}