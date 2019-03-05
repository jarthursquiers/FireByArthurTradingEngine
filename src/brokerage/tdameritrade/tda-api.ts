import { JLog } from '../../utils/jlog';
import { EngineConfig, EngineConfigProperty } from '../../engine/engine-config';
import { EngineState, EngineStateProperty } from '../../engine/engine-state';
import { EngineConfigSheet } from '../../sheets/engine-config-sheet';



export function getTDAOptionsQuote(symbol: string, CALLorPUT: string, strike: string, expireDate: Date): string {
  var tdaService = getTDAService();
  let tdaClientId = EngineConfig.instance().getConfig(EngineConfigProperty.TDAmeritradeAPIClientId);

  let tmpDate = `${expireDate.toISOString().substring(0, 10)}`;
  var response = null;
  if (!tdaService.hasAccess()) {
    if (JLog.debug) JLog.debug("Getting quotes for ")
    response = UrlFetchApp.fetch("https://api.tdameritrade.com/v1/marketdata/chains?apikey=" + tdaClientId + "&symbol=" + symbol + "&contractType=" + CALLorPUT + "&strike=" + strike + "&fromDate=" + tmpDate + "&toDate=" + tmpDate);
  }
  else {
    response = UrlFetchApp.fetch("https://api.tdameritrade.com/v1/marketdata/chains?apikey=" + tdaClientId + "&symbol=" + symbol + "&contractType=" + CALLorPUT + "&strike=" + strike + "&fromDate=" + tmpDate + "&toDate=" + tmpDate, {
      headers: {
        Authorization: 'Bearer ' + tdaService.getAccessToken()
      }
    });

  }

  //End of handling the crazy tda request

  var responseString = response.getContentText();

  return responseString;
}

export function getTDAFullChain(symbol: string, expireDate: string, authenticate : boolean) {
  var tdaService = getTDAService();
  let tdaClientId = EngineConfig.instance().getConfig(EngineConfigProperty.TDAmeritradeAPIClientId);

  let exDate = expireDate;


  var response = null;
  if (authenticate === false || !tdaService.hasAccess()) {
    if (JLog.debug) JLog.debug("Getting options chain list for")
    response = UrlFetchApp.fetch("https://api.tdameritrade.com/v1/marketdata/chains?apikey=" + tdaClientId + "&symbol=" + symbol + "&range=OTM&&fromDate=" + exDate + "&toDate=" + exDate);
  }
  else {
    response = UrlFetchApp.fetch("https://api.tdameritrade.com/v1/marketdata/chains?apikey=" + tdaClientId + "&symbol=" + symbol + "&range=OTM&fromDate=" + exDate + "&toDate=" + exDate, {
      headers: {
        Authorization: 'Bearer ' + tdaService.getAccessToken()
      }
    });

  }

  //End of handling the crazy tda request

  var responseString = response.getContentText();

  return responseString;

}

export function getTDAOptionsChainList(symbol: string, beginDate: Date, endDate: Date, authenticate : boolean) {
  var tdaService = getTDAService();
  let tdaClientId = EngineConfig.instance().getConfig(EngineConfigProperty.TDAmeritradeAPIClientId);

  let bDate = `${beginDate.toISOString().substring(0,10)}`;
  let eDate = `${endDate.toISOString().substring(0,10)}`;

  var response = null;
  if (authenticate === false || !tdaService.hasAccess()) {
    if (JLog.debug) JLog.debug("Getting options chain list for")
    response = UrlFetchApp.fetch("https://api.tdameritrade.com/v1/marketdata/chains?apikey=" + tdaClientId + "&symbol=" + symbol + "&strikeCount=1&range=OTM&contractType=CALL&fromDate=" + bDate + "&toDate=" + eDate);
  }
  else {
    response = UrlFetchApp.fetch("https://api.tdameritrade.com/v1/marketdata/chains?apikey=" + tdaClientId + "&symbol=" + symbol + "&strikeCount=1&range=OTM&contractType=CALL&fromDate=" + bDate + "&toDate=" + eDate, {
      headers: {
        Authorization: 'Bearer ' + tdaService.getAccessToken()
      }
    });

  }

  //End of handling the crazy tda request

  var responseString = response.getContentText();

  return responseString;

}

