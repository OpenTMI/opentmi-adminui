const express = require('express');
const {Addon} = require('opentmi-addon');

class AddonAdminUi extends Addon {
  constructor(...args) {
    super(...args);

    // Defined variables
    this.router = express.Router();
    this.staticPath = { prefix: '/admin', folder: '/public/' };
    this.app.use('/admin', express.static('./node_modules/opentmi_jsclient/dist'));
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
