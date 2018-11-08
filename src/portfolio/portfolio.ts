
import {OptionsPosition} from "../portfolio/optionsposition";
import {Option} from "../market/option"
import { HashMap } from '../utils/util-classes';
import { JLog } from '../utils/jlog';

export class Portfolio {
    private positions : HashMap = new HashMap();
    private static _instance : Portfolio;
    private static _instantiateLoadFunction : (portfolio : Portfolio) => void;
    private static _persistPortfolioFunction : (portfolio : Portfolio) => void;

    private constructor() {
        if (Portfolio._instantiateLoadFunction != null) {
            Portfolio._instantiateLoadFunction(this);
        }
    }

    static instance() : Portfolio {
        return Portfolio._instance || (Portfolio._instance = new Portfolio());
    }


    static clean() {
        Portfolio._instance = null;
        Portfolio._instantiateLoadFunction = null;
        Portfolio._persistPortfolioFunction = null;
    }

    static setInstantiateLoadFunction(instantiatePortfolioFunction : (portfolio : Portfolio) => void) {
        Portfolio._instantiateLoadFunction = instantiatePortfolioFunction;
    }

    static setPersistPortfolioFunction(persistPortfolioFunction : (portfolio : Portfolio) => void) {
        Portfolio._persistPortfolioFunction = persistPortfolioFunction;
    }

    persist() {
        if (Portfolio._persistPortfolioFunction != null) {
            Portfolio._persistPortfolioFunction(this);
        }
    }

    clearOptions() {
        for (let position of this.getPositions()) {
            position.clearOptions();
        }
    }

    clearReadInNetLiqs() {
        for (let position of this.getPositions()) {
            position.readInPositionNetLiq = 0;
        }
    }

    setPositionsNew(positionsNew : boolean) {
        for (let position of this.getPositions()) {
            position.newPosition = positionsNew;
        }
    }

    getPosition(symbol:string) : OptionsPosition {
        let wPos = this.positions.get(symbol);
        
        return wPos;
    }

    removePosition(symbol : string) {
        this.positions.remove(symbol);
    }

    setPosition(symbol:string, position: OptionsPosition) {
        if (symbol == null) JLog.error("Portfolio.setPosition()-> Adding a null/undefined position to the portfolio");
        else this.positions.put(symbol, position);
    }

    getPositions() : OptionsPosition[] {
        return this.positions.getValues();
    }

    addOption(option:Option) {
        let wPosition : OptionsPosition = this.getPosition(option.symbol);
        if (wPosition != null) {
            wPosition.addOption(option);
        }
        else {
            wPosition = new OptionsPosition();
            wPosition.symbol = option.symbol;
            wPosition.addOption(option);
            this.positions.put(wPosition.symbol,wPosition);
        }
    }


    addCreditForRoll(creditAmount : number, symbol : string ) {
        let wPosition : OptionsPosition = this.getPosition(symbol);

        if (wPosition == null) throw Error("Tried to add roll credit to a non-existing position");

        wPosition.addRollCredit(creditAmount);
    }


    getOpenProfitAndLoss() : number {
        let totalPL : number = 0;
        for (let position of this.getPositions()) {
            totalPL += position.getPositionPL();
        }

        return totalPL;
    }

    getHighestPLPercentPosition() : OptionsPosition {
        if (JLog.isDebug()) JLog.debug("Portfolio.getHighestPLPercentPosition: Begin");
        let hp : OptionsPosition = null;
        for (let position of this.getPositions()) {
            if (JLog.isDebug() && hp != null) JLog.debug(`${position.symbol} ${position.getPositionPLPercent()} | ${hp.symbol} ${hp.getPositionPLPercent()}`);
            if (hp == null) hp = position;
            else if (position.getPositionPLPercent() > hp.getPositionPLPercent()) {
                hp = position;
            }
        }
        if (JLog.isDebug()) JLog.debug("Portfolio.getHighestPLPercentPosition: End");
        return hp;
    }

    getLowestPLPercentPosition() : OptionsPosition {
        let lp : OptionsPosition;
        for (let position of this.getPositions()) {
            if (lp == null) lp = position;
            else if (position.getPositionPLPercent() < lp.getPositionPLPercent()) {
                lp = position;
            }
        }
        return lp;
    }




}