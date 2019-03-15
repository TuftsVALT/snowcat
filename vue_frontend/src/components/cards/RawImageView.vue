<template>
    <div id="raw-image-view">
        <v-progress-circular v-if="spinner" indeterminate v-bind:size="50" color="primary"></v-progress-circular>
        <v-container fluid grid-list-sm>
            <v-layout row wrap style="min-height: 580px;">
                <v-flex v-for="(bin, bindex) in imagesBinned" :key="bindex + '_0'" class="image-bin" v-bind:style="{width: (100 / imagesBinned.length) + '%'}">
                    <v-chip>{{ bin.formatString }}</v-chip>
                </v-flex>
                <v-flex v-for="(bin, bindex) in imagesBinned" :key="bindex + '_1'">
                    <v-flex xs1 v-for="(image, index) in bin" :key="image.d3mIndex" class="image-card" v-bind:style="{top: (index % 6  * 12.5 + 1) +'%', left: (bindex / imagesBinned.length * 98 + Math.floor(index / 6) + 1) + '%'}">
                        <!-- <v-tooltip top> -->
                        <div class="img-thumbnail" v-bind:id="'image-thumbnail-'+image.d3mIndex">
                            <img class="image" v-bind:src="image.srcThumb" width="100%" height="100%" >
                            <span>{{image.formatString}}</span>
                        </div>
                        <b-popover v-bind:target="'image-thumbnail-' + image.d3mIndex" triggers="hover focus">
                           <template slot="title">{{ image.image_file }}</template>
                           <img class="image" v-bind:src="image.srcFull" width="100%" height="100%">
                           <label>{{ valName }}:</label>
                           <span style="font-weight: bold;">{{ formatFloat(image.val) }}</span>
                        </b-popover>
                    </v-flex>
                </v-flex>
            </v-layout>
            <v-layout row wrap>
                <v-flex xs12 sm4 class="text-xs-center text-sm-left">
                    <div style="margin-top: 20px; margin-left: 10px;">
                        <label>Value Name: </label>
                        <h5 style="display: inline-block;">{{ valName }}</h5>
                    </div>
                </v-flex>
                <v-flex xs12 sm4 class="text-xs-center">
                    <v-btn
                        v-on:click="handleLoading"
                        :disable="imagesAvailable.length == 0"
                        color="primary">
                        Load More Images
                        <v-icon right dark>photo</v-icon>
                    </v-btn>
                </v-flex>
                <v-flex xs12 sm4 class="text-xs-center text-sm-right">
                    <div style="margin-top: 20px; margin-right: 10px;">
                        <label>Images Shown: </label>
                        <h5 style="display: inline-block;">{{ imagesLoaded.length }} / {{ imagesAvailable.length + imagesLoaded.length}}</h5>
                    </div>
                </v-flex>
            </v-layout>
        </v-container>
    </div>
</template>

<script>
var d3 = require('d3v4');

