<script>
	import { SidePanel } from "@hereticsibyl/svelte-dlxyz-base-dev";
	import { readTextFile, writeFile } from "@tauri-apps/api/fs";
	import { invoke, dialog, process } from "@tauri-apps/api";
	import { onMount } from "svelte/internal";
	import Statistics from "./Statistics.svelte";
	import Transactions from "./Transactions.svelte";
	import Events from "./Events.svelte";
	import Settings from "./Settings.svelte";

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
			lowest: 0
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
				cron: "* * * * * *"
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
	let calciumWorker;

	async function save() {
		if (!ready) {
			return;
		}
		writeFile({contents: JSON.stringify(state), path: stateFile});
		writeFile({contents: await invoke("get_checksum"), path: checksumFile});
	}

	onMount(async() => {
		stateFile = await invoke("get_state_path");
		checksumFile = await invoke("get_checksum_path");
		try {
			if (await readTextFile(checksumFile) != await invoke("get_checksum")) {
				if (!await dialog.ask("Futureproof detected the MD5 checksum of disk data to be invalid. Continue anyways?", "Futureproof: Checksum Warning")) {
					await dialog.message("Futureproof will now close.\nPlease repair \"$HOME/.futureproof/state.json\" before starting Futureproof again.");
					process.exit(0);
				}
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
		calciumWorker = new Worker("./calcium.js");
		calciumWorker.postMessage({events: state.events, stats: {balance: state.stats.balance}});
		calciumWorker.onmessage = (data) => {
			state.stats.history.balance.push(...data.history);
			state.stats.future = data.future;
			state.stats.future.unshift(state.stats.history.balance.slice(-1));
			if (data.lowest !== NaN) {
				state.stats.lowest = data.lowest;
			}
			calciumWorker.postMessage({clearHistory: true});
		}
	});

	$: state && save(); // save state if state changes.

	$: state.stats.balance && state.stats.history.balance.push({x: Date.now(), y: state.stats.balance}); // if balance changes, save to history.

	$: state.events && state.stats.balance && calciumWorker.postMessage({events: state.events, stats: {balance: state.stats.balance}}); // if balance or events changes, give them to calcium and recompute.
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
