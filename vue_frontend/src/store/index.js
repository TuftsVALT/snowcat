import Vue from 'vue'
import Vuex from 'vuex'

import modules from './modules'
import createLogger from '../../node_modules/vuex/dist/logger'

export const strict = false

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules,
  strict: false,
  // plugins: debug ? [createLogger()] : []
  plugins: []
})