export function isMarketOpen() {
  //Handle getting the data based on whether we have a login token or not
  var tdaService = getTDAService();
  let tdaClientId = EngineConfig.instance().getConfig(EngineConfigProperty.TDAmeritradeAPIClientId);
  EngineState.instance().setState(EngineStateProperty.MarketOpen, "false");

  var response = null;
  if (!tdaService.hasAccess()) {
    response = UrlFetchApp.fetch("https://api.tdameritrade.com/v1/marketdata/OPTION/hours?apikey=" + tdaClientId);
  }
  else {
    response = UrlFetchApp.fetch("https://api.tdameritrade.com/v1/marketdata/OPTION/hours?apikey=" + tdaClientId, {
      headers: {
        Authorization: 'Bearer ' + tdaService.getAccessToken()
      }
    });

  }

  var responseString = response.getContentText();

  if (JLog.isDebug()) JLog.debug(responseString);


  //Check if the market is even open today first. If not, we just return false
  var isOpen = parseValueFromJSON(responseString, "isOpen");
  if (isOpen === "false") return false;

  var data = JSON.parse(responseString);

  var startTimeString = data.option.EQO.sessionHours.regularMarket[0].start;
  var endTimeString = data.option.EQO.sessionHours.regularMarket[0].end;

  var startTime = new Date(startTimeString);
  var endTime = new Date(endTimeString);

  var now = new Date();


  if (now.valueOf() > startTime.valueOf() && now.valueOf() < endTime.valueOf()) {
    EngineState.instance().setState(EngineStateProperty.MarketOpen,"true");
    return true;
  }
  else return false;

}


export function testTDAmeritrade() {
  //Handle getting the data based on whether we have a login token or not
  var tdaService = getTDAService();
  let tdaClientId = EngineConfig.instance().getConfig(EngineConfigProperty.TDAmeritradeAPIClientId);

  var tmpSymbol = "XLI";
  var tmpType = "CALL";
  var tmpStrike = "70";
  var tmpDate = "2018-12-21";

  var response = null;
  if (!tdaService.hasAccess()) {
    response = UrlFetchApp.fetch("https://api.tdameritrade.com/v1/marketdata/chains?apikey=" + tdaClientId + "&symbol=" + tmpSymbol + "&contractType=" + tmpType + "&strike=" + tmpStrike + "&fromDate=" + tmpDate + "&toDate=" + tmpDate);
  }
  else {
    response = UrlFetchApp.fetch("https://api.tdameritrade.com/v1/marketdata/chains?apikey=" + tdaClientId + "&symbol=" + tmpSymbol + "&contractType=" + tmpType + "&strike=" + tmpStrike + "&fromDate=" + tmpDate + "&toDate=" + tmpDate, {
      headers: {
        Authorization: 'Bearer ' + tdaService.getAccessToken()
      }
    });

  }

  //End of handling the crazy tda request

  var responseString = response.getContentText();
  JLog.debug(responseString);
}

export function tdaLogin() {
  showSidebar();
}

export function tdaLogout() {
  var service = getTDAService()
  service.reset();
}

export function showSidebar() {
  var tdaService = getTDAService();
  // if (!tdaService.hasAccess()) {
  var authorizationUrl = tdaService.getAuthorizationUrl();
  var template = HtmlService.createTemplate(
    `<a href="${authorizationUrl}>" target="_blank">Authorize</a>. ' +
          'Reopen the sidebar when the authorization is complete.`);
  // template.authorizationUrl = authorizationUrl;
  var page = template.evaluate();
  //  DocumentApp.getUi().showSidebar(page);
  SpreadsheetApp.getUi().showSidebar(page);
  // } else {
  // ...
  //  }
}

function getTDAService() {
  let tdaClientId = EngineConfig.instance().getConfig(EngineConfigProperty.TDAmeritradeAPIClientId);
  let tdaClientSecret = "firebyarthurtradingengine";
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  //  return OAuth2.createService('tdameritrade')
  var scriptId = ScriptApp.getScriptId();
  return new OAuth2().createService('tdameritrade')

    // Set the endpoint URLs, which are the same for all Google services.
    .setAuthorizationBaseUrl('https://auth.tdameritrade.com/auth')
    .setTokenUrl('https://api.tdameritrade.com/v1/oauth2/token')

    // Set the client ID and secret, from the Google Developers Console.
    .setClientId(tdaClientId)
    .setScriptId(scriptId)
    .setClientSecret(tdaClientSecret)

    // Set the name of the callback function in the script referenced
    // above that should be invoked to complete the OAuth flow.
    .setCallbackFunction('authCallback')

    // Set the property store where authorized tokens should be persisted.
    .setPropertyStore(PropertiesService.getUserProperties())

    .setCache(CacheService.getUserCache())

    // Set the scopes to request (space-separated for Google services).
    // .setScope('https://www.googleapis.com/auth/drive')

    // Below are Google-specific OAuth2 parameters.

    // Sets the login hint, which will prevent the account chooser screen
    // from being shown to users logged in with multiple accounts.
    //  .setParam('login_hint', Session.getActiveUser().getEmail())

    // Requests offline access.
    .setParam('access_type', 'offline')

    // Forces the approval prompt every time. This is useful for testing,
    // but not desirable in a production application.
    //  .setParam('approval_prompt', 'force');
    .setParam('response_type', 'code')
    .setParam('redirect_uri', 'https://script.google.com/macros/d/' + scriptId + '/usercallback')
    .setParam('client_id', tdaClientId);
}

