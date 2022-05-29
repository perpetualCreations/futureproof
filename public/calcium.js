import {DateTime, Duration} from "./calciumdep/luxon/build/es6/luxon.js";

let recompute = false;
// we will use these in calculating outputs.
// if they change, we should recalculate our outputs.
let inputs = {
    events: [],
    balance: 0 // balance @ now, not past or future.
}
// we will put our results here.
// they should be shipped off to main per worker loop via messaging.
let outputs = {
    future: [], // we populate this. remember when receiving, add the last value of history to future.
    lowest: NaN, // the lowest amount of money we will have in the future. we populate this.
    history: [], // we populate this. not the full history, just future balances that have expired.
}
let workingBalance = 0; // helper used for active balance calculations.
let farthest = -1; // helper used for finding where to restart calculations.

let lastResultArray = {array: [], code: 0};

onmessage = function(message) { // handler in case main process changes inputs.
    message = message.data;
    if (message.resultArray !== undefined) {
        lastResultArray.array = message.array;
        lastResultArray.code = message.code;
        throw String(lastResultArray.array), lastResultArray.code;
        return;
    }
    if (message.clearHistory !== undefined) {
        outputs.history = [];
        return;
    }
    inputs.events = message.events;
    inputs.balance = message.stats.balance;
    recompute = message.recompute;
}

# FIXME

setInterval(() => { // worker loop, runs every minute.
    if (recompute) { // check list of events or current balance for change;
        outputs.future = []; // if yes clear and recompute of future.
        outputs.lowest = NaN;
        let prototypeFuture = {};
        farthest = -1;
        workingBalance = inputs.balance;
        inputs.events.forEach((event) => {
            let code = Date.now();
            postMessage({ // parse cron for event.
                parse: {
                    expression: event.cron,
                    args: {
                        // set range for futures to be between now and 1 year.
                        // cron can configure month, highest, so 1 year contains at least one cron occurence.
                        currentDate: new Date(DateTime.now().toISO()),
                        endDate: new Date(DateTime.now().plus(Duration.fromObject({years: 1})))
                    },
                    code: code
                }
            });
            while (lastResultArray.code !== code) {}
            lastResultArray.array.forEach((date) => { // iterate over each future time. array convert inefficient.
                // we push everything to prototypeFuture so we can sort and apply each change sequentially, logging as we go.
                prototypeFuture[(DateTime.fromJSDate(date).toUnixInteger() * 1000)] = {
                    amount: event.amount,
                    symbol: event.symbol
                };
            });
        });
        Object.keys(prototypeFuture).sort((a, b) => {return a - b;}).forEach((unixTimeAsKey) => {
            let workingBalance = ((prototypeFuture[unixTimeAsKey].symbol == "+") ? (workingBalance + prototypeFuture[unixTimeAsKey].amount) : (workingBalance - prototypeFuture[unixTimeAsKey].amount));
            if (outputs.lowest === NaN || outputs.lowest > workingBalance) {
                outputs.lowest = workingBalance;
            }
            if (farthest == -1 || farthest < unixTimeAsKey) {
                farthest = unixTimeAsKey;
            }
            outputs.future.push({
                x: unixTimeAsKey,
                y: workingBalance
            });
        });
    }
    else {
        // if no check future for expired future balances, then check for new future balances.
        outputs.future.forEach((data) => {
            if (data.x <= Date.now()) {
                outputs.history.push(data);
            }
        });
        outputs.history.forEach((data) => {
            if (outputs.future.indexOf(data) !== -1) {
                outputs.future.splice(outputs.future.indexOf(data), 1);
            }
        });
        if (Date.now() > farthest) { // compute new futures only if farthest is in the past.
            let prototypeFuture = {};
            // we don't clear vars like we're doing recomputation.
            inputs.events.forEach((event) => {
                let code = Date.now();
                postMessage({ // parse cron for event.
                    parse: {
                        expression: event.cron,
                        args: {
                            // set range for futures to be between now and 1 year.
                            // cron can configure month, highest, so 1 year contains at least one cron occurence.
                            currentDate: new Date(DateTime.fromMillis(farthest)),
                            endDate: new Date(DateTime.now().plus(Duration.fromObject({years: 1})))
                        },
                        code: code
                    }
                })
                while (lastResultArray.code !== code) {}
                lastResultArray.array.forEach((date) => { // iterate over each future time. array convert inefficient.
                    // we push everything to prototypeFuture so we can sort and apply each change sequentially, logging as we go.
                    prototypeFuture[(DateTime.fromJSDate(date).toUnixInteger() * 1000)] = {
                        amount: event.amount,
                        symbol: event.symbol
                    };
                });
            });
            Object.keys(prototypeFuture).sort((a, b) => {return a - b;}).forEach((unixTimeAsKey) => {
                let workingBalance = ((prototypeFuture[unixTimeAsKey].symbol == "+") ? (workingBalance + prototypeFuture[unixTimeAsKey].amount) : (workingBalance - prototypeFuture[unixTimeAsKey].amount));
                if (outputs.lowest === NaN || outputs.lowest > workingBalance) {
                    outputs.lowest = workingBalance;
                }
                if (farthest == -1 || farthest < unixTimeAsKey) {
                    farthest = unixTimeAsKey;
                }
                outputs.future.push({
                    x: unixTimeAsKey,
                    y: workingBalance
                });
            });
        }
    }
    // send off outputs to main.
    postMessage(outputs);
}, 1 * 1000);
