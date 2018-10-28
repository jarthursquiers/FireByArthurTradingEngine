import { TradeAlert } from './trade-alert';
import { EngineConfig, EngineConfigProperty } from '../engine/engine-config';
import { AlertType } from './alert-config';


export class NotificationSender {

    sendAlerts(alerts : TradeAlert[]) {
        let engineConfig : EngineConfig = EngineConfig.instance();
        let notificationEmails : string = engineConfig.getConfig(EngineConfigProperty.NotificationEmails);

        for (let alert of alerts) {
         //   MailApp.sendEmail(notificationEmails, `${alert.alertSymbol} ALERT, ${AlertType[alert.alertType]}`, alert.alertMessage);
         Logger.log("Would have sent email: "+alert.alertMessage);
        }
    }
}