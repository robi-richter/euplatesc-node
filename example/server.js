const express = require('express');
const nunjucks = require('express-nunjucks');
const app = express();
const bodyParser = require('body-parser');
const constants = require('../lib/constants');
const Gateway = require('../index').Gateway;

app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'html');
app.set('views', __dirname + '/templates');

nunjucks.setup({
  // (default: true) controls if output with dangerous characters are escaped automatically.
  autoescape: true,
  // (default: false) throw errors when outputting a null/undefined value.
  throwOnUndefined: false,
  // (default: false) automatically remove trailing newlines from a block/tag.
  trimBlocks: false,
  // (default: false) automatically remove leading whitespace from a block/tag.
  lstripBlocks: false,
  // (default: false) if true, the system will automatically update templates when they are changed on the filesystem.
  watch: true,
  // (default: false) if true, the system will avoid using a cache and templates will be recompiled every single time.
  noCache: true,
  // (default: see nunjucks syntax) defines the syntax for nunjucks tags.
  tags: {}
}, app);

const euplatescGateway = new Gateway({
  secretKey: '', // from admin panel,
  merchantId: '' // from admin panel
});

app.get('/', (req, res) => {
  euplatescGateway.prepareAuthorizationRequestData({
      amount: '1.00',
      currency: 'RON',
      invoiceId: '123456789',
      orderDescription: 'Test order',
      billingDetails: {
        firstName: 'Test',
        lastName: 'Test',
        address: '8th Test Street',
        email: 'test.test@example.com',
        city: 'Cluj-Napoca',
        country: 'Romania',
        state: 'Cluj',
        zip: '123456',
        phone: '0722222222'
      }
    })
    .then((data) => {

      return res.render('index', {
        redirectUrl: euplatescGateway.getRequestsEndpoint(),
        data
      });
    })
    .catch((err) => {
      console.log(err);
      return res.sendStatus(500);
    });
});

app.post('/reply', (req, res) => {
  euplatescGateway.parseGatewayResponse(res.body)
    .then((responseData) => {
      /**
       * Response data format:
       *
       * {
       *  amount: '12.00',
       *  currency: 'RON',
       *  invoiceId: '123456',
       *  transactionId: '934AEE6E29F32D225164AA36350F7800B1F5BA56',
       *  merchantId: '00000000',
       *  action: '0', 0 - for success, < 0 in case of an error
       *  message: 'Descriptive message',
       *  approval: '12345678',
       *  timestamp: '20160713121748',
       *  extraData: 'additional data send with the payment request'
       * }
       */
      console.log(responseData);
      return res.render('success', {
        data: {
          title: responseData.message,
          status: responseData.action,
          orderID: responseData.invoiceId
        }
      });
    })
    .catch((err) => {
      console.log(err);
      return res.sendStatus(500);
    });
});

app.post('/paymentcb', (req, res) => {
  euplatescGateway.parseGatewayResponse(res.body)
    .then((responseData) => {
      /**
       * Response data format:
       *
       * {
       *  amount: '12.00',
       *  currency: 'RON',
       *  invoiceId: '123456',
       *  transactionId: '934AEE6E29F32D225164AA36350F7800B1F5BA56',
       *  merchantId: '00000000',
       *  action: '0', 0 - for success, < 0 in case of an error
       *  message: 'Descriptive message',
       *  approval: '12345678',
       *  timestamp: '20160713121748',
       *  backURL: 'https://secure.euplatesc.ro/tdsprocess/silent/reply_confirmation.php',
       *  extraData: 'additional data send with the payment request'
       * }
       */
      console.log(responseData);
      return res.send('OK');
    })
    .catch((err) => {
      console.log(err);
      return res.send('OK');
    });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});