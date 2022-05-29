const parser = require("cron-parser");
const { DateTime, Duration } = require("luxon");

let recompute = true;
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
let workingBalance = 0 // helper used for active balance calculations.

onmessage = function(message) { // handler in case main process changes inputs.
    if (message.clearHistory !== undefined) {
        outputs.history = [];
        return;
    }
    inputs.events = message.events;
    inputs.balance = message.stats.balance;
    recompute = true;
}

setInterval(() => { // worker loop, runs every minute.
    if (recompute) { // check list of events or current balance for change;
        outputs.future = []; // if yes clear and recompute of future.
        outputs.lowest = NaN;
        prototypeFuture = {};
        workingBalance = inputs.balance;
        inputs.events.forEach((event) => {
            Array.from(parser.parseExpression(event.cron, { // parse cron for event.
                // set range for futures to be between now and 1 year.
                // cron can configure month, highest, so 1 year contains at least one cron occurence.
                currentDate: new Date(DateTime.now().toISO()),
                endDate: new Date(DateTime.now().plus(Duration.fromObject({years: 1}))),
                iterator: true
            })).forEach((date) => { // iterate over each future time. array convert inefficient.
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
        prototypeFuture = {};
        // we don't clear vars like we're doing recomputation.
        inputs.events.forEach((event) => {
            Array.from(parser.parseExpression(event.cron, { // parse cron for event.
                // this time we do this slightly differently, 1 minute window from 1 year from now.
                currentDate: new Date(DateTime.now().toISO().minus(Duration.fromObject({minutes: 1}).plus(Duration.fromObject({years: 1})))),
                endDate: new Date(DateTime.now().plus(Duration.fromObject({years: 1}))),
                iterator: true
            })).forEach((date) => { // iterate over each future time. array convert inefficient.
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
            outputs.future.push({
                x: unixTimeAsKey,
                y: workingBalance
            });
        });
    }
    // send off outputs to main.
    postMessage(outputs);
}, 60 * 1000);
