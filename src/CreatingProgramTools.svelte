<script>
  import Icon from "fa-svelte";
  import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
  import {
    broadcasts,
    additionalDiscounts,
    selectedProgram,
    selectedTab,
    sponsors,
    selectedSponsor,
    programs,
    isDirty,
    actionStore,
    wholeSeasonDiscounts,
    selectedAdditionalDiscount
  } from "./store/programTableStore.js";
  import {
    getSponsorNames,
    changeAllowedOffersAmount,
    getAdditionalDiscounts,
    getDefaultProgramData,
    getIntersectionByBroadCast,
    formatDecimals,
    setAppState
  } from "./services/services.js";
  import Select from "svelte-select";
  import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons/";

  export let periods = [];
  let period = "";
  let time = "";
  let selectedSortType = null;
  let sortType = [
    { value: 1, label: "Эфирной линейке" },
    { value: 2, label: "Спонсорским обозначениям внутри эфирных линеек" },
    { value: 3, label: "Спонсорским обозначениям" }
  ];
  let sortTypeValue = "";
  let selectedProgramValue = "";
  let selectedSponsorValue = "";
  let ASCSortType = true;

  function addBroadcast() {
    if (
      !time ||
      !period ||
      !$selectedProgram[$selectedTab] ||
      !$selectedSponsor[$selectedTab]
    ) {
      alert("Пожалуйста, заполните все данные формы");
      return;
    }
    $isDirty = true;
    const program = $programs[$selectedTab].find(
      p => p.taskid === $selectedProgram[$selectedTab]
    );
    const sponsor = $sponsors[$selectedTab].find(
      s => s.taskid === $selectedSponsor[$selectedTab]
    );

    getIntersectionByBroadCast(program.taskid).then(intersections => {
      if (intersections && intersections.length && window.swal) {
        let alertContent = `
            <style ✂prettier:content✂="CiAgICAgICAgICAgIC5pbnRlcnNlY3Rpb24tYWxlcnQgewogICAgICAgICAgICAgICAgbWFyZ2luLXRvcDogMDsKICAgICAgICAgICAgICAgIG92ZXJmbG93OiBhdXRvOwogICAgICAgICAgICAgICAgaGVpZ2h0OiAzNTBweDsKICAgICAgICAgICAgfQogICAgICAgIA==" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂="" ✂prettier:content✂=""></style>        <div class="intersection-alert" style="max-height: 400px; overflow-y: auto">`;
        for (let i = 0; i < intersections.length; i++) {
          alertContent +=
            '<b><a href="default.aspx?TaskID=' +
            intersections[i].taskid +
            '" target="_blank">' +
            intersections[i].tasktext +
            "</a></b><br>" +
            'Статус: "' +
            intersections[i].stateName +
            '"<br>' +
            'Бренд: "' +
            intersections[i].brand.taskText +
            '"<br><br>';
          // intersections[i].period ? ('период: ' + intersections[i].period + '<br><br>') : '<br>';
        }
        alertContent += "</div>";
        window.swal({
          title: "Внимание! Пересечения с КП:",
          html: true,
          text: alertContent,
          confirmButtonText: "Ок",
          allowOutsideClick: "true"
        });
      }
    });
    const defaultBroadcast = {
      TVR: "0.78",
      CPP: "1.34",
      defaultPrice: "620000",
      days: "Пн-Пт",
      time: "10:00",
      coeff: "2",
      multiple5: "1",
      timinginfo: "5 или 10",
      defaulttiming: "5",
      defaultquantity: "1",
      fee: false,
      notrecommended: false,
      broadcasttaskid: program.taskid
    };
    getDefaultProgramData(
      $selectedProgram[$selectedTab],
      $selectedSponsor[$selectedTab]
    ).then(result => {
      setAppState(
        actionStore,
        $broadcasts,
        $wholeSeasonDiscounts,
        $selectedAdditionalDiscount,
        $selectedTab
      );
      if (sponsor && sponsor.taskid) {
        defaultBroadcast.sponsoroffer = {
          id: sponsor.taskid,
          descr: sponsor.description
        };
      }

      defaultBroadcast.time = time;
      defaultBroadcast.defaultTime = time;
      defaultBroadcast.CPP = result.CPP || 0;
      defaultBroadcast.cppClassicPrice = result.cppClassicPrice || [];
      defaultBroadcast.cppClient = result.cppClient || 0;
      defaultBroadcast.TVR = result.TVR || 1;
      defaultBroadcast.TVR18 = result.TVR18 || [];
      defaultBroadcast.TVRlabel = result.TVRlabel || "18+";
      defaultBroadcast.periodicity = period;
      defaultBroadcast.defaultPeriodicity = period;
      defaultBroadcast.name = program.name;
      defaultBroadcast.programId = program.broadcast;
      defaultBroadcast.offtime = result.offtime;
      defaultBroadcast.prime = result.prime;
      defaultBroadcast.programTaskId = program.taskid;
      defaultBroadcast.defaultcoeff = result.coeff;
      defaultBroadcast.defaultDefaultCoeff = defaultBroadcast.defaultcoeff;
      defaultBroadcast.timing = result.defaulttiming;
      defaultBroadcast.price = formatDecimals(result.defaultPrice, true);
      defaultBroadcast.defaultPrice = formatDecimals(result.defaultPrice, true);
      defaultBroadcast.fee = result.fee;
      defaultBroadcast.notrecommended = result.notrecommended;
      defaultBroadcast.detalization = periods.map(p => {
        const broadcastForCurrentMonth = result.broadcasts.find(
          b => +b.month === +p.month
        );
        let tvr18 = 0;
        if (defaultBroadcast.TVR18 && defaultBroadcast.TVR18.length) {
          const curPeriodTvr = defaultBroadcast.TVR18.find(
            tvr => tvr.year === p.year && tvr.month === p.month
          );
          if (curPeriodTvr) {
            tvr18 = curPeriodTvr.value;
          }
        }
        let cppClassicPrice = 0;
        if (
          defaultBroadcast.cppClassicPrice &&
          defaultBroadcast.cppClassicPrice.length
        ) {
          const curCppClassicPrice = defaultBroadcast.cppClassicPrice.find(
            cpp => cpp.year === p.year && cpp.month === p.month
          );
          if (curCppClassicPrice) {
            cppClassicPrice = curCppClassicPrice.value;
          }
        }
        let cppClient = 0;
        if (defaultBroadcast.cppClient && defaultBroadcast.cppClient.length) {
          const curCppClient = defaultBroadcast.cppClient.find(
            cpp => cpp.year === p.year && cpp.month === p.month
          );
          if (curCppClient) {
            cppClient = curCppClient.value;
          }
        }
        return {
          year: p.year,
          month: p.month,
          broadcasts:
            broadcastForCurrentMonth && broadcastForCurrentMonth.quantity
              ? broadcastForCurrentMonth.quantity
              : 0,
          offer: 0,
          amount: 0,
          defaultquantity: result.defaultquantity || 0,
          quantity: result.quantity || result.defaultquantity || 0,
          additionalDiscount: 0,
          TVR18: tvr18,
          defaultTVR18: tvr18,
          GRP20: 0,
          cppClassic: cppClassicPrice,
          defaultCppClassic: cppClassicPrice,
          cppClient: cppClient,
          defaultCppClient: cppClient,
          cppClassicDiff: 0
        };
      });
      defaultBroadcast.additional = [];
      defaultBroadcast.currentIndex =
        $broadcasts[$selectedTab].broadcasts.length;
      defaultBroadcast.standartDeviationOptions = result;
      defaultBroadcast.useSeasonalDiscount = result.useSeasonalDiscount;

      if (defaultBroadcast.fee) {
        alert("Внимание, требуется гонорар");
      }

      if (defaultBroadcast.notrecommended) {
        alert("Данный бренд не рекомендуется к размещению в данной программе");
      }

      broadcasts.update(broadcast => {
        broadcast[$selectedTab].broadcasts.push(defaultBroadcast);
        return broadcast;
      });
      changeAllowedOffersAmount(broadcasts, $selectedTab);
      clearCreatingFields();
    });
  }

  function clearCreatingFields() {
    time = "";
    period = "";
    $selectedProgram[$selectedTab] = undefined;
    $selectedSponsor[$selectedTab] = undefined;
  }

  function onSponsorChange(e) {
    if (e && e.detail) {
      $selectedSponsor[$selectedTab] = e.detail.value;

      selectedSponsorValue = $sponsors[$selectedTab].find(
        e => e.taskid == $selectedSponsor[$selectedTab]
      ).label;
    }
    getAdditionalDiscounts(
      $selectedSponsor[$selectedTab],
      false,
      $selectedTab
    ).then(result => {
      $additionalDiscounts[$selectedTab] = result;
    });
    afterSponsorOrProgramChange();
  }

  function onSortTypeChange(e) {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
    if (e && e.detail) {
      selectedSortType = e.detail.value;
      sortTypeValue = sortType.find(e => e.value == selectedSortType).label;
    }
    sortBroadcasts();
  }
  function sortBroadcasts() {
    if (selectedSortType === 1) {
      $broadcasts[$selectedTab].broadcasts = $broadcasts[
        $selectedTab
      ].broadcasts.sort(sortByName);
    }
    if (selectedSortType === 2) {
      $broadcasts[$selectedTab].broadcasts = $broadcasts[
        $selectedTab
      ].broadcasts.sort(sortByNameAndSponsor);
    }
    if (selectedSortType === 3) {
      $broadcasts[$selectedTab].broadcasts = $broadcasts[
        $selectedTab
      ].broadcasts.sort(sortBySponsorName);
    }
    $broadcasts[$selectedTab].broadcasts = $broadcasts[
      $selectedTab
    ].broadcasts.map((b, i) => {
      b.currentIndex = i;
      return b;
    });
  }
  function sortByName(a, b) {
    if (!ASCSortType) {
      if (b.name < a.name) {
        return -1;
      }
      if (b.name > a.name) {
        return 1;
      }
    }
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }
  function sortBySponsorName(a, b) {
    if (!ASCSortType) {
      if (b.sponsoroffer.descr < a.sponsoroffer.descr) {
        return -1;
      }
      if (b.sponsoroffer.descr > a.sponsoroffer.descr) {
        return 1;
      }
    }
    if (a.sponsoroffer.descr < b.sponsoroffer.descr) {
      return -1;
    }
    if (a.sponsoroffer.descr > b.sponsoroffer.descr) {
      return 1;
    }
    return 0;
  }
  function sortByNameAndSponsor(a, b) {
    /* сортируем по имени */
    if (sortByName(a, b) !== 0) {
      return sortByName(a, b);
    } else {
      /* если программы по имени равны, то есть вернули ноль сортируем по спонсору */
      return sortBySponsorName(a, b);
    }
    return 0;
  }
  function onProgramChange(e) {
    if (e && e.detail) {
      $selectedProgram[$selectedTab] = e.detail.value;
      selectedProgramValue = $programs[$selectedTab].find(
        e => e.taskid == $selectedProgram[$selectedTab]
      ).label;
    }
    afterSponsorOrProgramChange();
    getSponsorNames($selectedProgram[$selectedTab]).then(r => {
      $sponsors[$selectedTab] = r;
      $sponsors[$selectedTab] = r.map(sponsor => {
        sponsor["value"] = sponsor.taskid;
        sponsor["label"] = sponsor.description;
        return sponsor;
      });
    });
  }
  function afterSponsorOrProgramChange() {
    if (
      !$selectedProgram ||
      !$selectedSponsor ||
      !$selectedProgram[$selectedTab] ||
      !$selectedSponsor[$selectedTab]
    ) {
      return;
    }
    getDefaultProgramData(
      $selectedProgram[$selectedTab],
      $selectedSponsor[$selectedTab]
    ).then(result => {
      period = result.days;
      time = result.time;
    });
  }
  function ASCSortTypeChange() {
    ASCSortType = !ASCSortType;
    sortBroadcasts();
  }
