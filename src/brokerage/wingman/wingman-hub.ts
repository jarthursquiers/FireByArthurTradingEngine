import { Portfolio } from '../../portfolio/portfolio';
import { JLog } from '../../utils/jlog';
import { Option } from '../../market/option';
import { WingmanOptionPosition } from './wingman-optionposition';


export class WingmanHub {

    loadOpenPositionsFromJSON(jsonString: string, portfolio: Portfolio) {
        let data = JSON.parse(jsonString);



        for (let underlying of data) {
            JLog.debug(`underlying: ` + underlying);

            let wingmanPosition : WingmanOptionPosition = new WingmanOptionPosition();
            wingmanPosition.originalBasis = parseFloat(underlying.original_basis);
            wingmanPosition.currentBasis = parseFloat(underlying.current_basis);
            wingmanPosition.amount = parseFloat(underlying.amount);
            wingmanPosition.quantity = parseFloat(underlying.quantity);
            wingmanPosition.originalCredit = wingmanPosition.originalBasis * wingmanPosition.quantity * 100;
            portfolio.setPosition(underlying.underlying, wingmanPosition);


            for (let leg of underlying.legs) {

                let wOption : Option = new Option();
                let legClosed : boolean = false;

                wOption.expirationDate = new Date(leg.expiration_date);
                wOption.quantity = parseInt(leg.quantity);
                wOption.cost = parseFloat(leg.original_basis);
                wOption.netLiq = wOption.cost * -1;
                wOption.symbol = underlying.underlying;
                
                wOption.strikePrice = parseFloat(leg.strike);

                for (let transaction of leg.transactions) {
                    if (transaction.instrument.indexOf("CALL") > -1) wOption.callOrPut = "Call";
                    else wOption.callOrPut = "Put";
                    if (transaction.order_action.indexOf("CLOSE") > -1) legClosed = true;

                }

                if (!legClosed)  portfolio.addOption(wOption);

            }
        }
    }

}