<template>
<div>
    <v-data-table :headers="headers" :items="videos" :pagination.sync="pagination" hide-actions class="elevation-1">
        <template slot="items" slot-scope="props">
            <tr :d3mIndex="props.item.d3mIndex" class="tablerow" @mouseenter="rowMouseEnter(props.item.d3mIndex)" @mouseleave="rowMouseLeave()">
                <td><strong>{{ props.item.d3mIndex }}</strong></td>
                <td>
                    <RawVideoViewSingle :video='props.item' :key="props.item.d3mIndex"></RawVideoViewSingle>
                </td>
            </tr>
        </template>
    </v-data-table>
    <div class="text-xs-center pt-2">
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
                Videos Per Page
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
import jQuery from "jquery";
import store from "@/store";

import RawVideoViewSingle from "./RawVideoViewSingle.vue";
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
          text: "Video Preview",
          value: "link",
          align: "left",
          width: "95%"
        }
      ],
      videos: [],
      numOfVideos: 0, // number of VideoLinks totally
      d3mIndexHovered: null // I had no idea what this is for --Alex
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
    // listen for "returnVideos" emmited from backend with data "videos"
    responseVideos: function(videos) {
      this.$store.videos = videos;
      this.videos = this.$store.videos;
      this.numOfVideos = this.videos.length; // update numOfVideos
      this.pagination.totalItems = this.numOfVideos;
    }
  },
  methods: {
    rowMouseEnter(d3mIndex) {
      this.d3mIndexHovered = d3mIndex;
      this.$store.commit("updateXLinking", {
        xLinkIndexes: [d3mIndex],
        highlight: true,
        visValue: true,
        visType: "video"
      });
    },
    rowMouseLeave() {
      // console.log("ROW MOUSE LEAVE", id - 1);
      this.d3mIndexHovered = null;
      this.$store.commit("updateXLinking", {
        xLinkIndexes: [],
        highlight: false,
        visValue: false,
        visType: ""
      });
    },

    setPage() {
      this.pagination.page = this.page;
    },
    setItemsPerPage() {
      this.pagination.rowsPerPage = this.itemsPerPage;
    },
    requestVideos() {
      this.$socket.emit("requestVideos");
    }
  },
  created() {
    this.requestVideos();
  },
  components: {
    RawVideoViewSingle
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
  appearance: menulist;
}
</style>