</script>

<style>
  .tools-wrapper {
    display: flex;
    align-items: flex-end;
  }
  .tool-item {
    margin-right: 10px;
    padding-bottom: 6px;
  }
  .sponsor-select,
  .program-select,
  .period-input {
    box-sizing: content-box;
    height: 23px;
    font-size: 12px;
    padding: 0 0 0 5px;
    max-width: 250px;
  }
  .tool-item :global(.add-program-icon) {
    cursor: pointer;
    position: relative;
    top: -9px;
    font-size: 12px;
  }
  .tool-item.autocomplete {
    position: relative;
    z-index: 1000;
    width: 280px;
    padding-bottom: 10px;
    --height: 25px;
    --indicatorTop: 3px;
  }
  .autocomplete :global(.selectContainer) {
    align-items: baseline;
  }
  .calculate-btn {
    margin: 5px 0 5px 0;
  }
  input,
  button,
  select,
  textarea {
    margin: 0 0 0.5em 0;
  }
  .sort-arrow {
    z-index: 1001;
    padding-bottom: 14px;
  }
  h4 {
    font-size: 12px;
    margin: 0 0 10px 0;
  }
</style>

<div class="tools-wrapper">
  <div class="tool-item autocomplete" title={selectedProgramValue}>
    <Select
      noOptionsMessage="Нет опций"
      bind:selectedValue={$selectedProgram[$selectedTab]}
      on:select={onProgramChange}
      items={$programs[$selectedTab] || []}
      showChevron={true}
      placeholder="Выберите программу" />
  </div>
  <div class="tool-item autocomplete" title={selectedSponsorValue}>
    <Select
      noOptionsMessage="Нет опций"
      bind:selectedValue={$selectedSponsor[$selectedTab]}
      on:select={onSponsorChange}
      items={$sponsors[$selectedTab] || []}
      showChevron={true}
      placeholder="Выберите спонсорское обозначение" />
  </div>
  <div class="tool-item">
    <input
      type="text"
      bind:value={period}
      name="period"
      placeholder="Период"
      class="period-input" />
  </div>
  <div class="tool-item">
    <input
      type="text"
      bind:value={time}
      name="time"
      placeholder="Время эфира"
      class="period-input" />
  </div>
  <div class="tool-item" on:click={addBroadcast}>
    <Icon class="add-program-icon" icon={faPlus} />
  </div>
  <div class="tool-item autocomplete sort-autocomplete" title={sortTypeValue}>
    <h4>Сортировать по</h4>
    <Select
      noOptionsMessage="Нет опций"
      bind:selectedValue={selectedSortType}
      on:select={onSortTypeChange}
      items={sortType}
      showChevron={true}
      placeholder="Сортировать по..." />
  </div>
  <div class="tool-item sort-arrow">
    <span on:click={ASCSortTypeChange} class="pin-btn">
      {#if ASCSortType}
        <Icon class="icon expand" icon={faArrowUp} />
      {:else}
        <Icon class="icon expand" icon={faArrowDown} />
      {/if}
    </span>
  </div>
</div>
