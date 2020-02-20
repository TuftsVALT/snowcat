import axios from "axios";
import Vue from "vue";
import _ from "lodash";

var getData = function(uri, callback) {
  axios
    .get(uri)
    .then(response => {
      callback(response);
    })
    .catch(e => {
      console.log(e);
    });
};

// initial state
const state = {
  dataRoot: null,
  heraldMap: new Map(),
  heraldsChanged: true, // hacky Boolean that flips every time there is an update to herald map to keep things reactive
  latestHeraldRead: -1,
  selectedModels: [ ],
  filteredModels: [ ],
  runProblem: null,
  debugMode: true,
  // Socket connections
  ta2Available: false,
  isConnected: false,
  socketMessage: "",
  models: [], // Holds TA2 model info, including metrics
  rawDataDesc: {}, // Holds the raw dataDesc.json
  rawProblemDesc: {}, // Holds the raw problemDesc.json
  rawProblemDesc_orig: {},
  dataCollection: {}, // Lookup table for the raw data, indexed by d3mIndex
  rawDataTypes: {}, // Types of the columns in rawData collection
  graphUris: [], // URIs for graphs for problems that include graphs
  networkData: {},
  voderDataFactsStatus: "not_started",
  voderDataFactsMessage: null,
  voderDataFactsPctProgress: 0.0,
  voderDataFactsErrMessage: null,
  voderMainDataMapFileUrl: null,
  voderMetadataMapFileUrl: null,
  voderSelectedVariable: "",
  imageFolders: [],
  audios: [], // list of links for audio files stored somewhere else
  videos: [], // list of links for video files stored somewhere else
  timeseriesFolders: [],
  folder: [],
  xLinking: {
    // cross linking data structure
    xLinkIndexes: [], // All the D3MIndexes would be in this array
    highlight: false, // The value would be 'true' when user mouse hover at element, and 'false' when mouse out from element
    visType: {
      // each visualizartion make it true during highlighting and then make it false otherwise
      tabular: false,
      graph: false,
      timeseries: false,
      text: false,
      image: false,
      video: false,
      audio: false,
      speech: false,
      confusionMatrixModel: false,
      residualChartModel: false,
      timeseriesForecastModel: false,
      collaborativeFiltering: false,
      rawTable: false
    }
  },
  xLinkingSelect: [], // watch this to get updates on selections (contains d3mIndices)
  xLinkingSelect_Set: new Set(), // for easier management, but array is needed too for now,
  // because vue is not reactive on sets (to be added in version 2.6 though)
  problemType: "unknown",
  datasetTypes: [], // One of tabular, timeseries, graph, img, video, audio, speech, unknown
  // we may not need this - this state change can be triggered by the web socket.
  message: "Loading application...",
  targetColumns: [],
  performanceMetrics: [],
  tabularProcessedData: {
    histogramMetaDataArray: [],
    participatingFieldsMetaData: [],
    histogramBarCountsArray: [],
    histogramBarNamesArray: [],
    histogramCountsArray: [],
    barRelationsArray: [],
    metadataColTypes: [],
    histogramD3MIndexArray: []
  },
  rawTextConfig: {},
  classReg_modelId: 0,
  selectedModel: -1,
  numModels: 5, // this should be what we send to the TA2s - how can we calculate this?
  errorMessage: "",
  infoMessage: "",
  dataAugTable: {},
  removeColName: "",
  addColName: "",
  attributesInCurrentDataTable: [],
  materializeFinished: false
};

