const appRootPath = require('app-root-path');
const path = require('path');
const { getRawData, getRelatedAttributes } = require(path.resolve(appRootPath + "/socket_listeners/controllers/dataaug_wikidata/attributeLogic.js"));
const { materializeJoin } = require(path.resolve(appRootPath + "/socket_listeners/controllers/dataaug_wikidata/joinLogic.js"));

const chai = require("chai");
chai.should();
chai.use(require('chai-things'));

const Dataset = require(path.resolve(appRootPath + "/Session/Dataset.js"))

describe ('#getRelatedAttributes', async function() {
    it('should return Team as a related attribute for baseball players in dataset 185', async function() {
        const datasetPath = path.resolve(appRootPath + "/input/185_baseball/");
        const dataset = new Dataset(datasetPath);
        const rawData = await getRawData(dataset);

        const results = await getRelatedAttributes('Player', rawData, 20);
        results.map((r) => r['name']).should.include('member of sports team'); // member of sports team: https://www.wikidata.org/wiki/Property:P54
    });
    it('should have a value type of join-collection-string for  member of sports team as a related attribute for baseball players in dataset 185', async function() {
        const datasetPath = path.resolve(appRootPath + "/input/185_baseball/");
        const dataset = new Dataset(datasetPath);
        const rawData = await getRawData(dataset);

        const results = await getRelatedAttributes('Player', rawData, 20);
        // results.map((r) => r['valueType'])[0].should.eq('join-collection-string'); // member of sports team: https://www.wikidata.org/wiki/Property:P54
        const memberOfSportsTeamResult = results.filter((r) => r['name'] === 'member of sports team')
        memberOfSportsTeamResult[0]['valueType'].should.eq('join-collection-string'); // member of sports team: https://www.wikidata.org/wiki/Property:P54
    });
})

describe ('#materializeJoin', async function() {
    it('should return a dataset with date of birth joined for first 10 baseball players in dataset 185', async function() {
        const datasetPath = path.resolve(appRootPath + "/input/185_baseball/");
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
        Object.keys(results[0]).should.include('date-of-birth'); // member of sports team: https://www.wikidata.org/wiki/Property:P54
    });
    it('should return a dataset with the baseball team name joined for first 10 baseball players in dataset 185', async function() {
        const datasetPath = path.resolve(appRootPath + "/input/185_baseball/");
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
        results[0]['sport-played'].should.eq('baseball'); // baseball: https://www.wikidata.org/wiki/Q5369
    });

})
