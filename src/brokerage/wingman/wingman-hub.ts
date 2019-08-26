import { Portfolio } from '../../portfolio/portfolio';
import { JLog } from '../../utils/jlog';
import { Option } from '../../market/option';
import { OptionsPosition } from '../../portfolio/optionsposition';
import { Stock } from '../../market/stock';


export class WingmanHub {

    loadOpenPositionsFromJSON(jsonString: string, portfolio: Portfolio) {
        let data = JSON.parse(jsonString);



        for (let underlying of data) {
            JLog.debug(`underlying: ` + underlying);
            let readInPosition = portfolio.getPosition(underlying.underlying);
            let wingmanPosition: OptionsPosition = new OptionsPosition();
            wingmanPosition.setAsWingman();
            wingmanPosition.readInPositionNetLiq = readInPosition.readInPositionNetLiq;
            wingmanPosition.originalBasis = parseFloat(underlying.original_basis);
            wingmanPosition.currentBasis = parseFloat(underlying.current_basis);
            wingmanPosition.amount = parseFloat(underlying.amount);
            wingmanPosition.quantity = parseFloat(underlying.quantity);
            wingmanPosition.originalCredit = wingmanPosition.originalBasis * (Math.abs(wingmanPosition.quantity)) * 100;
            wingmanPosition.symbol = underlying.underlying;
            wingmanPosition.account = underlying.account.name;
            portfolio.setPosition(underlying.underlying, wingmanPosition);


            for (let leg of underlying.legs) {

                let legClosed: boolean = false;
                let legType: string = "Call";


                for (let transaction of leg.transactions) {
                    if (transaction.instrument.indexOf("STOCK") > -1) legType = "Stock";
                    else if (transaction.instrument.indexOf("CALL") > -1) legType = "Call";
                    else legType = "Put";

                    if (transaction.order_action.indexOf("CLOSE") > -1) legClosed = true;

                }

                if (legType === "Call" || legType === "Put") {

                    let wOption: Option = new Option();

                    wOption.callOrPut = legType;
                    wOption.expirationDate = new Date(leg.expiration_date);
                    wOption.quantity = parseInt(leg.quantity);
                    wOption.cost = parseFloat(leg.original_basis);
                    wOption.netLiq = 0;
                    wOption.symbol = underlying.underlying;

                    wOption.strikePrice = parseFloat(leg.strike);



                    if (!legClosed) portfolio.addOption(wOption);
                }
                else {
                    let wStock: Stock = new Stock();
                    wStock.symbol = underlying.underlying;
                    wStock.shares = parseInt(leg.quantity);
                    if (!legClosed) wingmanPosition.addStock(wStock);
                }

            }
        }
    }

}