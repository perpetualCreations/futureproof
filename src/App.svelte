<script>
	import { SidePanel } from "@hereticsibyl/svelte-dlxyz-base-dev";
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
	let selected;
</script>

<main>
	<div id="side-panel">
		<SidePanel selections={selections} bind:selected={selected} panelHeightFactor=1/>
	</div>
	<div id="space"></div>
	<div id="editor">

	</div>
</main>

<style>
	main {
		display: flex;
	}

	#side-panel {
		flex: 30%;
	}

	#space {
		flex: 10%;
	}

	#editor {
		flex: 60%;
	}
</style>
