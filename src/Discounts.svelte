<script context="module">
  export let isWholesaleCustomValue = true;
</script>

<script>
  import {
    getMonthNameByMonthNumber,
    formatNumber,
    formatDecimals,
    getNumberValue,
    getNumberFromString,
    formatEventValue,
    setAppState
  } from "./services/services.js";
  import { createEventDispatcher, onMount, beforeUpdate } from "svelte";
  import { fly, slide } from "svelte/transition";
  import {
    selectedAdditionalDiscount,
    wholeSeasonDiscounts,
    broadcasts,
    selectedTab,
    additionalDiscounts,
    seasonalDiscountMonth,
    selectedCalulatingParamsType,
    fullPriceWithoutExtraDiscounts,
    standartConditionDeviation,
    fullAmountWithDiscounts,
    discountsScale,
    sumByMonth,
    discountsEmitter,
    isWholesaleCustom,
    readMode,
    actionStore,
    grpByMonth
  } from "./store/programTableStore.js";
  import { calulatingTypes } from "./services/types";
  import Multiselect from "./Multiselect.svelte";
  import Icon from "fa-svelte";
  import { faPlus, faTimes, faCheck } from "@fortawesome/free-solid-svg-icons/";

  export let periods = [];
  export let discounts;
  export let broadcastData;
  export let highlightSeason;
  export let additionalDiscountsHighlight = false;

  let additionalDiscountsItems = [];
  let selectedAdditionalDiscountsItem;
  let selectedCustomDiscountItem = "";

  let selectedAdditionalCustomDiscounts = [];
  let customDiscountName = "";
  let customDiscountAmount = "";
  let customDiscountType = "";
  let sponsorOfftime = 0;
  let sponsorPrime = 0;
  let classicOfftime = 0;
  let classicPrime = 0;
  let offtimeDiff = 0;
  let primeDiff = 0;
  let fullSponsor = 0;
  let fullClassic = 0;
  let fullSponsorClassicDiff = 0;
  let grpTotal = 0;
  let grpPrimeTotal = 0;
  let grpPrimePercentTotal = 0;
  let showExtraRows = false;
  let defaultWholesale = 0;
  let wholesale = 0;

  const changeDiscount = () => {
    $discountsEmitter[$selectedTab] = discounts;
  };

  onMount(() => {
    isWholesaleCustomValue = !!discounts.customWholesale;
    $isWholesaleCustom = isWholesaleCustomValue;
  });

  beforeUpdate(() => {
    if (!discounts) {
      discounts = {
        agency: 0,
        additional: 0,
        custom: []
      };
    }
    if (!discounts.agency) {
      discounts.agency = 0;
    }

    if (!discounts.defaultAgency) {
      discounts.defaultAgency = 0;
    }

    prepareDiscountScale();
    // if (!discounts.wholesale && $discountsScale && $discountsScale[$selectedTab] && $discountsScale[$selectedTab].length) {
    //     discounts.wholesale = 0;
    //     isWholesaleCustom = false;
    //     changeWholesaleByScale();
    // }

    if (!isWholesaleCustomValue) {
      changeWholesaleByScale();
    }

    if (!discounts.additional) {
      discounts.additional = 0;
    }

    if (!discounts.defaultAdditional) {
      discounts.defaultAdditional = 0;
    }

    if ($broadcasts[$selectedTab] && $broadcasts[$selectedTab].broadcasts) {
      sponsorOfftime = $broadcasts[$selectedTab].broadcasts.reduce(
        (ac, broadcast) => {
          let amountWithDscounts = 0;
          if (broadcast.offtime) {
            amountWithDscounts = broadcast.amountWithDscounts;
          }
          return ac + Math.round(amountWithDscounts);
        },
        0
      );

      sponsorPrime = $broadcasts[$selectedTab].broadcasts.reduce(
        (ac, broadcast) => {
          let amountWithDscounts = 0;
          if (broadcast.prime) {
            amountWithDscounts = broadcast.amountWithDscounts;
          }
          return ac + Math.round(amountWithDscounts);
        },
        0
      );

      classicOfftime = $broadcasts[$selectedTab].broadcasts.reduce(
        (ac, broadcast) => {
          let classic = 0;
          if (broadcast.offtime) {
            classic = broadcast.detalization.reduce((ac, offer) => {
              //   return ac + offer.GRP20 * (offer.cppClient | offer.cppClassicPrice);
              return ac + offer.cppClassicPrice;
            }, 0);
          }
          return ac + Math.round(classic);
        },
        0
      );

      classicPrime = $broadcasts[$selectedTab].broadcasts.reduce(
        (ac, broadcast) => {
          let classic = 0;
          if (broadcast.prime) {
            classic = broadcast.detalization.reduce((ac, offer) => {
              //  return ac + offer.GRP20 * (offer.cppClient | offer.cppClassicPrice);
              return ac + offer.cppClassicPrice;
            }, 0);
          }
          return ac + Math.round(classic);
        },
        0
      );

      grpTotal = $grpByMonth.reduce((acc, val) => {
        return acc + +val.grp;
      }, 0);

      grpPrimeTotal = $grpByMonth.reduce((acc, val) => {
        return acc + +val.grpPrime;
      }, 0);

      grpPrimePercentTotal = (grpPrimeTotal / grpTotal) * 100;

      defaultWholesale =
        $broadcasts[$selectedTab].discounts.defaultWholesale ||
        $broadcasts[$selectedTab].discounts.wholesale;

      wholesale = $broadcasts[$selectedTab].discounts.wholesale;

      defaultWholesale =
        $broadcasts[$selectedTab].discounts.defaultWholesale ||
        $broadcasts[$selectedTab].discounts.wholesale;

      offtimeDiff =
        !sponsorOfftime || !classicOfftime
          ? 0
          : sponsorOfftime / classicOfftime;
      primeDiff =
        !sponsorPrime || !classicPrime ? 0 : sponsorPrime / classicPrime;
      fullSponsor = sponsorOfftime + sponsorPrime;
      fullClassic = classicOfftime + classicPrime;
      fullSponsorClassicDiff = formatDecimals(
        fullClassic !== 0 ? fullSponsor / fullClassic : 0
      );
      if (!broadcastData.offtimePrimeValues) {
        broadcastData["offtimePrimeValues"] = {
          fullSponsor: 0,
          fullClassic: 0,
          fullSponsorClassicDiff: 0,
          sponsorOfftime: 0,
          classicOfftime: 0,
          offtimeDiff: 0,
          sponsorPrime: 0,
          classicPrime: 0,
          primeDiff: 0
        };
      }
      broadcastData.offtimePrimeValues.fullSponsor = fullSponsor;
      broadcastData.offtimePrimeValues.fullClassic = fullClassic;
      broadcastData.offtimePrimeValues.fullSponsorClassicDiff = fullSponsorClassicDiff;
      broadcastData.offtimePrimeValues.sponsorOfftime = sponsorOfftime;
      broadcastData.offtimePrimeValues.classicOfftime = classicOfftime;
      broadcastData.offtimePrimeValues.offtimeDiff = offtimeDiff;
      broadcastData.offtimePrimeValues.sponsorPrime = sponsorPrime;
      broadcastData.offtimePrimeValues.classicPrime = classicPrime;
      broadcastData.offtimePrimeValues.primeDiff = primeDiff;
    }
  });

  fullAmountWithDiscounts.subscribe(a => {
    changeWholesaleByScale();
  });

  function prepareDiscountScale() {
    if (
      $discountsScale &&
      $discountsScale[$selectedTab] &&
      $discountsScale[$selectedTab].length
    ) {
      $discountsScale[$selectedTab] = $discountsScale[$selectedTab].filter(
        ds => ds.from && ds.to && ds.amount
      );
    }
  }

  function changeWholesaleByScale() {
    function calcWholesale(wholesaleType) {
      let previousWholesaleDiscount = 0;
      if (
        $broadcasts[$selectedTab] &&
        $broadcasts[$selectedTab] &&
        $broadcasts[$selectedTab].discounts &&
        $broadcasts[$selectedTab].discounts[wholesaleType]
      ) {
        previousWholesaleDiscount =
          $broadcasts[$selectedTab].discounts[wholesaleType];
      }

      let allBroadcastsAmountWODiscounts = 0;
      if (
        $broadcasts[$selectedTab] &&
        $broadcasts[$selectedTab] &&
        $broadcasts[$selectedTab].discounts
      ) {
        allBroadcastsAmountWODiscounts = $broadcasts[
          $selectedTab
        ].broadcasts.reduce((ac, m) => {
          return ac + Math.round(m.amountWODiscounts);
        }, 0);
      }

      if (
        $discountsScale[$selectedTab] &&
        $discountsScale[$selectedTab].length
      ) {
        if (
          allBroadcastsAmountWODiscounts < $discountsScale[$selectedTab][0].from
        ) {
          if (
            !$broadcasts[$selectedTab] ||
            $broadcasts[$selectedTab].discounts[wholesaleType] === 0
          ) {
            return;
          }
          $broadcasts[$selectedTab].discounts[wholesaleType] = 0;
          changeDiscount();
        }
        for (let i = 0; i < $discountsScale[$selectedTab].length; i++) {
          if (
            (i === 0 &&
              allBroadcastsAmountWODiscounts <
                $discountsScale[$selectedTab][i].from) ||
            (allBroadcastsAmountWODiscounts >=
              $discountsScale[$selectedTab][i].from &&
              allBroadcastsAmountWODiscounts <=
                $discountsScale[$selectedTab][i].to)
          ) {
            if (
              $broadcasts[$selectedTab] &&
              $broadcasts[$selectedTab] &&
              $broadcasts[$selectedTab].discounts
            ) {
              if (
                previousWholesaleDiscount !==
                $discountsScale[$selectedTab][i].amount
              ) {
                $broadcasts[$selectedTab].discounts[wholesaleType] =
                  $discountsScale[$selectedTab][i].amount;
                changeDiscount();
              }
            }
            break;
          }
        }
      }
    }
    calcWholesale("defaultWholesale");
    if (isWholesaleCustomValue) {
      return;
    }
    calcWholesale("wholesale");
  }

  function onSeasonDiscountChange(year, month, value) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    $wholeSeasonDiscounts[$selectedTab] = $wholeSeasonDiscounts[
      $selectedTab
    ].map(d => {
      if (d.month === month && d.year === year) {
        d.amount = getNumberFromString(value);
      } else {
        d.amount = formatDecimals(getNumberFromString(d.amount), true);
      }
      return d;
    });
    $discountsEmitter[$selectedTab] = discounts;
  }
  additionalDiscounts.subscribe(a => {
    if (a[$selectedTab]) {
      additionalDiscountsItems = a[$selectedTab].data.map(d => {
        d.name =
          d.description +
          " (" +
          (d.percentageAmount ? d.percentageAmount + "%" : d.absoluteAmount) +
          ")";
        d.value = d.taskid;
        return d;
      });
    }
  });

  function onAdditionalCustomDiscountChange(data) {
    // console.log('onAdditionalCustomDiscountChange' + data);
  }
  function onDiscountFocus(input) {
    input.select();
  }
  function addCustomDiscount() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    let selectedItem = $additionalDiscounts[$selectedTab].data.find(
      a => a.value === selectedAdditionalDiscountsItem
    );
    if (selectedAdditionalDiscountsItem) {
      selectedItem = $additionalDiscounts[$selectedTab].data.find(
        a => a.value === selectedAdditionalDiscountsItem
      );
    } else {
      selectedItem = {};
    }

    selectedItem.amount = getNumberFromString(customDiscountAmount) || 0;
    if (customDiscountType == "percentage") {
      selectedItem.percentageAmount = getNumberFromString(customDiscountAmount);
      selectedItem.absoluteAmount = null;
    }
    if (customDiscountType == "absolute") {
      selectedItem.percentageAmount = null;
      selectedItem.absoluteAmount = getNumberFromString(customDiscountAmount);
    }
    selectedItem.description = customDiscountName;
    selectedItem.applyOrder = selectedItem.applyOrder || 1;
    if (customDiscountName && customDiscountAmount) {
      $selectedAdditionalDiscount[$selectedTab].push(selectedItem);
    }
    $selectedAdditionalDiscount = $selectedAdditionalDiscount;
    customDiscountAmount = "";
    customDiscountName = "";
    customDiscountType = "";
    selectedAdditionalDiscountsItem = "";
    changeDiscount();
  }
  function removeDiscount(index) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    $selectedAdditionalDiscount[$selectedTab].splice(index, 1);
    $selectedAdditionalDiscount[$selectedTab] =
      $selectedAdditionalDiscount[$selectedTab];
    selectedCustomDiscountItem = "";
    changeDiscount();
  }

  function openMonthDiscountCalculation(month, year) {
    $seasonalDiscountMonth = month + "_" + year;
    $selectedCalulatingParamsType = calulatingTypes.seasonalDiscount;
  }
  function onChangeAgencyDiscount(e) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    discounts.agency = getNumberFromString(e.target.value);
  }
  function onChangeWholesaleDiscount(e) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    const newValue = getNumberFromString(e.target.value);
    isWholesaleCustomValue = true;
    $isWholesaleCustom = isWholesaleCustomValue;
    if (!newValue && newValue !== 0) {
      isWholesaleCustomValue = false;
      $isWholesaleCustom = isWholesaleCustomValue;
    }
    discounts.customWholesale = +isWholesaleCustomValue;
    discounts.wholesale = getNumberFromString(e.target.value);
    // e.target.value = formatDecimals(discounts.wholesale);
  }
  function onChangeAdditionalDiscount(e) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    discounts.additional = getNumberFromString(e.target.value);
    // e.target.value = formatDecimals(discounts.additional, true);
  }
  function changeAdditionalDiscountsItems() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    const selectedItem = $additionalDiscounts[$selectedTab].data.find(
      a => a.value === selectedAdditionalDiscountsItem
    );

    if (selectedItem) {
      customDiscountAmount = selectedItem.absoluteAmount
        ? selectedItem.absoluteAmount
        : selectedItem.percentageAmount;
      customDiscountName = selectedItem.description;
      customDiscountType = "";
    } else {
      customDiscountAmount = "";
      customDiscountName = "";
      customDiscountType = "";
    }
  }
  function changeCustomDiscountItem(item, index) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    if ($readMode) {
      return;
    }
    if (item.percentageAmount) {
      customDiscountType = 'percentage';
    }
    if (item.absoluteAmount) {
      customDiscountType = 'absolute';
    }
    customDiscountName = item.description;
    customDiscountAmount = formatDecimals(item.amount, true);
    selectedCustomDiscountItem = index;
  }

  function completeChangeCustomDiscount() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    $selectedAdditionalDiscount[$selectedTab][
      selectedCustomDiscountItem
    ].amount = getNumberFromString(customDiscountAmount) || 0;

    if (
      $selectedAdditionalDiscount[$selectedTab][selectedCustomDiscountItem]
        .percentageAmount != null
    ) {
      $selectedAdditionalDiscount[$selectedTab][
        selectedCustomDiscountItem
      ].percentageAmount = customDiscountAmount;
    }

    if (
      $selectedAdditionalDiscount[$selectedTab][selectedCustomDiscountItem]
        .absoluteAmount != null
    ) {
      $selectedAdditionalDiscount[$selectedTab][
        selectedCustomDiscountItem
      ].absoluteAmount = customDiscountAmount;
    }
    
    if (customDiscountType == 'absolute') {
      $selectedAdditionalDiscount[$selectedTab][selectedCustomDiscountItem].absoluteAmount = 
      $selectedAdditionalDiscount[$selectedTab][selectedCustomDiscountItem].amount;
      $selectedAdditionalDiscount[$selectedTab][selectedCustomDiscountItem].percentageAmount = null;
    } else {
      $selectedAdditionalDiscount[$selectedTab][selectedCustomDiscountItem].percentageAmount = 
      $selectedAdditionalDiscount[$selectedTab][selectedCustomDiscountItem].amount;
      $selectedAdditionalDiscount[$selectedTab][selectedCustomDiscountItem].absoluteAmount = null;
    }

    $selectedAdditionalDiscount[$selectedTab][
      selectedCustomDiscountItem
    ].description = customDiscountName;
    customDiscountAmount = "";
    customDiscountName = "";
    customDiscountType = "";
    selectedCustomDiscountItem = "";
    changeDiscount();
  }
