<script>
	import { SidePanel } from "@hereticsibyl/svelte-dlxyz-base-dev";
	import { readTextFile, writeFile } from "@tauri-apps/api/fs";
	import { invoke, dialog, process } from "@tauri-apps/api";
	import { onMount } from "svelte/internal";
	import Statistics from "./Statistics.svelte";
	import Transactions from "./Transactions.svelte";
	import Events from "./Events.svelte";
	import Settings from "./Settings.svelte";
	import parser from "cron-parser";
	import {DateTime, Duration} from "luxon";

	const selections = [
		{
			id: "stats",
			label: "[0] Statistics"
		},
		{
			id: "transacts",
			label: "[1] Transactions"
		},
		{
			id: "events",
			label: "[2] Events"
		},
		{
			id: "settings",
			label: "[3] Settings"
		}
	];
	var stateFile;
	var checksumFile;
	let ready = false;
	let selected;

	let state = {
		stats: {
			balance: 0,
			history: {
				balance: [],
			},
            future: [],
			lowest: -1
		},
		transacts: [
			/*
			{
				title: "Alcoholism",
				description: "I had to feed my alcoholism. Sorry.",
				amount: 20,
				symbol: "-"
			}
			*/
		],
		events: [
			/*
			{
				title: "Payday",
				description: "I get paid every minute, don't ask. The boss is weird.",
				amount: 10,
				symbol: "+",
				cron: "* * * * *"
			}
			*/
		],
		settings: {
			currencySymbol: "¤",
		},
		meta: {
			firstBoot: -1
		}
	};
	let clockState = {
		workingBalance: NaN,
		farthest: 0
	};
	let clockWorker;

	async function save() {
		if (!ready) {
			return;
		}
		writeFile({contents: JSON.stringify(state), path: stateFile});
		writeFile({contents: await invoke("get_checksum"), path: checksumFile});
	}

	function getArrayOfFuture(expression, callback) {
		let worker = new Worker("./unwrapfuture.js");
		worker.onmessage = (message) => {
			callback(message.data);
		}
		worker.postMessage(expression);
	}

	onMount(async() => {
		stateFile = await invoke("get_state_path");
		checksumFile = await invoke("get_checksum_path");
		try {
			if (await readTextFile(checksumFile) != await invoke("get_checksum")) {
				// disabled because of false alarms. need to repair after the hackathon.
				// otherwise, checksums are complete.
				// if (!await dialog.ask("Futureproof may have detected the MD5 checksum of disk data to be invalid. Continue anyways?", "Futureproof: Checksum Warning")) {
				// 	await dialog.message("Futureproof will now close.\nPlease repair \"$HOME/.futureproof/state.json\" before starting Futureproof again.");
				// 	process.exit(0);
				// }
			}
			state = await JSON.parse(await readTextFile(stateFile));
		} catch {
			await save().catch(() => {
				dialog.message("Futureproof was unable to save information to disk." +
				"\nPlease check file system and consider application data to be volatile until saved.", "Futureproof: Failed to Save");
			});
		}
		Object.freeze(stateFile);
		Object.freeze(checksumFile);
		ready = true;
		Object.freeze(ready);
		if (state.meta.firstBoot == -1) {
			state.meta.firstBoot = Date.now();
			state.stats.history.balance.push({x: state.meta.firstBoot, y: state.stats.balance});
		}
		clockWorker = new Worker("./clock.js");
		clockWorker.onmessage = (_) => {
			if (clockState.workingBalance == NaN) {
				clockState.workingBalance = state.stats.balance;
			}
			state.stats.future.forEach((data) => {
				if (data.x <= Date.now()) {
					state.stats.history.balance.push(data);
				}
			});
			state.stats.history.balance.forEach((data) => {
				if (state.stats.future.indexOf(data) !== -1) {
					state.stats.future.splice(state.stats.future.indexOf(data), 1);
				}
			});
			if (Date.now() > clockState.farthest) { // compute new futures only if farthest is in the past.
				let prototypeFuture = {};
				// we don't clear vars like we're doing recomputation.
				state.events.forEach((event) => {
					getArrayOfFuture(parser.parseExpression(event.cron, { // parse cron for event.
						// this time we do this slightly differently, 1 minute window from 1 year from now.
						currentDate: new Date(DateTime.fromMillis(clockState.farthest)),
						endDate: new Date(DateTime.now().plus(Duration.fromObject({years: 1}))),
						iterator: true
					}), (data) => {
						data.forEach((date) => { // iterate over each future time. array convert inefficient.
							// we push everything to prototypeFuture so we can sort and apply each change sequentially, logging as we go.
							prototypeFuture[(DateTime.fromJSDate(date).toUnixInteger() * 1000)] = {
								amount: event.amount,
								symbol: event.symbol
							};
						});
					});
				});
				Object.keys(prototypeFuture).sort((a, b) => {return a - b;}).forEach((unixTimeAsKey) => {
					clockState.workingBalance = ((prototypeFuture[unixTimeAsKey].symbol == "+") ? (clockState.workingBalance + prototypeFuture[unixTimeAsKey].amount) : (clockState.workingBalance - prototypeFuture[unixTimeAsKey].amount));
					if (state.stats.lowest === NaN || state.stats.lowest > clockState.workingBalance) {
						state.stats.lowest = clockState.workingBalance;
					}
					if (clockState.farthest == -1 || clockState.farthest < unixTimeAsKey) {
						clockState.farthest = unixTimeAsKey;
					}
					state.stats.future = [...state.stats.future, {
						x: unixTimeAsKey,
						y: clockState.workingBalance
					}];
				});
			}
		}
	});

	$: state && save(); // save state if state changes.

	$: state.stats.balance && state.stats.history.balance.push({x: Date.now(), y: state.stats.balance}); // if balance changes, save to history.

	$: state.events && state.stats.balance && (() => { // rerun computation completely if events or balance change.
		console.log("invocation for future generation.")
		state.stats.future = []; // if yes clear and recompute of future.
        state.stats.lowest = -1;
        clockState.farthest = 0;
        let prototypeFuture = {};
        clockState.workingBalance = state.stats.balance;
		state.events.forEach((event) => {
			getArrayOfFuture(parser.parseExpression(event.cron, { // parse cron for event.
				currentDate: new Date(DateTime.now().toISO()),
				endDate: new Date(DateTime.now().plus(Duration.fromObject({years: 1}))),
				iterator: true
			}), (data) => {
				data.forEach((date) => { // iterate over each future time. array convert inefficient.
					// we push everything to prototypeFuture so we can sort and apply each change sequentially, logging as we go.
					prototypeFuture[(DateTime.fromJSDate(date).toUnixInteger() * 1000)] = {
						amount: event.amount,
						symbol: event.symbol
					};
				});
			})
		});
        Object.keys(prototypeFuture).sort((a, b) => {return a - b;}).forEach((unixTimeAsKey) => {
            clockState.workingBalance = ((prototypeFuture[unixTimeAsKey].symbol == "+") ? (clockState.workingBalance + prototypeFuture[unixTimeAsKey].amount) : (clockState.workingBalance - prototypeFuture[unixTimeAsKey].amount));
            if (state.stats.lowest === NaN || state.stats.lowest > clockState.workingBalance) {
                state.stats.lowest = clockState.workingBalance;
            }
            if (clockState.farthest == -1 || clockState.farthest < unixTimeAsKey) {
                farthest = unixTimeAsKey;
            }
			state.stats.future = [...state.stats.future, {
				x: unixTimeAsKey,
				y: clockState.workingBalance
			}];
        });
	})();
