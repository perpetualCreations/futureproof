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
    <form>
        <input type="text" placeholder="Title..." size=25>
        <textarea cols="25" rows="10" placeholder="Description..."></textarea>
    </form>
    <div id="spacer"></div>
    <table>
        <tbody>
            {#each state.transacts as transaction}
                <tr>
                    <h2>transaction.title</h2>
                    <p>{state.settings.currencySymbol} transaction.amount</p>
                </tr>
            {/each}
        </tbody>
    </table>
</main>

<style>
    main {
        display: flex;
    }

    form {
        flex: 45%
    }

    #spacer {
        flex: 10%;
    }

    table {
        flex: 45%;
    }

    tr {
        overflow-x: hidden;
    }

    textarea {
        resize: none;
    }
</style>
