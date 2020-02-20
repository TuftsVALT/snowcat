const appRootPath = require('app-root-path');
const path = require('path');
const { materializeJoinString, materializeJoinNumber, materializeJoinCollectionString, materializeJoinCollectionNumber } = require(path.resolve(appRootPath + "/socket_listeners/controllers/dataaug_wikidata/joinLogic.js"));
const { getRawData } = require(path.resolve(appRootPath + "/socket_listeners/controllers/dataaug_wikidata/attributeLogic.js"));

const Dataset = require(path.resolve(appRootPath + "/Session/Dataset.js"))

const chai = require("chai");
chai.should();
chai.use(require('chai-things'));

// Note that each test in this file actually loads the baseball dataset and attaches the
// joined data to that dataset, even though the different methods actually reach out via SPARQL
// to other entities, like Countries (Germany).  These materialize functions have to take in a 
// dataset (like the baseball dataset) because they need something to attach the new column to.
// But they make no check that the actual QIDs correspond to that dataset.
// So by default, we're just loading the baseball dataset in, claiming the sourceCol is Player, 
// but we're using whatever QIDs actually have the right type to test out each type of join.
describe ('join functions ', async function() {
    const datasetPath = path.resolve(appRootPath + "/input/185_baseball/");
    const dataset = new Dataset(datasetPath);
    const sourceColName = 'Player';
    const hankAaronQids = ['Q215777']; // Hank Aaron: https://www.wikidata.org/wiki/Q215777
    const germanyQids = ['Q183']; // Germany: https://www.wikidata.org/wiki/Q183
    
    describe ('#materializeJoinString', async function() {
        it('should join date of birth to players', async function() {
            const rawData = await getRawData(dataset);
            const targetRelUri = 'http://www.wikidata.org/prop/direct/P569';
            const targetColumnName = 'date-of-birth';
            const results = await materializeJoinString(rawData, sourceColName, targetRelUri, targetColumnName, hankAaronQids);
            results[0]['date-of-birth'].should.eq('1934-02-05T00:00:00Z');
        });    
    });

    describe ('#materializeJoinNumber', async function() {
        it('should join marriageable age to Germany', async function() {
            const rawData = await getRawData(dataset);
            const targetRelUri = 'http://www.wikidata.org/prop/direct/P3000';
            const targetColumnName = 'marriageable-age';
    
            const results = await materializeJoinNumber(rawData, sourceColName, targetRelUri, targetColumnName, germanyQids);
            // console.log("results[0] are", results[0])
            results[0]['marriageable-age'].should.eq('18');
        });    
    });

    describe ('#materializeJoinCollectionNumber', async function() {
        const speedLimitsTargetRelUri = 'http://www.wikidata.org/prop/direct/P3086';
        const speedLimitsTargetColumnName = 'collection-speed-limits';

        describe('aggregationOp === "count"', async function() {
            it('should join 2 speed limits for Germany', async function() {
                const rawData = await getRawData(dataset);
                const results = await materializeJoinCollectionNumber(rawData, sourceColName, speedLimitsTargetRelUri, speedLimitsTargetColumnName, germanyQids, 'count');
                parseFloat(results[0][speedLimitsTargetColumnName]).should.eq(2);
            });
        })
        describe('aggregationOp === "mean"', async function() {
            it('should average 2 speed limits for Germany', async function() {
                const rawData = await getRawData(dataset);
                const results = await materializeJoinCollectionNumber(rawData, sourceColName, speedLimitsTargetRelUri, speedLimitsTargetColumnName, germanyQids, 'mean');
                parseFloat(results[0][speedLimitsTargetColumnName]).should.eq(75);
            });        
        })
        describe('aggregationOp === "median"', async function() {
            it('should find median of 2 speed limits for Germany', async function() {
                const rawData = await getRawData(dataset);
                const results = await materializeJoinCollectionNumber(rawData, sourceColName, speedLimitsTargetRelUri, speedLimitsTargetColumnName, germanyQids, 'median');
                parseFloat(results[0][speedLimitsTargetColumnName]).should.eq(75);
            });        
        })
        describe('aggregationOp === "mode"', async function() {
            it('should return first speed limit among two different ones for Germany', async function() {
                const rawData = await getRawData(dataset);
                const results = await materializeJoinCollectionNumber(rawData, sourceColName, speedLimitsTargetRelUri, speedLimitsTargetColumnName, germanyQids, 'mode');
                parseFloat(results[0][speedLimitsTargetColumnName]).should.eq(50);
            });        
        })
        describe('aggregationOp === "max"', async function() {
            it('should join 100 kmph for Germany', async function() {
                const rawData = await getRawData(dataset);
                const results = await materializeJoinCollectionNumber(rawData, sourceColName, speedLimitsTargetRelUri, speedLimitsTargetColumnName, germanyQids, 'max');
                parseFloat(results[0][speedLimitsTargetColumnName]).should.eq(100);
            });        
        })
        describe('aggregationOp === "min"', async function() {
            it('should join 50 kmph for Germany', async function() {
                const rawData = await getRawData(dataset);
                const results = await materializeJoinCollectionNumber(rawData, sourceColName, speedLimitsTargetRelUri, speedLimitsTargetColumnName, germanyQids, 'min');
                parseFloat(results[0][speedLimitsTargetColumnName]).should.eq(50);
            });        
        })
        describe('aggregationOp === "variance"', async function() {
            it('should join 625 for Germany', async function() {
                const rawData = await getRawData(dataset);
                const results = await materializeJoinCollectionNumber(rawData, sourceColName, speedLimitsTargetRelUri, speedLimitsTargetColumnName, germanyQids, 'variance');
                parseFloat(results[0][speedLimitsTargetColumnName]).should.eq(1250);
            });
        })
    });

    describe ('#materializeJoinCollectionString', async function() {
        const awardsReceivedTargetRelUri = 'http://www.wikidata.org/prop/direct/P166';
        const awardsReceivedTargetColumnName = 'count-awards-received';

        describe('aggregationOp === "count"', async function() {
            it('should join 7 awards received for Hank Aaron', async function() {
                const rawData = await getRawData(dataset);
                const results = await materializeJoinCollectionString(rawData, sourceColName, awardsReceivedTargetRelUri, awardsReceivedTargetColumnName, hankAaronQids, 'count');
                results[0][awardsReceivedTargetColumnName].should.eq('7');
            });        
        })

        // describe('aggregationOp === "mode"', async function() {
        //     it('should join 7 awards received for Hank Aaron', async function() {
        //         const results = await materializeJoinCollectionString(rawData, sourceColName, awardsReceivedTargetRelUri, awardsReceivedTargetColumnName, hankAaronQids, 'count');
        //         results[0][awardsReceivedTargetColumnName].should.eq('7');
        //     });        
        // })

        // describe('aggregationOp === "entropy"', async function() {
        //     it('should join 7 awards received for Hank Aaron', async function() {
        //         const results = await materializeJoinCollectionString(rawData, sourceColName, awardsReceivedTargetRelUri, awardsReceivedTargetColumnName, hankAaronQids, 'count');
        //         results[0][awardsReceivedTargetColumnName].should.eq('7');
        //     });        
        // })
    });

});

