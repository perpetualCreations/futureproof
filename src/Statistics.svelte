<script>
	import { onMount } from "svelte/internal";
	import Chart from "chart.js/auto";
	import "chartjs-adapter-luxon";

	export let state = {
		stats: {
			balance: 0,
			history: {
				balance: [],
			},
            future: [],
			lowest: 0
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

	let graph;

	onMount(() => {
		let grapher = new Chart(graph, {
			type: "line",
			data: {
				datasets: [
					{
						label: "Balance (past-now)",
						borderColor: ["rgba(213, 196, 161, 1)"],
						backgroundColor: ["rgba(189, 174, 147, 1)"],
						data: state.stats.history.balance
					},
					{
						label: "Balance (now-future)",
						borderColor: ["rgba(250, 189, 47, 1)"],
						backgroundColor: ["rgba(215, 153, 33, 1)"],
						data: state.stats.future
					}
				]
			},
			options: {
				responsive: true,
				scales: {
					x: {
						type: "time",
						time: {}
					},
					y: {
						type: "linear",
						beginAtZero: true
					}
				}
			}
		});
	})
</script>

<canvas bind:this={graph}></canvas>
<main class="section">
	<div id="stats-value-panel">
		<p>Balance: {state.settings.currencySymbol + String(state.stats.balance)}</p>
		<p>You can spend up to {state.settings.currencySymbol}0 without going into debt.</p>
	</div>
	<div id="stats-countdown-panel">
		<h2>00:00:00</h2>
		<!-- the big countdown timer goes out here -->
	</div>
</main>

<style>
	main {
		display: flex;
	}

	#stats-value-panel {
		flex: 40%;
		justify-self: first;
	}

	#stats-countdown-panel {
		flex: 50%;
		justify-self: last;
		display: flex;
		justify-content: center;
	}

	@keyframes redBlinking {
		0% {
			color: var(--red1);
		}
		50% {
			color: var(--red0);
		}
		100% {
			color: var(--red1);
		}
	}

	#stats-countdown-panel h2 {
		color: var(--red0);
		animation: redBlinking 1s infinite;
	}

	canvas {
		width: 100%;
	}
</style>
