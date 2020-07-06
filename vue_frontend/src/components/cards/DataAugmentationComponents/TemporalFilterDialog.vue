<template>
  <v-dialog v-model="temporalDialog" persistent max-width="1200px">
    <v-card class="temporal-filter-container" v-if="temporalDialog">
      <v-card-text>
        <p>
            The attribute that was retrieved, <span class="highlighted-attribute">{{attributeName}}</span>, has multiple possible values per row of your dataset.  These values have timestamps.  For example, {{exampleSourceVal}} has {{temporalValues.length}} recorded values for <span class="highlighted-attribute">{{attributeName}}</span>.          
        </p>
        <v-card class="temporal-filter-example-container">
          <v-data-table
            :headers="temporalHeaders"
            :items="temporalValues"
            hide-actions
            disable-initial-sort
          >
            <template v-slot:items="props">
              <td>{{ props.item.time }}</td>
              <td>{{ props.item.val }}</td>
            </template>
          </v-data-table>
        </v-card>
        <p>
            You can decide to filter down to only values that match a particular date filter.
            Please view the options below.
        </p>

        <v-container>
            <v-radio-group v-model="temporalFilterChoice">
                <v-radio
                    label="No Change"
                    :value="'no_change'"
                >
                  <template v-slot:label>
                    <div class="temporal-filter-option">
                      No change - keep all values for {{attributeName}}
                    </div>
                  </template>
                </v-radio>
                <v-radio
                    label="Join the most recent"
                    :value="'most_recent'"
                >
                  <template v-slot:label>
                    <div class="temporal-filter-option">
                      Return only the most recent value for {{attributeName}}
                    </div>
                  </template>

                </v-radio>
                <v-radio
                    label="Join the closest"
                    :value="'closest_to_date'"
                >
                  <template v-slot:label>
                    <div class="temporal-filter-option">
                      Match the closest {{attributeName}} to the following date:
                        <!-- :return-value.sync="closestToDate" -->
                      <v-menu
                        ref="menu"
                        v-model="closestToDateMenu"
                        :close-on-content-click="false"
                        :nudge-right="170"
                        :nudge-bottom="170"
                        lazy
                        transition="scale-transition"
                        offset-y
                        full-width
                        min-width="290px"
                      >
                        <template v-slot:activator="{ on }">
                          <v-text-field
                            v-model="closestToDateString"
                            prepend-icon="event"
                            v-on="on"
                          ></v-text-field>
                        </template>
                        <v-date-picker 
                          v-model="closestToDatePicker" 
                          no-title
                          reactive
                          scrollable>
                          <v-spacer></v-spacer>
                          <v-btn flat color="primary" @click="menu = false">Cancel</v-btn>
                          <v-btn flat color="primary" @click="$refs.menu.save(closestToDateString)">OK</v-btn>
                        </v-date-picker>
                      </v-menu>


                    </div>
                  </template>

                </v-radio>
                <v-radio
                    label="Join to other column"
                    :value="'other_column'"
                >
                  <template v-slot:label>
                    <div class="temporal-filter-option">
                      Try to infer the date from another column: 
                      <v-select
                        :items="currentAttributeList"
                        v-model="inferDateAttribute"
                      ></v-select>
                    </div>
                  </template>

                </v-radio>
                <!-- <v-radio
                    label="Filter between"
                    :value="'filter'"
                >
                  <template v-slot:label>
                    <div class="temporal-filter-option">
                      Filter to only values within a range of dates 
                    </div>
                  </template>
                </v-radio> -->
            </v-radio-group>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          flat
          text
          color="green darken-1"
          @click="cancelFilter"
        >
          Cancel
        </v-btn>
        <v-btn 
          color="primary"
          @click="acceptFilter(filterResults)"
        >
          Apply Filter
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import store from "@/store";
import * as d3 from "d3";
import PreviewJoinGraph from "@/components/cards/DataAugmentationComponents/PreviewJoinGraph.vue";
import * as moment from "moment";

