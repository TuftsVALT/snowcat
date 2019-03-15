<template>
<div>
    <v-data-table :headers="headers" :items="audios" :pagination.sync="pagination" hide-actions class="elevation-1">
        <template slot="items" slot-scope="props">
            <tr :d3mIndex="props.item.d3mIndex" class="tablerow" @mouseenter="rowMouseEnter(props.item.d3mIndex)" @mouseleave="rowMouseLeave()">
                <td>{{ props.item.d3mIndex }}</td>
                <td>
                    <RawAudioViewSingle :audio='props.item' :key="props.item.d3mIndex"></RawAudioViewSingle>
                </td>
            </tr>
        </template>
    </v-data-table>

    <div class="text-xs-center pt-2" v-on:click="stop">
        <v-pagination v-model="pagination.page" :length="pages"></v-pagination>
    </div>

    <div class="container">
        <div class="row">
            <div class="col-xs-2"></div>
            <div class="col-xs-4">
                Jump to Page
                <input type="number" min="1" :max="pages" v-model.number="page">
                <button @click="setPage()" class="btn btn-primary btn-sm">Jump!</button>
            </div>
            <div class="col-xs-4">
                Audios Per Page
                <select v-model.number="itemsPerPage">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <button @click="setItemsPerPage()" class="btn btn-success btn-sm">Go!</button>
            </div>
            <div class="col-xs-2"></div>
        </div>
    </div>
</div>
</template>

<script>
import { mapGetters } from "vuex";
import store from "@/store";

import RawAudioViewSingle from "./RawAudioViewSingle.vue";
import { eventBus } from "../../main";
export default {
  data: function() {
    return {
      page: 1,
      itemsPerPage: 5,
      pagination: {
        rowsPerPage: 5,
        totalItems: 0
      },
      headers: [
        {
          text: "d3mIndex",
          value: "d3mIndex",
          align: "left"
        },
        {
          text: "Audio Wavesurfer",
          value: "link",
          align: "left",
          width: "95%"
        }
      ],
      audios: [],
      numOfAudios: 0, // number of audios totally
      d3mIndexHovered: null
    };
  },
  watch: {
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
    }
  },
  computed: {
    // items() {
    //   let rst = [];
    //   this.audios.forEach(audio => {
    //     rst.push(audio.id);
    //   });
    //   console.log(rst.length);
    //   return rst;
    // },
    xLinkingHilite() {
      var newStringArray = [];
      var isHighlight = this.$store.state.socket.xLinking.highlight;
      if (isHighlight) {
        var xLinkIndexes = this.$store.state.socket.xLinking.xLinkIndexes;
        newStringArray = xLinkIndexes.map(d => "" + d);
      }
      return {
        // array: newStringArray,
        set: new Set(newStringArray)
      };
    },
    pages() {
      var isRowsPerPageNull = this.pagination.rowsPerPage == null;
      var isTotalItemsNull = this.pagination.totalItems == null;
      if (isRowsPerPageNull || isTotalItemsNull) {
        return 0;
      }
      var totalPages = this.pagination.totalItems / this.pagination.rowsPerPage;
      return Math.ceil(totalPages);
    }
  },
  sockets: {
    connect: function() {
      // console.log("Client: connect to Server");
    },
    // listen for "returnAudios" emmited from backend with data "audios"
    responseAudios: function(audios) {
      this.$store.audios = audios;
      this.audios = this.$store.audios;
      this.numOfAudios = this.audios.length; // update numOfAudios
      this.pagination.totalItems = this.numOfAudios;
    }
  },
  methods: {
    rowMouseEnter(d3mIndex) {
      this.d3mIndexHovered = d3mIndex;
      this.$store.commit("updateXLinking", {
        xLinkIndexes: [d3mIndex],
        highlight: true,
        visValue: true,
        visType: "audio"
      });
    },
    rowMouseLeave() {
      this.d3mIndexHovered = null;
      this.$store.commit("updateXLinking", {
        xLinkIndexes: [],
        highlight: false,
        visValue: false,
        visType: ""
      });
    },
    stop() {
      eventBus.$emit("stop");
    },
    setPage() {
      this.pagination.page = this.page;
      this.stop();
    },
    setItemsPerPage() {
      this.pagination.rowsPerPage = this.itemsPerPage;
      this.stop();
    },
    // emit "getAudios" to backend server
    requestAudios() {
      this.$socket.emit("requestAudios");
    }
  },
  created() {
    this.requestAudios();
  },
  components: {
    RawAudioViewSingle
  }
};
</script>

<style scoped>
input {
  text-align: center;
  border: 1px solid gray;
  height: 25px;
  width: 50px;
}

select {
  border: 1px solid gray;
  height: 25px;
  width: 50px;
  /* appearance: menulist; */
}
</style>
