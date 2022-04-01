<script>
  import {
    tvChannels,
    broadcasts,
    selectedTab,
    isDataSaving,
    readMode,
    isTableUnlocked,
    actionStore,
    wholeSeasonDiscounts,
    selectedAdditionalDiscount
  } from "./store/programTableStore.js";
  import { createEventDispatcher, afterUpdate } from "svelte";
  import { removeEsmi, getKpVersions, setAppState } from "./services/services";
  import Icon from "fa-svelte";
  import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons/";

  export let programsForCurrentTask = [];
  export let isAdmin = false;
  let selectedBroadcasts = [];
  let selectTabOnInit = false;
  let kpVersions = [];

  afterUpdate(() => {
    if (!selectTabOnInit) {
      if (programsForCurrentTask.length) {
        selectedTab.set(programsForCurrentTask[0].id);
        selectTab(programsForCurrentTask[0].id);
        selectTabOnInit = true;
      }
    }
  });

  const dispatch = createEventDispatcher();
  const changeTab = () => dispatch("changeTab");

  let selectedChannel = "";

  broadcasts.subscribe(b => {
    if ($broadcasts[$selectedTab] && $broadcasts[$selectedTab].broadcasts) {
      let lastIndex = $broadcasts[$selectedTab].broadcasts.length;
      selectedBroadcasts = $broadcasts[$selectedTab].broadcasts
        .filter(b => Boolean(b.isSelectedBroadcast))
        .map(b => {
          return {
            TVR: b.TVR,
            TVRlabel: b.TVRlabel,
            CPP: b.CPP,
            defaultPrice: b.defaultPrice,
            days: "Пн-Пт",
            time: b.time,
            coeff: b.defaultcoeff,
            multiple5: "1",
            timinginfo: "5 или 10",
            defaulttiming: "5",
            defaultquantity: b.defaultquantity,
            fee: false,
            notrecommended: false,
            broadcasttaskid: b.programTaskId,
            sponsoroffer: b.sponsoroffer,
            defaultTime: b.defaultTime,
            CPPClient: b.CPPClient,
            periodicity: b.periodicity,
            defaultPeriodicity: b.defaultPeriodicity,
            name: b.name,
            programId: b.programId,
            programTaskId: b.programTaskId,
            defaultcoeff: b.defaultcoeff,
            defaultDefaultCoeff: b.defaultDefaultCoeff || b.defaultcoeff,
            timing: b.timing,
            price: b.price,
            detalization: b.detalization.map(detail => {
              return {
                GRP20: detail.GRP20,
                TVR18: detail.TVR18,
                additionalDiscount: detail.additionalDiscount,
                amount: detail.amount,
                amountWithDiscount: detail.amountWithDiscount,
                amountWithoutAdditionalDiscount:
                  detail.amountWithoutAdditionalDiscount,
                amountWithoutCoeff: detail.amountWithoutCoeff,
                amountWithoutDiscounts: detail.amountWithoutDiscounts,
                amountWithoutSeasonalDiscount:
                  detail.amountWithoutSeasonalDiscount,
                broadcasts: detail.broadcasts,
                cppClassic: detail.cppClassic,
                cppClassicDiff: detail.cppClassicDiff,
                cppClassicPrice: detail.cppClassicPrice,
                cppClient: detail.cppClient,
                defaultquantity: detail.defaultquantity,
                isAllowedOffersAmount: detail.isAllowedOffersAmount,
                month: detail.month,
                offer: detail.offer,
                quantity: detail.quantity,
                year: detail.year
              };
            }),
            additional: b.additional,
            additionalDiscount: b.additionalDiscount,
            currentIndex: lastIndex++,
            standartDeviationOptions: b.standartDeviationOptions,
            useSeasonalDiscount: b.useSeasonalDiscount,
            GRP: b.GRP,
            amountWithDscounts: b.amountWithDscounts,
            amountWithoutCoeff: b.amountWithoutCoeff,
            overallquantity: b.overallquantity,
            allquantity: b.allquantity,
            amountWODiscounts: b.amountWODiscounts,
            overalltiming: b.overalltiming,
            averagePrice: b.averagePrice,
            CPPDifference: b.CPPDifference,
            CPPCalculation: b.CPPCalculation,
            CPPdeviation: b.CPPdeviation
          };
        });
    }
  });

  function selectTab(programId) {
    selectedTab.set(programId);
    changeTab();
  }

  function addTab() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    if (!selectedChannel) {
      return;
    }
    const isTabAlredyAdded = programsForCurrentTask.find(
      p => p.id === selectedChannel
    );
    if (isTabAlredyAdded) {
      selectTab(selectedChannel);
      return;
    }
    const newChannel = $tvChannels.find(tv => tv.id === selectedChannel);
    programsForCurrentTask.push(newChannel);
    programsForCurrentTask = programsForCurrentTask;
    selectTab(selectedChannel);
  }

  function removeTab(e, tabId) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    e.stopPropagation();
    const confirmRemove = confirm("Вы уверены, что хотите удалить ЭСМИ?");
    if (!confirmRemove) {
      return;
    }
    removeEsmi(tabId).then(r => {
      console.log("esmi removed remote");
      if ($broadcasts[tabId] && $broadcasts[tabId].id) {
        // $broadcasts.splice(tabId, 1);
        delete $broadcasts[tabId];
        console.log("esmi removed local");
      }
    });
    programsForCurrentTask = programsForCurrentTask.filter(p => p.id !== tabId);
    // $broadcasts.splice(tabId, 1);
    delete $broadcasts[tabId];
    $broadcasts = $broadcasts;
  }
  function save(showIfNotFound = false) {
    $isDataSaving = true;
    dispatch("save", { showIfNotFound });
  }
  function checkIntersection() {
    dispatch("checkIntersection");
  }

  function copySelectedBroadcasts() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    broadcasts.update(broadcasts => {
      broadcasts[$selectedTab].broadcasts = [
        ...broadcasts[$selectedTab].broadcasts,
        ...selectedBroadcasts
      ];
      broadcasts[$selectedTab].broadcasts = broadcasts[
        $selectedTab
      ].broadcasts.map(b => {
        b.isSelectedBroadcast = false;
        return b;
      });
      return broadcasts;
    });
  }

  getKpVersions().then(versions => {
    kpVersions = versions;
  });

  function showVersions() {
    if (kpVersions && kpVersions.length && window.swal) {
      let alertContent = "";
      for (let i = 0; i < kpVersions.length; i++) {
        alertContent +=
          '<b><a href="maintaskform.aspx?TaskID=' +
          kpVersions[i].taskid +
          '&readMode=1" target="_blank">' +
          kpVersions[i].name +
          "</a></b><br><br>";
      }
      window.swal({
        title: "Версии КП:",
        html: true,
        text: alertContent,
        confirmButtonText: "Закрыть",
        allowOutsideClick: "true"
      });
    }
  }

  function unLockTable() {
    $readMode = false;
    $isTableUnlocked = true;
  }
