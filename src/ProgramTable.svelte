<script>
  import ProgramGridItem from "./ProgramGridItem.svelte";
  import CreatingProgramTools from "./CreatingProgramTools.svelte";
  import Discounts from "./Discounts.svelte";
  import Stats from "./Stats.svelte";
  import Tabs from "./Tabs.svelte";
  import {
    broadcasts,
    additionalDiscounts,
    wholeSeasonDiscounts,
    selectedAdditionalDiscount,
    tvChannels,
    programs,
    selectedTab,
    actionStore,
    selectedSponsor,
    discountsScale,
    isDirty,
    selectedCalulatingParamsType,
    singleSeasonalDiscountBroadcast,
    singleSeasonalDiscountMonth,
    coefficientDiscountBroadcast,
    fullPriceWithoutExtraDiscounts,
    fullPrice,
    standartConditionDeviation,
    fullAmountWithDiscounts,
    isDataSaving,
    discountsEmitter,
    sumByMonth,
    readMode,
    isTableUnlocked,
    grpByMonth
  } from "./store/programTableStore.js";
  import { calulatingTypes } from "./services/types";
  import Icon from "fa-svelte";
  import {
    faThumbtack,
    faArrowUp,
    faArrowDown
  } from "@fortawesome/free-solid-svg-icons/";
  import {
    formatNumber,
    getPrograms,
    prepareGridMetaDataFromDates,
    getSeasonDiscount,
    getAdditionalDiscounts,
    saveBroadcasts,
    compareBroadcasts,
    changeAllowedOffersAmount,
    getNumberValue,
    getFullPriceWithoutExtraDiscounts,
    getEsmiList,
    getOffersEsmi,
    getProgramNames,
    getDiscountScale,
    getIntersection,
    getAdditionalGeneralDiscount,
    getNumberFromString,
    getSeasonalByPeriod,
    formatDecimals,
    getAmountByPeriod,
    getPriceWithoutDiscountsForBroadcast,
    getAuthInfo,
    getLastAppState,
    setAppState,
    calculateDetalization
  } from "./services/services.js";
  import { onDestroy } from "svelte";

  let preparedPeriods = [];
  let selectedPrograms = [];
  let programsForCurrentTask = [];
  let additionalDiscountsHighlight = false;
  let isToolsFixed = false;
  let isDiscountsExpand = true;
  let highlightSeason = {};
  let isAdmin = false;
  let savingInProgress = false;
  const defaultAdditionalDiscounts = { data: [] };

  function addHandler(object, event, handler, useCapture) {
    if (object.addEventListener) {
      object.addEventListener(event, handler, useCapture ? useCapture : false);
    } else {
      object.attachEvent("on" + event, handler);
    }
  }

  addHandler(document, "keydown", hotSave);
  addHandler(document, "keydown", cancelAction);

  function cancelAction(e) {
    if (e.keyCode == 90 && e.ctrlKey) {
      e.preventDefault();
      const lastState = getLastAppState(
        $actionStore,
        $broadcasts,
        $selectedTab
      );
      if (
        lastState &&
        lastState[$selectedTab] &&
        lastState[$selectedTab].broadcastsData &&
        lastState[$selectedTab].selectedAdditionalDiscount
      ) {
        if (
          lastState[$selectedTab].broadcastsData &&
          $broadcasts[$selectedTab]
        ) {
          $broadcasts[$selectedTab].broadcasts =
            lastState[$selectedTab].broadcastsData.broadcasts;
          $broadcasts[$selectedTab].additional =
            lastState[$selectedTab].broadcastsData.additional;
          $broadcasts[$selectedTab].amount =
            lastState[$selectedTab].broadcastsData.amount;
          $broadcasts[$selectedTab].amountWODiscounts =
            lastState[$selectedTab].broadcastsData.amountWODiscounts;
          $broadcasts[$selectedTab].blockedPeriods =
            lastState[$selectedTab].broadcastsData.blockedPeriods;
          $broadcasts[$selectedTab].discounts =
            lastState[$selectedTab].broadcastsData.discounts;
          $broadcasts[$selectedTab].offtimePrimeValues =
            lastState[$selectedTab].broadcastsData.offtimePrimeValues;
          $broadcasts[$selectedTab].periods =
            lastState[$selectedTab].broadcastsData.periods;

          $wholeSeasonDiscounts[$selectedTab] =
            lastState[$selectedTab].wholeSeasonDiscounts;
          $selectedAdditionalDiscount[$selectedTab] =
            lastState[$selectedTab].selectedAdditionalDiscount;
          afterCalculationAmounts();
        }
      }
    }
  }

  function hotSave(evt) {
    evt = evt || window.event;
    var key = evt.keyCode || evt.which;
    key = String.fromCharCode(key).toLowerCase() == "s";
    if (evt.ctrlKey && key) {
      // Блокирование появления диалога о сохранении
      if (evt.preventDefault) evt.preventDefault();
      evt.returnValue = false;
      // Сохранение
      if (
        $broadcasts[$selectedTab] &&
        $broadcasts[$selectedTab] &&
        $broadcasts[$selectedTab].broadcasts
      ) {
        save();
      }
      // Возвращаем фокус в окно
      window.focus();
      return false;
    }
  }

  // Добавить удаление ЭСМИ и Программ

  onDestroy(() => {
    preparedPeriods = [];
    selectedPrograms = [];
    $broadcasts = {};
    $additionalDiscounts = [];
    $selectedAdditionalDiscount = [];
    $isDataSaving = false;
    $discountsEmitter = [];
    programsForCurrentTask = [];
    $fullPriceWithoutExtraDiscounts[$selectedTab] = 0;
    $fullAmountWithDiscounts[$selectedTab] = 0;
    $standartConditionDeviation[$selectedTab] = 0;
  });

  getAuthInfo().then(r => {
    if (r.data) {
      isAdmin = r.data.isAdmin;
    }
  });

  getEsmiList().then(r => {
    tvChannels.update(broadcast => {
      return r;
    });
    getOffersEsmi().then(r => {
      programsForCurrentTask = r;
      if (r) {
        $selectedTab = r.id;
        getPrograms($selectedTab).then(r => {
          if (r) {
            if (r.access < 2 && !$isTableUnlocked) {
              $readMode = true;
            }
            broadcasts.update(broadcast => {
              broadcast = r;

              broadcast.broadcasts = prepareBroadcastsData(
                broadcasts.broadcasts
              );
              return {
                [$selectedTab]: broadcast
              };
            });
            preparePeriods();
            $additionalDiscounts[$selectedTab] = defaultAdditionalDiscounts;
            $wholeSeasonDiscounts[$selectedTab] = prepareWholeSeasonDiscounts(
              preparedPeriods,
              $broadcasts,
              $selectedTab
            );
            if (
              $broadcasts[$selectedTab] &&
              $broadcasts[$selectedTab] &&
              $broadcasts[$selectedTab].broadcasts
            ) {
              changeAllowedOffersAmount(broadcasts, $selectedTab);
            }
          }
        });
      }
    });
  });

  function changeAnyValue() {
    $isDirty = true;
  }

  function preparePeriods() {
    preparedPeriods = [];
    for (let esmi in $broadcasts) {
      const blockedPeriods = ($broadcasts[esmi].blockedPeriods || []).map(p => {
        const curDate = new Date(p.date);
        return {
          month: curDate.getMonth() + 1,
          year: curDate.getFullYear()
        };
      });
      $broadcasts[esmi].periods.forEach(period => {
        const dateFrom = new Date(period.from);
        const dateTill = new Date(period.till);

        const curPeriod = prepareGridMetaDataFromDates(dateFrom, dateTill);

        for (let i = 0; curPeriod.length > i; i++) {
          const curPeriodAlreadyAdded = preparedPeriods.find(
            p => p.month === curPeriod[i].month && p.year === curPeriod[i].year
          );
          const isCurPeriodBlocked = blockedPeriods.find(
            bp =>
              bp.month === curPeriod[i].month && bp.year === curPeriod[i].year
          );
          curPeriod[i].isBlocked = !!isCurPeriodBlocked;
          if (!curPeriodAlreadyAdded) {
            preparedPeriods.push(curPeriod[i]);
          }
        }
      });
    }
  }

  function save(event) {
    if (savingInProgress) {
      return;
    }
    savingInProgress = true;
    let showIfNotFound = event ? event.detail.showIfNotFound : null;
    for (let tab in $broadcasts) {
      if (
        $broadcasts[tab].broadcasts &&
        $broadcasts[tab].broadcasts.length &&
        tab
      ) {
        $broadcasts[tab].deviation = $standartConditionDeviation[tab] || 0;
        $broadcasts[tab].amount = formatNumber($fullAmountWithDiscounts[tab]);
        $broadcasts[tab].amountWODiscounts = $fullPriceWithoutExtraDiscounts[tab];
        $broadcasts[tab].discounts.seasonal = $wholeSeasonDiscounts[tab];
        $broadcasts[tab].discounts.custom = $selectedAdditionalDiscount[tab].map(d => {
          if (d.absoluteAmount) {
            d.feature = "абсолютная";
          } else {
            d.feature = "процентная";
          }
          return d;
        });
        saveBroadcasts($broadcasts[tab]).then(response => {
          if (!response.ok) {
            swal("Ошибка при сохранении");
            $isDirty = true;
            $isDataSaving = false;
            return;
          }
          response.json().then(result => {
            if (result && result.discounts && result.discounts.seasonal) {
              $broadcasts[tab].discounts.seasonal = result.discounts.seasonal;
              $wholeSeasonDiscounts[tab] = $wholeSeasonDiscounts[
                $selectedTab
              ].map(d => {
                const seasonalLastStateDiscount = $broadcasts[
                  tab
                ].discounts.seasonal.find(
                  seasonal =>
                    seasonal.month === d.month && d.year === seasonal.year
                );
                if (seasonalLastStateDiscount) {
                  d.id = seasonalLastStateDiscount.id;
                }
                return d;
              });
            }
            $broadcasts[tab].id = result.id;
            if (result.brands && result.brands.length && !showIfNotFound) {
              const kpList = result.brands.reduce(
                (accumulator, currentValue) =>
                  accumulator + ", " + currentValue.description,
                ""
              );
              swal("Найдено КП из текущей товарной группы: " + kpList);
            }
            if (result.tenders && result.tenders.length && !showIfNotFound) {
              const tendersList = result.tenders.reduce(
                (accumulator, currentValue) =>
                  accumulator + ", " + currentValue.description,
                ""
              );
              swal(
                "Найдены несоответствия в ранее выставленных КП в рамках тендера: " +
                  tendersList
              );
            }
            $isDirty = false;
            $isDataSaving = false;
            if (!showIfNotFound) {
              swal("Сохранено");
            }
            if (result.broadcasts && result.broadcasts.length) {
              updateTVR(result.broadcasts, tab);
            }
            $actionStore = [];
            setAppState(
              actionStore,
              $broadcasts,
              $wholeSeasonDiscounts,
              $selectedAdditionalDiscount,
              tab
            );
            savingInProgress = false;
          });
          checkIntersection(showIfNotFound);
        });
      }
    }
  }

  function afterCalculationAmounts() {
    if ($broadcasts[$selectedTab]) {
      // const discounts = $broadcasts[$selectedTab].discounts;
      $broadcasts[$selectedTab].broadcasts = $broadcasts[
        $selectedTab
      ].broadcasts.map(broadcast => {
        broadcast["additionalDiscount"] =
          1 + $broadcasts[$selectedTab].discounts.additional / 100;
        broadcast.detalization = broadcast.detalization.map(d =>
          calculateDetalization(
            broadcast,
            d,
            $broadcasts,
            $selectedTab,
            $wholeSeasonDiscounts,
            $additionalDiscounts,
            $selectedAdditionalDiscount,
            defaultAdditionalDiscounts
          )
        );

        broadcast.amountWithDscounts = broadcast.detalization.reduce(
          (ac, m) => {
            return ac + +m.amount;
          },
          0
        );

        broadcast.amountWithoutCoeff = broadcast.detalization.reduce(
          (ac, m) => {
            return ac + +m.amountWithoutCoeff;
          },
          0
        );

        broadcast.overallquantity = broadcast.detalization.reduce((ac, m) => {
          return ac + +m.offer;
        }, 0);

        broadcast.allquantity = broadcast.detalization.reduce((ac, m) => {
          return ac + +m.broadcasts;
        }, 0);

        broadcast.amountWODiscounts = broadcast.detalization.reduce((ac, m) => {
          return ac + getPriceWithoutDiscountsForBroadcast(m, broadcast);
        }, 0);
        let overalltiming = broadcast.detalization.reduce((ac, m) => {
          return ac + +m.offer * +m.quantity;
        }, 0);

        // Общий хронометраж (overalltiming) = Заказ(offer)* Кол-во в одном выпуске(quantity) - суммируем произведения этих значений по месяцам и все это умножаем на хронометраж(timing)
        overalltiming = broadcast.timing * overalltiming;
        broadcast.overalltiming = overalltiming;
        broadcast.averagePrice =
          broadcast.amountWithDscounts / broadcast.overallquantity;
        // broadcast.CPPDifference = formatNumber(+broadcast.amountWithDscounts / +broadcast.overallquantity / +broadcast.quantity / +broadcast.timing / +broadcast.TVR * 30);

        broadcast.CPPDifference = 0;
        if (
          !broadcast.amountWithDscounts ||
          !broadcast.overallquantity ||
          broadcast.defaultquantity ||
          !broadcast.TVR
        ) {
          broadcast.CPPDifference =
            ((broadcast.amountWithDscounts /
              broadcast.overallquantity /
              broadcast.defaultquantity /
              broadcast.timing) *
              20) /
            broadcast.TVR;
          if (
            isNaN(broadcast.CPPDifference) ||
            !isFinite(broadcast.CPPDifference)
          ) {
            broadcast.CPPDifference = 0;
          }
          // итого с учетом скидок/число выбранных программ/кол-во в одном выпуске/хр-ж опции*20/tvr;
        }

        let cppClassicPrice = 0;
        broadcast.detalization.forEach(d => {
          cppClassicPrice += d.cppClassicPrice;
        });

        broadcast.CPPCalculation = getNumberValue(broadcast.CPPDifference);
        if (cppClassicPrice === 0) {
          broadcast.CPPdeviation = 0;
        } else {
          broadcast.CPPdeviation = getNumberValue(
            broadcast.amountWithDscounts / cppClassicPrice
          );
        }
        return broadcast;
      });

      if ($broadcasts[$selectedTab] && $broadcasts[$selectedTab].broadcasts) {
        if (!preparedPeriods || !preparedPeriods.length) {
          preparePeriods();
        }
        $sumByMonth = preparedPeriods.map(p => {
          p.sum = $broadcasts[$selectedTab].broadcasts.reduce(
            (broadcastAcc, b) => {
              return (
                broadcastAcc +
                b.detalization.reduce((detalizationAcc, d) => {
                  if (+d.month === +p.month && +d.year === +p.year) {
                    return detalizationAcc + +d.amount;
                  }
                  return detalizationAcc + 0;
                }, 0)
              );
            },
            0
          );
          return p;
        });

        $grpByMonth = preparedPeriods.map(p => {
          p.grp = $broadcasts[$selectedTab].broadcasts.reduce(
            (broadcastAcc, b) => {
              return (
                broadcastAcc +
                b.detalization.reduce((detalizationAcc, d) => {
                  if (+d.month === +p.month && +d.year === +p.year) {
                    return detalizationAcc + +d.GRP20;
                  }
                  return detalizationAcc + 0;
                }, 0)
              );
            },
            0
          );
          p.grpPrime = $broadcasts[$selectedTab].broadcasts.reduce(
            (broadcastAcc, b) => {
              return (
                broadcastAcc +
                b.detalization.reduce((detalizationAcc, d) => {
                  if (
                    +d.month === +p.month &&
                    +d.year === +p.year &&
                    b.prime === true
                  ) {
                    return detalizationAcc + +d.GRP20;
                  }
                  return detalizationAcc + 0;
                }, 0)
              );
            },
            0
          );
          return p;
        });

        $grpByMonth = preparedPeriods.map(p => {
          p.grpPrimePercent = preparedPeriods.reduce((periodsAcc, d) => {
            if (+d.month === +p.month && +d.year === +p.year) {
              return periodsAcc + (+d.grpPrime / +d.grp || 0);
            }
            return periodsAcc + 0;
          }, 0);
          return p;
        });
      }

      $fullPriceWithoutExtraDiscounts[
        $selectedTab
      ] = getFullPriceWithoutExtraDiscounts(
        $broadcasts[$selectedTab],
        $wholeSeasonDiscounts[$selectedTab]
      );
      $fullPriceWithoutExtraDiscounts[$selectedTab] =
        $fullPriceWithoutExtraDiscounts[$selectedTab] || 0;

      const additionalWholeDiscount =
        1 + $broadcasts[$selectedTab].discounts.additional / 100;
      $fullPrice[$selectedTab] = Math.round(
        $fullPriceWithoutExtraDiscounts[$selectedTab] * additionalWholeDiscount
      );

      const additionalDiscount = getAdditionalGeneralDiscount(
        $additionalDiscounts[$selectedTab] || defaultAdditionalDiscounts,
        $selectedAdditionalDiscount[$selectedTab]
      );

      let fullAmountWithDiscount = $broadcasts[$selectedTab].broadcasts.reduce(
        (ac, m) => {
          return ac + (!!m.amountWithDscounts ? +m.amountWithDscounts : 0);
        },
        0
      );
      let amountWithDiscount = fullAmountWithDiscount;
      additionalDiscount.forEach(d => {
        amountWithDiscount -=
          amountWithDiscount *
            getNumberFromString(formatDecimals(1 - d.percentageAmount, true)) +
          getNumberFromString(formatDecimals(d.absoluteAmount, true));
        // amountWithDiscount -= Math.round(fullAmountWithDiscount * (1 - d));
      });
      amountWithDiscount = Math.round(amountWithDiscount);
      $fullAmountWithDiscounts[$selectedTab] = amountWithDiscount;

      refreshStandardCondition();
    }
  }

  function refreshStandardCondition() {
    const standardCondition = calculateStandardCondition();
    const onePercent = standardCondition / 100;
    if (standardCondition > 0) {
      $standartConditionDeviation[$selectedTab] =
        (100 - $fullAmountWithDiscounts[$selectedTab] / onePercent).toFixed(2) *
        -1;
    }
  }

  function calculateStandardCondition() {
    // 1. Согласно их формулам, мы должны взять с фронта Кол-во передач за месяц (бирюзовый цвет на скрине) broadcast.detalization.offer
    // 2. Умножить на значения из справочника Спонсорские обозначения - Рубли/минута, Коэфф, Х-рж, Кол-во (розовым на скрине)
    // 3. Запоминаем текущую сумму, по этой сумме вычисляем стандартную объемную скидку и запоминаем её
    // 4. Умножить Сезонную скидку/наценку за месяц, т.е. 1+значение скидки из справочника Сезонные скидки (синим на скрине)
    // 5. Производим аналогичные действия по всем программам и месяцам и суммируем это
    // 6. Умножить на 1- Агентская скидку (она по дефолту 15), т.е. умножаем на 0,85 (красным на скрине)
    // 7. Умножаем всё на 1-Объемная скидка (берем из п.3)
    // 8. Получившуюся сумму делим на 60

    let broadcastDetailWithSum = $broadcasts[$selectedTab].broadcasts.map(b => {
      let broadcastsDetail = [];
      b.detalization.forEach(d => {
        let curMonthSum = 0;
        // console.log('standartDeviationOptions', b.standartDeviationOptions);
        if (b.standartDeviationOptions) {
          // console.log(d.year, d.month, +d.offer, (getNumberFromString(formatDecimals(b.standartDeviationOptions.price)) / 60), b.standartDeviationOptions.coeff, b.standartDeviationOptions.defaulttiming, d.defaultquantity)
          // console.log(+d.offer * (getNumberFromString(formatDecimals(b.standartDeviationOptions.price)) / 60) * b.standartDeviationOptions.coeff * b.standartDeviationOptions.defaulttiming * +d.defaultquantity)
          // curMonthSum += Math.round(+d.offer * (getNumberFromString(formatDecimals(b.standartDeviationOptions.price)) / 60) * +b.standartDeviationOptions.coeff * +b.standartDeviationOptions.defaulttiming * +d.defaultquantity);
          curMonthSum += Math.round(
            +d.offer *
              (getNumberFromString(
                formatDecimals(b.standartDeviationOptions.defaultPrice)
              ) /
                60) *
              +b.standartDeviationOptions.coeff *
              +b.timing *
              +b.defaultquantity
          );
        }
        let useSeasonalDiscount =
          b.standartDeviationOptions &&
          b.standartDeviationOptions.useSeasonalDiscount
            ? b.standartDeviationOptions.useSeasonalDiscount
            : 0;
        broadcastsDetail.push({
          year: d.year,
          month: d.month,
          sum: curMonthSum,
          useSeasonalDiscount: useSeasonalDiscount
        });
      });
      return broadcastsDetail;
    });
    let curWholesale = 0;
    let broadcastSum = 0;

    broadcastDetailWithSum.forEach(bdws => {
      broadcastSum += bdws.reduce((ac, m) => {
        return ac + +m.sum;
      }, 0);
    });

    if ($discountsScale[$selectedTab] && $discountsScale[$selectedTab].length) {
      for (let i = 0; i < $discountsScale[$selectedTab].length; i++) {
        if (
          broadcastSum >= $discountsScale[$selectedTab][i].from &&
          broadcastSum <= $discountsScale[$selectedTab][i].to
        ) {
          curWholesale = $discountsScale[$selectedTab][i].amount;
          break;
        }
      }
    }
    broadcastSum = Math.round(broadcastSum);
    // console.log('broadcastSum', broadcastSum, broadcastDetailWithSum);
    // console.log('curWholesale', curWholesale);
    // console.log('$wholeSeasonDiscounts[$selectedTab]', $wholeSeasonDiscounts[$selectedTab]);
    broadcastSum = 0;
    broadcastDetailWithSum.forEach(bdws => {
      broadcastSum += bdws.reduce((ac, m) => {
        const curDataSeasonalDiscount = $wholeSeasonDiscounts[
          $selectedTab
        ].find(wsd => wsd.month === m.month && wsd.year === m.year);
        if (curDataSeasonalDiscount && curDataSeasonalDiscount.defaultAmount) {
          // console.log('curDataSeasonalDiscount.defaultAmount', curDataSeasonalDiscount.defaultAmount)
          const seasonalDiscount = m.useSeasonalDiscount
            ? 1 + curDataSeasonalDiscount.defaultAmount / 100
            : 1;
          return ac + +m.sum * seasonalDiscount;
        }
        return ac + Math.round(+m.sum);
      }, 0);
    });
    // console.log('broadcastSum + сезонная скидка Math ', broadcastSum);

    broadcastSum = Math.round(
      broadcastSum *
        (1 - +$broadcasts[$selectedTab].discounts.defaultAgency / 100)
    );
    // console.log('1- Агентская скидка',  broadcastSum);

    broadcastSum = Math.round(broadcastSum * (1 - curWholesale / 100));
    // console.log('1-Объемная скидка',  broadcastSum);
    return broadcastSum;
  }

  function prepareBroadcastsData(broadcasts) {
    let newBroadcasts = broadcasts;
    if (!newBroadcasts) {
      newBroadcasts = [];
    }
    newBroadcasts = newBroadcasts.map((b, i) => {
      preparedPeriods.forEach(p => {
        const defaultDetalization = {
          year: p.year,
          month: p.month,
          broadcasts: 0,
          offer: 0,
          amount: 0,
          defaultquantity: b.defaultquantity ? b.defaultquantity : 0,
          quantity: b.quantity,
          TVR18: 0,
          GRP20: 0,
          cppClassic: 0,
          cppClient: 0,
          cppClassicPrice: 0,
          cppClassicDiff: 0
        };
        b.detalization = b.detalization ? b.detalization : [];
        const detalizationOfCurMonth = b.detalization.find(
          curDetalization =>
            +curDetalization.year === +p.year &&
            +curDetalization.month === +p.month
        );
        if (!detalizationOfCurMonth) {
          b.detalization.push(defaultDetalization);
        }
        b.detalization = b.detalization.map(bd => {
          if (!bd.defaultquantity) {
            bd.defaultquantity = b.defaultquantity;
          }
          return bd;
        });
      });
      if (!b.additional) {
        b.additional = [];
      }
      if (b.customTVR) {
        b.TVR = b.customTVR;
      }
      if (!b.TVRlabel) {
        b.TVRlabel = "18+";
      }
      b.currentIndex = Number.isInteger(b.currentIndex) ? b.currentIndex : i;
      return b;
    });

    newBroadcasts = newBroadcasts
      .map(b => {
        b.detalization = b.detalization ? b.detalization : [];
        b.detalization = b.detalization.sort(compareBroadcasts);
        b.defaultDefaultCoeff = b.defaultDefaultCoeff || b.defaultcoeff;
        b.detalization = b.detalization.map(d => {
          if (!d.quantity) {
            d.quantity = b.defaultquantity || 0;
          }
          if (!d.additionalDiscount) {
            d.additionalDiscount = 0;
          }
          return d;
        });
        return b;
      })
      .sort(function(a, b) {
        if (a.currentIndex > b.currentIndex) {
          return 1;
        }
        if (a.currentIndex < b.currentIndex) {
          return -1;
        }
        return 0;
      });

    return newBroadcasts;
  }

  function onCalculateAdditionalDiscount() {
    additionalDiscountsHighlight = true;
  }
  function onCalculateSeasonalDiscount(e) {
    highlightSeason = e.detail;
  }

  function onCalculate() {
    setAppState(
      actionStore,
      $broadcasts,
      $wholeSeasonDiscounts,
      $selectedAdditionalDiscount,
      $selectedTab
    );
  }

  function onChangeTab() {
    if (!$broadcasts[$selectedTab]) {
      getPrograms($selectedTab).then(r => {
        if (r.access < 2 && !$isTableUnlocked) {
          $readMode = true;
        }
        $programs[$selectedTab] = [];
        getProgramNames($selectedTab).then(r => {
          $programs[$selectedTab] = r.map(program => {
            program["value"] = program.taskid;
            program["label"] =
              program.name + " - " + program.day + " - " + program.time;
            return program;
          });
        });
        getDiscountScale($selectedTab).then(discountScale => {
          $discountsScale[$selectedTab] = discountScale;
        });
        const loadedBroadcast = r;
        loadedBroadcast.broadcasts = prepareBroadcastsData(
          loadedBroadcast.broadcasts
        );
        loadedBroadcast.esmi = $selectedTab;
        $broadcasts[$selectedTab] = loadedBroadcast;
        preparePeriods();
        $wholeSeasonDiscounts[$selectedTab] = prepareWholeSeasonDiscounts(
          preparedPeriods,
          $broadcasts,
          $selectedTab
        );
        $selectedAdditionalDiscount[$selectedTab] =
          r && r.discounts && r.discounts.custom ? r.discounts.custom : [];
        $selectedAdditionalDiscount[$selectedTab] = $selectedAdditionalDiscount[
          $selectedTab
        ].map(d => {
          d.name =
            d.description +
            " (" +
            (d.percentageAmount ? d.percentageAmount + "%" : d.absoluteAmount) +
            ")";
          d.value = d.taskid;
          return d;
        });

        changeAllowedOffersAmount(broadcasts, $selectedTab);
        getAdditionalDiscounts(
          $selectedSponsor[$selectedTab],
          false,
          $selectedTab
        ).then(result => {
          $additionalDiscounts[$selectedTab] = result;
        });
        $broadcasts[$selectedTab] = $broadcasts[$selectedTab];
        afterCalculationAmounts();
      });
    }
    $broadcasts[$selectedTab] = $broadcasts[$selectedTab];
    afterCalculationAmounts();
  }

  function updateTVR(resultBroadcasts, tab) {
    resultBroadcasts.forEach(resultBroadcast => {
      $broadcasts[tab].broadcasts = $broadcasts[tab].broadcasts.map(
        (b, i, arr) => {
          const newId = getBroadCastIdByCurrentIndex(resultBroadcasts, b.currentIndex);
          if (newId) {
            b.id = newId;
          }
          console.log(b.name, b.id);
          if (resultBroadcast.id === b.id) {
            if (resultBroadcast.customTVR) {
              b.TVR = resultBroadcast.customTVR;
              b.customTVR = resultBroadcast.customTVR;
            } else {
              b.TVR = resultBroadcast.TVR;
              b.customTVR = 0;
            }
          }
          return b;
        }
      );
      afterCalculationAmounts();
    });
  }

  function getBroadCastIdByCurrentIndex(arr, index) {
    const broadcast = arr.find(b => b.currentIndex === index);
    if (broadcast && Number.isInteger(broadcast.currentIndex)) {
      return broadcast.id;
    } else {
      return null;
    }
  }

  function prepareWholeSeasonDiscounts(periods, broadcasts, selectedTab) {
    return preparedPeriods.map(p => {
      const seasonal =
        broadcasts && broadcasts[selectedTab]
          ? getSeasonalByPeriod(p, broadcasts[selectedTab].discounts.seasonal)
          : null;
      return {
        id: seasonal ? seasonal.id : null,
        defaultAmount: seasonal ? seasonal.defaultAmount : null,
        month: p.month,
        year: p.year,
        amount:
          broadcasts && broadcasts[selectedTab]
            ? getSeasonDiscount(p, broadcasts[selectedTab].discounts.seasonal)
            : 0
      };
    });
  }
  function checkIntersection(showIfNotFound = true) {
    getIntersection().then(r => {
      let intersectionAlert = "";
      r.forEach(intersection => {
        intersectionAlert += `<div><b><a href="maintaskform.aspx?TaskID=${
          intersection.taskid
        }&readMode=1" target="_blank">${intersection.tasktext}</a></b><br>
          Бренд: ${intersection.brand.taskText}<br>
          Программа: <a href="maintaskform.aspx?TaskID=${
            intersection.broadcast.taskid
          }&readMode=1" target="_blank">${
          intersection.broadcast.program
        }</a> ${intersection.broadcast.from
          .split("-")
          .reverse()
          .join(".")} - ${intersection.broadcast.to
          .split("-")
          .reverse()
          .join(".")}<br>
          Рекламодатель: <a href="maintaskform.aspx?TaskID=${
            intersection.reklamodatel.reklamodatelId
          }&readMode=1" target="_blank">${
          intersection.reklamodatel.reklamodatelText
        }</a><br>
          Статус: ${intersection.stateName}
        </div><br><br>`;
        // intersection.offers.forEach(o => {
        //   intersectionAlert += o.month + "." + o.year + " - " + o.offer + "\n";
        // });
      });
      if (intersectionAlert) {
        // alert(intersectionAlert);
        intersectionAlert = `<div style="max-height: 400px; overflow-y: auto;">${intersectionAlert}</div>`;
        if (window.swal) {
          window.swal({
          title: "Пересечения:",
          html: true,
          text: intersectionAlert,
          confirmButtonText: "Закрыть",
          allowOutsideClick: "true"
        });
        }
      } else {
        if (showIfNotFound && window.swal) {
          window.swal({
            title: "Пересечения:",
            html: true,
            text: "Пересечения не найдены",
            confirmButtonText: "Закрыть",
            allowOutsideClick: "true"
          });
        }
      }
    });
  }
  function fixTools() {
    isToolsFixed = !isToolsFixed;
  }
  function expandDiscounts() {
    isDiscountsExpand = !isDiscountsExpand;
  }
  function getGridsHeight() {
    if (isDiscountsExpand && isToolsFixed) {
      return window.innerHeight / 1.9 + "px";
    }
    if (isToolsFixed) {
      return window.innerHeight / 2.7 + "px";
    }
    return "inital";
  }
