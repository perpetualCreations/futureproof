<script>
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
</script>

<main>
    <p>Balance: {state.settings.currencySymbol + String(state.stats.balance)}</p>
    <p>Currently earning {state.settings.currencySymbol + String(state.stats.positive)} per minute.</p>
    <p>Currently spending {state.settings.currencySymbol + String(state.stats.negative)} per minute.</p>
    <p>Net change of {state.settings.currencySymbol + String(state.stats.positive - state.stats.negative)} per minute.</p>
</main>