export function authCallback(request) {
  let engineConfigSheet : EngineConfigSheet = new EngineConfigSheet();
  let engineConfig : EngineConfig = EngineConfig.instance();
  engineConfigSheet.read(engineConfig);
  var tdaService = getTDAService();
  var isAuthorized = tdaService.handleCallback(request);
  Logger.log(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }

}




//OAUTH CODE:

class OAuth2 {

  /****** code begin *********/
  // Copyright 2014 Google Inc. All Rights Reserved.
  //
  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  //     http://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.

  /**
   * @file Contains the methods exposed by the library, and performs
   * any required setup.
   */

  /**
   * The supported formats for the returned OAuth2 token.
   * @enum {string}
   */
  TOKEN_FORMAT = {
    /** JSON format, for example <code>{"access_token": "..."}</code> **/
    JSON: 'application/json',
    /** Form URL-encoded, for example <code>access_token=...</code> **/
    FORM_URL_ENCODED: 'application/x-www-form-urlencoded'
  };


  prefix_;
  properties_;
  cache_;
  memory_ = {};
  scriptId_;


  /**
   * The supported locations for passing the state parameter.
   * @enum {string}
   */
  STATE_PARAMETER_LOCATION = {
    /**
     * Pass the state parameter in the authorization URL.
     * @default
     */
    AUTHORIZATION_URL: 'authorization-url',
    /**
     * Pass the state token in the redirect URL, as a workaround for APIs that
     * don't support the state parameter.
     */
    REDIRECT_URL: 'redirect-url'
  };

  /**
   * Creates a new OAuth2 service with the name specified. It's usually best to
   * create and configure your service once at the start of your script, and then
   * reference them during the different phases of the authorization flow.
   * @param {string} serviceName The name of the service.
   * @return {Service_} The service object.
   */
  createService(serviceName): OAuth2 {
    this.Service_(serviceName);
    return this;
  }

  /**
   * Returns the redirect URI that will be used for a given script. Often this URI
   * needs to be entered into a configuration screen of your OAuth provider.
   * @param {string} scriptId The script ID of your script, which can be found in
   *     the Script Editor UI under "File > Project properties".
   * @return {string} The redirect URI.
   */
  getRedirectUri(scriptId) {
    return Utilities.formatString(
      'https://script.google.com/macros/d/%s/usercallback', scriptId);
  }



  // Copyright 2014 Google Inc. All Rights Reserved.
  //
  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  //     http://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.

  /**
   * @file Contains the Service_ class.
   */

  // Disable JSHint warnings for the use of eval(), since it's required to prevent
  // scope issues in Apps Script.
  // jshint evil:true

  /**
   * Creates a new OAuth2 service.
   * @param {string} serviceName The name of the service.
   * @constructor
   */
  Service_ = function (serviceName) {
    this.validate_({
      'Service name': serviceName
    });
    this.serviceName_ = serviceName;
    this.params_ = {};
    this.tokenFormat_ = "application/json";
    this.tokenHeaders_ = null;
    this.scriptId_ = eval('Script' + 'App').getScriptId();
    this.expirationMinutes_ = 60;
  };

  /**
   * The number of seconds before a token actually expires to consider it expired
   * and refresh it.
   * @type {number}
   * @private
   */
  //Service_.EXPIRATION_BUFFER_SECONDS_ = 60;
  static readonly EXPIRATION_BUFFER_SECONDS_ = 60;

  /**
   * The number of milliseconds that a token should remain in the cache.
   * @type {number}
   * @private
   */
  //Service_.LOCK_EXPIRATION_MILLISECONDS_ = 30 * 1000;
  static readonly LOCK_EXPIRATION_MILLISECONDS_ = 30 * 1000;

  /**
   * Sets the service's authorization base URL (required). For Google services
   * this URL should be
   * https://accounts.google.com/o/oauth2/auth.
   * @param {string} authorizationBaseUrl The authorization endpoint base URL.
   * @return {Service_} This service, for chaining.
   */
  setAuthorizationBaseUrl = function (authorizationBaseUrl) {
    this.authorizationBaseUrl_ = authorizationBaseUrl;
    return this;
  };

  /**
   * Sets the service's token URL (required). For Google services this URL should
   * be https://accounts.google.com/o/oauth2/token.
   * @param {string} tokenUrl The token endpoint URL.
   * @return {Service_} This service, for chaining.
   */
  setTokenUrl = function (tokenUrl) {
    this.tokenUrl_ = tokenUrl;
    return this;
  };

  /**
   * Sets the service's refresh URL. Some OAuth providers require a different URL
   * to be used when generating access tokens from a refresh token.
   * @param {string} refreshUrl The refresh endpoint URL.
   * @return {Service_} This service, for chaining.
   */
  setRefreshUrl = function (refreshUrl) {
    this.refreshUrl_ = refreshUrl;
    return this;
  };

  /**
   * Sets the format of the returned token. Default: OAuth2.TOKEN_FORMAT.JSON.
   * @param {OAuth2.TOKEN_FORMAT} tokenFormat The format of the returned token.
   * @return {Service_} This service, for chaining.
   */
  setTokenFormat = function (tokenFormat) {
    this.tokenFormat_ = tokenFormat;
    return this;
  };

