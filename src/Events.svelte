<script>
    import { PayloadFairingButton, CronEditor } from "@hereticsibyl/svelte-dlxyz-base-dev";

    export let state = {
		stats: {
			balance: 0,
			history: {
				balance: [],
			},
            future: [],
			lowest: -1
		},
		transacts: [],
		events: [],
		settings: {
			currencySymbol: "¤"
		},
        meta: {
            firstBoot: -1
        }
	};
    let prototypeEvent = {
        title: "",
        description: "",
        amountDirty: "",
        amount: 0,
        symbol: "+",
        cron: ""
    };

    const resetPrototype = () => {
        prototypeEvent = {
            title: "",
            description: "",
            amountDirty: "",
            amount: 0,
            symbol: "+",
            cron: ""
        }
    }

    const loadEventIntoPrototype = (index) => {
        Object.keys(state.events[index]).forEach((key) => {
            console.log(key);
            prototypeEvent[key] = state.events[index][key];
            console.log(prototypeEvent);
        });
        prototypeEvent.amountDirty = String(state.events[index].amount);
    }

    const removeEvent = (index) => {
        state.events.splice(index, 1);
        state.events = state.events;
    }

    const savePrototype = () => {
        let prototype = {...prototypeEvent};
        let index = -1;
        try {
            state.events.forEach((event, eventIndex) => {
                if (event.title == prototype.title) {
                    index = eventIndex;
                    throw "break";
                }
            });
        }
        catch {}
        if (index == -1) {
            state.events.unshift(prototype);
        }
        else {
            state.events[index] = prototype;
        }
        state.events = state.events;
    }
</script>

<p>Recurring changes to your balance.</p>
<main>
    <form>
        <input type="text" placeholder="Title..." bind:value={prototypeEvent.title}>
        <textarea rows="15" placeholder="Description..." bind:value={prototypeEvent.description}></textarea>
        <input type="text" inputmode="decimal" placeholder="0.00" bind:value={prototypeEvent.amountDirty} on:change={(() => {
            try {
                if (Number(prototypeEvent.amountDirty) === NaN) {
                    throw "NaN is bad. We don't want NaN.";
                }
                prototypeEvent.amount = Number(prototypeEvent.amountDirty);
            } catch {
                prototypeEvent.amount = 0;
            }
        })}>
        <label>
            <input type="radio" bind:group={prototypeEvent.symbol} value="+" checked> Earning
        </label>
        <label>
            <input type="radio" bind:group={prototypeEvent.symbol} value="-"> Spending
        </label>
        <CronEditor bind:cron={prototypeEvent.cron}/>
    </form>
    <div id="spacer"></div>
    <div id="event-list">
        <div id="event-list-header">
            <p><b>|| Events</b></p>
        </div>
        <div id="event-list-content">
            {#if (state.events.length == 0)}
                <p style="text-align: center;">No events.</p>
            {/if}
            {#each state.events as event, index}
                <div class="event-list-item">
                    <p class="event-list-item-header"><b>{event.title}</b></p>
                    <p class="event-list-item-content">({event.symbol}) {state.settings.currencySymbol} {event.amount} | <button on:click={(() => {loadEventIntoPrototype(index)})}>🖋</button><button on:click={(() => {removeEvent(index)})}>✘</button></p>
                </div>
            {/each}
        </div>
    </div>
</main>
<div class="event-button-container-container">
    <div class="event-button-container">
        <PayloadFairingButton callback={savePrototype}>Save Event</PayloadFairingButton>
    </div>
    <div class="event-button-container">
        <PayloadFairingButton callback={resetPrototype}>New Event</PayloadFairingButton>
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

    #event-list {
        flex: 45%;
        height: fit-content;
        background-color: var(--bg2);
    }

    #event-list-header {
        background-color: var(--bg0_h);
    }

    #event-list-header p {
        margin: 0;
        padding: 0.5em;
    }

    #event-list-content {
        overflow-y: scroll;
        max-height: 80vh;
    }

    .event-button-container-container {
        display: flex;
        justify-content: center;
    }

    .event-button-container {
        margin: 1em;
        display: flex;
        justify-content: center;
        flex: 50%;
    }

    .event-list-item {
        background-color: var(--bg2);
        padding: 0.4em;
    }

    .event-list-item:nth-child(even) {
        background-color: var(--bg3);
    }

    .event-list-item-header {
        color: var(--fg0);
        font-size: 1.2em;
        margin: 0;
        margin-bottom: 0.25em;
    }

    .event-list-item-content {
        font-size: 0.8em;
        margin: 0;
    }

    .event-list-item-content button {
        background-color: transparent;
    }

    textarea {
        resize: none;
    }
</style>
