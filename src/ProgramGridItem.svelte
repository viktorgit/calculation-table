<script context="module">
  let initialWholeSale = [];
</script>

<script>
  import Icon from "fa-svelte";
  import {
    faCalendar,
    faClock,
    faRubleSign,
    faChartLine,
    faChevronUp,
    faChevronDown,
    faTimes,
    faArrowUp,
    faArrowDown,
    faHistory
  } from "@fortawesome/free-solid-svg-icons/";
  import {
    getSponsorNames,
    getAdditionalDiscounts,
    getMonthNameByMonthNumber,
    changeAllowedOffersAmount,
    formatNumber,
    getNumberValue,
    formatDecimals,
    asyncRemoveBroadcast,
    getDefaultProgramData,
    getNumberFromString,
    formatEventValue,
    setAppState
  } from "./services/services.js";
  import { fly, slide } from "svelte/transition";
  import {
    beforeUpdate,
    createEventDispatcher,
    afterUpdate,
    onMount
  } from "svelte";
  import {
    additionalDiscounts,
    selectedAdditionalDiscount,
    wholeSeasonDiscounts,
    broadcasts,
    selectedTab,
    fullAmountWithDiscounts,
    actionStore,
    changeCoeff,
    discountsEmitter,
    readMode,
    selectedSponsor
  } from "./store/programTableStore.js";
  import Multiselect from "./Multiselect.svelte";
  import { stop_propagation } from "svelte/internal";

  export let broadcast;
  export let periods = [];
  export let isAdmin = false;
  export let defaultAdditionalDiscounts;
  export let discounts;

  let broadcastAdditionalDiscounts = [];
  broadcastAdditionalDiscounts = broadcastAdditionalDiscounts.map(d => {
    d.name =
      d.name +
      " (" +
      (d.percentageAmount ? d.percentageAmount + "%" : d.absoluteAmount) +
      ")";
    return d;
  });

  let sponsors = [];
  let isExpand = true;
  let showExtraRows = false;
  let isSeasonDiscountExist =
    broadcast.seasonalDiscounts && broadcast.seasonalDiscounts.length
      ? true
      : false;
  initialWholeSale[$selectedTab] = 0;

  const dispatch = createEventDispatcher();

  if (broadcast.additional) {
    broadcast.additional = broadcast.additional.map(d => {
      d.name =
        d.description +
        " (" +
        (d.percentageAmount ? d.percentageAmount + "%" : d.absoluteAmount) +
        ")";
      d.value = d.taskid;
      return d;
    });
  }

  discountsEmitter.subscribe(d => {
    calculateAmount();
  });

  // function calculateGRP() {
  //     broadcast.GRP = +broadcast.TVR / 20 * +broadcast.defaultquantity * +broadcast.timing * +broadcast.overallquantity;
  // }

  onMount(() => {
    calculateAmount();
    if (!broadcast.standartDeviationOptions) {
      getSponsorNames(broadcast.programId).then(r => {
        sponsors = r;
        getDefaultProgramData(
          broadcast.programTaskId,
          broadcast.sponsoroffer.id
        ).then(r => {
          broadcast.standartDeviationOptions = r;
          if (Number.isInteger(+broadcast.useSeasonalDiscount)) {
            broadcast.standartDeviationOptions.useSeasonalDiscount =
              broadcast.useSeasonalDiscount;
          }
          dispatch("getDefaultProgramData");
        });
      });
    }
  });

  beforeUpdate(() => {
    if (!broadcast.standartDeviationOptions) {
      broadcast.standartDeviationOptions = {};
      getSponsorNamesAndDefaultProgramData();
    }
  });

  fullAmountWithDiscounts.subscribe(a => {
    if (initialWholeSale[$selectedTab]) {
      if (
        $broadcasts[$selectedTab] &&
        $broadcasts[$selectedTab].discounts &&
        $broadcasts[$selectedTab].discounts.wholesale
      ) {
        if (
          initialWholeSale[$selectedTab] !==
          $broadcasts[$selectedTab].discounts.wholesale
        ) {
          initialWholeSale[$selectedTab] =
            $broadcasts[$selectedTab].discounts.wholesale;
          calculateAmount();
        }
      }
    }
  });

  getSponsorNamesAndDefaultProgramData();

  getAdditionalDiscounts(broadcast.sponsoroffer.id, true, $selectedTab).then(
    result => {
      broadcastAdditionalDiscounts = result.data.map(d => {
        d.name =
          d.description +
          " (" +
          (d.percentageAmount ? d.percentageAmount + "%" : d.absoluteAmount) +
          ")";
        d.value = d.taskid;
        return d;
      });
    }
  );

  function toggleExpand() {
    isExpand = !isExpand;
  }

  function getSponsorNamesAndDefaultProgramData() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    getSponsorNames(broadcast.programId).then(r => {
      sponsors = r;
      getDefaultProgramData(
        broadcast.programTaskId,
        broadcast.sponsoroffer.id
      ).then(r => {
        broadcast.standartDeviationOptions = r;
        if (Number.isInteger(+broadcast.useSeasonalDiscount)) {
          broadcast.standartDeviationOptions.useSeasonalDiscount =
            broadcast.useSeasonalDiscount;
        }
        dispatch("getDefaultProgramData");
      });
    });
  }

  function onExtraSeasonalDiscountChange(e, offer) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    const newSeasonalDiscount = getNumberFromString(e.target.value);
    broadcast.detalization = broadcast.detalization.map(d => {
      if (d.month === offer.month && d.year === offer.year) {
        d.additionalDiscount = newSeasonalDiscount;
      }
      return d;
    });
    $discountsEmitter[$selectedTab] = discounts;
  }

  function selectBroadcast() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    broadcast["isSelectedBroadcast"] = !broadcast["isSelectedBroadcast"];
    broadcasts.update(b => b);
  }

  function onTVR18Change(e, offer) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    const newTVR18 = getNumberFromString(e.target.value);
    broadcast.detalization = broadcast.detalization.map(d => {
      if (d.month === offer.month && d.year === offer.year) {
        d.TVR18 = newTVR18;
      }
      return d;
    });
    $discountsEmitter[$selectedTab] = discounts;
  }

  function changeOffer(e, offer) {
    const newOffer = getNumberFromString(e.target.value);
    broadcast.detalization = broadcast.detalization.map(d => {
      if (d.month === offer.month && d.year === offer.year) {
        d.offer = newOffer;
      }
      return d;
    });
    $discountsEmitter[$selectedTab] = discounts;
  }

  function onCppClassicChange(e, offer) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    const newCppClassic = getNumberFromString(e.target.value);
    broadcast.detalization = broadcast.detalization.map(d => {
      if (d.month === offer.month && d.year === offer.year) {
        d.cppClassic = newCppClassic;
      }
      return d;
    });
    $discountsEmitter[$selectedTab] = discounts;
  }

  function onCppClientChange(e, offer) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    const newCppClient = getNumberFromString(e.target.value);
    broadcast.detalization = broadcast.detalization.map(d => {
      if (d.month === offer.month && d.year === offer.year) {
        d.cppClient = newCppClient;
      }
      return d;
    });
    $discountsEmitter[$selectedTab] = discounts;
  }

  function getAdditionalDiscount() {
    return 1 + discounts.additional / 100;
  }

  function calculateAmount() {
    dispatch("afterCalculationAmounts");
  }

  function onSponsorChange() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    const sponsor = (sponsors || []).find(
      s => s.taskid === broadcast.sponsoroffer.id
    );
    broadcast.sponsoroffer = {
      id: sponsor.taskid,
      descr: sponsor.description
    };
    getAdditionalDiscounts(broadcast.sponsoroffer.id, true, $selectedTab).then(
      result => {
        broadcastAdditionalDiscounts = result.data.map(d => {
          d.name =
            d.description +
            " (" +
            (d.percentageAmount ? d.percentageAmount + "%" : d.absoluteAmount) +
            ")";
          d.value = d.taskid;
          return d;
        });
      }
    );
    getDefaultProgramData(
      broadcast.programTaskId,
      broadcast.sponsoroffer.id
    ).then(r => {
      broadcast.standartDeviationOptions = r;
      if (r.coeff) {
        broadcast.defaultcoeff = r.coeff;
      }
      if (r.fee && r.notrecommended) {
        alert(
          "Внимание, требуется гонорар!\nДанный бренд не рекомендуется к размещению в данной программе"
        );
      } else {
        if (r.fee) {
          alert("Внимание, требуется гонорар");
        }
        if (r.notrecommended) {
          alert(
            "Данный бренд не рекомендуется к размещению в данной программе"
          );
        }
      }
    });
  }

  function onInputFocus(input) {
    input.select();
  }

  function onDefaultQuantityChange(e) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    broadcast.defaultquantity = Math.trunc(getNumberValue(e.target.value));
    const newQuantity = broadcast.defaultquantity;
    e.target.value = newQuantity;
    broadcast.detalization.map(d => {
      d.defaultquantity = getNumberValue(newQuantity);
      d.quantity = getNumberValue(newQuantity);
      return d;
    });
    calculateAmount();
  }

  function onDefaultQuantityKeyup(e) {
    if (e.code === "Enter") {
      onDefaultQuantityChange(e);
      return false;
    }
  }

  function onQuantityChange() {
    calculateAmount();
  }

  function removeBroadcast() {
    broadcasts.update(broadcasts => {
      broadcasts[$selectedTab].broadcasts.forEach(b => {
        if (b.currentIndex === broadcast.currentIndex) {
          if (b.id) {
            asyncRemoveBroadcast(b.id).then(r => {
              console.log("broadcast removed");
            });
          }
        }
      });
      broadcasts[$selectedTab].broadcasts = broadcasts[
        $selectedTab
      ].broadcasts.filter(b => b.currentIndex !== broadcast.currentIndex);
      $discountsEmitter[$selectedTab] = discounts;
      broadcasts[$selectedTab].broadcasts = broadcasts[$selectedTab].broadcasts.map((b,i) => {
          b.currentIndex = i;
          return b;
        });
        return broadcasts;
      });
  }
  function changeTvr(e) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    broadcast.TVR = getNumberFromString(e.target.value);
    // broadcast.customTVR = getNumberFromString(e.target.value);
    $discountsEmitter[$selectedTab] = discounts;
  }
  function changeBroadcastPrice(e) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    broadcast.price = getNumberFromString(e.target.value);
    // e.target.value = formatDecimals(broadcast.price, true);
    $discountsEmitter[$selectedTab] = discounts;
  }
  function onChangeTiming(e) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    broadcast.timing = getNumberFromString(e.target.value);
    $discountsEmitter[$selectedTab] = discounts;
  }
  function onChangeDefaultCoeff(e) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    broadcast.defaultcoeff = getNumberFromString(e.target.value);
    calculateAmount();
  }
  function sortUp() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    if (broadcast.currentIndex === 0) {
      return;
    }
    let prevBroadcast =
      $broadcasts[$selectedTab].broadcasts[broadcast.currentIndex - 1];
    const currentBroadcast = Object.assign(broadcast);
    $broadcasts[$selectedTab].broadcasts[
      currentBroadcast.currentIndex
    ] = prevBroadcast;
    $broadcasts[$selectedTab].broadcasts[
      prevBroadcast.currentIndex
    ] = currentBroadcast;
    $broadcasts = $broadcasts;
    sortItems();
  }
  function sortDown() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    const count = $broadcasts[$selectedTab].broadcasts.length - 1;
    if (broadcast.currentIndex === count) {
      return;
    }
    let nextBroadcast =
      $broadcasts[$selectedTab].broadcasts[broadcast.currentIndex + 1];
    const currentBroadcast = Object.assign(broadcast);
    $broadcasts[$selectedTab].broadcasts[
      currentBroadcast.currentIndex
    ] = nextBroadcast;
    $broadcasts[$selectedTab].broadcasts[
      nextBroadcast.currentIndex
    ] = currentBroadcast;
    $broadcasts = $broadcasts;
    sortItems();
  }
  function isBlockedPeriod(offer) {
    const period = periods.find(
      p => p.year === offer.year && p.month === offer.month
    );
    if (period) {
      return period.isBlocked;
    } else {
      return false;
    }
  }
  function sortItems() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    $broadcasts[$selectedTab].broadcasts = $broadcasts[
      $selectedTab
    ].broadcasts.map((b, i) => {
      b.currentIndex = i;
      return b;
    });
  }
  function unblockPeriod(period) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    if (isAdmin) {
      periods = periods.map(p => {
        if (period.month === p.month && period.year === p.year) {
          p.isBlocked = false;
        }
        return p;
      });
      $broadcasts[$selectedTab].broadcasts = $broadcasts[
        $selectedTab
      ].broadcasts.map(b => {
        return b;
      });
    }
  }
  changeCoeff.subscribe(c => {
    calculateAmount();
  });