  /**
   * Sets the additional HTTP headers that should be sent when retrieving or
   * refreshing the access token.
   * @param {Object.<string,string>} tokenHeaders A map of header names to values.
   * @return {Service_} This service, for chaining.
   */
  setTokenHeaders = function (tokenHeaders) {
    this.tokenHeaders_ = tokenHeaders;
    return this;
  };

  /**
   * @callback tokenHandler
   * @param tokenPayload {Object} A hash of parameters to be sent to the token
   *     URL.
   * @param tokenPayload.code {string} The authorization code.
   * @param tokenPayload.client_id {string} The client ID.
   * @param tokenPayload.client_secret {string} The client secret.
   * @param tokenPayload.redirect_uri {string} The redirect URI.
   * @param tokenPayload.grant_type {string} The type of grant requested.
   * @returns {Object} A modified hash of parameters to be sent to the token URL.
   */

  /**
   * Sets an additional function to invoke on the payload of the access token
   * request.
   * @param {tokenHandler} tokenHandler tokenHandler A function to invoke on the
   *     payload of the request for an access token.
   * @return {Service_} This service, for chaining.
   */
  setTokenPayloadHandler = function (tokenHandler) {
    this.tokenPayloadHandler_ = tokenHandler;
    return this;
  };

  /**
   * Sets the name of the authorization callback function (required). This is the
   * function that will be called when the user completes the authorization flow
   * on the service provider's website. The callback accepts a request parameter,
   * which should be passed to this service's <code>handleCallback()</code> method
   * to complete the process.
   * @param {string} callbackFunctionName The name of the callback function.
   * @return {Service_} This service, for chaining.
   */
  setCallbackFunction = function (callbackFunctionName) {
    this.callbackFunctionName_ = callbackFunctionName;
    return this;
  };

  /**
   * Sets the client ID to use for the OAuth flow (required). You can create
   * client IDs in the "Credentials" section of a Google Developers Console
   * project. Although you can use any project with this library, it may be
   * convinient to use the project that was created for your script. These
   * projects are not visible if you visit the console directly, but you can
   * access it by click on the menu item "Resources > Advanced Google services" in
   * the Script Editor, and then click on the link "Google Developers Console" in
   * the resulting dialog.
   * @param {string} clientId The client ID to use for the OAuth flow.
   * @return {Service_} This service, for chaining.
   */
  setClientId = function (clientId) {
    this.clientId_ = clientId;
    return this;
  };

  setScriptId(scriptId) {
    this.scriptId_ = scriptId;
    return this;
  }

  /**
   * Sets the client secret to use for the OAuth flow (required). See the
   * documentation for <code>setClientId()</code> for more information on how to
   * create client IDs and secrets.
   * @param {string} clientSecret The client secret to use for the OAuth flow.
   * @return {Service_} This service, for chaining.
   */
  setClientSecret = function (clientSecret) {
    this.clientSecret_ = clientSecret;
    return this;
  };

  /**
   * Sets the property store to use when persisting credentials (required). In
   * most cases this should be user properties, but document or script properties
   * may be appropriate if you want to share access across users.
   * @param {PropertiesService.Properties} propertyStore The property store to use
   *     when persisting credentials.
   * @return {Service_} This service, for chaining.
   * @see https://developers.google.com/apps-script/reference/properties/
   */
  setPropertyStore = function (propertyStore) {
    this.properties_ = propertyStore;
    return this;
  };

  /**
   * Sets the cache to use when persisting credentials (optional). Using a cache
   * will reduce the need to read from the property store and may increase
   * performance. In most cases this should be a private cache, but a public cache
   * may be appropriate if you want to share access across users.
   * @param {CacheService.Cache} cache The cache to use when persisting
   *     credentials.
   * @return {Service_} This service, for chaining.
   * @see https://developers.google.com/apps-script/reference/cache/
   */
  setCache = function (cache) {
    this.cache_ = cache;
    return this;
  };

  /**
   * Sets the lock to use when checking and refreshing credentials (optional).
   * Using a lock will ensure that only one execution will be able to access the
   * stored credentials at a time. This can prevent race conditions that arise
   * when two executions attempt to refresh an expired token.
   * @param {LockService.Lock} lock The lock to use when accessing credentials.
   * @return {Service_} This service, for chaining.
   * @see https://developers.google.com/apps-script/reference/lock/
   */
  setLock = function (lock) {
    this.lock_ = lock;
    return this;
  };

  /**
   * Sets the scope or scopes to request during the authorization flow (optional).
   * If the scope value is an array it will be joined using the separator before
   * being sent to the server, which is is a space character by default.
   * @param {string|Array.<string>} scope The scope or scopes to request.
   * @param {string} [optSeparator] The optional separator to use when joining
   *     multiple scopes. Default: space.
   * @return {Service_} This service, for chaining.
   */
  setScope = function (scope, optSeparator) {
    var separator = optSeparator || ' ';
    this.params_.scope = Array.isArray(scope) ? scope.join(separator) : scope;
    return this;
  };

