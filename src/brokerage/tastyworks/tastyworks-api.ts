

export class TastyworksAPI {
    private static _instance : TastyworksAPI;

    private constructor() {
  
    }

    static instance() : TastyworksAPI {
        return TastyworksAPI._instance || (TastyworksAPI._instance = new TastyworksAPI());
    }

    sellStrangle(symbol : string, expiration : Date, putStrike : number, callStrike : number) {

    }


}


/**
 * def get_occ2010_symbol(self):
        strike_int, strike_dec = divmod(self.strike, 1)
        strike_int = int(round(strike_int, 5))
        strike_dec = int(round(strike_dec, 3) * 1000)

        res = '{ticker}{exp_date}{type}{strike_int}{strike_dec}'.format(
            ticker=self.ticker[0:6].ljust(6),
            exp_date=self.expiry.strftime('%y%m%d'),
            type=self.option_type.value,
            strike_int=str(strike_int).zfill(5),
            strike_dec=str(strike_dec).zfill(3)
        )
        return res
 */