</script>

<style>
  .tabs {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: solid 1px #dedede;
    padding-bottom: 10px;
  }
  .tab {
    display: flex;
    width: 120px;
    cursor: pointer;
    padding: 4px 10px;
    box-sizing: border-box;
    border: 1px solid #9a9a9a;
    background-color: #f1f1f1;
    margin-left: 5px;
  }
  .tab .label {
    width: 100px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  select.channel {
    height: 27px;
    margin: 0;
    max-width: 200px;
    padding: 3px;
    border: none;
  }
  .selected {
    background-color: #fff;
  }
  .add-tab {
    padding-left: 5px;
  }
  .add-tab-icon {
    position: relative;
    top: 4px;
  }
  .empty-space {
    flex-grow: 1;
    height: 27px;
    text-align: right;
    display: flex;
    justify-content: flex-end;
  }

  .tab-button {
    color: #333;
    background-color: #f4f4f4;
    outline: none;
    margin-right: 10px;
  }
</style>

{#if programsForCurrentTask}
  <div class="tabs">
    {#each programsForCurrentTask as program}
      <div
        class:selected={program.id === $selectedTab}
        class="tab"
        on:click={e => {
          selectTab(program.id);
        }}>
        <div class="label">{program.description}</div>
        {#if !$readMode}
          <div
            on:click={e => {
              removeTab(e, program.id);
            }}>
            <Icon icon={faTimes} />
          </div>
        {/if}
      </div>
    {/each}
    <div class="add-tab">
      {#if !$readMode}
        <select
          bind:value={selectedChannel}
          placeholder="Выберите канал"
          name="channel"
          class="channel">
          {#if $tvChannels}
            <option value="">Выберите канал</option>
            {#each $tvChannels as channel}
              <option value={channel.id}>{channel.description}</option>
            {/each}
          {/if}
        </select>
        <span class="add-tab-icon" on:click={addTab}>
          <Icon class="icon" icon={faPlus} />
        </span>
      {/if}
    </div>
    <div class="empty-space">
      {#if isAdmin && $readMode}
        <div class="tab-button">
          <button class="save-btn btn btn-primary" on:click={unLockTable}>
            Разблокировать
          </button>
        </div>
      {/if}
      {#if !$readMode}
        {#if selectedBroadcasts.length}
          <div class="tab-button">
            <button
              class="save-btn btn btn-primary"
              on:click={copySelectedBroadcasts}>
              Копировать выделенные
            </button>
          </div>
        {/if}
        {#if kpVersions && kpVersions.length && window.swal}
          <div class="tab-button">
            <button class="save-btn btn btn-primary" on:click={showVersions}>
              Версии КП
            </button>
          </div>
        {/if}
        <div class="tab-button">
          <button
            class="save-btn btn btn-primary"
            on:click={e => {
              save(true);
            }}>
            Проверить пересечение
          </button>
        </div>
        <div class="tab-button">
          <button
            class="save-btn btn btn-success"
            disabled={$isDataSaving}
            on:click={e => {
              save(false);
            }}>
            Сохранить
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
