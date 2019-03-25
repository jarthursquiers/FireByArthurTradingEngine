import { EngineConfig, EngineConfigProperty } from '../engine/engine-config';

//Display for values val|val|val|val (val4 has to be a number)
export function sendPushoverFull(title, subtext, percent, maintext) {


  var formData = {
    'token': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverAppKey),
    'user': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverUserKey),
    'device': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverDeviceName),
    'title': title,
    'subtext': subtext,
    'text': maintext,
    'count': percent,
    'percent': percent
  };

  var options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    'method': 'post',
    'payload': formData
  };

  var response = UrlFetchApp.fetch("https://api.pushover.net/1/glances.json", options);

  Logger.log(response);

}


function sendPushoverValue(value) {

  var formData = {
    'token': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverAppKey),
    'user': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverUserKey),
    'device': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverDeviceName),
    'text': 'Total P/L $' + value,
    'count': value + ""
  };

  var options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    'method': 'post',
    'payload': formData
  };

  var response = UrlFetchApp.fetch("https://api.pushover.net/1/glances.json", options);

  Logger.log(response);

}

//Display for values val|val|val|val (val4 has to be a number)
export function sendPushoverQuad(value1, value2, value3, value4) {

  var formData = {
    'token': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverAppKey),
    'user': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverUserKey),
    'device': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverDeviceName),
    'text': value1 + "|" + value2 + "|" + value3 + "|" + value4,
    'count': value4 + ""
  };

  var options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    'method': 'post',
    'payload': formData
  };

  var response = UrlFetchApp.fetch("https://api.pushover.net/1/glances.json", options);

  Logger.log(response);

}

//Display for values val|val|val|val (val4 has to be a number)
export function sendPushoverQuint(value1, value2, value3, value4, value5) {

  var formData = {
    'token': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverAppKey),
    'user': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverUserKey),
    'device': EngineConfig.instance().getConfig(EngineConfigProperty.PushoverDeviceName),
    'text': value1 + "|" + value2 + "|" + value3 + "|" + value4 + "|" + value5,
    'count': value5 + ""
  };

  var options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    'method': 'post',
    'payload': formData
  };

  var response = UrlFetchApp.fetch("https://api.pushover.net/1/glances.json", options);

  Logger.log(response);

}


function testSendPushoverValue() {
  sendPushoverValue(15);
}

function testSendPushoverQuad() {
  sendPushoverQuad("50%", "-10%", 28, 955);
}
