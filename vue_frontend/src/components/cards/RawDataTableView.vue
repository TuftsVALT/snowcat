<template>
  <v-card>
    <v-card-title>
      <v-spacer></v-spacer>
      <v-text-field
        append-icon="search"
        label="Search"
        single-line
        hide-details
        v-model="search"
      ></v-text-field>
    </v-card-title>
    <v-data-table
      :headers="modHeaders"
      :items="items"
      :pagination.sync="pagination"
      :total-items="totalItems"
      :loading="loading"
      :rows-per-page-items="[5,10,25]"
      v-model="selected"
      item-key="d3mIndex"
    >
      <template slot="items" slot-scope="props">
        <tr :d3mIndex="props.item.d3mIndex" @mouseenter="rowMouseEnter(props.item)" @mouseleave="rowMouseLeave(props.item)" @click="click(props.item)" class="tablerow">
          <td>
            <v-checkbox
              v-model="props.selected"
              primary
              hide-details
            ></v-checkbox>
          </td>
          <td v-for="header in headers" class="text-xs-center" :title="getTooltipText(header,props.index)">{{ props.item[header.value] }}</td>
      </tr>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>

//using the suggested solution to watch vuex data from:
//https://stackoverflow.com/questions/43270159/vuejs-2-how-to-watch-store-values-from-vuex
import { mapGetters } from 'vuex';
import store from '@/store';

export default {
  name: 'RawDataTableView',
  mounted () {
    this.getData()
      .then(data => {
        this.raw_items = data.items;
        this.totalItems = data.total;
        this.headers = data.headers;
      }).catch(console.log);
  },
  data () {
    return {
      config: this.$store.state.socket.evaluationConfig,
      search: '',
      selected: [],
      totalItems: 0,
      raw_items: [],
      loading: true,
      headers: [],
      modHeaders: [],
      pagination: {},
      d3mIndexHovered: null,
    }
  },
  computed: {
    items() {
      let new_items = [];
      for (let i = 0; i < this.raw_items.length; i++) {
        let data_object = this.raw_items[i];
        let new_object = { };
        let keys = Object.keys(data_object);
        for (let j = 0; j < keys.length; j++) {
          let key = keys[j];
          let value = data_object[key];
          if (typeof value === "string" && value.length > 20) {
            value = value.substring(0, 20) + "...";
          }
          new_object[key] = value;
        }
        new_items.push(new_object);
      }
      return new_items;
    },
    xLinkingHilite() {
      if (this.$store.state.socket.xLinking.highlight) {
        var newStringArray = this.$store.state.socket.xLinking.xLinkIndexes.map(d => "" + d);
        return {
          array: newStringArray,
          set: new Set(newStringArray)
        }
      } else {
        return {
          array: [],
          set: new Set()
        };
      }
    },
    xLinkingSelect() {
      return {
        array: this.$store.state.socket.xLinkingSelect,
        set: this.$store.state.socket.xLinkingSelect_Set
      }
    }
  },
  watch: {
    totalItems() {
      console.log("TOTAL ITEMS", this.totalItems);
    },
    headers() {
      let newHeaders = this.headers.map(d => d);
      newHeaders.unshift({
        align: "center",
        // it would be much cooler if rows could be sorted by selection
        // but because the backend does sorting and has no selection model
        // this is not possible at the moment
        sortable: false,
        text: "selected",
        value: "selected"
      });
      //console.log(newHeaders);
      this.modHeaders = newHeaders;
    },
    xLinkingHilite() {
      let indexSet = this.xLinkingHilite.set;
      let tableRows = d3.select(this.$el).selectAll(".tablerow");
      tableRows.each(function() {
        let tableRow = d3.select(this);
        if (indexSet.has(tableRow.attr("d3mIndex"))) {
          tableRow.style("background-color", "#eeeeee");
        } else {
          tableRow.style("background-color", "");
        }
      });
    },
    xLinkingSelect() {
      //console.log("enter xLinkingSelect", this.xLinkingSelect.array);
      let newArray = this.xLinkingSelect.array.map((d3mIndex) => { return { d3mIndex: d3mIndex } } );
      this.selected = newArray;
      //console.log("exit xLinkingSelect", newArray);
    },
    search() {
      //console.log("search: ", this.search, this.totalItems);
      //console.log("pagination: ", this.pagination);
      //this is hacky: trigger actions for change in pagination object
      //search uses the same endpoint in the backend
      this.pagination.__ob__.dep.notify();
    },
    pagination: {
      handler () {
        this.getData()
          .then(data => {
            this.raw_items = data.items;
            this.totalItems = data.total;
          })
      },
      deep: true
    }
  },
  methods: {
    getTooltipText(header, index) {
      return this.raw_items[index][header.value];
    },
    rowMouseLeave(data) {
      // console.log("ROW MOUSE LEAVE", data.d3mIndex);
      this.d3mIndexHovered = null;
      console.log("NotOK");
      store.commit('updateXLinking', {
        xLinkIndexes: [],
        highlight: false,
        visValue: false,
        visType: "rawTable"
      });
    },
    rowMouseEnter(data) {
      // console.log("ROW MOUSE ENTER", data.d3mIndex);
      this.d3mIndexHovered = "" + data.d3mIndex;
      store.commit('updateXLinking', {
        xLinkIndexes: ["" + data.d3mIndex],
        highlight: true,
        visValue: true,
        visType: "rawTable"
      });
    },
    click(item) {
      let d3mIndex = "" + item.d3mIndex;
      if (this.xLinkingSelect.set.has(d3mIndex)) {
        //deselect node
        store.commit("xLinkUnSelect", d3mIndex);
      } else {
        //select node
        store.commit("xLinkSelect", d3mIndex);
      }
      console.log('click', d3mIndex);
      //this.selected.push({d3mIndex: 99});
    },
    getData () {
      this.loading = true
      return new Promise((resolve, reject) => {
        const { sortBy, descending, page, rowsPerPage } = this.pagination;
        let vueThis = this;
        let intervalId = setInterval(function() {
          vueThis.$socket.emit("tableEndpoint", vueThis.pagination, vueThis.search, function(data) {
            vueThis.loading = false;
            clearInterval(intervalId);
            resolve(data);
          });
        }, 3000);
      });
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
