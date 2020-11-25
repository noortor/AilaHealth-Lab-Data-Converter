const fs = require('fs');
const tabula = require('tabula-js');
const yargs = require('yargs');

const validLabs = ["EN", "UL"];

yargs.command({
    command: 'convert',
    describe: 'Convert a pdf of lab data into a json',
    builder: {
        fileName: {
            describe: 'Name of the lab pdf',
            demandOption: true,
            type: 'string'
        }
    },
    handler: function (argv) {
        main(argv.fileName);
    }
})

yargs.parse();

function main(fileName) {
    const t = tabula('./labDataInputs/' + fileName);
    t.extractCsv((err, data) => {
        let labData = {
            "labs": []
        };
        for (let i = 0; i < data.length; i++) {
            data[i] = data[i].split(',').filter(elem => elem != '' && elem != '""');
        }
        data = data.filter(arr => arr.length == 2);
        data = data.filter(arr => (/\d/.test(arr[0]) && !arr[1].includes('PAGE')));
        for (let i = 0; i < data.length; i++) {
            let labEntry = {};
            labEntry["name"] = getTestName(data[i]);
            labEntry["value"] = getTestValue(data[i]);
            labEntry["range"] = getTestRange(data[i]);
            labEntry["units"] = getTestUnits(data[i]);
            labEntry["lab"] = getTestLab(data[i]);
            labData.labs.push(labEntry);
        }
        const labDataStringified = JSON.stringify(labData);
        fs.writeFileSync('./labDataOutputs/' + fileName.substring(0, fileName.length - 4) + '.json', labDataStringified);
        console.log(labData);
    })

}

function getTestNameWithValue(rawTestDataEntry) {
    let parsedTestDataEntry = rawTestDataEntry[0].split('"')[1].trim();
    return parsedTestDataEntry.slice(0, -1);
}

function getTestRangeWithLab(rawTestDataEntry) {
    let parsedTestDataEntry = rawTestDataEntry[1].replace(/"/g, '').trim();
    return parsedTestDataEntry;
}

function getTestName(rawTestDataEntry) {
    let testNameWithValue = getTestNameWithValue(rawTestDataEntry)
    let testName = testNameWithValue.split(' ').slice(0, -1).join(' ');
    return testName;
}

function getTestValue(rawTestDataEntry) {
    let testNameWithValue = getTestNameWithValue(rawTestDataEntry)
    let testNameWithValueArr = testNameWithValue.split(' ');
    let valueStr = testNameWithValueArr[testNameWithValueArr.length - 1];
    let value = parseFloat(valueStr);
    return value;
}

function getTestRange(rawTestDataEntry) {
    let testRangeWithLab = getTestRangeWithLab(rawTestDataEntry);
    let range = testRangeWithLab.split(' ')[0];
    if (isValidRange(range)) {
        return range;
    } else {
        return null;
    }
}

function getTestUnits(rawTestDataEntry) {
    let testRangeWithLab = getTestRangeWithLab(rawTestDataEntry);
    let testRangeWithLabArr = testRangeWithLab.split(' ')
    if (!(getTestRange(rawTestDataEntry) === null)) {
        testRangeWithLabArr = testRangeWithLabArr.slice(1);
    }
    if (getTestLab(rawTestDataEntry) === null) {
        return testRangeWithLabArr.join(' ');
    } else {
        return testRangeWithLabArr.slice(0, -1).join(' ');
    }
}

function getTestLab(rawTestDataEntry) {
    let testRangeWithLab = getTestRangeWithLab(rawTestDataEntry);
    let testRangeWithLabArr = testRangeWithLab.split(' ')
    let testLab = testRangeWithLabArr[testRangeWithLabArr.length - 1];
    if (isValidLab(testLab)) {
        return testLab;
    } else {
        return null;
    }
}

function isValidLab(testLab) {
    return validLabs.includes(testLab);
}

function isValidRange(testRange) {
    return /\d/.test(testRange);
}