  /**
   * Sets an additional parameter to use when constructing the authorization URL
   * (optional). See the documentation for your service provider for information
   * on what parameter values they support.
   * @param {string} name The parameter name.
   * @param {string} value The parameter value.
   * @return {Service_} This service, for chaining.
   */
  setParam = function (name, value) {
    this.params_[name] = value;
    return this;
  };

  /**
   * Sets the private key to use for Service Account authorization.
   * @param {string} privateKey The private key.
   * @return {Service_} This service, for chaining.
   */
  setPrivateKey = function (privateKey) {
    this.privateKey_ = privateKey;
    return this;
  };

  /**
   * Sets the issuer (iss) value to use for Service Account authorization.
   * If not set the client ID will be used instead.
   * @param {string} issuer This issuer value
   * @return {Service_} This service, for chaining.
   */
  setIssuer = function (issuer) {
    this.issuer_ = issuer;
    return this;
  };

  /**
   * Sets the subject (sub) value to use for Service Account authorization.
   * @param {string} subject This subject value
   * @return {Service_} This service, for chaining.
   */
  setSubject = function (subject) {
    this.subject_ = subject;
    return this;
  };

  /**
   * Sets number of minutes that a token obtained through Service Account
   * authorization should be valid. Default: 60 minutes.
   * @param {string} expirationMinutes The expiration duration in minutes.
   * @return {Service_} This service, for chaining.
   */
  setExpirationMinutes = function (expirationMinutes) {
    this.expirationMinutes_ = expirationMinutes;
    return this;
  };

  /**
   * Gets the authorization URL. The first step in getting an OAuth2 token is to
   * have the user visit this URL and approve the authorization request. The
   * user will then be redirected back to your application using callback function
   * name specified, so that the flow may continue.
   * @return {string} The authorization URL.
   */
  getAuthorizationUrl = function () {
    this.validate_({
      'Client ID': this.clientId_,
      'Script ID': this.scriptId_,
      'Callback function name': this.callbackFunctionName_,
      'Authorization base URL': this.authorizationBaseUrl_
    });

    var redirectUri = this.getRedirectUri(this.scriptId_);
    var state = eval('Script' + 'App').newStateToken()
      .withMethod(this.callbackFunctionName_)
      .withArgument('serviceName', this.serviceName_)
      .withTimeout(3600)
      .createToken();
    var params = {
      client_id: this.clientId_ + '@AMER.OAUTHAP',
      response_type: 'code',
      redirect_uri: redirectUri,
      state: state
    };
    params = this.extend_(params, this.params_);
    params['client_id'] = this.clientId_ + '@AMER.OAUTHAP';//override this thing with @AMER.OAUTHAP
    return this.buildUrl_(this.authorizationBaseUrl_, params);
  };

  /**
   * Completes the OAuth2 flow using the request data passed in to the callback
   * function.
   * @param {Object} callbackRequest The request data recieved from the callback
   *     function.
   * @return {boolean} True if authorization was granted, false if it was denied.
   */
  handleCallback = function (callbackRequest) {
    var code = callbackRequest.parameter.code;
    var error = callbackRequest.parameter.error;
    if (error) {
      if (error == 'access_denied') {
        return false;
      } else {
        throw new Error('Error authorizing token: ' + error);
      }
    }
    this.validate_({
      'Client ID': this.clientId_,
      'Client Secret': this.clientSecret_,
      'Script ID': this.scriptId_,
      'Token URL': this.tokenUrl_
    });
    var redirectUri = this.getRedirectUri(this.scriptId_);
    var headers = {
      'Accept': this.tokenFormat_
    };
    if (this.tokenHeaders_) {
      headers = this.extend_(headers, this.tokenHeaders_);
    }
    var tokenPayload = {
      code: code,
      client_id: this.clientId_,
      client_secret: this.clientSecret_,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      access_type: 'offline'
    };
    if (this.tokenPayloadHandler_) {
      tokenPayload = this.tokenPayloadHandler_(tokenPayload);
    }

    Logger.log("GetToken on Callback is:"+this.tokenUrl_);
    Logger.log("tokenPayload is: "+tokenPayload);
    Logger.log("GetTokenHeaders are: "+headers);
    var response = UrlFetchApp.fetch(this.tokenUrl_, {
      method: 'post',
      headers: headers,
      payload: tokenPayload,
      muteHttpExceptions: true
    });
    Logger.log("Response is: "+response);
    var token = this.getTokenFromResponse_(response);
    Logger.log("Response from handleCallback call: " + response);
    Logger.log(`Saving Token: ${token} as given by response`);
    if (JLog.isDebug()) JLog.debug(`Saving Token: ${token} as given by response.`);
    this.getStorage().saveToken_(token);
    return true;
  };

