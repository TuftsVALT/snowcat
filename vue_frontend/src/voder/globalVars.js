/**
 * Created by arjun010 on 11/4/17.
 */
(function(){
    window._voder_globalVars = {};
    window._voder_globalVars.dataList = null;
    window._voder_globalVars.dataTypeMap = null;
    window._voder_globalVars.itemAttribute = null;
    window._voder_globalVars.insightMap = null;
    window._voder_globalVars.insightCounter = 0;
    window._voder_globalVars.activeVisObject = null;
    window._voder_globalVars.activeVisAttributes = [];
    window._voder_globalVars.metadataMap = null;
    window._voder_globalVars.mainSessionMap = null;
    window._voder_globalVars.dataFactMap = {};
    window._voder_globalVars.displayedDataFactIds = [];

    window._voder_globalVars.activeVisObjectList = [];

    window._voder_globalVars.dataFactCounter = 0;

    window._voder_globalVars.bookmarkedVisObjects = [];
    window._voder_globalVars.bookmarkedDataFactMap = {}; // id : [visObj]

    window._voder_globalVars.taskCategoryInterestMap = {
        "Distribution" : 0.0,
        "Correlation" : 0.0,
        "Anomaly" : 0.0,
        "Extremum" : 0.0,
        "DerivedValue" : 0.0
    };

    window._voder_globalVars.taskInterestMap = {
        "OutlierFact":0.0,
        "ExtremeValueFact":0.0,
        "RelativeValueFact":0.0,
        "DerivedValueFact":0.0,
        "CorrelationFact":0.0,
        "CategoryCorrelationFact":0.0,
        "QuadrantDistributionFact":0.0,
        "RangeDistributionFact":0.0
    };

    window._voder_globalVars.categoriesOfInterest = [];
    window._voder_globalVars.itemsOfInterest = [];
    window._voder_globalVars.attributesOfInterest = [];
    window._voder_globalVars.userClickedVariableName = null;
})();