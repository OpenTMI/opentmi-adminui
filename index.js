const express = require('express');
const logger = require('../../tools/logger');


class AddonAdminUi {
  constructor(app, server, io) {
    // Defined variables
    this.router = express.Router();
    this.staticPath = { prefix: '/admin', folder: '/public/' };
    app.use('/admin', express.static('./node_modules/opentmi_jsclient/dist'));

    // Own variables
    this.app = app;
    this.server = server;
    this.io = io;
  }

  // Default implementation of register
  register() {
    logger.warn('registering instance of admin-ui class');
  }
  unregister() {
    logger.warn('unregistering instance of admin-ui class');
  }
}

module.exports = AddonAdminUi;
