import phases from '@/store/settings/phases'
import layouts from '@/store/settings/layouts'
import phases_task_one from '@/store/settings/phases_task_one_new'
import layouts_task_one from '@/store/settings/layouts_task_one'
import cardComponents from '@/store/settings/cardComponents'
import _ from 'lodash'

let defaultWorkspaces = {}

for (const phase of phases) {
  defaultWorkspaces[phase.workspace] = layouts[phase.defaultLayout]
}

// initial state
const state = {
  // Socket connections
  problemDefinition: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc.',
  phases,
  layouts,
  cardComponents,
  workspaces: _.cloneDeep(defaultWorkspaces),
  currentWorkspace: 0,
  currentPhase: 1,
  highlightedCards: [],
  task_number: 2
}

// getters
const getters = {
}

// actions
const actions = {
}

// mutations
const mutations = {
  INCREMENT_CURRENT_PHASE (state) {
    state.currentPhase += 1
    state.currentWorkspace = state.phases[state.currentPhase - 1].workspace
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
  SET_TASK_NUMBER (state, task_number) {
    state.task_number = task_number
    if ( task_number == 1 ) {
      state.phases = phases_task_one;
      state.layouts = layouts_task_one;
      state.workspaces = _.cloneDeep(defaultWorkspaces);
      for (const phase of phases_task_one) {
        state.workspaces[phase.workspace] = state.layouts[phase.defaultLayout];
      }
      // state.workspaces = _.cloneDeep(defaultWorkspaces)
    } else {
      this.commit("SET_CURRENT_PHASE", 1);
      state.phases = phases;
      state.layouts = layouts;
      state.workspaces = _.cloneDeep(defaultWorkspaces);
      state.currentWorkspace = 0;
      state.currentPhase = 1;
      state.highlightedCards = [];
    }
    console.log("PHASES: ", state.phases);
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
