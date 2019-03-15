'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  CONFIG_JSON_PATH: '"static/config_files/example_dev_classification_config.json"'
})
