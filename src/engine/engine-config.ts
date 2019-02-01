import { HashMap } from '../utils/util-classes';
import { Constants } from '../utils/constants';
import { JLogLevel } from '../utils/jlog';


export class EngineConfig {
    private configHash: HashMap = new HashMap();
    private static _instance: EngineConfig;

    private constructor() {

    }

    static instance(): EngineConfig {
        return EngineConfig._instance || (EngineConfig._instance = new EngineConfig());
    }

    setConfig(propertyName: EngineConfigProperty, value: string | number | Date) {
        this.configHash.put(EngineConfigProperty[propertyName], value);
    }

    getConfig(propertyName: EngineConfigProperty): string {
        return this.getConfigByStr(EngineConfigProperty[propertyName]);
    }

    getConfigByStr(propertyName: string): string {
        let configValue = this.configHash.get(propertyName);
        if (configValue == null) {
            configValue = this.getDefaultConfigValue(propertyName);
            this.setConfigByStr(propertyName, configValue);
        }

        return `${configValue}`;
    }

    setConfigByStr(propertyName: string, value: string | number | Date) {
        this.configHash.put(propertyName, value);
    }

    getAllPropertyNames() {
        return this.configHash.getKeys();
    }

    private getDefaultConfigValue(propertyName: string): string {
        let value = null;

        switch (propertyName) {
            case EngineConfigProperty[EngineConfigProperty.CSVLoadCheckFrequency]:
                value = "1";
                break;
            case EngineConfigProperty[EngineConfigProperty.CSVLoadFormat]:
                value = Constants.TASTYWORKS_BROKERAGE;
                break;
            case EngineConfigProperty[EngineConfigProperty.CSVLoadFileName]:
                value = "p.csv";
                break;
            case EngineConfigProperty[EngineConfigProperty.ALERTMaxLossPercent]:
                value = "-300";
                break;
            case EngineConfigProperty[EngineConfigProperty.ALERTMaxGainPercent]:
                value = "50";
                break;
            case EngineConfigProperty[EngineConfigProperty.ALERTDaysTillExpiration]:
                value = "50";
                break;
            case EngineConfigProperty[EngineConfigProperty.ALERTDeltaMultiple1]:
                value = "2";
                break;
            case EngineConfigProperty[EngineConfigProperty.ALERTDeltaMultiple2]:
                value = "4";
                break;
            case EngineConfigProperty[EngineConfigProperty.ALERTDeltaMultiple3]:
                value = "5";
                break;
            case EngineConfigProperty[EngineConfigProperty.ALERTDeltaMultiple4]:
                value = "6";
                break;
            case EngineConfigProperty[EngineConfigProperty.ALERTDeltaMultiple5]:
                value = "7";
                break;
            case EngineConfigProperty[EngineConfigProperty.ALERTDeltaMultiple6]:
                value = "8";
                break;
            case EngineConfigProperty[EngineConfigProperty.ALERTDeltaMultiple7]:
                value = "9b";
                break;
            case EngineConfigProperty[EngineConfigProperty.NotificationEmails]:
                value = "noreply@noreply.com";
                break;
            case EngineConfigProperty[EngineConfigProperty.DebugLevel]:
                value = JLogLevel[JLogLevel.DEBUG];
                break;
            case EngineConfigProperty[EngineConfigProperty.APIBroker]:
                value = Constants.TDAMERITRADE_BROKERAGE;
                break;
            case EngineConfigProperty[EngineConfigProperty.QuoteAPICallFrequency]:
                value = "0";
                break;
            case EngineConfigProperty[EngineConfigProperty.WatchFaceUpdateFrequency]:
                value = "0";
                break;
            case EngineConfigProperty[EngineConfigProperty.TDAmeritradeAPIClientId]:
                value = "Your.TDA.developer.ClientId";
                break;
            case EngineConfigProperty[EngineConfigProperty.TDAmeritradeAPIClientId]:
                value = "Your.TDA.developer.Secret";
                break;
            case EngineConfigProperty[EngineConfigProperty.TDAmeritradeAPIClientId]:
                value = "Your.TDA.developer.ClientId";
                break;
            case EngineConfigProperty[EngineConfigProperty.TDAmeritradeAPIClientId]:
                value = "Your.TDA.developer.Secret";
                break;
            case EngineConfigProperty[EngineConfigProperty.TDAmeritradeAPIClientId]:
                value = "Your.TDA.developer.ClientId";
                break;
            case EngineConfigProperty[EngineConfigProperty.PushoverAppKey]:
                value = "Your.Pushover.AppKey";
                break;
            case EngineConfigProperty[EngineConfigProperty.PushoverDeviceName]:
                value = "Your.Pushover.DeviceName";
                break;
            case EngineConfigProperty[EngineConfigProperty.PushoverUserKey]:
                value = "Your.Pushover.UserKey";
                break;
            case EngineConfigProperty[EngineConfigProperty.StrikeBreachAlertEnabled]:
                value = "0";
                break;
            case EngineConfigProperty[EngineConfigProperty.DailyReturnMetAlertEnabled]:
                value = "0";
                break;
            case EngineConfigProperty[EngineConfigProperty.PortfolioName]:
                value = "FBATE Portfolio";
                break;
            case EngineConfigProperty[EngineConfigProperty.JArthurRulesEnabled]:
                value = "0";
                break;
        }

        return value;
    }

}


export enum EngineConfigProperty {
    CSVLoadCheckFrequency,
    CSVLoadFormat,
    CSVLoadFileName,
    ALERTMaxLossPercent,
    ALERTMaxGainPercent,
    ALERTDeltaMultiple1,
    ALERTDeltaMultiple2,
    ALERTDeltaMultiple3,
    ALERTDeltaMultiple4,
    ALERTDeltaMultiple5,
    ALERTDeltaMultiple6,
    ALERTDeltaMultiple7,
    ALERTDaysTillExpiration,
    NotificationEmails,
    DebugLevel,
    APIBroker,
    QuoteAPICallFrequency,
    WatchFaceUpdateFrequency,
    TDAmeritradeAPIClientId,
    TDAmeritradeAPISecret,
    PushoverAppKey,
    PushoverUserKey,
    PushoverDeviceName,
    StrikeBreachAlertEnabled,
    DailyReturnMetAlertEnabled,
    PortfolioName,
    JArthurRulesEnabled
}