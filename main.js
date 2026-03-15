/* eslint-disable no-console */
import { EuroDreams, EuroMillions } from 'pactole-js';

// Generate 3 random combinations
for (const combination of new EuroMillions().generate({ n: 3 })) {
    console.log(combination.toString());
}

console.log(new EuroMillions().getLastDrawDate(null, false).toISOString().substring(0, 10));
console.log(new EuroMillions().getNextDrawDate(null, false).toISOString().substring(0, 10));

const euroMillions = new EuroMillions();
const euroMillionsCount = await euroMillions.count();
console.log(`EuroMillions count: ${euroMillionsCount}\n`);
const euroMillionsRecords = Array.from(await euroMillions.get_records());
console.log(`EuroMillions last record: ${euroMillionsRecords[euroMillionsRecords.length - 1].toString()}\n`);
const euroMillionsDump = await euroMillions.dump();
console.log(`EuroMillions last dump: ${euroMillionsDump[euroMillionsDump.length - 1].toString()}\n`);
console.log(
    `EuroMillions last JSON: ${JSON.stringify(euroMillionsRecords[euroMillionsRecords.length - 1], null, 2)}\n`
);

const euroDreams = new EuroDreams();
const euroDreamsCount = await euroDreams.count();
console.log(`EuroDreams count: ${euroDreamsCount}\n`);
const euroDreamsRecords = Array.from(await euroDreams.get_records());
console.log(`EuroDreams last record: ${euroDreamsRecords[euroDreamsRecords.length - 1].toString()}\n`);
const euroDreamsDump = await euroDreams.dump();
console.log(`EuroDreams last dump: ${euroDreamsDump[euroDreamsDump.length - 1].toString()}\n`);
console.log(`EuroDreams last JSON: ${JSON.stringify(euroDreamsRecords[euroDreamsRecords.length - 1], null, 2)}\n`);
