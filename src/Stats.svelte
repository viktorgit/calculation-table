<script>
    import { broadcasts, selectedTab } from './store/programTableStore.js';
    import { formatNumber } from './services/services.js';
    import { slide } from 'svelte/transition';

    let selectedBroadcasts = [];
    if ($broadcasts && $broadcasts[$selectedTab]) {
        $broadcasts[$selectedTab].broadcasts.filter(b => Boolean(b.isSelectedBroadcast));
    }
    let allquantity = 0;
    let overallquantity = 0;
    let amountWODiscounts = 0;
    let amountWithDscounts = 0;
    let timing = 0;

    broadcasts.subscribe(r => {
        if ($broadcasts && $broadcasts[$selectedTab]) {
            $broadcasts[$selectedTab].broadcasts.filter(b => Boolean(b.isSelectedBroadcast));
        } else  {
            return r;
        }
        selectedBroadcasts = $broadcasts[$selectedTab].broadcasts.filter(b => Boolean(b.isSelectedBroadcast));
        allquantity = 0;
        overallquantity = 0;
        amountWODiscounts = 0;
        timing = 0;
        amountWithDscounts = 0;
        selectedBroadcasts.forEach(b => {
            allquantity += b.allquantity;
            overallquantity += b.overallquantity;
            amountWODiscounts += b.amountWODiscounts;
            amountWithDscounts += b.amountWithDscounts;
            timing += +b.overalltiming;
        });
    })
</script>

<style>
.stats {
    margin: 10px 0;
    font-size: 12px;
    padding: 10px;
    border: solid 1px #f1f1f1;
    display: flex;
    justify-content: space-between;
    flex-basis: 150px;
}
</style>

{#if selectedBroadcasts.length }
    <div class="stats" in:slide="{{ y: 400, duration: 400 }}" out:slide="{{ y: 200, duration: 200 }}">
        <div title="Выбрано/Всего">
            <b>Программ:</b>&nbsp;<span class="totalProgRequestQuantity">{formatNumber(overallquantity || 0)}</span>/<span class="totalProgQuantity">{allquantity || 0}</span>
        </div>
        <div><b>ВСЕГО без скидок:</b> <span class="totalProgCostWODiscount">{formatNumber(amountWODiscounts || 0)}</span> руб.</div>
        <div><b>ИТОГО со скидками:</b> <span class="totalProgCost">{formatNumber(amountWithDscounts || 0)}</span> руб.</div>
        <div><b>Общий хронометраж:</b> <span class="totalProgKT">{formatNumber(timing || 0)}</span> сек</div>
    </div>
{/if}