</script>

<style>
  table {
    font-size: 12px;
    max-width: 100%;
    border-collapse: collapse;
  }

  table thead td:first-child {
    /*width: 60px;*/
  }
  table thead td {
    color: #999;
    font-size: 10px;
    padding: 5px;
  }

  table td {
    text-align: center;
    border: solid 1px #f1f1f1;
  }
  table tbody td {
    height: 20px;
  }
  table td {
    text-align: center;
    border: solid 1px #f1f1f1;
  }
  table td input {
    width: 100%;
    padding: 0;
    border: solid 1px transparent;
    text-align: center;
    margin: 0;
    box-sizing: border-box;
  }
  .global-discounts {
    margin: 10px 0 20px 0;
    display: flex;
    align-items: center;
  }
  .discounts {
    margin-bottom: 10px;
  }
  input,
  select {
    height: 23px;
    font-size: 12px;
    padding: 0 0 0 5px;
    max-width: 110px;
    margin: 0;
  }
  table td input {
    height: 18px;
  }
  .global-discounts__item {
    position: relative;
    align-items: center;
    margin-right: 10px;
    font-size: 12px;
    min-height: 30px;
    display: flex;
  }
  .hint {
    position: absolute;
    top: 25px;
    left: 1px;
    color: #8e8e8e;
    font-size: 11px;
  }
  .hint.multiselect {
    top: 60px;
  }
  select {
    padding: 0;
    min-width: 227px;
  }
  .changed {
    background: #fffb8c;
  }
  .not-default {
    border-bottom: 2px #ee3b3b solid !important;
  }
  .highlight {
    border: 2px solid #65d04f !important;
  }
  .add-custom-discount-icon,
  .change-custom-discount-icon {
    cursor: pointer;
  }
  .remove-discount {
    cursor: pointer;
  }
  .custom-discount-item {
    cursor: pointer;
    align-items: center;
    display: flex;
    justify-content: space-between;
    white-space: nowrap;
    overflow: hidden;
    background: #f1f1f1;
    max-width: 90px;
    border-radius: 4px;
    padding: 0 5px;
    margin-right: 2px;
    margin-bottom: 2px;
    text-overflow: ellipsis;
  }
  .custom-discount-item-label {
    width: 130px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .total-info {
    display: flex;
    padding-bottom: 10px;
    border-bottom: solid 1px #f1f1f1;
    margin-bottom: 10px;
    font-size: 12px;
  }
  .total-info div {
    margin-right: 10px;
  }
  .total-label {
    margin-right: 10px;
    font-weight: bold;
  }
  .discounts-block {
    display: flex;
  }
  .discounts-block h4 {
    margin: 10px 0;
    font-size: 14px;
  }
  .custom-discounts {
    display: flex;
  }
  .month-sum-item {
    width: 110px;
  }
  .month-sum tr td {
    border-top: none;
  }
  .selected-custom-discount {
    background: #65d04f;
  }
  .name-column {
    display: inline-block;
    width: 140px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  input:disabled {
    color: #000;
  }
  .discounts-top {
    display: flex;
    justify-content: space-between;
    position: relative;
  }
  .first-col {
    width: 100px;
  }
  .offtime-prime-table {
    width: 325px;
    margin-left: 20px;
  }

  .margin-top {
    margin-top: 10px;
  }
  .show-extra-rows {
    cursor: pointer;
    position: absolute;
    left: -20px;
    top: 36px;
  }

  .default-wholesale {
    font-size: 12px;
    margin-left: 20px;
    margin-top: 10px;
  }
</style>

<div class="discounts">
  <div class="discounts-body">
    <div class="discounts-top">
      {#if showExtraRows}
        <span
          class="show-extra-rows"
          on:click={e => {
            showExtraRows = false;
          }}>
          [-]
        </span>
      {/if}
      {#if !showExtraRows}
        <span
          class="show-extra-rows"
          on:click={e => {
            showExtraRows = true;
          }}>
          [+]
        </span>
      {/if}
      <div class="discounts-sum">
        <table>
          <thead>
            <tr>
              <td />
              {#each periods as period}
                <td
                  on:click={e => {
                    openMonthDiscountCalculation(period.month, period.year);
                  }}>
                  {getMonthNameByMonthNumber(period.month)} {period.year}
                </td>
              {/each}
            </tr>
          </thead>
          <tbody>
            <tr class="row-total-quant">
              <td>
                <span class="name-column">Сезонная скидка/наценка</span>
              </td>
              {#if $wholeSeasonDiscounts[$selectedTab] && $wholeSeasonDiscounts[$selectedTab].length}
                {#each $wholeSeasonDiscounts[$selectedTab] as discount}
                  <td>
                    <input
                      disabled={$readMode}
                      class:highlight={highlightSeason && +highlightSeason.year === +discount.year && +highlightSeason.month === +discount.month}
                      class:not-default={discount.amount !== discount.defaultAmount}
                      type="text"
                      on:focus={e => {
                        onDiscountFocus(e.target);
                        highlightSeason = {};
                      }}
                      on:change={e => {
                        onSeasonDiscountChange(discount.year, discount.month, e.target.value);
                      }}
                      placeholder="0%"
                      value={discount.amount}
                      on:blur={event => {
                        formatEventValue(event, discount.amount);
                      }} />
                  </td>
                {/each}
              {/if}
            </tr>
          </tbody>
        </table>
        <div class="month-sum">
          <table>
            <tbody>
              <tr>
                <td>
                  <span class="name-column">Сумма</span>
                </td>
                {#if $sumByMonth}
                  {#each $sumByMonth as period}
                    <td class="month-sum-item">{formatNumber(period.sum)}</td>
                  {/each}
                {/if}
              </tr>
            </tbody>
          </table>
        </div>
        {#if showExtraRows}
          <div class="month-sum">
            <table>
              <tbody>
                <tr>
                  <td>
                    <span class="name-column">GRP</span>
                  </td>
                  {#if $grpByMonth}
                    {#each $grpByMonth as period}
                      <td class="month-sum-item">
                        {formatDecimals(period.grp)}
                      </td>
                    {/each}
                  {/if}
                </tr>
              </tbody>
            </table>
          </div>
          <div class="month-sum">
            <table>
              <tbody>
                <tr>
                  <td>
                    <span class="name-column">GRP Прайм</span>
                  </td>
                  {#if $grpByMonth}
                    {#each $grpByMonth as period}
                      <td class="month-sum-item">
                        {formatDecimals(period.grpPrime)}
                      </td>
                    {/each}
                  {/if}
                </tr>
              </tbody>
            </table>
          </div>
          <div class="month-sum">
            <table>
              <tbody>
                <tr>
                  <td>
                    <span class="name-column">GRP Прайм, %</span>
                  </td>
                  {#if $grpByMonth}
                    {#each $grpByMonth as period}
                      <td class="month-sum-item">
                        {formatDecimals(period.grpPrimePercent * 100)}
                      </td>
                    {/each}
                  {/if}
                </tr>
              </tbody>
            </table>
          </div>
        {/if}
      </div>
      <div class="discounts-info">
        <table class="offtime-prime-table">
          <thead>
            <tr>
              <td />
              <td>Спонсорство</td>
              <td>Классика</td>
              <td>Разница</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td />
              <td>{formatNumber(fullSponsor)}</td>
              <td>{formatNumber(fullClassic)}</td>
              <td>{fullSponsorClassicDiff}</td>
            </tr>
            <tr class="row-total-quant">
              <td class="first-col">Оффтайм</td>
              <td>{formatNumber(sponsorOfftime)}</td>
              <td>{formatNumber(classicOfftime)}</td>
              <td>{formatDecimals(offtimeDiff)}</td>
            </tr>
            <tr class="row-total-quant">
              <td class="first-col">Прайм</td>
              <td>{formatNumber(sponsorPrime)}</td>
              <td>{formatNumber(classicPrime)}</td>
              <td>{formatDecimals(primeDiff)}</td>
            </tr>
          </tbody>
        </table>
        {#if showExtraRows}
          <table class="offtime-prime-table margin-top">
            <tbody>
              <tr class="row-total-quant">
                <td class="first-col">GRP</td>
                <td>{formatDecimals(grpTotal, true)}</td>
              </tr>
              <tr class="row-total-quant">
                <td class="first-col">GRP Прайм</td>
                <td>{formatDecimals(grpPrimeTotal, true)}</td>
              </tr>
              <tr class="row-total-quant">
                <td class="first-col">GRP Прайм, %</td>
                <td>{formatDecimals(grpPrimePercentTotal)}</td>
              </tr>
            </tbody>
          </table>
        {/if}
        {#if wholesale != defaultWholesale}
          <div class="default-wholesale">
            <b>Объемная скидка по умолчанию:</b>
            {formatDecimals(defaultWholesale)}%
          </div>
        {/if}
      </div>
    </div>
    <div class="discounts-block">
      <div>
        <h4>Скидки:</h4>
        <div class="global-discounts">
          <div class="global-discounts__item">
            <input
              disabled={$readMode}
              placeholder="Агентская"
              on:focus={e => {
                onDiscountFocus(e.target);
              }}
              value={discounts.agency}
              type="text"
              class:not-default={discounts.agency != discounts.defaultAgency}
              on:change={e => {
                onChangeAgencyDiscount(e);
                changeDiscount();
              }}
              on:blur={event => formatEventValue(event, discounts.agency)} />
            <span class="hint">Агентская</span>
          </div>
          <div class="global-discounts__item">
            <input
              disabled={$readMode}
              placeholder="Объемная"
              type="text"
              on:focus={e => {
                onDiscountFocus(e.target);
              }}
              value={formatDecimals(discounts.wholesale)}
              class:not-default={discounts.customWholesale}
              on:blur={event => {
                formatEventValue(event, discounts.wholesale);
              }}
              on:change={e => {
                onChangeWholesaleDiscount(e);
                changeDiscount();
              }} />
            <span class="hint">Объемная</span>
          </div>
          <div class="global-discounts__item">
            <input
              disabled={$readMode}
              placeholder="Доп. скидка/наценка"
              on:focus={e => {
                onDiscountFocus(e.target);
                additionalDiscountsHighlight = false;
              }}
              class:highlight={additionalDiscountsHighlight}
              value={discounts.additional}
              class:not-default={discounts.additional != discounts.defaultAdditional}
              on:blur={event => formatEventValue(event, discounts.additional)}
              on:change={e => {
                onChangeAdditionalDiscount(e);
                changeDiscount();
              }}
              type="text" />
            <span class="hint">Доп. скидка/наценка</span>
          </div>
          {#if !$readMode}
            <div class="global-discounts__item">
              {#if $additionalDiscounts && $additionalDiscounts[$selectedTab] && $additionalDiscounts[$selectedTab]}
                <select
                  bind:value={selectedAdditionalDiscountsItem}
                  name="additional-discounts"
                  on:change={changeAdditionalDiscountsItems}>
                  <option value="">Выберите скидку</option>
                  {#each $additionalDiscounts[$selectedTab].data as discount}
                    <option value={discount.value}>{discount.name}</option>
                  {/each}
                </select>
              {/if}
            </div>
          {/if}
        </div>
      </div>
      <div>
        <h4>Доп. скидки:</h4>
        <div class="global-discounts">
          {#if !$readMode}
            <div class="global-discounts__item">
              <input
                placeholder="описание скидки"
                bind:value={customDiscountName}
                type="text" />
            </div>
            <div class="global-discounts__item">
              <input
                placeholder="скидка"
                bind:value={customDiscountAmount}
                type="text" />
            </div>
            <div class="global-discounts__item">
              <select
                bind:value={customDiscountType}
                disabled={
                Number.isInteger(selectedAdditionalDiscountsItem) || 
                (
                  $selectedAdditionalDiscount[$selectedTab] ? $selectedAdditionalDiscount[$selectedTab][selectedCustomDiscountItem] &&
                  $selectedAdditionalDiscount[$selectedTab][selectedCustomDiscountItem].taskid : false
                )
                }
                name="custom-discount-type">
                <option value="">выберите тип скидки</option>
                <option value="percentage">процентная</option>
                <option value="absolute">абсолютная</option>
              </select>
            </div>
            <div class="global-discounts__item">
              {#if (!Number.isInteger(selectedCustomDiscountItem) && (customDiscountType == 'absolute' || customDiscountType == 'percentage')) || (Number.isInteger(selectedAdditionalDiscountsItem) && customDiscountType == '')}
                <span
                  class="add-custom-discount-icon"
                  on:click={addCustomDiscount}>
                  <Icon icon={faPlus} />
                </span>
              {/if}
              {#if Number.isInteger(selectedCustomDiscountItem)}
                <span
                  class="change-custom-discount-icon"
                  on:click={completeChangeCustomDiscount}>
                  <Icon icon={faCheck} />
                </span>
              {/if}
            </div>
          {/if}
          <div class="custom-discounts">
            {#if $selectedAdditionalDiscount && $selectedAdditionalDiscount[$selectedTab]}
              {#each $selectedAdditionalDiscount[$selectedTab] as discount, index}
                <div
                  class="custom-discount-item"
                  class:selected-custom-discount={index === selectedCustomDiscountItem}>
                  <div
                    on:click={e => {
                      changeCustomDiscountItem(discount, index);
                    }}
                    class="custom-discount-item-label"
                    title={(discount.percentageAmount ? formatDecimals(discount.amount) + '%' : formatDecimals(discount.amount)) + ' - ' + discount.description}>
                    {(discount.percentageAmount ? formatDecimals(discount.amount) + '%' : formatDecimals(discount.amount)) + ' - ' + discount.description}
                  </div>
                  {#if !$readMode}
                    <div
                      on:click={e => {
                        removeDiscount(index);
                      }}
                      class="remove-discount">
                      <Icon icon={faTimes} />
                    </div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div class="total-info">
      <div class="total-label">ИТОГИ:</div>
      <div>
        <b>Сумма без доп. скидок:</b>
        &nbsp;&nbsp;{formatNumber($fullPriceWithoutExtraDiscounts[$selectedTab])}
      </div>
      <div>
        <b>Общая стоимость:</b>
        &nbsp;&nbsp;{formatNumber($fullAmountWithDiscounts[$selectedTab])}
      </div>
      <div>
        <b>Отклонение от стандартных условий:</b>
        &nbsp;&nbsp;{$standartConditionDeviation[$selectedTab] || 0}%
      </div>
    </div>
  </div>
</div>
