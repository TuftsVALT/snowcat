const appRootPath = require('app-root-path');
const path = require('path');
const { getRawData, getRelatedAttributes } = require(path.resolve(appRootPath + "/socket_listeners/controllers/dataaug_wikidata/attributeLogic.js"));
const { materializeJoin } = require(path.resolve(appRootPath + "/socket_listeners/controllers/dataaug_wikidata/joinLogic.js"));
const Session = require(path.resolve(appRootPath + "/Session/Session.js"));

const chai = require("chai");
chai.should();
chai.use(require('chai-things'));

const Dataset = require(path.resolve(appRootPath + "/Session/Dataset.js"))

describe ('#getRelatedAttributes', async function() {
    it('should return Team as a related attribute for baseball players in dataset 185', async function() {
        const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/185_baseball/");
        const dataset = new Dataset(datasetPath);
        const rawData = await getRawData(dataset);

        const results = await getRelatedAttributes('Player', rawData, 20);
        results.map((r) => r['name']).should.include('member of sports team'); // member of sports team: https://www.wikidata.org/wiki/Property:P54
    });
    it('should have a value type of join-collection-string for  member of sports team as a related attribute for baseball players in dataset 185', async function() {
        const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/185_baseball/");
        const dataset = new Dataset(datasetPath);
        const rawData = await getRawData(dataset);

        const results = await getRelatedAttributes('Player', rawData, 20);
        // results.map((r) => r['valueType'])[0].should.eq('join-collection-string'); // member of sports team: https://www.wikidata.org/wiki/Property:P54
        const memberOfSportsTeamResult = results.filter((r) => r['name'] === 'member of sports team')
        memberOfSportsTeamResult[0]['valueType'].should.eq('join-collection-string'); // member of sports team: https://www.wikidata.org/wiki/Property:P54
    });

    describe ('through joins', async function() {
        // Unfortunately, the current implementation doesn't expose state in a testable way, 
        // so we can't test these sequences of joins without refactoring.
        
        // it('should be able to join a string and then join off that string', async function() {
        //     // First, we join to the country of citizenship
        //     const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/185_baseball/");
        //     const session = new Session(true);

        //     let dataset = new Dataset(datasetPath);
        //     session.setCurrentDataset(dataset);
        //     let rawData = await getRawData(dataset);
        //     let joinInstructions = {
        //         'dataset': '185',
        //         'operation': 'join-string',
        //         'column': 'Player',
        //         'relationship': 'country of citizenship',
        //         'relationshipUri': 'http://www.wikidata.org/prop/direct/P27'
        //     }
    
        //     const firstJoinResults = await materializeJoin(joinInstructions, rawData, 10);

        //     // Then, we try to get related attributes from that, and join to it.
        //     dataset = session.getCurrentDataset();
        //     rawData = await getRawData(dataset);
        //     const secondRelatedAttrs = await getRelatedAttributes('Player - country of citizenship', rawData, 30, 10, 20)

        //     // inception
        //     // https://www.wikidata.org/wiki/Property:P571
        //     const inceptionResult = secondRelatedAttrs.filter((r) => r['name'] === 'inception')
        //     inceptionResult[0]['dataType'].should.eq('datetime');

        //     // Then, we join in the inception date
        //     joinInstructions = {
        //         'dataset': '185',
        //         'operation': 'join-string',
        //         'column': 'Player - country of citizenship',
        //         'relationship': 'inception',
        //         'relationshipUri': 'http://www.wikidata.org/prop/direct/P571'
        //     }

        //     const secondJoinResults = await materializeJoin(joinInstructions, rawData, 10);

        //     Object.keys(secondJoinResults[0]).should.include('Player - country of citizenship - inception');
        // })
    })

    describe ('metadata', async function() {
        it('should include the data type of the attribute', async function() {
            const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/185_baseball/");
            const dataset = new Dataset(datasetPath);
            const rawData = await getRawData(dataset);

            const playerResults = await getRelatedAttributes('Player', rawData, 20);
            // console.log("playerResults are ", playerResults);
            const dateOfBirthResult = playerResults.filter((r) => r['name'] === 'date of birth');
            // console.log("dateOfBirthResult is ", dateOfBirthResult)
            dateOfBirthResult[0]['dataType'].should.eq('datetime');
        });

        it('should include the description of the attribute', async function() {
            const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/185_baseball/");
            const dataset = new Dataset(datasetPath);
            const rawData = await getRawData(dataset);

            const playerResults = await getRelatedAttributes('Player', rawData, 20);

            const dateOfBirthResult = playerResults.filter((r) => r['name'] === 'date of birth');
            dateOfBirthResult[0]['description'].should.include('date on which the subject was born');
        });

        it('should include 3 examples of values for that attribute', async function() {
            const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/185_baseball/");
            const dataset = new Dataset(datasetPath);
            const rawData = await getRawData(dataset);

            const playerResults = await getRelatedAttributes('Player', rawData, 20);

            const dateOfBirthResult = playerResults.filter((r) => r['name'] === 'date of birth');
            const exampleDobs = dateOfBirthResult[0]['examples'];
            exampleDobs.should.have.lengthOf(3);
        });

        it('should include the units for a numerical column', async function() {
            const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/DA_poverty_estimation/");
            const dataset = new Dataset(datasetPath);
            const rawData = await getRawData(dataset);

            // Here, we can test out with a state, and get a numerical value
            const stateResults = await getRelatedAttributes('State', rawData, 20);
            // console.log("stateResults is ", stateResults)
            const waterPercentResult = stateResults.filter((r) => r['name'] === 'water as percent of area');
            waterPercentResult[0]['units'].should.eq('percent');
        });

        // it('should include the data source, if it exists', async function() {
        //     const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/DA_poverty_estimation/");
        //     const dataset = new Dataset(datasetPath);
        //     const rawData = await getRawData(dataset);

        //     // Here, we can test out with a state, and get a numerical value
        //     const stateResults = await getRelatedAttributes('State', rawData, 20);

        //     const minimumTempResult = stateResults.filter((r) => r['name'] === 'minimum temperature record');
        //     minimumTempResult[0]['sources'].should.include('imported from Wikimedia project');
        // });

        describe ('aggregated summaries', async function() {

            it('should include the estimated percent of joinable rows', async function() {
                const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/DA_poverty_estimation/");
                const dataset = new Dataset(datasetPath);
                const rawData = await getRawData(dataset);
    
                // Here, we can test out with a state, and get a numerical value
                const stateResults = await getRelatedAttributes('State', rawData, 50, 10, 10);
                // console.log("stateResults[0] is ", stateResults[0])
                // console.log("stateResults.map((r) => r['percentJoinable']) is ", stateResults.map((r) => r['percentJoinable']));
                // console.log("stateResults.map((r) => r['name']) is ", stateResults.map((r) => r['name']));
                const coatOfArmsResult = stateResults.filter((r) => r['name'] === 'coat of arms');
                const coatOfArmsPct = coatOfArmsResult[0]['percentJoinable'];
                coatOfArmsPct.should.be.below(1.0);
                coatOfArmsPct.should.be.above(0.0);    
            });

            describe ('quantitative feature', async function() {
                it('should include estimated summary statistics', async function() {
                    const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/DA_poverty_estimation/");
                    const dataset = new Dataset(datasetPath);
                    const rawData = await getRawData(dataset);
        
                    // Here, we can test out with a state, and get a numerical value
                    const stateResults = await getRelatedAttributes('State', rawData, 20, 10, 10);
                    // console.log("stateResults are", stateResults)
                    const elevationResult = stateResults.filter((r) => r['name'] === 'elevation above sea level');
                    // console.log("elevationResult are", elevationResult)
                    const summaryStats = elevationResult[0]['summaryStats'];
                    summaryStats.should.have.keys(['max', 'min', 'mean', 'firstQuartileEnd', 'median', 'thirdQuartileEnd', 'mode', 'variance']);
                });

                it('should include histogram bins', async function() {
                    const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/DA_poverty_estimation/");
                    const dataset = new Dataset(datasetPath);
                    const rawData = await getRawData(dataset);
        
                    // Here, we can test out with a state, and get a numerical value
                    const stateResults = await getRelatedAttributes('State', rawData, 20, 10, 10);
        
                    const populationResult = stateResults.filter((r) => r['name'] === 'elevation above sea level');
                    const bins = populationResult[0]['histogramBins'];
                    bins.length.should.eq(10);
                    bins[0]['min'].should.be.a('number');
                    bins[0]['max'].should.be.a('number');
                    bins[0]['count'].should.be.a('number');
                });
            })

            describe ('nonnumeric feature', async function() {
                it('should include estimated value counts', async function() {
                    const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/DA_poverty_estimation/");
                    const dataset = new Dataset(datasetPath);
                    const rawData = await getRawData(dataset);
        
                    // Here, we can test out with a state, and get a numerical value
                    const stateResults = await getRelatedAttributes('State', rawData, 20, 10, 10);
        
                    const borderResult = stateResults.filter((r) => r['name'] === 'shares border with');
                    const keys = Object.keys(borderResult[0]['frequencyCounts']);
                    const values = Object.values(borderResult[0]['frequencyCounts']);
                    keys.length.should.be.above(1);
                    keys[0].should.be.a('string');
                    values[0].should.be.a('number');
                });
            })
        });
    })


})

