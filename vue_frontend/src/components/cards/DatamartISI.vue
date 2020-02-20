<template>
  <v-card>
    <v-card-title>
      <v-spacer></v-spacer>
      <v-text-field
        append-icon="search"
        label="Search"
        single-line
        hide-details
        id="datamart-search-field"
        ref="my-datamart-search-field"
        v-model="searchTerms"
      ></v-text-field>
      <v-spacer></v-spacer>
      <v-btn 
        @click="searchDatamartISI"
        :loading="searching"
        :disabled="searching"
        color="info"
      >Search</v-btn>
      <v-btn
        @click="augmentDatamartISI"
        :loading="loading"
        :disabled="loading"
        color="info"
      >Augment</v-btn>
      <v-spacer></v-spacer>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="items"
      :rows-per-page-items="[100]"
    >
      <template slot="headers" slot-scope="props">
        <tr>
          <td class = "text-xs-center">
            Selected
          </td>
          <td class = "text-xs-center">
            Dataset name
          </td>
          <td class = "text-xs-center">
            Variables
          </td>
          <td class = "text-xs-center">
            Join Columns
          </td>
          <td class = "text-xs-center">
            Score
          </td>
        </tr>
      </template>
      <template slot="items" slot-scope="props">
        <tr @click="click(props.index)">
          <td>
            <v-radio-group
            v-model="selected"
            name="datasetSelector"
            >
            <v-radio :value="props.index"/>
            </v-radio-group>
          </td>
          <td class = "text-xs-center">
            {{props.item[0]}}
          </td>
          <td class = "text-xs-center">
            {{props.item[1]}}
          </td>
          <td class = "text-xs-center">
            {{props.item[2]}}
          </td>
          <td class = "text-xs-center">
            {{props.item[3]}}
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import store from "@/store";

export default {
  name: "DatamartISI",
  data () {
    return {
      config: this.$store.state.socket.evaluationConfig,
      searchTerms: '',
      augmentSelect: false,
      loader: null,
      loading: false,
      searching: false,
      headers: [],
      pagination: {},
      items: [],
      selectedIndex: 0,
      augmentIteration: 0,
      selected: []
    }
  },
  sockets: {
    datamartFrontendISI(dataset){
      this.items = dataset;
      console.log(this.items);
    }
  },
  methods: {
    searchDatamartISI () {
      this.searching = true;
      this.getDataISI()
        .then(data => {
          this.searching = false;
      });
    },
    augmentDatamartISI () {
      this.loading = true;
      this.augmentSelect = true;
      this.getDataISI()
        .then(data => {
          this.loading = false;
          this.augmentSelect = false;
          this.selectedIndex = 0;
          this.augmentIteration += 1; 
      });
    },
    click(index) {
      this.selectedIndex = index;
      this.selected = index;
      console.log("clicked", this.selectedIndex);
    },
    getDataISI () {
      return new Promise((resolve, reject) => {
        const { sortBy, descending, page, rowsPerPage } = this.pagination;
        let vueThis = this;
        this.$socket.emit("datamartEndpointISI", this.pagination, this.searchTerms, this.augmentSelect, this.selectedIndex, this.augmentIteration, function(data) {
          resolve(data);
        });
      });
    }
  }
}
</script>

<style scoped>
.dataDiscoveryContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  border: 1px solid lightgray;
  padding: 3px;
}

.labelInputContainer {
  display: flex;
  flex-direction: column;
  width: 100%;
  /* height: 100%; */
  padding: 3px;
}

.dataListContainer {
  display: flex;
  flex-direction: column;
  width: 100%;
  /* height: 100%; */
  padding: 3px;
}

h6 {
  padding: 4px;
  width: 100%;
  text-align: left;
}
</style>