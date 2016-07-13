/**
 * @typedef {Object} GatewayConfig
 * @property {String} merchantId
 * @property {String} secretKey
 * @property {Boolean} sandbox
 */

/**
 * @typedef {Object} ClientInfo
 * @property {String} firstName
 * @property {String} lastName
 * @property {String} company
 * @property {String} address
 * @property {String} city
 * @property {String} state
 * @property {String} zip
 * @property {String} country
 * @property {String} phone
 * @property {String} fax
 * @property {String} email
 */

/**
 * @typedef {Object} AuthorizationParams
 * @property {Number} amount Numeric value with two decimals
 * @property {String} currency 3 characters currency (RON, EUR, USD)
 * @property {String} invoiceId Order unique ID 6-27 chars
 * @property {String} merchantId Merchant ID from Euplatesc.ro
 * @property {String} orderDescription Detailed description for the order
 * @property {ClientInfo} billingDetails
 * @property {ClientInfo} shippingDetails
 * @property {String} extraData
 */

const constants = require('./constants');
const utils = require('./utils');
const Promise = require('bluebird');
const Lazy = require('lazy.js');

class Gateway {

  /**
   * @param {GatewayConfig} config
   */
  constructor(config) {

    if (!config) {
      throw new Error('Config is required');
    }

    this.config = Object.assign({
      merchantId: '',
      sandbox: false,
      secretKey: ''
    }, config);

    if (!this.config.secretKey) {
      throw new Error('Missing secret key');
    }

    if(!this.config.merchantId) {
      throw new Error('Missing merchant ID');
    }
  }

  getRequestsEndpoint() {
    return constants.REQUEST_ENDPOINTS[this.config.sandbox ? constants.SANDBOX_MODE : constants.LIVE_MODE];
  }

  /**
   * return {Promise}
   */
  prepareAuthorizationRequestData(params) {
    return new Promise((resolve, reject) => {

      if(!params.amount) {
        return reject(new Error('Amount is required'));
      }

      const requestData = {
        amount: params.amount || '0.00',
        curr: params.currency || 'RON',
        invoice_id: params.invoiceId || '',
        order_desc: params.orderDescription || '',
        merch_id: this.config.merchantId || '',
        timestamp: utils.getTimestamp(),
        nonce: utils.generateNonce(),
      };

      requestData['fp_hash'] = utils.signData(requestData, this.config.secretKey);

      if(params.billingDetails) {
        Object.assign(requestData, utils.clientInfoToGatewayFields(params.billingDetails));
      }

      if(params.shippingDetails) {
        Object.assign(requestData, utils.clientInfoToGatewayFields(params.shippingDetails));
      }

      if (params.extraData) {
        requestData.ExtraData = params.extraData;
      }

      return resolve(requestData);
    });
  }

  /**
   * @param data
   * @return {Promise}
   */
  parseGatewayResponse(data) {
    return new Promise((resolve, reject) => {
      const expectedFields = ['amount', 'curr', 'invoice_id', 'ep_id', 'merch_id', 'action',
        'message', 'approval', 'timestamp', 'nonce', 'fp_hash'];

      Lazy(expectedFields).each((field) => {
        if(typeof data[field] === 'undefined') {
          reject(new Error(`Invalid response data: missing '${field}' field`));
        }
      });

      const dataHash = utils.signData(Lazy(data).omit(['backurl', 'fp_hash', 'lang', 'ExtraData[rate]'])
        .toObject(), this.config.secretKey);

      if(dataHash !== data.fp_hash.toLowerCase()) {
        reject(new Error(`Invalid response hash ${dataHash} - ${data.fp_hash.toLowerCase()}`));
      }

      const responseData = {
        amount: data.amount,
        currency: data.curr,
        invoiceId: data.invoice_id,
        transactionId: data.ep_id,
        merchantId: data.merch_id,
        action: data.action,
        message: data.message,
        approval: data.approval,
        timestamp: data.timestamp,
      };

      if(data.backurl) {
        responseData.backURL = data.backurl;
      }

      if(data.extraData) {
        responseData.extraData = data.ExtraData;
      }

      return resolve(responseData);
    });
  }
}

module.exports = Gateway;