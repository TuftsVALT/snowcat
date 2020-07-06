// import phases from '@/store/settings/full_eval/phases'
// import layouts from '@/store/settings/full_eval/layouts'
// import style from '@/store/settings/full_eval/style'
import phases from '@/store/settings/data_aug/phases'
import layouts from '@/store/settings/data_aug/layouts'
import style from '@/store/settings/data_aug/style'
import cardComponents from '@/store/settings/cardComponents'
import _ from 'lodash'
import Vue from "vue";

let defaultWorkspaces = {}

for (const phase of phases) {
  defaultWorkspaces[phase.workspace] = layouts[phase.defaultLayout]
}

// initial state
const state = {
  // Socket connections
  phases,
  layouts,
  cardComponents,
  style,
  workspaces: _.cloneDeep(defaultWorkspaces),
  currentWorkspace: 0,
  currentPhase: 1,
  highlightedCards: [],
  task_number: 1,
  experimentLoaded: true,
}

// getters
const getters = {
}

// actions
const actions = {
  socket_experimentLoaded(context) {
    context.commit("EXPERIMENT_LOADED");
  }
}

// mutations
const mutations = {
  SET_TASK_NUMBER (state, number) {
    state.task_number = number;
  },
  EXPERIMENT_LOADED (state) {
    state.experimentLoaded = true;
  },
  INCREMENT_CURRENT_PHASE (state) {
    state.currentPhase += 1
    state.currentWorkspace = state.phases[state.currentPhase - 1].workspace
    state.experimentLoaded = false;
    let v = new Vue();
    v.$socket.emit("vast20ExpNextTask");
    v.$socket.emit("dataaugIncrementTask");
    // setTimeout(() => {
    //   state.experimentLoaded = true;
    // }, 500)
  },
  SET_CURRENT_PHASE (state, value) {
    state.currentPhase = value
    state.currentWorkspace = state.phases[state.currentPhase - 1].workspace
  },
  SET_CURRENT_WORKSPACE (state, value) {
    state.currentWorkspace = value
  },
  SET_WORKSPACE (state, payload) {
    state.workspaces[payload.workspace].cards = payload.value
  },
  RESET_WORKSPACE (state, workspace) {
    state.workspaces[workspace] = _.cloneDeep(defaultWorkspaces[workspace])
  },
  SET_HIGHLIGHTED_CARDS (state, value) {
    state.highlightedCards = value
  },
  DEHIGHLIGHT_CARDS (state) {
    state.highlightedCards = []
  },
  ADD_CARD (state, payload) {
    state.workspaces[payload.workspace].cards.push(payload.card)
  },
  ADD_CARDS_BY_NAME (state, payload) {
    const cardNames = _.difference(payload.cardNames, _.map(state.workspaces[payload.workspace].cards, (d) => d.component))
    for (const cardName of cardNames) {
      const card = { component: cardName, size: cardComponents[cardName].defaultSize , help: false}
      state.workspaces[payload.workspace].cards.push(card)
    }
  },
  REMOVE_CARD (state, payload) {
    state.workspaces[payload.workspace].cards.splice(payload.cardIndex, 1)
  },
  TOGGLE_CARD_HELP (state, payload) {
    state.workspaces[payload.workspace].cards[payload.cardIndex].help = !state.workspaces[payload.workspace].cards[payload.cardIndex].help
  },
  TOGGLE_CARD_FLEX (state, payload) {
    const swap = { 12: 6, 6: 12 }
    state.workspaces[payload.workspace].cards[payload.cardIndex].size = swap[state.workspaces[payload.workspace].cards[payload.cardIndex].size]
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