export default {
  name: "TemporalFilterDialog",

  components: {
  },

  props: {
    temporalDialog: {
      type: Boolean,
      default: () => false
    },
    temporalDialogVal: {
      type: Object,
      default: () => {}
    },
    currentAttributeList: {
      type: Array,
      default: () => []
    },
    temporalFilters: {
      type: Object,
      default: () => {}
    }
  },

  data() {
    return {
      loading: false,
      temporalFilterChoice: 'no_change',
      closestToDate: '',
      closestToDateUserString: '',
      closestToDateMenu: false,
      inferDateAttribute: ''
    };
  },

  mounted () {
  },

  computed: {
    filterResults: {
      get: function() {
        return {
          'filteredAttribute': this.attributeName,
          'temporalFilterChoice': this.temporalFilterChoice,
          'closestToDate': this.closestToDate,
          'closestToDateUserString': this.closestToDateUserString,
          'inferDateAttribute': this.inferDateAttribute
        }
      }
    },

    exampleSourceVal: {
      get: function() {
        return this.temporalDialogVal && this.temporalDialogVal.entityLabel && this.temporalDialogVal.entityLabel.value;
      }
    },

    closestToDatePicker: {
      get: function() {
        return this.closestToDate;
      },

      set: function(date) {
        this.closestToDateString = date;
      }
    },

    closestToDateString: {
      get: function() {
        return this.closestToDateUserString;
      },

      set: function(dateString) {
        // console.log("trying to set date string...")
        this.closestToDateUserString = dateString;
        this.debouncedClosestToDate(dateString)
      }
    },

    attributeName: {
      get: function() {
        return this.temporalDialogVal && this.temporalDialogVal.wdLabel && this.temporalDialogVal.wdLabel.value
      }
    },

    previousTemporalFilter: {
      get: function() {
        return this.temporalFilters[this.attributeName];
      }
    },

    temporalValues: {
      get: function() {
        if (this.temporalDialogVal && this.temporalDialogVal.sortedTemporalVals) {
          return this.temporalDialogVal.sortedTemporalVals;
        } else {
          return [];
        }
      }
    },

    temporalHeaders: {
      get: function() {
        if (this.attributeName) {
          return [
            { text: 'Time', value: 'time' },
            { text: this.attributeName, value: 'val' }
          ]
        } else {
          return [];
        }
      }
    }
  },

  watch: {
    temporalDialog: function(value) {
        // console.log("temporalDialog has been changed, it is ", value)
    },
  },

  methods: {
    initializeDialog: function() {
      this.temporalFilterChoice = (this.temporalFilter && this.temporalFilter.temporalFilterChoice) || 'no_change';
      this.closestToDate = (this.temporalFilter && this.temporalFilter.closestToDate) || '';
      this.closestToDateUserString = (this.temporalFilter && this.temporalFilter.closestToDateUserString) || '';
      this.inferDateAttribute = (this.temporalFilter && this.temporalFilter.inferDateAttribute) || '';
    },

    debouncedClosestToDate: _.debounce(function (dateString) {
      // console.log("setting datepicker to ", dateString)
      const parsedDateString = moment(dateString).format();
      this.closestToDate = parsedDateString;
      // console.log("setting closestToDate to be ", parsedDateString)
      }, 
    500),

    cancelFilter() {
      this.$emit('cancelFilter');
    },

    acceptFilter() {
      this.$emit('acceptFilter', this.filterResults);
    },

  }
};
</script>

<style scoped>
  .temporal-filter-container {
    font-size: 1.7em;
    padding: 50px;
    text-align: left;
  }

  .temporal-filter-example-container {
    height: 200px;
    overflow-y: scroll;
  }

  .temporal-filter-option {
    display: inline-flex;
    height: 40px;
    line-height: 40px;
  }

  .v-text-field {
    padding-top: 0px;
  }

  .highlighted-attribute {
    color: red;
    font-weight: 700;
  }

</style>