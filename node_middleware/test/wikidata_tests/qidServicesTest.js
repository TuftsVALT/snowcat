const appRootPath = require('app-root-path');
const path = require('path');
const { singleGetRelatedAttributes, convertToPotentialQID, convertHeaderToQID, convertColumnToQIDs } = require(path.resolve(appRootPath + "/socket_listeners/controllers/dataaug_wikidata/qidServices.js"));
const { joinAttributes } = require(path.resolve(appRootPath + "/socket_listeners/controllers/dataaug_wikidata/attributeLogic.js"));

const chai = require("chai");
chai.should();
chai.use(require('chai-things'));

describe ('#singleGetRelatedAttributes', async function() {
    it('should return an empty array when passed a bad QID', async function() {
        const results = await singleGetRelatedAttributes('nonsensee4234');
        results.should.eql([]);
    });
    it('should return "population" as one of the related attributes for "Germany"', async function() {
        const results = await singleGetRelatedAttributes('Q183');
        results.map((r) => r['wdLabel']['value']).should.include('population'); // Germany: https://www.wikidata.org/wiki/Q183
    });
    it('should return "P1082" as the uri for "population"', async function() {
        const results = await singleGetRelatedAttributes('Q183');
        results.map((r) => r['wdt']['value']).should.include('http://www.wikidata.org/prop/direct/P1082'); // Germany: https://www.wikidata.org/wiki/Q183
    });
    
    it('should return "director" as one of the related attributes for "Pulp Fiction"', async function() {
        const results = await singleGetRelatedAttributes('Q104123');
        results.map((r) => r['wdLabel']['value']).should.include('director'); // Pulp Fiction: https://www.wikidata.org/wiki/Q104123
    });
    it('should ignore related attributes on the blacklist', async function() {
        const results = await singleGetRelatedAttributes('Q183');
        results.map((r) => r['wdLabel']['value']).should.not.include('instance of'); // Germany: https://www.wikidata.org/wiki/Q183
    });
    it('should have a value type of join-collection-string for member of sports team as a related attribute for Hank Aaron', async function() {
        const results = await singleGetRelatedAttributes('Q215777');// Hank Aaron: https://www.wikidata.org/wiki/Q215777
        // console.log("results are ", results)
        const memberOfSportsTeamResult = results.filter((r) => r['wdLabel']['value'] === 'member of sports team')
        memberOfSportsTeamResult[0]['valueType'].should.eq('join-collection-string'); // member of sports team: https://www.wikidata.org/wiki/Property:P54
    });

});

describe ('#convertColumnToQIDs', async function() {
    it('should convert Hank Aaron to Q215777', async function() {
        const rawData = [
            { 'Player': 'Hank Aaron' }
        ]

        const results = await convertColumnToQIDs(rawData, 'Player', 10, false);
        results.should.include('Q215777');
    })

    it('should convert nonsense to a blank string', async function() {
        const rawData = [
            { 'Player': 'Hank Aaron' },
            { 'Player': 'asdkf2oi4h0vh9042h04ehf0ehgv0bn024hnvg24q0ehg04evg0e2q9vnheq0vnh4eq09gv9evhnqievg42gh084ehvf80wdrvhg240h029' }
        ]

        const results = await convertColumnToQIDs(rawData, 'Player', 10, false);
        results.length.should.eq(2);
    })
})

describe ('#convertToPotentialQID', async function() {
    it('should convert exact matches', async function() {
        const result = await convertToPotentialQID('Hank Aaron');
        const results = result.map((r) => r['id'])
        results.should.include('Q215777');
    });

    it('should convert fuzzy matches with all caps', async function() {
        const result = await convertToPotentialQID('HANK AARON');
        const results = result.map((r) => r['id'])
        results.should.include('Q215777');
    });

    it('should convert fuzzy matches with underscores instead of spaces', async function() {
        const result = await convertToPotentialQID('HANK_AARON');
        const results = result.map((r) => r['id'])
        results.should.include('Q215777');
    });

})

describe ('#joinAttributes', async function() {
    it ('should include attribute URIs to the returned hash', async function() {
        const results = await singleGetRelatedAttributes('Q183');
        const joinedResults = await joinAttributes([results], -1);
        // console.log("joinedResults.map((r) => r['uri']) is ", joinedResults.map((r) => r['uri']))
        joinedResults.map((r) => r['uri']).should.include('http://www.wikidata.org/prop/direct/P1082'); // Germany: https://www.wikidata.org/wiki/Q183
    })
})

// describe ('#convertHeaderToQID', async function() {
//     it('should convert "Player" with Hank Aaron into the QID for Baseball Player', async function() {
//         const rawData = [
//             { 'Player': 'Hank Aaron' }
//         ]
//         const result = await convertHeaderToQID(rawData, 'Player');
//         result.should.eql('Q10871364');
//     })
//     it('should convert "Player" with Deion Sanders and Derek Jeter into the QID for Baseball Player', async function() {
//         const rawData = [
//             { 'Player': 'Deion Sanders' },
//             { 'Player': 'Derek Jeter' }
            
//         ]
//         const result = await convertHeaderToQID(rawData, 'Player');
//         result.should.eql('Q10871364');
//     })
//     it('should convert "Player" with Deion Sanders and Eli Manning into the QID for Football Player', async function() {
//         const rawData = [
//             { 'Player': 'Deion Sanders' },
//             { 'Player': 'Eli Manning' }
            
//         ]
//         const result = await convertHeaderToQID(rawData, 'Player');
//         result.should.eql('Q19204627');
//     })
//     it('should convert "Player" with Eli Manning and Peyton Manning into the QID for Football Player', async function() {
//         const rawData = [
//             { 'Player': 'Peyton Manning' },
//             { 'Player': 'Eli Manning' }
            
//         ]
//         const result = await convertHeaderToQID(rawData, 'Player');
//         result.should.eql('Q19204627');
//     })
//     it('should convert "Quarterback" with Eli Manning and Peyton Manning into the QID for Quarterback', async function() {
//         const rawData = [
//             { 'Player': 'Peyton Manning' },
//             { 'Player': 'Eli Manning' }
            
//         ]
//         const result = await convertHeaderToQID(rawData, 'Quarterback');
//         result.should.eql('Q622747');
//     })
// })

