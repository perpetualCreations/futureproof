<script>
    import { PayloadFairingButton } from "@hereticsibyl/svelte-dlxyz-base-dev";

    export let state = {
		stats: {
			balance: 0,
            negative: 0,
            positive: 0,
			history: {
				balance: [],
				positive: [],
				negative: [],
				spare: []
			}
		},
		transacts: [],
		events: [],
		settings: {
			currencySymbol: "¤"
		}
	};
    let prototypeTransaction = {
        title: "",
        description: "",
        amountDirty: "",
        amount: 0,
        symbol: "+"
    };

    const resetPrototype = () => {
        prototypeTransaction = {
            title: "",
            description: "",
            amountDirty: "",
            amount: 0,
            symbol: "+"
        }
    }
    resetPrototype();

    const loadTransactionIntoPrototype = (index) => {
        Object.keys(state.transacts[index]).forEach((key) => {
            console.log(key);
            prototypeTransaction[key] = state.transacts[index][key];
            console.log(prototypeTransaction);
        });
        prototypeTransaction.amountDirty = String(state.transacts[index].amount);
    }

    const evaluateTransaction = (amount, symbol) => {
        if (symbol == "+") {
            state.stats.balance += amount;
        }
        else if (symbol == "-") {
            state.stats.balance -= amount;
        }
    }

    const symbolReversalLookup = {
        "-": "+",
        "+": "-"
    }

    const removeTransaction = (index) => {
        evaluateTransaction(state.transacts[index].amount, symbolReversalLookup[state.transacts[index].symbol]);
        state.transacts.splice(index, 1);
        state.transacts = state.transacts;
    }

    const savePrototype = () => {
        let prototype = {...prototypeTransaction};
        let index = -1;
        try {
            state.transacts.forEach((transaction, transactionIndex) => {
                if (transaction.title == prototype.title) {
                    index = transactionIndex;
                    throw "break";
                }
            });
        }
        catch {}
        if (index == -1) {
            evaluateTransaction(prototype.amount, prototype.symbol);
            state.transacts.unshift(prototype);
        }
        else {
            evaluateTransaction(state.transacts[index].amount, symbolReversalLookup[state.transacts[index].symbol]);
            evaluateTransaction(prototype.amount, prototype.symbol);
            state.transacts[index] = prototype;
        }
        state.transacts = state.transacts;
    }
</script>

<p>One-time changes to your balance.</p>
<main>
    <form>
        <input type="text" placeholder="Title..." bind:value={prototypeTransaction.title}>
        <textarea rows="15" placeholder="Description..." bind:value={prototypeTransaction.description}></textarea>
        <input type="text" inputmode="decimal" placeholder="0.00" bind:value={prototypeTransaction.amountDirty} on:change={(() => {
            try {
                prototypeTransaction.amount = Number(prototypeTransaction.amountDirty);
            } catch {
                prototypeTransaction.amount = 0;
            }
        })}>
        <label>
            <input type="radio" bind:group={prototypeTransaction.symbol} value="+" checked> Earning
        </label>
        <label>
            <input type="radio" bind:group={prototypeTransaction.symbol} value="-"> Spending
        </label>
    </form>
    <div id="spacer"></div>
    <div id="transaction-list">
        <div id="transaction-list-header">
            <p><b>|| Transactions</b></p>
        </div>
        <div id="transaction-list-content">
            {#if (state.transacts.length == 0)}
                <p style="text-align: center;">No transactions.</p>
            {/if}
            {#each state.transacts as transaction, index}
                <div class="transaction-list-item">
                    <p class="transaction-list-item-header"><b>{transaction.title}</b></p>
                    <p class="transaction-list-item-content">({transaction.symbol}) {state.settings.currencySymbol} {transaction.amount} | <button on:click={(() => {loadTransactionIntoPrototype(index)})}>🖋</button><button on:click={(() => {removeTransaction(index)})}>✘</button></p>
                </div>
            {/each}
        </div>
    </div>
</main>
<div class="transaction-button-container-container">
    <div class="transaction-button-container">
        <PayloadFairingButton callback={savePrototype}>Save Transaction</PayloadFairingButton>
    </div>
    <div class="transaction-button-container">
        <PayloadFairingButton callback={resetPrototype}>New Transaction</PayloadFairingButton>
    </div>
</div>

<style>
    main {
        display: flex;
    }

    form {
        flex: 45%;
        width: 100%;
        overflow-x: hidden;
    }

    input[type="text"], textarea {
        width: 100%;
    }

    #spacer {
        flex: 10%;
    }

    #transaction-list {
        flex: 45%;
        height: fit-content;
        background-color: var(--bg2);
    }

    #transaction-list-header {
        background-color: var(--bg0_h);
    }

    #transaction-list-header p {
        margin: 0;
        padding: 0.5em;
    }

    #transaction-list-content {
        overflow-y: scroll;
        max-height: 80vh;
    }

    .transaction-button-container-container {
        display: flex;
        justify-content: center;
    }

    .transaction-button-container {
        margin: 1em;
        display: flex;
        justify-content: center;
        flex: 50%;
    }

    .transaction-list-item {
        background-color: var(--bg2);
        padding: 0.4em;
    }

    .transaction-list-item:nth-child(even) {
        background-color: var(--bg3);
    }

    .transaction-list-item-header {
        color: var(--fg0);
        font-size: 1.2em;
        margin: 0;
        margin-bottom: 0.25em;
    }

    .transaction-list-item-content {
        font-size: 0.8em;
        margin: 0;
    }

    .transaction-list-item-content button {
        background-color: transparent;
    }

    textarea {
        resize: none;
    }
</style>