// getters
const getters = {
  getHello: state => state.hello,
  getDataCollection: state => state.dataCollection,
  // This notation is pretty strange to me, but we want this method to
  // return a method that takes the argument
  categoricalValues: state => colName => {
    if (state.rawDataTypes[colName] === "categorical") {
      // We can get this information from the tabular data visualization
      // First, we get the index in participatingFields from participatingFieldsMetaData
      var index = _.findIndex(
        state.tabularProcessedData.participatingFieldsMetaData,
        el => {
          // el[3] is the colname for this collection.  Look at the vuex store to see
          // what is getting written from the tabular data preprocessing.
          return el[3] === colName;
        }
      );
      if (index) {
        return state.tabularProcessedData.histogramBarNamesArray[index];
      }
    }
  },
  minValue: state => colName => {
    if (_.includes(["integer", "real", "float"], state.rawDataTypes[colName])) {
      var colData = _.find(
        state.tabularProcessedData.histogramMetaDataArray,
        el => {
          return el[0] === colName;
        }
      );
      if (colData) {
        return colData[2];
      }
    }
  },
  maxValue: state => colName => {
    if (_.includes(["integer", "real", "float"], state.rawDataTypes[colName])) {
      var colData = _.find(
        state.tabularProcessedData.histogramMetaDataArray,
        el => {
          return el[0] === colName;
        }
      );
      if (colData) {
        return colData[3];
      }
    }
  }
};

