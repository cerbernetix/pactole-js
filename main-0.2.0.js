/* eslint-disable no-console */
import { EuroMillions, EuroMillionsCombination } from 'pactole-js';

// Build a known combination
const euroMillions = new EuroMillionsCombination({ numbers: [3, 15, 22, 28, 44], stars: [2, 9] });

console.log(euroMillions.numbers.values);
console.log(euroMillions.stars.values);
console.log(euroMillions.rank);

// Generate 3 random combinations
for (const combination of new EuroMillions().generate({ n: 3 })) {
    console.log(combination.toString());
}

console.log(new EuroMillions().getLastDrawDate(null, false).toISOString().substring(0, 10));
console.log(new EuroMillions().getNextDrawDate(null, false).toISOString().substring(0, 10));