  /**
   * Determines if the service has access (has been authorized and hasn't
   * expired). If offline access was granted and the previous token has expired
   * this method attempts to generate a new token.
   * @return {boolean} true if the user has access to the service, false
   *     otherwise.
   */
  hasAccess = function () {
    return this.lockable_(function () {
      var token = this.getStorage().getToken();
      if (!token || this.isExpired_(token)) {
        if (token && this.canRefresh_(token)) {
          try {
            this.refresh();
          } catch (e) {
            this.lastError_ = e;
            return false;
          }
        } else if (this.privateKey_) {
          try {
            this.exchangeJwt_();
          } catch (e) {
            this.lastError_ = e;
            return false;
          }
        } else {
          return false;
        }
      }
      return true;
    });
  };

  /**
   * Gets an access token for this service. This token can be used in HTTP
   * requests to the service's endpoint. This method will throw an error if the
   * user's access was not granted or has expired.
   * @return {string} An access token.
   */
  getAccessToken = function () {
    if (!this.hasAccess()) {
      throw new Error('Access not granted or expired.');
    }
    var token = this.getToken();
    return token.access_token;
  };

  /**
   * Resets the service, removing access and requiring the service to be
   * re-authorized.
   */
  reset = function () {
    this.getStorage().removeValue(null);
  };

  /**
   * Gets the last error that occurred this execution when trying to automatically
   * refresh or generate an access token.
   * @return {Exception} An error, if any.
   */
  getLastError = function () {
    return this.lastError_;
  };


  /**
   * Gets the token from a UrlFetchApp response.
   * @param {UrlFetchApp.HTTPResponse} response The response object.
   * @return {Object} The parsed token.
   * @throws If the token cannot be parsed or the response contained an error.
   * @private
   */
  getTokenFromResponse_ = function (response) {
    var token = this.parseToken_(response.getContentText());
    var resCode = response.getResponseCode();
    if (resCode < 200 || resCode >= 300 || token.error) {
      var reason = [
        token.error,
        token.message,
        token.error_description,
        token.error_uri
      ].filter(Boolean).map(function (part) {
        return typeof (part) == 'string' ? part : JSON.stringify(part);
      }).join(', ');
      if (!reason) {
        reason = resCode + ': ' + JSON.stringify(token);
      }
      throw new Error('Error retrieving token: ' + reason);
    }
    return token;
  };

  /**
   * Parses the token using the service's token format.
   * @param {string} content The serialized token content.
   * @return {Object} The parsed token.
   * @private
   */
  parseToken_ = function (content) {
    var token;
    if (this.tokenFormat_ == this.TOKEN_FORMAT.JSON) {
      try {
        token = JSON.parse(content);
      } catch (e) {
        throw new Error('Token response not valid JSON: ' + e);
      }
    } else if (this.tokenFormat_ == this.TOKEN_FORMAT.FORM_URL_ENCODED) {
      token = content.split('&').reduce(function (result, pair) {
        var parts = pair.split('=');
        result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
        return result;
      }, {});
    } else {
      throw new Error('Unknown token format: ' + this.tokenFormat_);
    }
    token.granted_time = this.getTimeInSeconds_(new Date());
    return token;
  };

  /**
   * Refreshes a token that has expired. This is only possible if offline access
   * was requested when the token was authorized.
   */
  refresh = function () {
    this.validate_({
      'Client ID': this.clientId_,
      'Client Secret': this.clientSecret_,
      'Token URL': this.tokenUrl_
    });

    this.lockable_(function () {
      var token = this.getToken();
      if (!token.refresh_token) {
        throw new Error('Offline access is required.');
      }
      var headers = {
        Accept: this.tokenFormat_
      };
      if (this.tokenHeaders_) {
        headers = this.extend_(headers, this.tokenHeaders_);
      }
      var tokenPayload = {
        refresh_token: token.refresh_token,
        client_id: this.clientId_,
        client_secret: this.clientSecret_,
        grant_type: 'refresh_token',
        access_type: 'offline'
      };
      if (this.tokenPayloadHandler_) {
        tokenPayload = this.tokenPayloadHandler_(tokenPayload);
      }
      // Use the refresh URL if specified, otherwise fallback to the token URL.
      var url = this.refreshUrl_ || this.tokenUrl_;
      var response = UrlFetchApp.fetch(url, {
        method: 'post',
        headers: headers,
        payload: tokenPayload,
        muteHttpExceptions: true
      });
      var newToken = this.getTokenFromResponse_(response);
      if (!newToken.refresh_token) {
        newToken.refresh_token = token.refresh_token;
      }
      this.saveToken_(newToken);
    });
  };

  /**
   * Gets the storage layer for this service, used to persist tokens.
   * Custom values associated with the service can be stored here as well.
   * The key <code>null</code> is used to to store the token and should not
   * be used.
   * @return {Storage} The service's storage.
   */
  getStorage = function (): any {
    this.validate_({
      'Property store': this.properties_
    });
    if (this.prefix_ == null) {
      var prefix = 'oauth2.' + this.serviceName_;
      this.prefix_ = prefix;
    }
    return this;
  };