// actions
const actions = {
  readHerald(context, heraldId) {
    let v = new Vue();
    v.$socket.emit("readHeraldRequest", heraldId);
  },
  createHerald(context) {
    let v = new Vue();
    v.$socket.emit("createHeraldRequest");
  },
  setRunProblem(context, problemObject) {
    context.commit("runProblem", problemObject);
  },
  updateSelectedModel(context, id) {
    context.commit("setSelectedModel", id);
  },
  socket_newSession(context) {
    /*
     * processConfig reads the evaluation config, and is responsible for updating the store
     * - Telling node server to put the raw data and assets (images, graph files) in public folder
     *     It is the node server's responsibility to only transfer as much data as is reasonable (not tbs)
     * - Using axios to get raw tabular data
     * - filling lookup table
     * - replacing img, video, etc. references with file URIs
     * - For graphs, load the graph URI into the graphs store
     */

    // Next, we tell node to get the assets ready to be loaded
    // this.$socket.emit("serveData")
    // TODO - if socketio fixes their bug, fix this code
    // NOTE - Bug with socketio requires this https://github.com/MetinSeylan/Vue-Socket.io/issues/85
    var v = new Vue();

    // These handleXData calls should probably be moved into beforeMount calls, so that
    // the message isn't sent to our server unless the server actually has to handle
    // that data.

    // Even though every dataset we've seen has tabular data, this should still be
    // processed in its own socket call, rather than being handled by the serveData call
    /*
    v.$socket.emit("handleTabularData", function(data) {});

    v.$socket.emit("handleProblemSetCreation", function(data) {});

    v.$socket.emit("handleImageData", function(data) {});

    v.$socket.emit("handleTimeseriesData", function(data) {});

    v.$socket.emit("handleGraphData", function(data) {
      context.commit("addGraphData", data);
    });
    */
    // Generate data facts using Arjun's Voder.  Tries to generate, but if
    // there is a failure, it will set failure state into store, with message
    // to user.
    // socket.io's callback to emit only fires once, so it is only good for synchronous communication.
    // instead, we open up a listener on the client for progress updates.
    v.$socket.emit("handleVoderDataFacts", function(data) {
      if (context.state.debugMode) {
        console.log(
          " in handleVoderDataFacts, ack function received data: ",
          data
        );
      }
    });

    // to start sending signal to node server for tabular data
    // context.dispatch('loadTabularRawData')
    // Now, we need to wait until we get notification that our data is available.
    // So, that sounds to me like we actually put that into a different action.
  },
  modelClassifRegress(context, numModelArr) {
    context.commit("numModelClassifReg", numModelArr);
  },
  loadRegressData: function(context, dataIn) {
    // context.state.classReg_modelId += 1;
    // if (context.state.classReg_modelId > context.state.models.length - 1) {
    //   context.state.classReg_modelId = 0;
    // }
    var data = {
      predicted: dataIn.predicted,
      // index : context.state.classReg_modelId,
      index: dataIn.modelId,
      fileUri: dataIn.fileUri
    };
    console.log("trying to load regression data ", data);
    // console.log("trying to load classication data ", context.state.evaluationConfig);
    var v = new Vue();
    v.$socket.emit("load-regress-data", data);
  },
  //load classification prob data
  loadClassifData: function(context, dataIn) {
    // context.state.classReg_modelId += 1;
    // if( context.state.classReg_modelId > context.state.models.length-1 ){
    //   context.state.classReg_modelId = 0;
    // }
    var data = {
      predicted: dataIn.predicted,
      index: dataIn.modelId,
      fileUri: dataIn.fileUri
    };
    console.log("trying to load classication data ", data);
    // console.log("trying to load classication data ", context.state.evaluationConfig);
    var v = new Vue();
    v.$socket.emit("load-classify-data", data);
    v.$socket.emit("confusionMatrixData", {
      modelId: dataIn.modelId,
      predictionFile: dataIn.fileUri
    });
  },
  socket_updateCurrentDatasetRootPath: (context, dataRoot) => {
    console.log("updateCurrentDatasetRootPath", dataRoot);
    context.commit("updateDataRoot", dataRoot);
    // this.dataRoot = dataRoot;
  },
  socket_createHeraldResponse: (context, heraldId) => {
    context.dispatch("readHerald", heraldId);
  },
  socket_readHeraldResponse: (context, herald) => {
    if (
      !context.state.heraldMap.has(herald.heraldIdSelected) ||
      !context.state.heraldMap.get(herald.heraldIdSelected)
    ) {
      context.commit("ADD_HERALD", herald);
    }
    context.commit("LAST_HERALD_READ", herald.heraldIdSelected);
  },
  socket_dataDescFinished: (context, datasetSchema) => {
    // If this socket message has fired, then the training data is accessible
    context.commit("loadDataDesc", datasetSchema);
    console.log("data reasources", datasetSchema.dataResources);
    // also load the column types
    var datatypes = {};
    var columns = context.state.rawDataDesc.dataResources.filter(
      resource => resource.resType === "table"
    )[0].columns;
    columns.forEach(col => (datatypes[col.colName] = col.colType));
    if (_.find(columns, col => _.includes(col.role, "timeIndicator"))) {
      context.commit("ADD_DATASET_TYPE", "timeseries");
    }
    context.commit("loadDataTypes", datatypes);
    _.each(datasetSchema.dataResources, resource =>
      context.commit("ADD_DATASET_TYPE", resource.resType)
    );
  },
  socket_rawDataFinished: (context, data) => {
    console.log("raw data loaded");
    context.commit("loadData", Object.freeze(data));
  },
  socket_serveProblemFinished: ( context, { problemSchema, orig } ) => {
    console.log("problem served", problemSchema);
    context.commit("CLEAR_TARGET_COLS");
    context.commit("CLEAR_PERFORMANCE_METS");
    if (!problemSchema) {
      context.commit("loadProblemDesc_orig", null);
    }
    if (!_.isEmpty(problemSchema)) {
      context.commit("loadProblemDesc", problemSchema);
      if (orig) {
        console.log("original problem description from dataset received");
        context.commit("loadProblemDesc_orig", problemSchema);
      }
      if (problemSchema.about && problemSchema.about.taskType) {
        // support for older version of problem schema
        context.commit("SET_PROBLEM_TYPE", problemSchema.about.taskType);
      } else {
        context.commit("SET_PROBLEM_TYPE", problemSchema.taskType);
      }
      // Now that we have received the problemDoc, we're also going to figure out the
      // target columns.
      // var data_section, target;
      // for (var i = 0; i < problemSchema.inputs.data.length; i++) {
      //   data_section = problemSchema.inputs.data[i];
      //   for (var j = 0; j < data_section.targets.length; j++) {
      //     target = data_section.targets[j];
      //     context.commit("addTargetColumn", target.colName);
      //   }
      // }
      // var performanceMetric;
      // for (var i = 0; i < problemSchema.inputs.performanceMetrics.length; i++) {
      //   performanceMetric = problemSchema.inputs.performanceMetrics[i];
      //   context.commit("addPerformanceMetric", performanceMetric.metric);
      // }
    } else {
      console.log(
        "warning: no problem schema available; setting to classification"
      );
      context.commit("SET_PROBLEM_TYPE", "classification");
    }
  },
  socket_modelFinished: (context, pipeline) => {
    // parsing predictions is hacky here, but we were seeing weird behavior near the evaluation
    // deadline and wanted to retain ability to work in dev and eval mode.
    let model = {
      modelId: pipeline.heraldId + "::" + pipeline.id,
      modelName: "Model " + (state.models.length + 1),
      modelMetrics: pipeline.scores,
      predictions: pipeline.results.data
        ? pipeline.results.data
        : pipeline.results,
      fileUri: pipeline.fileUri,
      heraldId: pipeline.heraldId
    };
    context.commit("addModel", model);
  },
  socket_tabularDataProcessed: (context, data) => {
    console.log("Tabular data has been allocated to Store!");
    context.commit("addTabularProcessedData", data);
  },
  socket_pipelineFailed: context => {
    context.commit(
      "updateErrorMessage",
      "Oops, something went wrong during model creation. Please contact the administrator."
    );
  },
  "socket_write-pipeline-failed": context => {},
  socket_imagesthumbnailsready: (context, data) => {
    console.log("IMAGESTHUMBNAILSREADY");
    context.commit("addImages", data);
  },
  socket_timeseriesready: (context, data) => {
    console.log("TIMESERIESREADY");
    context.commit("addTimeseries", data);
  },
  socket_updateVoderDataFactsStatus: (context, data) => {
    if (context.state.debugMode) {
      console.log(
        " in socket_updateVoderDataFactsStatus, received data: ",
        data
      );
    }
    if (data.status === "processing") {
      context.commit("updateVoderDataFactsStatus", {
        status: "processing",
        message: "Processing",
        pctProgress: data.pctProgress
      });
    } else if (data.status === "completed") {
      context.commit("addVoderDataFacts", data.completedInfo);
      context.commit("updateVoderDataFactsStatus", {
        status: "completed",
        message: "Completed",
        pctProgress: 1.0
      });
    } else if (data.status === "failed") {
      context.commit("updateVoderDataFactsStatus", {
        status: "failed",
        message: "Data Facts Generation Failed",
        readableError: data.errMessage
      });
    }
  },
  socket_backendConnected: context => {
    console.log("received: backendConnected");
    context.commit("ta2Available");
  }
};

