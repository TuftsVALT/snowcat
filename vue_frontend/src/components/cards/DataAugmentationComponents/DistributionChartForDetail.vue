<template>
  <v-dialog v-model="dialog" width="900px">
    <v-card v-if="dialog">
      <v-card-title class="px-4 py-4" ref="cardTitle">
        <span class="headline text-center attributeName">{{ selectedAttributeText }}</span>
      </v-card-title>
      <DistributionChartSVG
        :selected-attribute-text="selectedAttributeText"
        :all-attribute-data="allAttributeData"
        :svg-width="svgWidth"
        :svg-height="svgHeight"
      ></DistributionChartSVG>
      <v-spacer></v-spacer>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn flat text color="green darken-1" @click="dialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import store from "@/store";
import DistributionChartSVG from "@/components/cards/DataAugmentationComponents/DistributionChartSVG.vue";
import * as d3 from "d3";

export default {
  name: "DistributionChartForDetail",

  components: {
    DistributionChartSVG
  },

  props: {
    selectedAttributeText: {
      type: String,
      default: () => ""
    },

    allAttributeData: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      dialog: false,
      svgWidth: 500
    };
  },

  mounted: function() {
    //
  },

  computed: {
    svgHeight() {
      return this.svgWidth / 1.618;
    }
  },

  watch: {
    selectedAttributeText: function(value) {
      if (value == "") return;
      this.dialog = true;
      this.$nextTick(function() {
        this.svgWidth = this.$refs.cardTitle.offsetWidth;
      });
    },

    dialog: function(value) {
      if (value == false) {
        this.$emit("unselect-attribute-text", false);
        // reset scroller
        // this.$nextTick(function() {
        //   let elem = this.$refs.card.$parent.$el;
        //   elem.scrollTop = 0;
        // });
      }
    }
  },

  methods: {
    //
  }
};
</script>

<style scoped></style>
