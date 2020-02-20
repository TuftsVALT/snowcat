<template>
  <v-dialog v-model="dialog" persistent max-width="400px">
    <v-card v-if="dialog">
      <v-card-text v-if="!loading">
        Do you want to continue the materializaion of the current dataset? The materializing process may take few minutes.
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
      this.$socket.emit(
        "dataaugMaterializeD3MDataset",
        this.$store.state.socket.attributesInCurrentDataTable,
        // this.$store.state.socket.dataAugTable, //Replace with "this.$store.state.socket.attributesInCurrentDataTable"
        function() {
          console.log("RETURN FUNCTION HAS BEEN CALLED")
          vueThis.dialog = false;
          vueThis.loading = false;
          vueThis.$emit("hide-confirm-and-loading-dialog");
          store.commit('setMaterializeFinishToken', true);
        }
      );
    }
  }
};
</script>

<style scoped></style>
