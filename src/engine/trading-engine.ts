import { Portfolio } from "../portfolio/portfolio";
import { AlertConfig, AlertType } from '../alerts/alert-config';
import { OptionsPosition } from '../portfolio/optionsposition';
import { TradeAlert } from "../alerts/trade-alert";
import { EngineConfig, EngineConfigProperty } from './engine-config';
import { EngineState, DataChangedType } from './engine-state';
import { JLog } from '../utils/jlog';
import { HighlightType } from '../sheets/open-positions-sheet';





export class TradingEngine {
    private alertConfigs: AlertConfig[] = [];
    private highlightFunction: (symbol: string, alertType: AlertType, highlightType: HighlightType, noteText : string) => void;

    setHighlightFunction(highlightFunction: (symbol: string, alertType: AlertType, highlightType: HighlightType, noteText) => void) {
        this.highlightFunction = highlightFunction;
    }

    addAlertConfig(alertConfig: AlertConfig) {
        this.alertConfigs.push(alertConfig);
    }

    loadAlerts() {
        let engineConfig: EngineConfig = EngineConfig.instance();
        let tAlertConfig: AlertConfig = new AlertConfig(
            AlertType.MaxLoss, Number(engineConfig.getConfig(EngineConfigProperty.ALERTMaxLossPercent)));
        this.alertConfigs.push(tAlertConfig);

        tAlertConfig = new AlertConfig(
            AlertType.MaxGain, Number(engineConfig.getConfig(EngineConfigProperty.ALERTMaxGainPercent)));
        this.alertConfigs.push(tAlertConfig);


        tAlertConfig = new AlertConfig(
            AlertType.DaysTillExpiration, Number(engineConfig.getConfig(EngineConfigProperty.ALERTDaysTillExpiration)));
        this.alertConfigs.push(tAlertConfig);

        tAlertConfig = new AlertConfig(
            AlertType.BiggestDelta, Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple1)));
        tAlertConfig.maxValue = Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple2));
        tAlertConfig.expectedAdjustmentCount = 1;
        this.alertConfigs.push(tAlertConfig);

        tAlertConfig = new AlertConfig(
            AlertType.BiggestDelta, Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple2)));
        tAlertConfig.maxValue = Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple3));
        tAlertConfig.expectedAdjustmentCount = 2;
        this.alertConfigs.push(tAlertConfig);

        tAlertConfig = new AlertConfig(
            AlertType.BiggestDelta, Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple3)));
        tAlertConfig.maxValue = Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple4));
        tAlertConfig.expectedAdjustmentCount = 3;
        this.alertConfigs.push(tAlertConfig);

        tAlertConfig = new AlertConfig(
            AlertType.BiggestDelta, Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple4)));
        tAlertConfig.maxValue = Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple5));
        tAlertConfig.expectedAdjustmentCount = 4;
        this.alertConfigs.push(tAlertConfig);

        tAlertConfig = new AlertConfig(
            AlertType.BiggestDelta, Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple5)));
        tAlertConfig.maxValue = Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple6));
        tAlertConfig.expectedAdjustmentCount = 5;
        this.alertConfigs.push(tAlertConfig);

        tAlertConfig = new AlertConfig(
            AlertType.BiggestDelta, Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple6)));
        tAlertConfig.maxValue = Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple7));
        tAlertConfig.expectedAdjustmentCount = 5;
        this.alertConfigs.push(tAlertConfig);

        tAlertConfig = new AlertConfig(
            AlertType.BiggestDelta, Number(engineConfig.getConfig(EngineConfigProperty.ALERTDeltaMultiple7)));
        tAlertConfig.maxValue = 110; //Note that the delta of an option cannot go over 100 so this is a safe cap
        tAlertConfig.expectedAdjustmentCount = 5;
        this.alertConfigs.push(tAlertConfig);

        if (engineConfig.getConfig(EngineConfigProperty.StrikeBreachAlertEnabled) === "1") {
            tAlertConfig = new AlertConfig(AlertType.StrikeBreached,Number(engineConfig.getConfig(EngineConfigProperty.StrikeBreachAlertEnabled)));
            this.alertConfigs.push(tAlertConfig);
        }

        if (engineConfig.getConfig(EngineConfigProperty.DailyReturnMetAlertEnabled) === "1") {
            tAlertConfig = new AlertConfig(AlertType.DailyReturnMet, Number(engineConfig.getConfig(EngineConfigProperty.DailyReturnMetAlertEnabled)));
            this.alertConfigs.push(tAlertConfig);
        }

        if (engineConfig.getConfig(EngineConfigProperty.JArthurRulesEnabled) === "1") {
            tAlertConfig = new AlertConfig(AlertType.JArthurRules, Number("1"));
            this.alertConfigs.push(tAlertConfig);
        }
    }

    processAlerts(portfolio: Portfolio): TradeAlert[] {
        if (JLog.isDebug()) JLog.debug("Running TradingEngine.processAlerts(): Begin");
        let tradeAlerts: TradeAlert[] = [];
        let positions: OptionsPosition[] = portfolio.getPositions();
        let engineState: EngineState = EngineState.instance();


        for (let position of positions) {
            if (EngineState.instance().getDataChangedType() === DataChangedType.EquityOnly && position.symbol.indexOf("./") > -1) {
                if (JLog.isDebug()) JLog.debug(`Only equity data was updated and this position is ${position.symbol} so we skip it`);
                continue;
            }
            //We need this because if we highlight the PLPercent for MaxGain we don't want it to go to normal 
            //after checking MaxLoss
            let plAlreadyHighlighted: boolean = false;
            let deltaAlreadyHighlighted: boolean = false;
            if (position.symbol == null) {
                JLog.error("One of the positiosn had a null/undefined symbol, so skipping it");
                continue;
            }
            for (let alertConfig of this.alertConfigs) {
                if (alertConfig.alertType === AlertType.BiggestDelta) {
                    //The biggest delta check is a multiple--so the biggest delta in the position must be >= the
                    //multiple times the original delta
                    if (JLog.isDebug()) JLog.debug(`GoingToCompareDelta for ${position.symbol}, biggest delta is ${position.getBiggestDelta()} 
                                 and readInBiggestDeltaOpen is ${position.readInBiggestDeltaOpen} alertConfig.alertValue: ${alertConfig.alertValue}
                                 alertConfig.maxValue: ${alertConfig.maxValue} (which totals value * open delta): ${alertConfig.alertValue * position.readInBiggestDeltaOpen}`);
                    //Check to see if an ajustment has already been made
                    let wAlreadyAdjusted : boolean = (position.rollCredits.length >= alertConfig.expectedAdjustmentCount);
                    if ((wAlreadyAdjusted === false) && (position.getBiggestDelta() >= alertConfig.alertValue * position.readInBiggestDeltaOpen) &&
                        (position.getBiggestDelta() < alertConfig.maxValue * position.readInBiggestDeltaOpen) ) {
                            if (JLog.isDebug()) JLog.debug(`Delta Alert being thrown! ${position.symbol} 
                                    Biggest Delta: ${position.getBiggestDelta()}
                                    Biggest Delta at Open: ${position.getBiggestDelta()}
                                    Alert value: ${alertConfig.alertValue}
                                    Alert max value: ${alertConfig.maxValue}`);

                        
                        let alertedState: string = engineState.getStateByStr(
                            `${position.symbol}-${AlertType[AlertType.BiggestDelta]}-${alertConfig.alertValue}`);

                        //Call highlight function
                        if (JLog.isDebug()) JLog.debug(`Biggest Delta exceeded alert ${position.symbol}, so setting to PINK`);
                        let newNote = null;
                        if (alertedState !== "Done") newNote = new Date()+": Biggest Delta Exceded";
                        this.highlightFunction(position.symbol, AlertType.BiggestDelta, HighlightType.PINK, newNote);
                        deltaAlreadyHighlighted = true;

                        if (alertedState === "Done") continue;
                        if (JLog.isDebug()) JLog.debug(`Creating Delta alert for ${position.symbol}`);
                        let alert = new TradeAlert();
                        alert.alertType = alertConfig.alertType;
                        alert.alertSymbol = position.symbol;
                        alert.alertMessage = `${position.symbol} Alert! Largest delta is ${position.getBiggestDelta()}`;
                        tradeAlerts.push(alert);
                        engineState.setStateByStr(
                            `${position.symbol}-${AlertType[AlertType.BiggestDelta]}-${alertConfig.alertValue}`,
                            "Done");
                    }
                    else if (deltaAlreadyHighlighted === false) {
                        if (JLog.isDebug()) JLog.debug(`MaxGain wasn't in threshold for ${position.symbol}, so setting to normal`);
                        if (this.highlightFunction != null)
                            this.highlightFunction(position.symbol, AlertType.BiggestDelta, HighlightType.NORMAL, null);
                    }
                }
                else if (alertConfig.alertType === AlertType.DaysTillExpiration) {
                    if (position.getDTE() < alertConfig.alertValue) {
                        if (JLog.isDebug()) JLog.debug(`DTE Alert being thrown! ${position.symbol}
                                   DTE: ${position.getDTE()}
                                    Alert value: ${alertConfig.alertValue}`);
                        let alertedState: string = engineState.getStateByStr(
                            `${position.symbol}-${AlertType[AlertType.DaysTillExpiration]}-${alertConfig.alertValue}`);

                        //Highligh function
                        if (this.highlightFunction != null) {
                            if (JLog.isDebug()) JLog.debug(`Under days till expiration threshold for ${position.symbol}, so setting to RED`);
                            let newNote = null;
                            if (alertedState !== "Done") newNote = new Date()+": Under days till expriation";
                            this.highlightFunction(position.symbol, AlertType.DaysTillExpiration, HighlightType.RED, newNote);
                        }
                        if (alertedState === "Done") continue;
                        if (JLog.isDebug()) JLog.debug(`Creating DTE Alert for ${position.symbol}`);
                        let alert = new TradeAlert();
                        alert.alertType = alertConfig.alertType;
                        alert.alertSymbol = position.symbol;
                        alert.alertMessage = `${position.symbol} Alert! DTE is ${position.getDTE()}`;
                        tradeAlerts.push(alert);
                        engineState.setStateByStr(
                            `${position.symbol}-${AlertType[AlertType.DaysTillExpiration]}-${alertConfig.alertValue}`,
                            "Done");
                    }
                    else {
                        if (JLog.isDebug()) JLog.debug(`DTE above threshold for ${position.symbol}, so setting to normal`);
                        if (this.highlightFunction != null)
                            this.highlightFunction(position.symbol, AlertType.DaysTillExpiration, HighlightType.NORMAL,null);
                    }
                }
                else if (alertConfig.alertType === AlertType.MaxGain) {
                    if (position.getPositionPLPercent() >= alertConfig.alertValue) {
                        if (JLog.isDebug()) JLog.debug(`Max Gain Alert being thrown! ${position.symbol}
                                    Position PL Percent: ${position.getPositionPLPercent()}
                                    Alert value: ${alertConfig.alertValue}`);
                        let alertedState: string = engineState.getStateByStr(
                            `${position.symbol}-${AlertType[AlertType.MaxGain]}-${alertConfig.alertValue}`);
                        //Highligh function
                        if (this.highlightFunction != null && plAlreadyHighlighted === false) {
                            if (JLog.isDebug()) JLog.debug(`MaxGain above threshold for ${position.symbol}, so setting to GREEN`);
                            if (this.highlightFunction != null) {
                                let newNote = null;
                                if (alertedState !== "Done") newNote = new Date()+": Max Gain Reached";
                                this.highlightFunction(position.symbol, AlertType.MaxGain, HighlightType.GREEN, newNote);
                                plAlreadyHighlighted = true;
                            }
                        }

                        if (alertedState === "Done") continue;
                        if (JLog.isDebug()) JLog.debug(`Creating Max Gain alert for ${position.symbol}`);
                        let alert = new TradeAlert();
                        alert.alertType = alertConfig.alertType;
                        alert.alertSymbol = position.symbol;
                        alert.alertMessage = `${position.symbol} Alert! P/L Percent is ${position.getPositionPLPercent()}%`;
                        tradeAlerts.push(alert);
                        engineState.setStateByStr(
                            `${position.symbol}-${AlertType[AlertType.MaxGain]}-${alertConfig.alertValue}`,
                            "Done");
                    }
                    else {
                        //Highligh function
                        if (this.highlightFunction != null && plAlreadyHighlighted === false) {
                            if (JLog.isDebug()) JLog.debug(`MaxGain didn't hit alert for ${position.symbol}, so setting to normal`);
                            this.highlightFunction(position.symbol, AlertType.MaxGain, HighlightType.NORMAL,null);
                        }
                    }
                }
                else if (alertConfig.alertType === AlertType.MaxLoss) {
                    if (position.getPositionPLPercent() <= alertConfig.alertValue) {
                        if (JLog.isDebug()) JLog.debug(`Max Loss Alert being thrown! ${position.symbol}
                                   Position PL Percent: ${position.getPositionPLPercent()}
                                   Alert value: ${alertConfig.alertValue}`);
                        let alertedState: string = engineState.getStateByStr(
                            `${position.symbol}-${AlertType[AlertType.MaxLoss]}-${alertConfig.alertValue}`);
                        //Highligh function
                        if (this.highlightFunction != null) {
                            if (JLog.isDebug()) JLog.debug(`MaxLoss in threshold for ${position.symbol}, so setting to RED`);
                            let newNote = null;
                            if (alertedState !== "Done") newNote = new Date()+": Max Loss Reached";
                            this.highlightFunction(position.symbol, AlertType.MaxLoss, HighlightType.RED, newNote);
                            plAlreadyHighlighted = true;
                        }

                        if (alertedState === "Done") continue;
                        if (JLog.isDebug()) JLog.debug(`Creating MaxLoss alert for ${position.symbol}`);
                        let alert = new TradeAlert();
                        alert.alertType = alertConfig.alertType;
                        alert.alertSymbol = position.symbol;
                        alert.alertMessage = `${position.symbol} Alert! P/L Percent is ${position.getPositionPLPercent()}%`;
                        tradeAlerts.push(alert);
                        engineState.setStateByStr(
                            `${position.symbol}-${AlertType[AlertType.MaxLoss]}-${alertConfig.alertValue}`,
                            "Done");
                    }
                    else {
                        //Highlight function
                        if (this.highlightFunction != null && plAlreadyHighlighted === false) {
                            if (JLog.isDebug()) JLog.debug(`MaxLoss wasn't in threshold for ${position.symbol}, so setting to normal`);
                            this.highlightFunction(position.symbol, AlertType.MaxLoss, HighlightType.NORMAL, null);
                        }
                    }

                }

                 //Strike Breached closing alert
                else if (alertConfig.alertType === AlertType.StrikeBreached) {
               
                    if (alertConfig.alertValue === 0) continue; //get outa here
                    //vars needed
                    let underlyingPrice = position.underlyingPrice;
                    if (underlyingPrice === 0) continue; //get outa here.

                    

                    if (JLog.isDebug()) JLog.debug(`GoingToCheckStrikeBreached for ${position.symbol}`);
                 

                    if (position.isStrikeBreached()) {
                        if (JLog.isDebug()) JLog.debug(`Strike Breached!! ${position.symbol}`);
                        let alertedState: string = engineState.getStateByStr(
                            `${position.symbol}-${AlertType[AlertType.StrikeBreached]}`);
                        //Highligh function
                        if (this.highlightFunction != null) {
                            if (JLog.isDebug()) JLog.debug(`Strike Breached ${position.symbol}, so setting to RED`);
                            if (this.highlightFunction != null) {
                                let newNote = null;
                                if (alertedState !== "Done") newNote = new Date()+": Strike Breached";
                                this.highlightFunction(position.symbol, AlertType.StrikeBreached, HighlightType.RED, newNote);
                            }
                        }

                        if (alertedState === "Done") continue;
                        if (JLog.isDebug()) JLog.debug(`Creating StrikeBreached alert for ${position.symbol}`);
                        let alert = new TradeAlert();
                        alert.alertType = alertConfig.alertType;
                        alert.alertSymbol = position.symbol;
                        alert.alertMessage = `${position.symbol} Alert! Strike Breached due to price at $${underlyingPrice}`;
                        tradeAlerts.push(alert);
                        engineState.setStateByStr(
                            `${position.symbol}-${AlertType[AlertType.StrikeBreached]}`,
                            "Done");
                    }
                    else {
                        //Highligh function
                        if (this.highlightFunction != null) {
                            if (JLog.isDebug()) JLog.debug(`StrikeBreached didn't hit alert for ${position.symbol}, so setting to normal`);
                            this.highlightFunction(position.symbol, AlertType.StrikeBreached, HighlightType.NORMAL, null);
                        }
                    }

                }

                else if (alertConfig.alertType === AlertType.DailyReturnMet) {
                    if (alertConfig.alertValue === 0) continue; //get outa here
                    //vars needed
                    let originalDTE = position.originalDTE;
                    let originalCredit = position.originalCredit;
                    let daysInTrade = position.daysInTrade;

                    let minimumPL = originalCredit / 4;
                    let positionPL = position.getPositionPL();

                    if (daysInTrade === 0) daysInTrade = 1;
                    if (originalDTE === 0) daysInTrade = 1;

                    let expectedProfitPerDay = originalCredit /  originalDTE;
                    let actualProfitPerDay = positionPL / daysInTrade;
                    

                    if (JLog.isDebug()) JLog.debug(`GoingToCheckDailyReturnMet for ${position.symbol}, originalDTE delta is ${originalDTE} 
                    and originalCredit is ${originalCredit} alertConfig.alertValue: ${alertConfig.alertValue}
                    daysInTrade: ${position.daysInTrade}, minimumPL: ${minimumPL}, positionPL: ${positionPL}
                     expectedProfitPerDay: ${expectedProfitPerDay}, actualProfitPerDay: ${actualProfitPerDay}`);
                 

                    if ((positionPL > minimumPL) && (actualProfitPerDay > expectedProfitPerDay)) {
                        if (JLog.isDebug()) JLog.debug(`Daily Return Met! ${position.symbol}`);
                        let alertedState: string = engineState.getStateByStr(
                            `${position.symbol}-${AlertType[AlertType.DailyReturnMet]}`);
                        //Highligh function
                        if (this.highlightFunction != null) {
                            if (JLog.isDebug()) JLog.debug(`Daily Return met ${position.symbol}, so setting to GREEN`);
                            if (this.highlightFunction != null) {
                                let newNote = null;
                                if (alertedState !== "Done") newNote =  new Date()+": Daily Return Met";
                                this.highlightFunction(position.symbol, AlertType.DailyReturnMet, HighlightType.GREEN, newNote);
                            }
                        }

                        if (alertedState === "Done") continue;
                        if (JLog.isDebug()) JLog.debug(`Creating DailyReturnMet alert for ${position.symbol}`);
                        let alert = new TradeAlert();
                        alert.alertType = alertConfig.alertType;
                        alert.alertSymbol = position.symbol;
                        alert.alertMessage = `${position.symbol} Alert! Daily Return is met at $${positionPL}`;
                        tradeAlerts.push(alert);
                        engineState.setStateByStr(
                            `${position.symbol}-${AlertType[AlertType.DailyReturnMet]}`,
                            "Done");
                    }
                    else {
                        //Highligh function
                        if (this.highlightFunction != null) {
                            if (JLog.isDebug()) JLog.debug(`DailyREturnMet didn't hit alert for ${position.symbol}, so setting to normal`);
                            this.highlightFunction(position.symbol, AlertType.DailyReturnMet, HighlightType.NORMAL, null);
                        }
                    }

                }

                else if (alertConfig.alertType === AlertType.JArthurRules) {
                    if (alertConfig.alertValue === 0) continue; //get outa here
                    //vars needed
                    let adjustmentsMade = 0;
                    if (position.rollCredits != null) adjustmentsMade = position.rollCredits.length;
                   


                    if ((adjustmentsMade === 1) && (position.getPositionPLPercent() >= 25)) {
                        if (JLog.isDebug()) JLog.debug(`Position had one adjustment and is over 25% profit! ${position.symbol}`);
                        let alertedState: string = engineState.getStateByStr(
                            `${position.symbol}-${AlertType[AlertType.JArthurRules]}`);
                        //Highligh function
                        if (this.highlightFunction != null) {
                            if (JLog.isDebug()) JLog.debug(`Position had JArthurRules met ${position.symbol}, so setting to GREEN`);
                            if (this.highlightFunction != null) {
                                let newNote = null;
                                if (alertedState !== "Done") newNote = new Date()+": 25% profit met with one adjustment";
                                this.highlightFunction(position.symbol, AlertType.JArthurRules, HighlightType.GREEN, newNote);
                                plAlreadyHighlighted = true;
                            }
                        }

                        if (alertedState === "Done") continue;
                        if (JLog.isDebug()) JLog.debug(`Creating JArthurRules alert for ${position.symbol}`);
                        let alert = new TradeAlert();
                        alert.alertType = alertConfig.alertType;
                        alert.alertSymbol = position.symbol;
                        alert.alertMessage = `${position.symbol} Alert! Position had one adjustment and profit is at $${position.getPositionPLPercent()}`;
                        tradeAlerts.push(alert);
                        engineState.setStateByStr(
                            `${position.symbol}-${AlertType[AlertType.JArthurRules]}`,
                            "Done");
                    }
                    else if (adjustmentsMade > 1 && position.getPositionPLPercent() >= 0 ) {
                        let alertedState: string = engineState.getStateByStr(
                            `${position.symbol}-${AlertType[AlertType.JArthurRules]}`);
                        //Highligh function
                        if (this.highlightFunction != null) {
                            if (JLog.isDebug()) JLog.debug(`Position had JARthurRules met ${position.symbol}, so setting to GREEN`);
                            let newNote = null;
                            if (alertedState !== "Done") newNote = new Date()+": Above 0 profit with multiple adjustments";
                                this.highlightFunction(position.symbol, AlertType.JArthurRules, HighlightType.GREEN, newNote);
                                plAlreadyHighlighted = true;
                        }

                        if (alertedState === "Done") continue;
                        if (JLog.isDebug()) JLog.debug(`Creating JArthurRules alert for ${position.symbol}`);
                        let alert = new TradeAlert();
                        alert.alertType = alertConfig.alertType;
                        alert.alertSymbol = position.symbol;
                        alert.alertMessage = `${position.symbol} Alert! Position had multiple adjustments and profit is above 0 at $${position.getPositionPLPercent()}`;
                        tradeAlerts.push(alert);
                        engineState.setStateByStr(
                            `${position.symbol}-${AlertType[AlertType.JArthurRules]}`,
                            "Done");
                    }
                    else {
                        //Highligh function
                        if (plAlreadyHighlighted === false && this.highlightFunction != null) {
                            if (JLog.isDebug()) JLog.debug(`JArthurRulres didn't hit alert for ${position.symbol}, so setting to normal`);
                            this.highlightFunction(position.symbol, AlertType.JArthurRules, HighlightType.NORMAL, null);
                        }
                    }

                }
            }
        }

        engineState.persist();

        if (JLog.isDebug()) JLog.debug(`TradingEngine.processAlerts(): End`);
        return tradeAlerts;
    }

    fireUp(): string {
        return "We're really fired up!";
    }

}