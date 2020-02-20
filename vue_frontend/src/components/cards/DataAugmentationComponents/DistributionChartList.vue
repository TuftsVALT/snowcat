<template>
  <v-card
    class="d-flex flex-column mb-2 distributionChart"
    hover
    flat
    v-if="show"
    @click="clickCard()"
    v-resize="onResize"
  >
    <v-card-title class="px-2 py-2" ref="cardTitle">
      <span class="text-left attributeName">{{ selectedAttributeText }}</span>
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
      <v-btn flat text small color="green darken-1" @click="show = false">Close</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import store from "@/store";
import DistributionChartSVG from "@/components/cards/DataAugmentationComponents/DistributionChartSVG.vue";
import * as d3 from "d3";

export default {
  name: "DistributionChartList",

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
      show: true,
      svgWidth: 150
    };
  },

  mounted: function() {
    this.onResize();
  },

  watch: {
    show: function(value) {
      if (value === false) {
        this.$emit("deleteWindow", this.$props.selectedAttributeText);
      }
    }
  },

  computed: {
    svgHeight() {
      return this.svgWidth / 1.618;
    }
  },

  methods: {
    clickCard() {
      this.$emit("showAttributeDetail", this.$props.selectedAttributeText);
    },

    onResize: function(el) {
      this.svgWidth = this.$refs.cardTitle.offsetWidth - 2;
    }
  }
};
</script>

<style scoped>
.distributionChart {
  border: 1px solid rgba(34,36,38,.15);
  border-radius: 0px;
}
</style>
