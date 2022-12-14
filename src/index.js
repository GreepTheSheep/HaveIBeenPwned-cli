renderTitle();
require('dotenv').config();
const fetch = require("node-fetch");
const fs = require('fs');
const wait = require('util').promisify(setTimeout);

let KEY = process.env.API_KEY;

let execArgs = process.argv.slice(2);

if (execArgs == "") {
    returnHelpAndExit();
}

// split array every -
execArgs = execArgs.join(" ").split("-");
execArgs.shift();

execArgs = execArgs.map(m=>{
    let tab = m.split(' ');
    return tab.filter(t=>t !== '');
});

if (KEY == "") {
    if (execArgs.filter(e=>e[0] == "k" || e[0] == 'key').length > 0) {
        KEY = execArgs.filter(e=>e[0] == "k" || e[0] == 'key')[0][1]
    } else {
        console.error("Missing API Key");
        process.exit(3);
    }
}

let inFile = execArgs.filter(e=>e[0] == "f" || e[0] == 'file')[0][1];

let outFile = execArgs.filter(e=>e[0] == "o" || e[0] == 'out')[0][1];

let includeNotBreached = execArgs.filter(e=>e[0] == 'all').length > 0;
let verbose = execArgs.filter(e=>e[0] == 'v').length > 0;

if (inFile) {
    let content = fs.readFileSync(inFile).toString();
    let contentTab = content.split("\r\n").filter(t=>t !== '');
    if (verbose) console.log('mails list', contentTab);
    checkAddresses(contentTab);
} else {
    if (execArgs.filter(e=>e[0] == 'e' || e[0] == 'email').length > 0) {
        let email = execArgs.filter(e=>e[0] == "e" || e[0] == 'email')[0][1];
        if (verbose) console.log('mail ', email);
        checkAddress(email);
    } else returnHelpAndExit();
}

async function checkAddresses(addresses) {
    let pwnedAccounts = 0;
    for (let i = 0; i < addresses.length; i++) {
        if (verbose) console.log(':: Checking address', addresses[i]);
        if (checkAddress(addresses[i])) pwnedAccounts++;
        await wait(2000);
    }
    renderResults(addresses.length, pwnedAccounts);
}

async function checkAddress(address) {
    await getPwnedAPI(address).then(r=>{
        if (verbose) console.log(address, r);
        else {
            if (Array.isArray(r)) console.log(">", address, "is breached!");
            else console.log(">", address, r);
        }
        if (outFile) {
            let csvString;
            if (Array.isArray(r))
                csvString = address+','+r.join(',');
            if (includeNotBreached && r == "not breached")
                csvString = address;

            // Write
            if (csvString != undefined)
                if (fs.existsSync(outFile))
                    fs.writeFileSync(outFile, fs.readFileSync(outFile) + '\n' + csvString);
                else
                    fs.writeFileSync(outFile, csvString);
        }
    }).catch(e=>{
        console.error("!! Error:", address, e.message);
        if (e.code == 401) process.exit(e.code);
    });
}

async function getPwnedAPI(account, service = "breachedaccount", parameters = "includeUnverified=true") {
    let res = await fetch(`https://haveibeenpwned.com/api/v3/${service}/${account}?${parameters}`, {
        headers: {
            "hibp-api-key": KEY
        }
    });

    switch (res.status) {
        case 404:
            return "not breached";
        case 200:
            let json = await res.json();

            return json.map(j=>j.Name);
        case 429:
            //Rate limit
            throw new APIError(res.status, "rate limit");
        default:
            // Unexcepted
            let jsonE = await res.json(),
                errorMessage = "Unexcepted"
            if (jsonE) errorMessage = jsonE.message;
            throw new APIError(res.status, errorMessage);
    }
}

function renderTitle() {
    const package = require("../package.json");
    console.log(package.name + " by " + package.author.name + ' ('+package.author.url+')');
    console.log('v'+package.version);
    console.log();
}

function returnHelpAndExit() {
    console.error("Usage: [-k API_KEY] [-f INPUT_FILE | -e MAIL_ADDRESS] (-o OUTPUT_FILE) (-all) (-v)");
    console.error("API_KEY is required, you can use the .env file if you don't want to expose the key");
    console.error("INPUT_FILE must be a raw text format, emails must be separated by lines (in CRLF format)");
    console.error("OUTPUT_FILE must be a CSV format, if a file is already created, it will add new lines");
    console.error("-all parameter will list emails that are not breached in the OUTPUT_FILE");
    console.error("-v parameter will verbose output logs");
    console.error();
    process.exit(1);
}

function renderResults(totalAccountsNumber, pwnedAccountsNumber) {
    console.log();
    console.log("Results:");
    console.log(`On ${totalAccountsNumber} accounts scanned, ${pwnedAccountsNumber} have been pwned.`);
    console.log(`That's a total of ${(pwnedAccountsNumber/totalAccountsNumber) * 100}% of accounts that are pwned`);
    if (outFile) {
        console.log(`The list of ${includeNotBreached?"":"breached "}accounts ${includeNotBreached?"(breached or not) ":""} is rendered to ${outFile}`);
    }
}

class APIError extends Error {
    constructor(code, message) {
        super(message);

        this.code = code;
    }
}