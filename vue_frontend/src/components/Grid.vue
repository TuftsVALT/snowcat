<template>
  <v-container grid-list-xl class="the-grid" fluid>
    <!-- <draggable v-model="cards" @start="drag=true" @end="drag=false" :options="{ 'handle': '.drag-handle' }" class="drag-container layout row wrap"> -->
    <draggable v-model="cards" @start="drag=true" @end="drag=false" :options="{ 'handle': '.drag-handle' }" class="drag-container layout row wrap">
      <v-flex
        v-for="(card, index) in cards"
        v-bind="{ [`xs${card.size}`]: true }"
        :key="'card-'+index"
        class="grid-card"
        v-if="satisfiesDeps(card.component)"
      >
        <v-card :class="{ highlighted: highlightedCards.includes(card.component), 'elevation-0': true }">
          <v-toolbar dense dark flat color="blue-grey darken-1">
            <v-toolbar-title>{{getCardTitle(card.component)}}</v-toolbar-title>

            <v-layout flex align-center>
              <v-btn bottom icon v-show="getCardHelpText(card.component)" @click.stop="toggleCardHelpPanel(index)"><v-icon>help</v-icon></v-btn>
            </v-layout>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>
            <v-spacer></v-spacer>

            <v-layout flex pr-0 justify-end>
              <v-btn title="Hold to drag card" bottom class="drag-handle" icon>
                <v-icon class="drag-handle">reorder</v-icon>
              </v-btn>
            </v-layout>

            <v-layout flex pr-0 pl-0 justify-end>

              <v-btn  title="Resize" bottom  icon @click.stop="toggleFlex(index)">
                <v-icon>{{card.size === 12 ? 'fullscreen_exit' : 'fullscreen'}}</v-icon>
              </v-btn>

            </v-layout>

            <v-layout flex mr-0 pr-0 pl-0 justify-end>

              <v-btn title="Close" bottom icon @click.stop="removeCard(index)" v-if="hasCardClose(card.skipCloseButton)">
                <v-icon>clear</v-icon>
              </v-btn>

            </v-layout>


          </v-toolbar>
          <v-expansion-panel expand dark class="elevation-0">
            <v-expansion-panel-content :value="card.help">
              <v-card color="blue-grey darken-3">
                <v-card-text v-html="getCardHelpText(card.component)" class="help-text">
                </v-card-text>
              </v-card>
            </v-expansion-panel-content>
          </v-expansion-panel>
            <component :is="cardComponents[card.component]" />
          <v-card-actions class="white">


          </v-card-actions>
        </v-card>
      </v-flex>
      <v-flex xs12 slot="footer" class="add-card" v-show="cardComponentList.length > 0">
        <v-menu>
          <v-btn block flat color="primary" slot="activator" outline>
            <!--
              <v-icon x-large>add</v-icon>
            -->
            ADD ADDITIONAL VIEW
          </v-btn>
          <v-list>
            <v-list-tile v-for="item in cardComponentList" :key="item.component" @click="addCard(item)">
              <v-list-tile-title v-text="item.title"></v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
      </v-flex>
    </draggable>
  </v-container>
</template>

<script>
import draggable from 'vuedraggable'
import cards from '@/components/cards'
import marked from 'marked'
var renderer = new marked.Renderer();

renderer.link = function( href, title, text ) {
  return '<a target="_blank" href="'+ href +'" title="' + title + '">' + text + '</a>';
}
import _ from 'lodash'

export default {
  name: 'grid',
  components: { draggable },
  methods: {
    toggleFlex (index) {
      this.$store.commit('TOGGLE_CARD_FLEX', { workspace: this.$store.state.meta.currentWorkspace, cardIndex: index })
    },
    addCard (card) {
      this.$store.commit('ADD_CARD', { workspace: this.$store.state.meta.currentWorkspace, card: { component: card.component, size: card.defaultSize, help: false } })
    },
    removeCard (index) {
      this.$store.commit('REMOVE_CARD', { workspace: this.$store.state.meta.currentWorkspace, cardIndex: index })
    },
    getCardTitle (component) {
      if (this.cardMeta[component]) {
        return this.cardMeta[component].title
      }
      return ''
    },
    getCardHelpText (component) {
      if (this.cardMeta[component] && this.cardMeta[component].help) {
        if (this.cardMeta[component].help) {
          return marked(this.cardMeta[component].help, { breaks: true, anchorTargetBlank: true, renderer: renderer })
        } else {
          return " ";
        }
      }
      return null
    },
    toggleCardHelpPanel (index) {
      this.$store.commit('TOGGLE_CARD_HELP', { workspace: this.$store.state.meta.currentWorkspace, cardIndex: index })
    },
    satisfiesDeps (component) {
      if (this.$store.state.meta.task_number == 1) {
        return true;
      } else if (this.cardMeta[component]) {
        const meta = this.cardMeta[component];
        if (meta.dataDeps && _.intersection(meta.dataDeps, this.datasetTypes).length === 0) {
          return false;
        }
        if (meta.problemDeps && !meta.problemDeps.includes(this.problemType)) {
          return false;
        }
        return true;
      }
      return false;
    },
    hasCardClose (skipCloseButton) {
      return !skipCloseButton;
    }
  },
  computed: {
    cards: {
      get () {
        return this.$store.state.meta.workspaces[this.$store.state.meta.currentWorkspace].cards
      },
      set (value) {
        this.$store.commit('SET_WORKSPACE', { workspace: this.$store.state.meta.currentWorkspace, value: value })
      }
    },
    highlightedCards () {
      return this.$store.state.meta.highlightedCards
    },
    cardComponentList () {
      return _.filter(_.toArray(this.$store.state.meta.cardComponents), (d) => {
        /*
        if (d.phaseDependency > this.$store.state.meta.currentPhase) {
          return false
        }*/
        if (d.dataDeps && _.intersection(d.dataDeps, this.datasetTypes).length === 0) {
          return false
        }
        if (d.problemDeps && !d.problemDeps.includes(this.problemType)) {
          return false
        }
        if (_.some(this.cards, {component: d.component})) {
          return false
        }
        return true
      })
    },
    cardMeta () {
      return this.$store.state.meta.cardComponents
    },
    problemType () {
      return this.$store.state.socket.problemType
    },
    datasetTypes () {
      return this.$store.state.socket.datasetTypes
    }
  },
  mounted: function () {
    // console.log('data in it ', this.cardComponents)
    // console.log('help text', this.getCardHelpText('ProblemDefinition'))
  },
  data () {
    return {
      cardComponents: cards
    }
  }
}
</script>

<style lang="scss">
.the-grid {
  ul.expansion-panel {
    margin-bottom: 0;
  }
  div.drag-container {
    width: 100%;
  }
  &.container.grid-list-xl {
    padding-right: 0;
  }
  .grid-card {
    -webkit-transition: max-width 0.3s ease-in-out, flex-basis 0.3s ease-in-out;
    -moz-transition: max-width 0.3s ease-in-out, flex-basis 0.3s ease-in-out;
    -o-transition: max-width 0.3s ease-in-out, flex-basis 0.3s ease-in-out;
    transition: max-width 0.3s ease-in-out, flex-basis 0.3s ease-in-out;
    .highlighted {
      outline: 10px solid #ff9800;
    }
  }
  .add-card {
    .menu {
      width: 100%;
    }
    .btn {
      margin: 0;
      height: 60px;
    }
  }
  .help-text {
    p:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
