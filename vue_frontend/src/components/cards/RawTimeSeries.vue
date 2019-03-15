<template>
    <div id="time-series-container">
        <svg id="time-series-svg" width="100%"></svg>
        <v-layout row wrap>
            <v-flex xs6>
                <v-autocomplete
                    v-if="problemType === 'classification'"
                    v-bind:items="timeSeriesAvailable"
                    @change="handleLoading"
                    label="Add Track"
                    item-text="time_series_file"
                    item-value="d3mIndex"
                    chips
                    single-line
                    prepend-icon="add"
                    hide-details>
                    <template slot="selection" slot-scope="data">
                        <v-chip
                        class="chip--select-multi"
                        @input="data.parent.selectItem(data.item)"
                        :key="data.item.d3mIndex">
                            <v-progress-circular indeterminate color="primary"></v-progress-circular>
                            {{ data.item.time_series_file }}
                        </v-chip>
                    </template>
                    <template slot="item" slot-scope="data">
                        <v-list-tile-avatar>
                            <i class="material-icons" :style="{'color': colorScale(data.item.label)}">fiber_manual_record</i>
                        </v-list-tile-avatar>
                        <v-list-tile-content :key="data.item.d3mIndex">
                            <v-list-tile-title v-html="data.item.time_series_file"></v-list-tile-title>
                        </v-list-tile-content>
                    </template>
                </v-autocomplete>
            </v-flex>
          <v-flex xs6>
                <v-subheader>{{ problemHeader }}</v-subheader>
                <template v-for="label in timeSeriesLabels">
                    <v-chip style="float: left;">
                        <v-avatar :style="{'background-color': label.color, 'background-border': label.color}">
                            <img :src="label.imgSrc" :alt="label.id">
                        </v-avatar>
                        {{ label.name }}
                    </v-chip>
                </template>
          </v-flex>
      </v-layout>
    </div>
</template>

<script>
var d3 = require('d3v4');