</script>

<style>
  table {
    max-width: 100%;
    border-collapse: collapse;
  }
  table thead td:first-child {
    width: 160px;
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
    height: 23px;
    font-size: 12px;
    box-sizing: border-box;
  }
  table tbody tr td:first-child {
    text-align: right;
    padding-right: 10px;
  }
  table td {
    text-align: center;
    border: solid 1px #f1f1f1;
  }
  table td {
    color: #909090;
  }
  table td input {
    width: 100%;
    padding: 0px !important;
    border: solid 1px transparent;
    text-align: center;
    margin: 0;
    box-sizing: border-box;
    color: #000;
  }
  .vg-prog-header {
    display: flex;
    flex-wrap: wrap;
    background: #f1f1f1;
    justify-content: space-between;
    padding: 5px 10px;
  }
  .vg-prog-header.selected {
    background: #d9dbe0;
  }
  .vg-prog-descr {
    font-size: 14px;
    line-height: 26px;
  }
  .vg-prog-header > div {
    margin-right: 5px;
    white-space: nowrap;
  }
  .vg-prog-option {
    height: 28px;
    line-height: 28px;
    padding-left: 5px;
    color: #444;
    font-size: 12px;
    overflow: hidden;
    z-index: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .vg-prog-option-control {
    display: inline-block;
  }

  .vg-prog-option input {
    width: 35px;
  }
  .vg-prog-option input.s2 {
    width: 90px;
  }

  .vg-prog-option input.broadcast-price-input {
    width: 80px;
  }
  .vg-prog-option.vg-prog-option-coeff input {
    width: 67px;
  }

  .vg-prog-option select,
  .vg-prog-option input {
    padding: 0;
    background: #f1f1f1;
    color: #444;
    border: solid 1px transparent;
  }
  .vg-prog-option:focus-within input,
  .vg-prog-option:focus-within select {
    border: dotted 1px #dedede;
    background: #fff;
    border-radius: 4px;
    color: #000;
  }
  .vg-prog-months table {
    font-size: 12px;
    width: 100%;
    border-collapse: collapse;
  }
  .vg-prog-months table thead td:first-child {
    width: 150px;
  }
  .vg-prog-months table thead td {
    color: #999;
  }
  .vg-prog-months table td {
    text-align: center;
    border: solid 1px #f1f1f1;
  }
  .vg-prog-months thead td {
    font-size: 10px;
    padding: 5px;
  }
  .vg-prog-months table td input {
    width: 100%;
    padding: 5px;
    border: solid 1px transparent;
    text-align: center;
  }
  .vg-prog-months table td input::placeholder {
    color: #ccc;
  }
  .vg-prog-months table td:focus-within input {
    border: solid 1px #888;
  }
  select {
    height: 23px;
    font-size: 12px;
    padding: 0 0 0 5px;
  }
  :global(.icon) {
    cursor: pointer;
    position: relative;
    top: 1px;
    font-size: 12px;
  }
  .stat {
    display: flex;
    justify-content: space-between;
    padding: 5px 10px;
    background: #f5f5f5;
    border-top: solid 1px #fff;
    font-size: 11px;
  }
  .stat div {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  td input.error {
    border-color: red;
  }
  .sponsor {
    max-width: 220px;
    margin: 0;
    margin-left: 10px;
  }
  .additional-discount-select {
    margin: 0 0 0 5px;
  }
  .changed {
    background: #fffb8c;
  }
  .closeWrapper {
    margin-left: 10px;
  }
  .highlight {
    border: 2px solid #65d04f !important;
  }
  .coeff-label {
    cursor: pointer;
  }
  .vg-prog-header__first-row,
  .vg-prog-header__second-row {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }
  .sponsor-info,
  .main-info {
    display: flex;
    align-items: center;
  }
  .broadcast-name {
    font-weight: bold;
  }
  .select-broadcast {
    position: relative;
    margin: 0 10px 0 0;
    top: 2px;
  }
  .expandWrapper {
    margin-right: 5px;
  }
  .not-default {
    border-bottom: 2px #ee3b3b solid !important;
  }
  select:disabled {
    color: #000;
  }
  .show-extra-rows {
    cursor: pointer;
    position: absolute;
    left: -20px;
    bottom: 60px;
  }
  .sort-buttons {
    cursor: pointer;
    position: absolute;
    left: -20px;
    top: 10px;
  }
  .grid-item {
    position: relative;
  }
</style>

<div class="grid-item" transition:fly={{ y: 200, duration: 500 }}>
  <div class="sort-buttons">
    <div class="sort-up" on:click={sortUp}>
      <Icon class="icon" icon={faArrowUp} />
    </div>
    <div class="sort-down" on:click={sortDown}>
      <Icon class="icon" icon={faArrowDown} />
    </div>
  </div>
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
  <div class="grid-header">
    <div class="vg-prog-header" class:selected={broadcast.isSelectedBroadcast}>
      <div class="vg-prog-descr vg-prog-header__first-row">
        <div class="main-info">
          <span class="expandWrapper" on:click={toggleExpand}>
            {#if isExpand}
              <Icon class="icon expand" icon={faChevronUp} />
            {:else}
              <Icon class="icon expand" icon={faChevronDown} />
            {/if}
          </span>
          {#if !$readMode}
            <input
              class="select-broadcast"
              type="checkbox"
              checked={broadcast.isSelectedBroadcast}
              on:change={selectBroadcast} />
          {/if}
          <div class="broadcast-name">
            {broadcast.name} &mdash; {broadcast.defaultPeriodicity}: {broadcast.defaultTime}
          </div>
          <div title={broadcast.sponsoroffer.descr}>
            <div>
              <select
                disabled={$readMode}
                on:change={onSponsorChange}
                bind:value={broadcast.sponsoroffer.id}
                placeholder="Спонсорское обозначение"
                name="sponsor"
                class="sponsor">
                {#each sponsors as sponsor}
                  <option value={sponsor.taskid}>{sponsor.description}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
        <div class="sponsor-info">
          <div class="additional-discount-select">
            <Multiselect
              bind:selectedItems={broadcast.additional}
              placeholder="Доп. скидка программы"
              items={broadcastAdditionalDiscounts} />
          </div>
          {#if !$readMode}
            <span class="closeWrapper">
              <span on:click={removeBroadcast}>
                <Icon
                  on:click={removeBroadcast}
                  class="icon close"
                  icon={faTimes} />
              </span>
            </span>
          {/if}
        </div>
      </div>
      <div class="vg-prog-header__second-row">
        <div class="vg-prog-option vg-prog-date">
          <Icon class="icon" icon={faCalendar} />
          <!--<span contenteditable="true" class:changed="{broadcast.periodicity != broadcast.defaultPeriodicity}">{broadcast.periodicity}</span>-->
          <input
            disabled={$readMode}
            class:changed={broadcast.periodicity != broadcast.defaultPeriodicity}
            type="text"
            bind:value={broadcast.periodicity} />
        </div>
        <div class="vg-prog-option vg-prog-time">
          <span>Время эфира</span>
          <div class="vg-prog-option-control">
            <input
              disabled={$readMode}
              class="s2"
              on:focus={e => {
                onInputFocus(e.target);
              }}
              class:changed={broadcast.time != broadcast.defaultTime}
              type="text"
              bind:value={broadcast.time} />
          </div>
        </div>
        <div
          class="vg-prog-option vg-prog-option-keepTiming"
          title="Хр-ж опции, сек">
          <span>Хр-ж</span>
          <div class="vg-prog-option-control">
            <input
              disabled={$readMode}
              on:change={e => {
                onChangeTiming(e);
              }}
              on:focus={e => {
                onInputFocus(e.target);
              }}
              class="recalc-control"
              type="text"
              on:blur={event => formatEventValue(event, broadcast.timing)}
              value={broadcast.timing} />
          </div>
        </div>
        <div
          class="vg-prog-option vg-prog-option-quantPerIssue"
          title="Кол-во в одном выпуске">
          Кол-во
          <div class="vg-prog-option-control">
            <input
              disabled={$readMode}
              on:focus={e => {
                onInputFocus(e.target);
              }}
              on:change={e => onDefaultQuantityChange(e)}
              class="recalc-control"
              type="text"
              on:blur={event => formatEventValue(event, broadcast.defaultquantity)}
              value={broadcast.defaultquantity} />
          </div>
        </div>
        <div class="vg-prog-option vg-prog-option-coeff" title="Коэффицент">
          <span class="coeff-label">Коэф</span>
          <div class="vg-prog-option-control">
            <input
              disabled={$readMode}
              class:highlight={broadcast.highlight}
              on:focus={e => {
                onInputFocus(e.target);
                broadcast.highlight = false;
              }}
              class="recalc-control"
              class:not-default={broadcast.defaultcoeff != broadcast.defaultDefaultCoeff}
              on:change={e => {
                onChangeDefaultCoeff(e);
              }}
              value={formatDecimals(broadcast.defaultcoeff, true)}
              type="text" />
          </div>
        </div>
        <div class="vg-prog-option vg-prog-tvr" title="TVR">
          <Icon class="icon" icon={faChartLine} />
          TVR
          <input
            disabled={$readMode}
            on:focus={e => {
              onInputFocus(e.target);
            }}
            bind:value={broadcast.TVRlabel} />
          <input
            disabled={$readMode}
            on:change={e => {
              changeTvr(e);
            }}
            on:focus={e => {
              onInputFocus(e.target);
            }}
            value={formatDecimals(broadcast.TVR)}
            class="tvr-data"
            class:not-default={broadcast.customTVR && broadcast.TVR !== broadcast.customTVR} />
        </div>
        <div
          class="vg-prog-option vg-prog-option-costPerMinute"
          title="Цена минуты рубли (с НДС)">
          <Icon class="icon" icon={faRubleSign} />
          <div class="vg-prog-option-control">
            <input
              disabled={$readMode}
              class:not-default={broadcast.price !== broadcast.defaultPrice}
              on:change={e => {
                changeBroadcastPrice(e);
              }}
              on:blur={event => formatEventValue(event, broadcast.price)}
              value={broadcast.price}
              class="broadcast-price-input" />
            <span class="text">руб / мин</span>
          </div>
        </div>
      </div>
    </div>
    <div class="stat">
      <div title="Выбрано/Всего">
        Программ:
        <span class="totalProgRequestQuantity">
          {formatNumber(broadcast.overallquantity || 0)}
        </span>
        /
        <span class="totalProgQuantity">{broadcast.allquantity || 0}</span>
      </div>
      <div>
        ВСЕГО без скидок:
        <span class="totalProgCostWODiscount">
          {formatNumber(broadcast.amountWODiscounts || 0)}
        </span>
        руб.
      </div>
      <div>
        ИТОГО со скидками:
        <span class="totalProgCost">
          {formatNumber(broadcast.amountWithDscounts || 0)}
        </span>
        руб.
      </div>
      <div>
        Общий хр-ж:
        <span class="totalProgKT">
          {formatNumber(broadcast.overalltiming || 0)}
        </span>
        сек
      </div>
      <div>
        GRP:
        <span class="totalProgGRP">{formatDecimals(broadcast.GRP || 0)}</span>
      </div>
      <div>
        Разница с КР итоговой суммы:
        <span class="totalProgCPP">
          {formatDecimals(broadcast.CPPdeviation)}
        </span>
      </div>
      <div>
        Ср. ст-ть выпуска:
        <span class="avgProgIssueCost">
          {formatNumber(broadcast.averagePrice || 0)}
        </span>
        руб.
      </div>
    </div>
  </div>
  <div>
    <table>
      <thead>
        <tr>
          <td />
          {#each periods as period}
            <td>
              {getMonthNameByMonthNumber(period.month)} {period.year}
              {#if isAdmin && isBlockedPeriod(period) && !$readMode}
                <span
                  on:click={e => {
                    e.stopPropagation();
                    unblockPeriod(period);
                  }}>
                  <Icon class="icon" icon={faHistory} />
                </span>
              {/if}
            </td>
          {/each}
        </tr>
      </thead>
      <tbody>
        <tr class="row-request">
          <td>Кол-во передач (заказ)</td>
          {#each broadcast.detalization as offer}
            <td>
              <input
                disabled={$readMode || isBlockedPeriod(offer)}
                on:focus={e => {
                  onInputFocus(e.target);
                }}
                type="text"
                on:change={event => {
                  setAppState(actionStore, $broadcasts, $wholeSeasonDiscounts, $selectedAdditionalDiscount, $selectedTab);
                  changeOffer(event, offer);
                  changeAllowedOffersAmount(broadcasts, $selectedTab);
                  calculateAmount();
                }}
                class:error={!offer.isAllowedOffersAmount}
                placeholder="0"
                value={offer.offer} />
            </td>
          {/each}
        </tr>
        {#if isExpand}
          <tr class="row-total-quant">
            <td>Кол-во передач (доступно)</td>
            {#each broadcast.detalization as detalization}
              <td>{detalization.broadcasts}</td>
            {/each}
          </tr>
          <tr>
            <td>Кол-во в одном выпуске</td>
            {#each broadcast.detalization as offer}
              <td>{offer.quantity}</td>
              <!-- <td><input on:focus="{ e => {onInputFocus(e.target)} }" on.keyup="{onQuantityChange}" type="text" placeholder="0" bind:value="{offer.quantity}"></td> -->
            {/each}
          </tr>
          <tr class="row-cost">
            <td>Стоимость, руб</td>
            {#each broadcast.detalization as offer}
              <td>{formatNumber(offer.amount)}</td>
            {/each}
          </tr>
          <tr>
            <td>Доп. сезонная скидка</td>
            {#each broadcast.detalization as offer}
              <td
                on:click={e => {
                  offer.highlight = false;
                }}>
                <input
                  disabled={$readMode || isBlockedPeriod(offer)}
                  on:change={event => {
                    onExtraSeasonalDiscountChange(event, offer);
                  }}
                  value={formatNumber(offer.additionalDiscount)}
                  placeholder="0"
                  class:not-default={offer.additionalDiscount != 0}
                  on:blur={event => formatEventValue(event, offer.additionalDiscount)} />
              </td>
            {/each}
          </tr>
          {#if showExtraRows}
            <tr>
              <td>TVR 18+</td>
              {#each broadcast.detalization as offer}
                <td>
                  <input
                    disabled={$readMode || isBlockedPeriod(offer)}
                    on:focus={e => {
                      onInputFocus(e.target);
                    }}
                    on:change={event => {
                      onTVR18Change(event, offer);
                    }}
                    value={offer.TVR18}
                    placeholder="0"
                    class:not-default={offer.TVR18 != offer.defaultTVR18}
                    on:blur={event => formatEventValue(event, offer.TVR18)} />
                </td>
                <!-- <td>{ formatDecimals(offer.TVR18) }</td> -->
              {/each}
            </tr>
            <tr>
              <td>GRP 20</td>
              {#each broadcast.detalization as offer}
                <td>{formatDecimals(offer.GRP20)}</td>
              {/each}
            </tr>
            <tr>
              <td>CPP КР</td>
              {#each broadcast.detalization as offer}
                <td>
                  <input
                    disabled={$readMode || isBlockedPeriod(offer)}
                    on:focus={e => {
                      onInputFocus(e.target);
                    }}
                    on:change={event => {
                      onCppClassicChange(event, offer);
                    }}
                    value={formatNumber(offer.cppClassic)}
                    placeholder="0"
                    class:not-default={offer.cppClassic != offer.defaultCppClassic}
                    on:blur={event => formatEventValue(event, offer.cppClassic)} />
                </td>
                <!-- <td>{ formatNumber(offer.cppClassic) }</td> -->
              {/each}
            </tr>
            <tr>
              <td>CPP Клиента</td>
              {#each broadcast.detalization as offer}
                <td>
                  <input
                    disabled={$readMode || isBlockedPeriod(offer)}
                    on:focus={e => {
                      onInputFocus(e.target);
                    }}
                    on:change={event => {
                      onCppClientChange(event, offer);
                    }}
                    value={formatNumber(offer.cppClient)}
                    placeholder="0"
                    class:not-default={offer.cppClient != offer.defaultCppClient}
                    on:blur={event => formatEventValue(event, offer.cppClient)} />
                </td>

                <!-- <td>{formatNumber(offer.cppClient)}</td> -->
              {/each}
            </tr>
            <tr>
              <td>Стоимость в КР по CPP</td>
              {#each broadcast.detalization as offer}
                <td>{formatNumber(offer.cppClassicPrice, true)}</td>
              {/each}
            </tr>
            <tr>
              <td>Разница с КР</td>
              {#each broadcast.detalization as offer}
                <td>{formatDecimals(offer.cppClassicDiff)}</td>
              {/each}
            </tr>
          {/if}
        {/if}
      </tbody>
    </table>
  </div>
</div>
