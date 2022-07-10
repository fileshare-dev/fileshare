const path = require('path');
const config = require('./config/config.js');

module.exports = {
  createBackendUrl: function (uri, query = '') {
    let host = config.BACKEND_HOST;
    let port = config.BACKEND_PORT;
    //FIXME I'm lazy
    //normalize path to remove double slashes not handled by express
    return `http://${host}:${port}${path.normalize('/' + uri)}?${query}`;
  }
};
