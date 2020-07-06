<template>
  <v-dialog v-model="dialog" persistent max-width="400px">
    <v-card v-if="dialog">
      <v-card-text v-if="!loading">
        <!-- Do you want to continue the materialization of the current dataset? The materializing process may take few minutes. -->
        Do you want to construct a new model with the current dataset? The modeling process may take few minutes.
      </v-card-text>
      <v-card-text v-if="loading">
        Please stand by
        <v-progress-linear
          indeterminate
          color="primary"
          class="mb-0"
        ></v-progress-linear>
      </v-card-text>
      <v-card-actions v-if="!loading">
        <v-spacer></v-spacer>
        <v-btn
          flat
          text
          color="green darken-1"
          @click="stopMaterializeData"
        >
          Close
        </v-btn>
        <v-btn 
          color="primary"
          @click="continueMaterializeData"
        >
          Continue
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import store from "@/store";
import * as d3 from "d3";

export default {
  name: "ConfirmAndLoading",

  components: {
    //
  },

  props: {
    confirmAndLoadingDialog: {
      type: Boolean,
      default: () => false
    }
  },

  data() {
    return {
      dialog: false,
      loading: false
    };
  },

  mounted: function() {
    //
  },

  computed: {
    //
  },

  watch: {
    confirmAndLoadingDialog: function(value) {
      if(value) {
        this.dialog = true;
      }
    }
  },

  methods: {
    stopMaterializeData () {
      this.dialog = false;
      this.$emit("hide-confirm-and-loading-dialog");
    },
    
    continueMaterializeData () {
      let vueThis = this;
      console.log("materialize data");
      this.loading = true;
      //Should send attributesInCurrentDataTable to the backend
      console.log("attributes in the current data table are ", this.$store.state.socket.attributesInCurrentDataTable);
      let colArr = this.$store.state.socket.attributesInCurrentDataTable, newArr = []
      let removecollist = this.$store.state.socket.removeColList;
      console.log('col arr seen  in materialize', colArr, removecollist, this.$store.state.socket)
      for(let i = 0; i<colArr.length;i++){
        let ind = removecollist.indexOf(colArr[i]['key'])
        if(ind == -1) {
          newArr.push(colArr[i])
        }
      }              
      console.log('col arr seen after splicing in materialize view', newArr)
      this.$socket.emit(
        "dataaugMaterializeD3MDataset",
        newArr,
        // this.$store.state.socket.attributesInCurrentDataTable,
        // this.$store.state.socket.dataAugTable, //Replace with "this.$store.state.socket.attributesInCurrentDataTable"
        function() {
          console.log("RETURN FUNCTION HAS BEEN CALLED")
          vueThis.dialog = false;
          vueThis.loading = false;
          vueThis.$emit("hide-confirm-and-loading-dialog");
          // store.commit('setMaterializeFinishToken', true); // commented to not reset column view
        }
      );
    }
  }
};
</script>

<style scoped></style>
