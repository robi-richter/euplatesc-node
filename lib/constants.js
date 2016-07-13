const LIVE_MODE = 'live';
const SANDBOX_MODE = 'sandbox';

const REQUEST_ENDPOINTS = {
  [LIVE_MODE]: 'https://secure.euplatesc.ro/tdsprocess/tranzactd.php',
  [SANDBOX_MODE]: 'https://secure.euplatesc.ro/tdsprocess/tranzactd.php'
};

module.exports = {
  LIVE_MODE,
  SANDBOX_MODE,
  REQUEST_ENDPOINTS
};