describe ('#materializeJoin', async function() {
    it('should return a dataset with date of birth joined for first 10 baseball players in dataset 185', async function() {
        const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/185_baseball/");
        const dataset = new Dataset(datasetPath);
        const rawData = await getRawData(dataset);
        const joinInstructions = {
            'dataset': '185',
            'operation': 'join-string',
            'column': 'Player',
            'relationship': 'date-of-birth',
            'relationshipUri': 'http://www.wikidata.org/prop/direct/P569'
        }

        const results = await materializeJoin(joinInstructions, rawData, 10);

        Object.keys(results[0]).should.include('Player - date-of-birth'); // member of sports team: https://www.wikidata.org/wiki/Property:P54
    });
    it('should return a dataset with the baseball team name joined for first 10 baseball players in dataset 185', async function() {
        const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/185_baseball/");
        const dataset = new Dataset(datasetPath);
        const rawData = await getRawData(dataset);
        const joinInstructions = {
            'dataset': '185',
            'operation': 'join-string',
            'column': 'Player',
            'relationship': 'sport-played',
            'relationshipUri': 'http://www.wikidata.org/prop/direct/P641'
        }

        const results = await materializeJoin(joinInstructions, rawData, 10);
        results[0]['Player - sport-played'].should.eq('baseball'); // baseball: https://www.wikidata.org/wiki/Q5369
    });

    describe ('metadata', async function() {
        it('should include the date recorded, if it exists', async function() {
            // false.should.eq(true);
            // const datasetPath = path.resolve(appRootPath + "/static/local_testing_data/DA_poverty_estimation/");
            // const dataset = new Dataset(datasetPath);
            // const rawData = await getRawData(dataset);
    
            // // Here, we can test out with a state, and get a numerical value
            // const stateResults = await getRelatedAttributes('State', rawData, 20);
    
            // const minimumTempResult = stateResults.filter((r) => r['name'] === 'minimum temperature record');
            // minimumTempResult[0]['dateRecorded'].should.include('');
        });    
    })
})