</script>

<main>
	<div id="side-panel">
		<SidePanel selections={selections} bind:selected={selected} panelHeightFactor=1 tipNoThings="-> //"/>
	</div>
	<div id="gap"></div>
	<div id="working-container">
		<p class="deco-page-star" style="border-top: none;">≺✧≻</p>
		<div id="working">
			{#if selected == "stats"}
				<Statistics bind:state={state}/>
			{:else if selected == "transacts"}
				<Transactions bind:state={state}/>
			{:else if selected == "events"}
				<Events bind:state={state}/>
			{:else if selected == "settings"}
				<Settings bind:settings={state.settings}/>
			{:else}
				<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
					<p style="text-align: center;">Nothing selected.</p>
				</div>
			{/if}
		</div>
		<p class="deco-page-star" style="border-bottom: none;">≺✧≻</p>
	</div>
</main>

<style>
	main {
		display: flex;
	}

	#side-panel {
		flex: 30%;
	}

	#gap {
		flex: 1%;
		width: 100%;
	}

	#working-container {
		flex: 69%;
		overflow-y: hidden;
		height: 100vh;
	}

	#working {
		height: auto;
	}

	.deco-page-star {
		text-align: center;
		border: 0.1em solid var(--fg1);
		border-left: none;
		border-right: none;
	}
</style>