export default {
    name: 'raw-time-series',
    data: function() {
        return {
            config: null,
            numTracksToLoad: 5,
            timeSeriesAvailable: [],
            d3mIndexToTimeSeries: { },
            timeSeriesToLoad: [],
            timeSeriesLabels: [],
            problemHeader: 'Classification',
            loadingQueue: d3.queue(),
            colorScale: d => '#777',
            data: {}
        }
    },
    computed: {
        problemType() {
          let tableInfo = _.find(this.dataResources, (res) => res.resType === 'table');
          let seriesInfo = _.find(this.dataResources, (res) => res.resType === 'timeseries');
          if (tableInfo && seriesInfo) {
            return "classification";
          } else if (tableInfo) {
            return "forecasting";
          } else {
            return null;
          }
        },
        timeseriesFolders() {
            return this.$store.state.socket.timeseriesFolders;
        },
        dataResources() {
            return this.$store.state.socket.rawDataDesc.dataResources;
        },
        dataRoot() {
            return this.$store.state.socket.evaluationConfig.training_data_root;
        },
        showModelsPhase() {
          // NOTE! Only showing models if the current phase is 3, meaning we are on the model selection stage of this workflow
          // TODO - do this in a way that isn't coupled with the navigation.
          // The issue is that this card has to change its behavior when the button is pressed, even though it is persisting.
          return this.$store.state.meta.currentPhase === 3;
        },
        predictionModels() {
          // dont show models when task type is time series classification (nothing interesting in the models to show here)
          if (this.problemType === "forecasting" & this.showModelsPhase) {
            return this.$store.state.socket.models;
          } else {
            return [];
          }
        }
    },
    watch: {
      timeSeriesAvailable() {
        for (let i = 0; i < this.timeSeriesAvailable.length; i++) {
          this.d3mIndexToTimeSeries[this.timeSeriesAvailable[i].d3mIndex] = this.timeSeriesAvailable[i];
        }
      },
      dataResources() {
        this.loadDataLocally();
      },
      predictionModels() {
        this.loadPredictions();
      },
      timeseriesFolders() {
        if (!_.isEmpty(this.timeseriesFolders)) {
          this.spinner = false;
          this.loadDataLocally();
          console.log("finished load data locally")
          if(this.predictionModels.length > 0) {
              this.loadPredictions();
              console.log("finished load predictions")
          }
        }
      }
    },
    methods: {
        processSeriesRow(d) {
          let cn = this.data.valInfo.colName;
          let val = d[cn] ? +d[cn] : +d.value;
          if(val > this.data.seriesInfo.domain[1]) {
              this.data.seriesInfo.domain[1] = val;
          }
          if(val < this.data.seriesInfo.domain[0]) {
              this.data.seriesInfo.domain[0] = val;
          }
          return {time: +d.time, val: val};
        },
        processPredictionRow(d) {
            let cn = this.data.valInfo.colName;
            let val = d[cn] ? +d[cn] : +d['0'];
            if(val > this.data.seriesInfo.domain[1]) {
                this.data.seriesInfo.domain[1] = val;
            }
            if(val < this.data.seriesInfo.domain[0]) {
                this.data.seriesInfo.domain[0] = val;
            }
            return {time: +(d.time || d.d3mIndex), val: val};
        },
        handleRemove(series, index) {
            _.remove(this.data.seriesData, d => d === series);
            _.remove(this.data.seriesLoaded, (d, i) => i == index);
            this.timeSeriesAvailable.push(series);
            this.updateChart();
        },
        handleLoading(d3mIndex) {
            let series = this.d3mIndexToTimeSeries[d3mIndex];
            let _self = this;
            this.data.seriesLoaded.push(series);
            // let seriesPath = this.dataRoot + this.data.seriesInfo.resPath + series.time_series_file;
            // For now, we freeze the seriesPath to static/timeseries_0/
            let seriesPath = "static/timeseries_0/" + series.time_series_file;
            this.loadingQueue.defer(d3.csv, seriesPath, this.processSeriesRow);
            this.loadingQueue.await(function(...args) {
                if(args[0]) {
                    console.error('Error loading queued time series data');
                    console.error(args[0]);
                    return;
                }
                // arguments has all the data, get rid of null error
                args.slice(1).forEach(s => {
                    let l = s.length - 1;
                    s = s.filter((r, i) => {
                        return i == 0 || i == l || (i > 0 && i < l && (r.val != s[i-1].val || r.val != s[i+1].val));
                    });
                    _self.data.seriesData.push(s);
                });

                _self.updateChart();
                _self.loadingQueue = d3.queue();
                _self.timeSeriesAvailable = _.filter(_self.data.seriesDirectory, series => _self.data.seriesLoaded.indexOf(series) < 0);
            });
        },
        loadPredictions() {
            console.log("running loadPredictions.  this.predictionModels.length is ", this.predictionModels.length)
            console.log("this.dataResources.length is ", this.dataResources.length)
            if (this.data.seriesData) {
                this.predictionModels.forEach(m => {
                    this.data.seriesData.push(_.map(m.predictions, this.processPredictionRow));
                    this.data.seriesLoaded.push({time_series_file: m.modelName, label: m.modelId, isPrediction: true});
                });
                this.updateChart();
            }
        },
        loadDataLocally() {
            var _self = this;
            this.data = {};
            this.data.tableInfo = _.find(this.dataResources, (res) => res.resType === 'table');
            this.data.seriesInfo = _.find(this.dataResources, (res) => res.resType === 'timeseries');
            this.data.seriesLoaded = [];

            // This is a classification timeseries problem
            if(this.data.tableInfo && this.data.seriesInfo) {
                this.data.seriesInfo.domain = [Number.MAX_SAFE_INTEGER, - Number.MAX_SAFE_INTEGER];
                this.data.seriesInfo.labels = [];
                this.data.valInfo = {colName: 'value', 'colType': 'real', 'role': ['suggestedTarget']};
                this.problemHeader = 'Classification';
                // For now, we freeze the Data to static/learningData.csv
                let dataPath = "static/learningData.csv"

                // d3.csv(this.dataRoot + this.data.tableInfo.resPath,
                d3.csv(dataPath,
                    row => {
                        row.time_series_file = (row.timeseries_file || row.time_series_file);
                        return row;
                    },
                    (error, seriesDir) => {
                        if(error){
                            console.error('Error loading csv directory of timeseries files');
                            console.error(error);
                            return;
                        }
                        this.data.seriesDirectory = seriesDir;
                        let queue = d3.queue();
                        let numTracks = this.data.seriesDirectory.length > this.numTracksToLoad
                                            ? this.numTracksToLoad : this.data.seriesDirectory.length;
                        this.data.seriesDirectory.splice(0, numTracks).forEach((series) => {
                            this.data.seriesLoaded.push(series);
                            series.label = series.hasOwnProperty('label') ? series['label'] : series['class'];
                            if(this.data.seriesInfo.labels.indexOf(series.label) < 0) {
                                this.data.seriesInfo.labels.push(series.label);
                            }
                            // For now, we freeze the seriesPath to static/timeseries_0/
                            let seriesPath = "static/timeseries_0/" + series.time_series_file;
                            // let seriesPath = this.dataRoot + this.data.seriesInfo.resPath + series.time_series_file;
                            queue.defer(d3.csv, seriesPath, this.processSeriesRow);
                        });
                        this.timeSeriesAvailable = _.filter(this.data.seriesDirectory, series => this.data.seriesLoaded.indexOf(series) < 0);
                        queue.await(function(...args) {
                            if(args[0]) {
                                console.error('Error loading queued time series data')
                                console.error(args[0]);
                                return;
                            }
                            // arguments has all the data, get rid of null error
                            _self.data.seriesData = args.slice(1);
                            // Need to get rid of duplicate values, otherwise drawing 10k points for each line is crazy slow
                            for(let s = 0; s < _self.data.seriesData.length; s++) {
                                let series = _self.data.seriesData[s];
                                let l = series.length - 1;
                                _self.data.seriesData[s] = _self.data.seriesData[s].filter((r, i) => {
                                    return i == 0 || i == l || (i > 0 && i < l && (r.val != series[i-1].val || r.val != series[i+1].val));
                                });
                            }
                            // _self.updateChart();
                            _self.loadPredictions()
                        });
                });
            // This is a forecasting problem
            } else if (this.data.tableInfo) {
                this.data.seriesInfo = { domain: [Number.MAX_SAFE_INTEGER, - Number.MAX_SAFE_INTEGER], resType: 'forecast', labels: [0] };
                this.data.valInfo = _.find(this.data.tableInfo.columns, c => _.indexOf(c.role, 'suggestedTarget') >= 0);
                this.problemHeader = 'Forecast';
                // Handle multiple columns for forecast data, not just "value"
                let path = this.dataRoot.endsWith("/") ? this.dataRoot + this.data.tableInfo.resPath :
                  this.dataRoot + '/' + this.data.tableInfo.resPath;
                console.log("PATHPATH", path);
                d3.csv(path, this.processSeriesRow, (error, series) => {
                    if(error){
                        console.error('Error loading csv directory of timeseries forecasting data');
                        console.error(error);
                        return;
                    }
                    // We have an async problem here - d3.csv is returning after we
                    // assume seriesData is loaded.  So we want to call

                    // Add filtering out of duplicate points
                    series.time_series_file = _self.data.tableInfo.resPath;
                    series.label = 0;
                    _self.data.seriesData = [series];
                    _self.data.seriesLoaded.push(series);
                    _self.loadPredictions();
                    // this.updateChart();
                });
            } else {
                console.log('No timeseries data found. Or data improperly formatted');
            }
        },
        initChart() {
          this.$svg = d3.select(this.$el).select('#time-series-svg');
          this.chartParams = {
              padding: {l:40, t:80, r:40, b:20}
          };
          this.$chart = this.$svg.append('g')
              .attr('transform', 'translate('+[this.chartParams.padding.l, this.chartParams.padding.t]+')');
          this.$overview = this.$chart.append('g');
          this.$content = this.$chart.append('g');
          this.$defs = this.$svg.append('defs');

          this.$overview.append('g')
              .attr('class', 'overview axis')
              .attr('transform', 'translate(0,-'+(this.chartParams.padding.t / 2)+')');

          this.$overview.append('g')
              .attr('class', 'brush')
              .attr('transform', 'translate(0,-'+ (this.chartParams.padding.t / 2 + 30)+')');

          this.$overview.append('g')
              .attr('class', 'time axis')
              .attr('transform', 'translate(0,-4)');

          this.$overview.append('text')
              .attr('class', 'time axis-label')
              .text('Time (step)');

          this.$overview.append('text')
              .attr('class', 'val axis-label')
              .text('Value');

          this.$defs.append('clipPath')
                  .attr('id', 'contentClip')
                  .append('rect');
        },
        updateChart() {
            if(this.data && this.data.seriesData) {
                console.log(this.predictionModels);
                let isForecast = this.data.seriesInfo.resType === 'forecast';
                let timeDomain = d3.extent(this.data.seriesData[0], d => d.time);
                let trackHeight = isForecast ? 240 : 60;
                let trackPadding = isForecast ? 20 : 40;
                let availWidth = this.chartParams.dimens.w - this.chartParams.padding.l - this.chartParams.padding.r;
                let availHeight = (trackHeight + trackPadding) * this.data.seriesData.length - trackPadding
                                  + this.chartParams.padding.t + this.chartParams.padding.b;

                let timeScale = d3.scaleLinear()
                    .domain(timeDomain)
                    .range([0, availWidth]);
                let overviewScale = d3.scaleLinear()
                    .domain(timeDomain)
                    .range([0, availWidth]);
                let valScale = d3.scaleLinear()
                    .domain(this.data.seriesInfo.domain)
                    .range([trackHeight, 0]).nice();
                let line = d3.line()
                    .defined(d => d.val)
                    .x(d => timeScale(d.time))
                    .y(d => valScale(d.val));
                this.colorScale = d3.scaleOrdinal(d3.schemeCategory10)
                    .domain(this.data.seriesInfo.labels);
                this.data.seriesInfo.labels.forEach(l => {
                    if(isForecast) {
                        if(_.findIndex(this.timeSeriesLabels, ['id', l]) < 0) {
                            this.timeSeriesLabels.push({name: 'training', 'color': '#ccc',
                                                        id: l, imgSrc: 'src/assets/forecast-solid-avatar.png'});
                            this.timeSeriesLabels.push({name: 'forecasted', 'color': '#ccc',
                                                        id: l, imgSrc: 'src/assets/forecast-dash-avatar.png'});
                        }
                    } else {
                        if(_.findIndex(this.timeSeriesLabels, ['id', l]) < 0) {
                            this.timeSeriesLabels.push({name: 'class \"' + l + '\"', 'color': this.colorScale(l),
                                                        id: l, imgSrc: 'src/assets/classification-avatar.png'});
                        }
                    }
                });
                let overviewAxis = d3.axisTop(overviewScale),
                    timeAxis = d3.axisTop(timeScale).tickSize(-availHeight, 0, 0),
                    valAxis = d3.axisLeft(valScale).tickSize(-availWidth, 0, 0);

                var brush = d3.brushX()
                    .extent([[0,0], [availWidth, 30]])
                    .on('brush end', () => {
                        // Ignore brush-by-zoom
                        if(d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return;
                        var sel = d3.event.selection || overviewScale.range();
                        timeScale.domain(sel.map(overviewScale.invert, overviewScale));
                        this.$content.selectAll('.time-series .line')
                            .attr('d', line);
                        this.$overview.selectAll('.time.axis')
                            .call(timeAxis);
                    });

                this.$defs.select('#contentClip rect')
                    .attr('width', availWidth)
                    .attr('height', trackHeight);

                let select = this.$content.selectAll('.time-series')
                    .data(this.data.seriesData);

                let enter = select.enter()
                    .append('g')
                    .attr('class', 'time-series');

                let labelEnter = enter.append('g')
                    .attr('class', 'series-label')
                    .on('click', (d,i) => {
                        if(!isForecast){
                            this.handleRemove(d,i);
                        }
                    });

                labelEnter.append('rect')
                    .attr('width', (d, i) => this.data.seriesLoaded[i].time_series_file.replace('.csv', '').length * 6 + 18)
                    .attr('height', 18)
                    .attr('x', (d, i) => this.data.seriesLoaded[i].time_series_file.replace('.csv', '').length * -3 - 6)
                    .attr('y', -12)
                    .attr('rx', 9)
                    .attr('ry', 9);

                labelEnter.append('text')
                    .attr('x', -6);

                labelEnter.append('circle')
                    .attr('cy', -3)
                    .attr('cx', (d, i) => this.data.seriesLoaded[i].time_series_file.replace('.csv', '').length * 3 /*- 3*/ + 2)
                    .attr('r', 7)
                    .text((d, i) => this.data.seriesLoaded[i].time_series_file.replace('.csv', ''));

                labelEnter.append('path')
                    .attr('d', (d,i) => {
                        let l = this.data.seriesLoaded[i].time_series_file.replace('.csv', '').length * 3;
                        return 'M'+(l/*-3*/ + 2)+',-3m-4,-4l8,8m-8,0l8,-8';
                    })
                    .attr('cx', (d, i) => this.data.seriesLoaded[i].time_series_file.replace('.csv', '').length * 3 - 3)
                    .attr('r', 7)
                    .text((d, i) => this.data.seriesLoaded[i].time_series_file.replace('.csv', ''));

                enter.append('g')
                    .attr('class', 'val axis')
                    .attr('transform', 'translate(-4,0)');

                enter.append('path')
                    .style('stroke-width', isForecast ? 1.5 : 1)
                    .style('stroke-opacity', isForecast ? 1 : 0.7)
                    .style('stroke-dasharray', (d,i) => this.data.seriesLoaded[i].isPrediction ? '3px 2px' : '')
                    .attr('class', 'line');

                let merged = select.merge(enter)
                    .attr('transform', (d,i) => 'translate('+[0, i * (trackHeight + trackPadding)]+')');

                let labelMerged = merged.select('.series-label')
                    .attr('transform', 'translate('+(isForecast ? [availWidth - 60, -24] : [availWidth + 15, trackHeight / 2])+')'
                          + (isForecast ? '' : 'rotate(90)'));

                labelMerged.select('text')
                    .text((d, i) => this.data.seriesLoaded[i].time_series_file.replace('.csv', ''))

                merged.select('.line')
                    .style('stroke', (d,i) => this.colorScale(this.data.seriesLoaded[i].label))
                    .attr('d', line);

                let valAxisMerged = merged.select('.val.axis')
                    .call(valAxis.ticks(4))
                    .selectAll('.tick line')
                    .style('stroke', d => d===0 ? '#aaa' : '#ccc')
                    .style('stroke-dasharray', d => d===0 ? 'none' : '3px 2px');

                this.$overview.selectAll('.overview.axis')
                    .call(overviewAxis);

                this.$overview.selectAll('.brush')
                    .call(brush)
                    .call(brush.move, timeScale.range());

                this.$overview.selectAll('.val.axis')
                    .call(valAxis);

                this.$overview.selectAll('.time.axis')
                    .call(timeAxis);

                this.$overview.selectAll('.time.axis-label')
                    .attr('transform', 'translate('+[availWidth/2, -24]+')');

                this.$overview.selectAll('.val.axis-label')
                    .attr('transform', 'translate('+[-4, availHeight - 80]+')');

                this.$chartContainer.style('min-height', availHeight + 'px');
                this.$svg.attr('height', availHeight + 'px');

            }
        },
        updateChartSize() {
            // Safely update the chart size. A lot of browsers don't support height: 100% style for SVG.
            this.$chartContainer = d3.select('#time-series-container');
            let r = this.$chartContainer.node().getBoundingClientRect();

            this.$svg.attr('height', r.height + 'px');
            this.$svg.attr('width', r.width + 'px');
            this.chartParams.dimens = {w: r.width, h: r.height};

            this.updateChart();
        }
    },
    mounted() {
        this.initChart();
        this.updateChartSize();
        console.log("in mount, this.dataResources is ", this.dataResources)
        console.log("and this.predictionModels is ", this.predictionModels)
        if(this.dataResources) {
            this.loadDataLocally();
            console.log("finished load data locally")
            if(this.predictionModels.length > 0) {
                this.loadPredictions();
                console.log("finished load predictions")
            }
        }
        window.addEventListener('resize', _.debounce(this.updateChartSize, 500));
        window.setTimeout(this.updateChartSize, 1000);
    },
    beforeDestroy() {
      window.removeEventListener('resize', _.debounce(this.updateChartSize, 500));
    }
}
</script>

<style lang="scss">
#time-series-container {
    min-height: 640px;
    width: 100%;
}

.card__media__content {
    /* Effects styling for svg, need height and width from this container.*/
    /* This might effect styling on other cards.*/
    display: block;
    width: 100%;
}
</style>

<style lang="scss">
#time-series-svg {
    .time-series .line{
        fill: none;
        clip-path: url(#contentClip);
    }

    .axis .tick line{
        stroke: #ccc;
        stroke-width: 1px;
    }

    .axis .domain {
        display: none;
    }

    .time.axis-label {
        font-size: 12px;
        text-anchor: middle;
    }

    .val.axis-label {
        font-size: 12px;
        text-anchor: end;
    }

    .time.axis .tick text,
    .val.axis .tick text {
        fill: #777;
    }

    .val.axis text{
        font-size: 9px;
    }

    .val.axis .tick line,
    .time.axis .tick line {
        stroke-dasharray: 3px 2px;
    }

    .series-label {
        cursor: pointer;
        rect {
            fill: #e0e0e0;
        }
        text {
            font-size: 11px;
            font-weight: 500;
            text-anchor: middle;
            fill: #333;
        }
        circle {
            fill: #676767;
        }
        path {
            stroke: #e0e0e0;
            fill: none;
        }
        &:hover {
            circle {
                fill: #999;
            }
        }
    }
}

</style>
