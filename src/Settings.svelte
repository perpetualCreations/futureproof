<script>
    export let settings = {
        currencySymbol: "¤"
    };
</script>

<h2>Settings</h2>
<div class="section">
    <h3>Currency Symbol</h3>
    <p>Change the displayed currency symbol. <i>Please note that no actual conversion is done when changing currency symbols.</i></p>
    <label>
        <input type="radio" bind:group={settings.currencySymbol} value="¤"> ¤
    </label>
    <label>
        <input type="radio" bind:group={settings.currencySymbol} value="$"> $
    </label>
    <label>
        <input type="radio" bind:group={settings.currencySymbol} value="£"> £
    </label>
    <label>
        <input type="radio" bind:group={settings.currencySymbol} value="€"> €
    </label>
    <label>
        <input type="radio" bind:group={settings.currencySymbol} value="¥"> ¥
    </label>
</div>
