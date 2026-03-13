# Lottery Classes

Pactole.js exposes lottery-handling classes in `pactole-js`:

- `BaseLottery`: Generic implementation for draw-day handling and combination creation.
- `EuroMillions`: Preconfigured lottery (`Tuesday`, `Friday`) using `EuroMillionsCombination`.
- `EuroDreams`: Preconfigured lottery (`Monday`, `Thursday`) using `EuroDreamsCombination`.

## Create a lottery instance

Use built-in classes when your game rules match EuroMillions or EuroDreams.

```ts
import { EuroDreams, EuroMillions } from 'pactole-js';

const euromillions = new EuroMillions();
const eurodreams = new EuroDreams();

console.log(euromillions.drawDays.days);
console.log(eurodreams.drawDays.days);
```

## Get last and next draw dates

Lottery instances delegate date computations to configured draw days.

```ts
import { EuroMillions } from 'pactole-js';

const lottery = new EuroMillions();

console.log(lottery.getLastDrawDate(new Date(2026, 1, 19), true));
console.log(lottery.getNextDrawDate(new Date(2026, 1, 19), true));
```

## Create and generate combinations from a lottery

Use the same API through the lottery class instead of calling combination classes directly.

```ts
import { EuroMillions } from 'pactole-js';

const lottery = new EuroMillions();

const played = lottery.getCombination({ numbers: [3, 15, 22, 28, 44], stars: [2, 9] });
const randomTickets = lottery.generate({ n: 3 });

console.log(played);
console.log(randomTickets);
```

## Build your own lottery class

Subclass `BaseLottery` to define custom draw days and your own combination class.

```ts
import { BaseLottery, EuroMillionsCombination, Weekday } from 'pactole-js';

class CustomLottery extends BaseLottery {
    constructor() {
        super({
            drawDays: [Weekday.MONDAY, Weekday.THURSDAY],
            combinationFactory: EuroMillionsCombination
        });
    }
}

const custom = new CustomLottery();
console.log(custom.drawDays.days);
```
