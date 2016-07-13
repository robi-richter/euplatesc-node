const crypto = require('crypto');
const moment = require('moment');
const Lazy = require('lazy.js');

module.exports.generateNonce = generateNonce;
module.exports.getTimestamp = getTimestamp;
module.exports.signData = signData;
module.exports.clientInfoToGatewayFields = clientInfoToGatewayFields;

function generateNonce() {
  return crypto.randomBytes(32).toString('hex');
}

function getTimestamp() {
  return moment().utcOffset(0).format('YYYYMMDDHHmmss');
}

function signData(data, key) {
  const fields = Lazy(data).keys();

  const valuesString = fields.map((field) => {
    let value = data[field];

    if(value === null || typeof value === 'undefined' || value === '') {
      return '-';
    }

    value = String(value);
    return `${value.length}${value}`;
  }).join('');

  const hmac = crypto.createHmac('md5', Buffer.from(key, 'hex'));

  hmac.update(valuesString);

  return hmac.digest('hex');
}

function clientInfoToGatewayFields(clientInfo, prefix = '') {
  const clientInfoToFieldsMap = {
    firstName: 'fname',
    lastName: 'lname',
    company: 'company',
    address: 'add',
    city: 'city',
    state: 'state',
    zip: 'zip',
    country: 'country',
    phone: 'phone',
    fax: 'fax',
    email: 'email'
  };
  const result = {};

  Lazy(clientInfo).keys().each((field) => {
    if(typeof clientInfoToFieldsMap[field] !== 'undefined') {
      result[`${prefix}${clientInfoToFieldsMap[field]}`] = clientInfo[field];
    }
  });

  return result
}