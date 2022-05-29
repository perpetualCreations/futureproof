<script>
    export let state = {
		stats: {
			balance: 0,
			history: {
				balance: [],
				spare: [],
                events: []
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
</main>