  /**
   * Saves a token to the service's property store and cache.
   * @param {Object} token The token to save.
   * @private
   */
  saveToken_ = function (token) {
    this.setValue(null, token);
  };

  /**
   * Gets the token from the service's property store or cache.
   * @return {Object} The token, or null if no token was found.
   */
  getToken = function () {
    return this.getValue(null);
  };

  /**
   * Determines if a retrieved token is still valid.
   * @param {Object} token The token to validate.
   * @return {boolean} True if it has expired, false otherwise.
   * @private
   */
  isExpired_ = function (token) {
    var expiresIn = token.expires_in || token.expires;
    if (!expiresIn) {
      return false;
    } else {
      var expiresTime = token.granted_time + Number(expiresIn);
      var now = this.getTimeInSeconds_(new Date());
      return expiresTime - now < OAuth2.EXPIRATION_BUFFER_SECONDS_;
    }
  };

  /**
   * Determines if a retrieved token can be refreshed.
   * @param {Object} token The token to inspect.
   * @return {boolean} True if it can be refreshed, false otherwise.
   * @private
   */
  canRefresh_ = function (token) {
    if (!token.refresh_token) return false;
    var expiresIn = token.refresh_token_expires_in;
    if (!expiresIn) {
      return true;
    } else {
      var expiresTime = token.granted_time + Number(expiresIn);
      var now = this.getTimeInSeconds_(new Date());
      return expiresTime - now > OAuth2.EXPIRATION_BUFFER_SECONDS_;
    }
  };

  /**
   * Uses the service account flow to exchange a signed JSON Web Token (JWT) for
   * an access token.
   * @private
   */
  exchangeJwt_ = function () {
    this.validate_({
      'Token URL': this.tokenUrl_
    });
    var jwt = this.createJwt_();
    var headers = {
      'Accept': this.tokenFormat_
    };
    if (this.tokenHeaders_) {
      headers = this.extend_(headers, this.tokenHeaders_);
    }
    var response = UrlFetchApp.fetch(this.tokenUrl_, {
      method: 'post',
      headers: headers,
      payload: {
        assertion: jwt,
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
      },
      muteHttpExceptions: true
    });
    var token = this.getTokenFromResponse_(response);
    this.saveToken_(token);
  };

  /**
   * Creates a signed JSON Web Token (JWT) for use with Service Account
   * authorization.
   * @return {string} The signed JWT.
   * @private
   */
  createJwt_ = function () {
    this.validate_({
      'Private key': this.privateKey_,
      'Token URL': this.tokenUrl_,
      'Issuer or Client ID': this.issuer_ || this.clientId_
    });
    var header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    var now = new Date();
    var expires = new Date(now.getTime());
    expires.setMinutes(expires.getMinutes() + this.expirationMinutes_);
    var claimSet = {
      iss: this.issuer_ || this.clientId_,
      aud: this.tokenUrl_,
      exp: Math.round(expires.getTime() / 1000),
      iat: Math.round(now.getTime() / 1000),
      sub: "",
      scope: ""
    };
    if (this.subject_) {
      claimSet.sub = this.subject_;
    }
    if (this.params_.scope) {
      claimSet.scope = this.params_.scope;
    }
    var toSign = Utilities.base64EncodeWebSafe(JSON.stringify(header)) + '.' +
      Utilities.base64EncodeWebSafe(JSON.stringify(claimSet));
    var signatureBytes =
      Utilities.computeRsaSha256Signature(toSign, this.privateKey_);
    var signature = Utilities.base64EncodeWebSafe(signatureBytes);
    return toSign + '.' + signature;
  };

  /**
   * Locks access to a block of code if a lock has been set on this service.
   * @param {function} func The code to execute.
   * @return {*} The result of the code block.
   * @private
   */
  lockable_ = function (func) {
    var releaseLock = false;
    if (this.lock_ && !this.lock_.hasLock()) {
      this.lock_.waitLock(OAuth2.LOCK_EXPIRATION_MILLISECONDS_);
      releaseLock = true;
    }
    var result = func.apply(this);
    if (this.lock_ && releaseLock) {
      this.lock_.releaseLock();
    }
    return result;
  };

  // Copyright 2017 Google Inc. All Rights Reserved.
  //
  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  //     http://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.

  /**
   * @file Contains classes used to persist data and access it.
   */

  /**
   * Creates a new Storage_ instance, which is used to persist OAuth tokens and
   * related information.
   * @param {string} prefix The prefix to use for keys in the properties and
   *     cache.
   * @param {PropertiesService.Properties} properties The properties instance to
   *     use.
   * @param {CacheService.Cache} [optCache] The optional cache instance to use.
   * @constructor
   */


