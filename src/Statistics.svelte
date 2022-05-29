<script>
    export let state = {
		stats: {
			balance: 0,
			history: {
				balance: [],
				spare: [],
                events: []javascript calculate time until date
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
