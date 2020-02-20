<template>
  <v-card>
    <div>
      <v-progress-linear
        indeterminate
        color="primary"
        class="mb-0"
        v-if="loading"
        height="2"
      ></v-progress-linear>
      <ColumnView
        :first-column-data="firstColumnData"
        :all-attribute-data="allAttributeData"
      ></ColumnView>
      <ConfirmAndLoading
        :confirm-and-loading-dialog="confirmAndLoadingDialog"
        @hide-confirm-and-loading-dialog="hideConfirmAndLoadingDialog"
      ></ConfirmAndLoading>
    </div>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn 
        color="primary"
        :disabled="!active"
        @click="showConfirmAndLoadingDialog"
      >
        Materialize Data
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import store from "@/store";
import _ from "lodash";
import ColumnView from "@/components/cards/DataAugmentationComponents/ColumnView.vue";
import ConfirmAndLoading from "@/components/cards/DataAugmentationComponents/ConfirmAndLoading.vue";
import * as d3 from "d3";

export default {
  name: "DataAugmentation",

  components: {
    ColumnView,
    ConfirmAndLoading
  },

  data () {
    return {
      config: this.$store.state.socket.evaluationConfig,
      searchTerms: '',
      loader: null,
      loading: true,
      searching: false,
      headers: [],
      pagination: {},
      items: [],
      selectedIndex: 0,
      augmentIteration: 0,
      outputPath: '',
      selected: [],
      firstColumnData: {
        children: []
      },
      allAttributeData: [],
      confirmAndLoadingDialog: false
    }
  },

  sockets:{
    //
  },

  mounted: function() {
    this.updateDataTable();
  },

  computed: {
    active() {
      return !_.isEmpty(this.$store.state.socket.dataAugTable);
    },

    materializeFinish() {
      return this.$store.state.socket.materializeFinished;
    }
  },

  watch: {
    materializeFinish(value) {
      if(value) {
        this.firstColumnData = {
          children: []
        };
        this.updateDataTable();
      }
    }
  },

  methods: {
    getData () {
      this.loading = true;
      return new Promise((resolve, reject) => {
        const { sortBy, descending, page, rowsPerPage } = this.pagination;
        let vueThis = this;
        let intervalId = setInterval(function() {
          vueThis.$socket.emit("tableEndpoint", vueThis.pagination, vueThis.searchTerms, function(data) {
            vueThis.loading = false;
            clearInterval(intervalId);
            resolve(data);
          });
        }, 3000);
      });
    },

    updateDataTable () {
      let vm = this;
      this.getData()
        .then(data => {
          if (!data) return;
          vm.allAttributeData = data.items;
          let firstColumnData = {
            key: "baseball",
            value: "",
            children: []
          };
          data.headers.forEach(datum => {
            let valueType = isNaN(vm.allAttributeData[0][datum.value]) ? "string" : "number";
            firstColumnData.children.push({
              key: datum.value,
              value: "",
              valueType: valueType,
              children: [],
              derived: false,
              includeInData: true
            });
          });
          vm.firstColumnData = firstColumnData;
          store.commit('updateAttributesInCurrentDataTable', vm.firstColumnData.children);
        }).catch(console.log);
    },

    showConfirmAndLoadingDialog () {
      this.confirmAndLoadingDialog = true;
    },

    hideConfirmAndLoadingDialog () {
      this.confirmAndLoadingDialog = false;
    }
  }
};
</script>

<style scoped></style>