// mutations
const mutations = {
  SET_FILTERED_MODELS(state, modelArray) {
    state.filteredModels = modelArray;
  },
  SET_SELECTED_MODELS(state, modelIdArray) {
    state.selectedModels = modelIdArray;
  },
  ADD_HERALD(state, herald) {
    state.heraldMap.set(herald.heraldIdSelected, herald);
    state.heraldsChanged = !state.heraldsChanged;
  },
  LAST_HERALD_READ(state, heraldId) {
    state.latestHeraldRead = heraldId;
  },
  // Socket mutations
  SOCKET_CONNECT(state) {
    state.isConnected = true;
  },
  SOCKET_DISCONNECT(state) {
    state.isConnected = false;
  },
  SOCKET_raw_data_JSON_form(state, message) {
    state.socketMessage = "raw_data_json_form" + message;
  },
  CLEAR_MODELS(state) {
    state.models = [];
  },
  updateDataRoot(state, dataRoot) {
    state.dataRoot = dataRoot;
  },
  setUserVariable(state, variable) {
    console.log("STORE: SET VODER USER VARIABLE", variable);
    state.voderSelectedVariable = variable;
  },
  ta2Available(state) {
    state.ta2Available = true;
  },
  addGraphData(state, data) {
    state.networkData = Object.freeze(data);
  },
  updateVoderDataFactsStatus(state, data) {
    state.voderDataFactsStatus = data.status;
    state.voderDataFactsMessage = data.message;
    state.voderDataFactsPctProgress = data.pctProgress;
    state.voderDataFactsErrMessage = data.readableError;
  },
  addVoderDataFacts(state, data) {
    state.voderMainDataMapFileUrl = data.voderMainDataMapFileUrl;
    state.voderMetadataMapFileUrl = data.voderMetadataMapFileUrl;
  },
  runProblem(state, problemObject) {
    state.runProblem = problemObject;
  },
  loadData(state, data) {
    Object.keys(data).forEach(function(each) {
      // data[each].state = {'selected': false, 'hovered': false}
      // data[each].modelPredictions = { }
    });
    Vue.set(state, "dataCollection", data);
  },
  addGraph(state, data) {
    state.networkData.push(Object.freeze(data));
  },
  addTabularProcessedData(state, data) {
    state.tabularProcessedData.histogramMetaDataArray =
      data.histogramMetaDataArray;
    state.tabularProcessedData.participatingFieldsMetaData =
      data.participatingFieldsMetaData;
    state.tabularProcessedData.histogramBarCountsArray =
      data.histogramBarCountsArray;
    state.tabularProcessedData.histogramBarNamesArray =
      data.histogramBarNamesArray;
    state.tabularProcessedData.histogramCountsArray = data.histogramCountsArray;
    state.tabularProcessedData.barRelationsArray = data.barRelationsArray;
    state.tabularProcessedData.histogramD3MIndexArray =
      data.histogramD3MIndexArray;
  },
  addImages(state, data) {
    console.log("ADDIMAGES", data.data);
    state.imageFolders = data.data;
    //for (var i = 0; i < data.data.length; i++) {
    //state.imageFolders.push(data.data[i]);
    //}
  },
  xLinkSelect(state, ...d3mIndices) {
    for (let d3mIndex of d3mIndices) {
      if (!state.xLinkingSelect_Set.has(d3mIndex)) {
        state.xLinkingSelect_Set.add(d3mIndex);
      }
    }
    state.xLinkingSelect = Array.from(state.xLinkingSelect_Set);
  },
  xLinkUnSelect(state, ...d3mIndices) {
    for (let d3mIndex of d3mIndices) {
      if (state.xLinkingSelect_Set.has(d3mIndex)) {
        state.xLinkingSelect_Set.delete(d3mIndex);
      }
    }
    state.xLinkingSelect = Array.from(state.xLinkingSelect_Set);
  },
  xLinkSelectClear(state) {
    state.xLinkingSelect_Set.clear();
    state.xLinkingSelect = [];
  },
  updateXLinking(state, data) {
    // the data in this case would be an object of four things, i.e., an array 'xLinkIndexes' with the index data points
    // a boolean 'highlight' variable true or false, a 'visType' variable with the name of the visualizartion (e.g., tabular or image)
    //and a 'visValue' boolean variable which will be true when highlighting and will be false otherwise
    //here is the object structure
    // xLinking: {
    //    xLinkIndexes: [],
    //    highlight: false,
    //    visType: '',
    //    visValue: false
    //  }

    //console.log("This is data:", data.xLinkIndexes);
    state.xLinking.xLinkIndexes = data.xLinkIndexes;
    state.xLinking.highlight = data.highlight;
    if (data.visType == "tabular") {
      state.xLinking.visType.tabular = data.visValue;
    } else if (data.visType == "graph") {
      state.xLinking.visType.graph = data.visValue;
    } else if (data.visType == "timeseries") {
      state.xLinking.visType.timeseries = data.visValue;
    } else if (data.visType == "text") {
      state.xLinking.visType.text = data.visValue;
    } else if (data.visType == "image") {
      state.xLinking.visType.image = data.visValue;
    } else if (data.visType == "video") {
      state.xLinking.visType.video = data.visValue;
    } else if (data.visType == "audio") {
      state.xLinking.visType.audio = data.visValue;
    } else if (data.visType == "speech") {
      state.xLinking.visType.speech = data.visValue;
    } else if (data.visType == "confusionMatrixModel") {
      state.xLinking.visType.confusionMatrixModel = data.visValue;
    } else if (data.visType == "residualChartModel") {
      state.xLinking.visType.residualChartModel = data.visValue;
    } else if (data.visType == "timeseriesForecastModel") {
      state.xLinking.visType.timeseriesForecastModel = data.visValue;
    } else if (data.visType == "collaborativeFiltering") {
      state.xLinking.visType.collaborativeFiltering = data.visValue;
    } else if (data.visType == "rawTable") {
      state.xLinking.visType.rawTable = data.visValue;
    }
  },

  addTimeseries(state, data) {
    console.log("ADDTIMESERIES", data.data);
    state.timeseriesFolders = data.data;
  },

  loadDataDesc(state, dataDesc) {
    state.rawDataDesc = dataDesc;
  },

  loadProblemDesc(state, problemDesc) {
    state.rawProblemDesc = problemDesc;
  },
  loadProblemDesc_orig(state, problemDesc) {
    state.rawProblemDesc_orig = problemDesc;
  },

  loadDataTypes(state, dataTypes) {
    state.rawDataTypes = dataTypes;
  },

  ADD_DATASET_TYPE(state, datasetType) {
    state.datasetTypes.push(datasetType);
  },

  SET_PROBLEM_TYPE(state, problemType) {
    state.problemType = problemType;
  },
  CLEAR_TARGET_COLS(state) {
    state.targetColumns = [];
  },
  addTargetColumn(state, colName) {
    state.targetColumns.push(colName);
  },
  CLEAR_PERFORMANCE_METS(state) {
    state.performanceMetrics = [];
  },
  addPerformanceMetric(state, metricName) {
    state.performanceMetrics.push(metricName);
  },

  addModel(state, model) {
    state.models.push(Object.freeze(model));
  },

  updateDatumState(state, datumState) {
    var d3mIndex = datumState.d3mIndex;
    var action = datumState.action; // currently either hovered or selected
    var bool = datumState.bool; // either true or false
    var datapt = state.dataCollection[d3mIndex];
    if (datapt) {
      Vue.set(state.dataCollection[d3mIndex].state, action, bool);
    }
  },

  updateMessage(state, msg) {
    state.message = msg;
  },

  setSelectedModel(state, id) {
    console.log("found id ", id);
    state.selectedModel = id;
  },

  numModelClassifReg(state, numModelArr) {
    state.numModelClassifReg = numModelArr;
  },

  updateErrorMessage(state, message) {
    state.errorMessage = message;
  },

  updateInfoMessage(state, message) {
    state.infoMessage = message;
  },

  updateDataAugTable(state, message) {
    state.dataAugTable = message;
  },

  updateRemoveColName(state, message) {
    state.removeColName = message;
    // reset it, so that if same colname comes again it triggers correctly
    setTimeout(() => {
      state.removeColName = ""
    }, 500);
  },

  updateAddColName(state, message) {
    state.addColName = message;
    // reset it, so that if same colname comes again it triggers correctly
    setTimeout(() => {
      state.addColName = ""
    }, 500);
  },

  setMaterializeFinishToken(state, message) {
    state.materializeFinished = message;
    if(message) {
      setTimeout(() => {
        state.materializeFinished = false;
      }, 15000);
    }
  },

  updateAttributesInCurrentDataTable(state, message) {
    state.attributesInCurrentDataTable = message;
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
