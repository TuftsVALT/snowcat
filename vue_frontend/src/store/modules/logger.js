// import phases from '@/store/settings/full_eval/phases'
// import layouts from '@/store/settings/full_eval/layouts'
// import style from '@/store/settings/full_eval/style'
import _ from 'lodash'
import Vue from "vue";

// initial state
const state = {
  'vast20ExpLog': {}
}

// getters
const getters = {
}

// actions
const actions = {
}

// mutations
const mutations = {
  // SEND_LOG_MESSAGE (state, log_message) {
  //   let v = new Vue();
  //   v.$socket.emit("", log_message);
  //   state.task_number = number;
  // },
  SEND_VAST20_LOG_MESSAGE(state, log_message) {
    let v = new Vue();
    v.$socket.emit("logVast20Exp", log_message);
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