  /**
   * The TTL for cache entries, in seconds.
   * @type {number}
   * @private
   */
  static CACHE_EXPIRATION_TIME_SECONDS: number = 21600; // 6 hours.

  /**
   * Gets a stored value.
   * @param {string} key The key.
   * @return {*} The stored value.
   */
  getValue = function (key) {
    // Check memory.
    if (this.memory_[key]) {
      return this.memory_[key];
    }

    var prefixedKey = this.getPrefixedKey_(key);
    var jsonValue;
    var value;

    // Check cache.
    if (this.cache_ && (jsonValue = this.cache_.get(prefixedKey))) {
      value = JSON.parse(jsonValue);
      this.memory_[key] = value;
      return value;
    }

    // Check properties.
    if (jsonValue = this.properties_.getProperty(prefixedKey)) {
      if (this.cache_) {
        this.cache_.put(prefixedKey,
          jsonValue, 21600);
      }
      value = JSON.parse(jsonValue);
      this.memory_[key] = value;
      return value;
    }

  

    // Not found.
    return null;
  };

  /**
   * Stores a value.
   * @param {string} key The key.
   * @param {*} value The value.
   */
  setValue = function (key, value) {
    var prefixedKey = this.getPrefixedKey_(key);
    var jsonValue = JSON.stringify(value);
    Logger.log("Storing the propety: "+prefixedKey+" : "+jsonValue);
    this.properties_.setProperty(prefixedKey, jsonValue);
    if (this.cache_) {
      this.cache_.put(prefixedKey, jsonValue,
        21600);
    }
    this.memory_[key] = value;
  };

  /**
   * Removes a stored value.
   * @param {string} key The key.
   */
  removeValue = function (key) {
    var prefixedKey = this.getPrefixedKey_(key);
    this.properties_.deleteProperty(prefixedKey);
    if (this.cache_) {
      this.cache_.remove(prefixedKey);
    }
    delete this.memory_[key];
  };

  /**
   * Gets a key with the prefix applied.
   * @param {string} key The key.
   * @return {string} The key with the prefix applied.
   * @private
   */
  getPrefixedKey_(key): string {
    if (key) {
      return this.prefix_ + '.' + key;
    } else {
      return this.prefix_;
    }
  }

  // Copyright 2014 Google Inc. All Rights Reserved.
  //
  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  //     http://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.

  /**
   * @file Contains utility methods used by the library.
   */

  /* exported buildUrl_ */
  /**
   * Builds a complete URL from a base URL and a map of URL parameters.
   * @param {string} url The base URL.
   * @param {Object.<string, string>} params The URL parameters and values.
   * @return {string} The complete URL.
   * @private
   */
  buildUrl_(url, params) {
    var paramString = Object.keys(params).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + paramString;
  }

  /* exported validate_ */
  /**
   * Validates that all of the values in the object are non-empty. If an empty
   * value is found, and error is thrown using the key as the name.
   * @param {Object.<string, string>} params The values to validate.
   * @private
   */
  validate_(params) {
    Object.keys(params).forEach(function (name) {
      var value = params[name];
      if (!value) {
        throw Utilities.formatString('%s is required.', name);
      }
    });
  }

  /* exported getTimeInSeconds_ */
  /**
   * Gets the time in seconds, rounded down to the nearest second.
   * @param {Date} date The Date object to convert.
   * @return {Number} The number of seconds since the epoch.
   * @private
   */
  getTimeInSeconds_(date) {
    return Math.floor(date.getTime() / 1000);
  }

  /* exported extend_ */
  /**
   * Copy all of the properties in the source objects over to the
   * destination object, and return the destination object.
   * @param {Object} destination The combined object.
   * @param {Object} source The object who's properties are copied to the
   *     destination.
   * @return {Object} A combined object with the desination and source
   *     properties.
   * @see http://underscorejs.org/#extend
   */
  extend_(destination, source) {
    var keys = Object.keys(source);
    for (var i = 0; i < keys.length; ++i) {
      destination[keys[i]] = source[keys[i]];
    }
    return destination;
  }

  /****** code end *********/

  copy(src, target, obj) {
    obj[target] = obj[target] || {};
    if (src && typeof src === 'object') {
      for (var k in src) {
        if (src.hasOwnProperty(k)) {
          obj[target][k] = src[k];
        }
      }
    } else {
      obj[target] = src;
    }
  }

}
//  ).call(null, module.exports, expose, host);
//}).call(this, this, "OAuth2");

function parseValueFromJSON(jsonString, name) {
  var nameLocation = jsonString.indexOf(name);
  var aSub = jsonString.substring(nameLocation, jsonString.length);
  nameLocation = aSub.indexOf(",");
  if (nameLocation == -1) nameLocation = aSub.indexOf("}");
  var bSub = aSub.substring(0, nameLocation);
  var jsonStringtmp = "{\"" + bSub + "}";
  var data = JSON.parse(jsonStringtmp);
  var returnStr = eval("data." + name);
  return returnStr;
} 
