// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from '@/App'
import router from '@/router'
import store from '@/store'
import Vuetify from 'vuetify'
import BootstrapVue from 'bootstrap-vue'
import socketio from 'socket.io-client'
import VueSocketIO from 'vue-socket.io'
import VTooltip from 'v-tooltip'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'vuetify/dist/vuetify.min.css'
import * as d3 from "d3";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(Vuetify);
Vue.use(VTooltip);

let host = window.location.host;
let path = window.location.pathname;
path.endsWith("/") ? window.location.pathname : window.location.pathname + "/";
path = path + "socket.io";
console.log("socket connecting to: ", host, "path: ", path);
export const SocketInstance = socketio(host, { path: path });
Vue.use(VueSocketIO, SocketInstance, store);

/* eslint-disable no-new */
new Vue({
  el: "#app",
  router,
  store,
  template: "<App/>",
  components: { App }
});

export const eventBus = new Vue();