</script>

<style>
  .program-table {
    padding: 10px;
    transition: height ease-in 1s;
  }
  .save-btn {
    margin-top: 10px;
    cursor: pointer;
    font-size: 12px;
  }
  .pin-btn {
    cursor: pointer;
    float: right;
    margin-right: 10px;
    height: 100px;
  }
  :global(.icon.unfixed) {
    color: #9a9a9a;
  }
  .fixed {
    height: 20%;
    max-height: 20%;
    overflow: auto;
  }
</style>

<div on:keyup={changeAnyValue} transition class="program-table">
  <Tabs
    {isAdmin}
    on:save={e => {
      save(e);
    }}
    on:checkIntersection={checkIntersection}
    on:changeTab={onChangeTab}
    on:calculateSeasonalDiscount={onCalculateSeasonalDiscount}
    on:calculateAdditionalDiscount={onCalculateAdditionalDiscount}
    on:afterCalculation={onCalculate}
    {programsForCurrentTask} />
  <div>
    <span on:click={fixTools} class="pin-btn">
      {#if isToolsFixed}
        <Icon class="icon" icon={faThumbtack} />
      {:else}
        <Icon class="icon unfixed" icon={faThumbtack} />
      {/if}
    </span>
    <span on:click={expandDiscounts} class="pin-btn">
      {#if isDiscountsExpand}
        <Icon class="icon expand" icon={faArrowUp} />
      {:else}
        <Icon class="icon expand" icon={faArrowDown} />
      {/if}
    </span>
  </div>
  {#if $broadcasts[$selectedTab] && $broadcasts[$selectedTab] && $selectedTab}
    {#if isDiscountsExpand}
      <Discounts
        {highlightSeason}
        discounts={$broadcasts[$selectedTab].discounts}
        broadcastData={$broadcasts[$selectedTab]}
        {additionalDiscountsHighlight}
        periods={preparedPeriods} />
    {/if}
    {#if !$readMode}
      <CreatingProgramTools periods={preparedPeriods} />
    {/if}
    {#if $broadcasts[$selectedTab].broadcasts && $broadcasts[$selectedTab].broadcasts.length}
      <div
        class="grid-wrapper"
        class:fixed={isToolsFixed}
        style="height:{isDiscountsExpand && isToolsFixed ? window.innerHeight / 2.7 + 'px' : isToolsFixed ? window.innerHeight / 1.9 + 'px' : 'inital'}">
        {#each $broadcasts[$selectedTab].broadcasts as broadcast, i}
          <ProgramGridItem
            periods={preparedPeriods}
            {isAdmin}
            on:afterCalculationAmounts={afterCalculationAmounts}
            on:getDefaultProgramData={afterCalculationAmounts}
            {defaultAdditionalDiscounts}
            {broadcast}
            discounts={$broadcasts[$selectedTab].discounts} />
        {/each}
      </div>
    {/if}
    <Stats />
  {/if}
</div>
