<script>
	import { SidePanel } from "@hereticsibyl/svelte-dlxyz-base-dev";
	import { readTextFile, writeFile } from "@tauri-apps/api/fs";
	import { invoke, dialog, process } from "@tauri-apps/api";
	import { onMount } from "svelte/internal";
	import Statistics from "./Statistics.svelte";
	import Transactions from "./Transactions.svelte";
	import Events from "./Events.svelte";

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
	const currencySymbols = ["¤", "$", "£", "¥", "€"];
	let stateFile;
	let checksumFile;
	let selected;

	let state = {
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

	async function save() {
		writeFile({contents: JSON.stringify(state), path: stateFile});
		writeFile({contents: await invoke("get_checksum"), path: checksumFile});
	}

	$: state && save(); // save state if state changes.

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
	});
</script>

<main>
	<div id="side-panel">
		<SidePanel selections={selections} bind:selected={selected} panelHeightFactor=1 tipNoThings="-> //"/>
	</div>
	<div id="working-container">
		<div id="working">
			<p class="deco-page-star" style="margin-top: 3em;">≺✧≻</p>
			{#if selected == "stats"}
				<Statistics bind:state={state}/>
			{:else if selected == "transacts"}
				<Transactions/>
			{:else if selected == "events"}
				<Events/>
			{:else}
				<p style="text-align: center;">Nothing selected.</p>
			{/if}
			<p class="deco-page-star" style="margin-bottom: 3em;">≺✧≻</p>
		</div>
	</div>
</main>

<style>
	main {
		display: flex;
	}

	#side-panel {
		flex: 30%;
	}

	#working-container {
		flex: 70%;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow-y: hidden;
	}

	#working {
		border: 0.1em solid var(--fg1);
        padding-left: 5%;
        padding-right: 5%;
		max-height: 80vh;
	}

	#working .deco-page-star {
		text-align: center;
	}
</style>