export default {
    name: 'raw-image-viewer',
    data: function() {
        return {
            spinner: true,
            config: null,
            numImagesToLoad: 50,
            numImagesToAdd: 50,
            imagesAvailable: [],
            imagesToLoad: [],
            imagesLoaded: [],
            imagesBinned: [],
            problemHeader: 'Classification',
            loadingQueue: d3.queue(),
            thumbnailsFolder: 'static/thumbnails_0/'
        }
    },
    computed: {
        imageFolders() {
          return this.$store.state.socket.imageFolders;
        },
        dataResources() {
          return this.$store.state.socket.rawDataDesc.dataResources;
        },
        dataRoot() {
          return this.$store.state.socket.evaluationConfig.training_data_root;
        },
        valName() {
          return this.data ? this.data.valInfo.colName : 'N/A';
        },
        valType() {
          return this.data ? this.data.valInfo.colType : 'N/A';
        },
        isNumType() {
          return this.valType == 'real' || this.valType == 'float'
                   || this.valType == 'zeroToOneFloat' || this.valType == 'integer';
        }
    },
    watch: {
      //dataResources() {
      //  console.log(this.imageFolders());
      //  if (!_.isEmpty(this.imageFolders())) {
      //    this.loadData();
      //  }
      //},
      imageFolders() {
        console.log("IMAGE FOLDERS", this.imageFolders);
        if (!_.isEmpty(this.imageFolders)) {
          this.spinner = false;
          this.loadData();
      }
    }
    },
    methods: {
        formatFloat(f) {
            return parseFloat(f).toFixed(3);
        },
        processImageRow(r) {
          //r.srcThumb = this.dataRoot + 'media/thumbnails/' + r.image_file;
          // r.srcFull = this.dataRoot + 'media/' + r.image_file;
          // r.srcThumb = this.imageFolders[0]+'/' + r.image_file;
          r.srcThumb = this.thumbnailsFolder + '/' + r.image_file;
          r.srcFull = this.thumbnailsFolder + '/' + r.image_file;
          let valInfo = _.find(this.data.tableInfo.columns, c => _.indexOf(c.role, 'suggestedTarget') >= 0);
          r.val = r[valInfo.colName];
          console.log(r.val);
          if(this.isNumType) {
              r.val = parseFloat(r.val);
              r.formatString = this.formatFloat(r.val);
              if(r.val > this.data.valInfo.domain[1]) {
                  this.data.valInfo.domain[1] = r.val;
              }
              if(r.val < this.data.valInfo.domain[0]) {
                  this.data.valInfo.domain[0] = r.val;
              }
          } else {
              if(!this.data.valInfo.domain.indexOf(r.val)) {
                  this.data.valInfo.domain.push(r.val);
              }
              r.formatString = r.val;
          }
          return r;
        },
        loadData() {
          console.log("LOAD DATA CALLED");
          this.data = {};
          this.data.tableInfo = _.find(this.dataResources, (res) => res.resType == 'table');
          this.data.imageInfo = _.find(this.dataResources, (res) => res.resType == 'image');
          this.data.valInfo = _.find(this.data.tableInfo.columns, c => _.indexOf(c.role, 'suggestedTarget') >= 0);
          if(this.isNumType) {
              this.data.valInfo.domain = [Number.MAX_SAFE_INTEGER, - Number.MAX_SAFE_INTEGER];
          } else {
              this.data.valInfo.domain = [];
          }
          console.log("test123");
          console.log(this.data.tableInfo);
          console.log(this.data.imageInfo);
          // If the proper data exists then load the image directories, then load the initial image files
          if(this.data.tableInfo && this.data.imageInfo) {
              var path = this.dataRoot.endsWith('/') ?
                this.dataRoot + this.data.tableInfo.resPath : this.dataRoot + "/" + this.data.tableInfo.resPath;
              // Temporarily just symlinking learningData.csv to static
              path = 'static/learningData.csv'
              d3.csv(path, this.processImageRow, (error, seriesDir) => {
                  if(error){
                      console.error('Error loading csv directory of image files');
                      console.error(error);
                      return;
                  }
                  this.imagesAvailable = seriesDir;
                  this.imagesAvailable.splice(0, this.numImagesToLoad).forEach(img => {
                      this.imagesLoaded.push(img)
                  });
                  this.updateChart();
              });
          }
        },
        updateChart() {
          if(this.isNumType) {
              let x = d3.scaleLinear()
                  .rangeRound([0,100])
                  .domain(this.data.valInfo.domain);
              let bins = d3.histogram()
                  .domain(x.domain())
                  .thresholds(x.ticks(6))
                  .value(d => d.val)(this.imagesLoaded);
              this.imagesBinned = bins;
              this.imagesBinned.forEach(b => {
                  b.formatString = b.x0.toFixed(1) + ' - ' + b.x1.toFixed(1);
                  b.sort((a, b) => a.val - b.val);
              });
          } else {
              let bins = d3.nest().key(d => d.val).object(this.imagesLoaded);
              this.imagesBinned = [];
              _.keys(bins).forEach(key => {
                  let bin = bins[key];
                  bin.formatString = key;
                  this.imagesBinned.push(bin);
              })
          }
          console.log(this.imagesBinned);
        },
        handleLoading() {
            if(this.imagesAvailable.length > 0) {
                this.imagesAvailable.splice(0, this.numImagesToAdd).forEach(img => {
                    this.imagesLoaded.push(img);
                });
                this.updateChart();
            }
        },
    },
    mounted() {
        if(this.dataResources && !_.isEmpty(this.imageFolders)) {
            this.loadData();
        }
    }
}
</script>

<style lang="scss">
#raw-image-view {
    width: 100%;
}

.card__media__content {
    display: block;
    width: 100%;
}
.img-thumbnail span {
    font-size: 10px;
    text-align: center;
}

.container.grid-list-sm .image-card.flex.xs1 {
    position: absolute;
    top: 2%;
    padding: 0;
    margin-top: 100px;
}

.container.grid-list-sm .image-card.flex.xs1:hover {
    z-index: 20;
}

</style>
