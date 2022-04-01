import numeral from "numeral";

numeral.register("locale", "ru", {
  delimiters: {
    thousands: " ",
    decimal: ",",
  },
  abbreviations: {
    thousand: "тыс",
    million: "млн",
    billion: "млрд",
    trillion: "трлн",
  },
  ordinal: function (number) {
    return number === 1 ? "er" : "ème";
  },
  currency: {
    symbol: "₽",
  },
});

numeral.locale("ru");

export async function getPrograms(esmi) {
  if (!esmi) {
    return null;
  }
  const taskId = window.taskId || 0;
  esmi = esmi || null;

  let broadcasts = {};
  let response = await fetch(
    "/app/v1.2/api/publications/action/getofferdata?currenttaskid=" +
      taskId +
      "&esmi=" +
      esmi
  );
  broadcasts = await response.json();
  return broadcasts[0];
}

export async function getSponsorNames(esmi) {
  let sponsorNames = [];
  let response = await fetch(
    "/app/v1.2/api/publications/action/getsponsoroffer?broadcast=" + esmi
  );
  sponsorNames = await response.json();

  return sponsorNames.length ? sponsorNames : [];
}

export async function getProgramNames(esmi) {
  const taskId = window.taskId || 0;
  esmi = esmi || null;
  let broadcasts = [];

  let response = await fetch(
    "/app/v1.2/api/publications/action/getbroadcasts?esmi=" +
      esmi +
      "&currenttaskid=" +
      taskId
  );
  broadcasts = await response.json();

  return broadcasts.length ? broadcasts : [];
}

export function getDiscounts() {
  return {};
}

export async function getIntersection() {
  const taskId = window.taskId || 0;
  let intersections = [];
  let response = await fetch(
    "/app/v1.2/api/publications/action/checkintersections?currenttaskid=" +
      taskId
  );
  intersections = await response.json();
  return intersections;
}

export async function getAuthInfo() {
  let info = null;
  let response = await fetch("/api/auth/info");
  info = await response.json();
  return info;
}

export async function getIntersectionByBroadCast(broadcastId) {
  const taskId = window.taskId || 0;
  let intersections = [];
  let response = await fetch(
    "/app/v1.2/api/publications/action/checkintersections-newprogramm?taskid=" +
      taskId +
      "&broadcastid=" +
      broadcastId
  );
  intersections = await response.json();
  return intersections;
}

export function getMonthNameByMonthNumber(monthNumber) {
  const months = [
    "Янв",
    "Фев",
    "Март",
    "Апр",
    "Май",
    "Июнь",
    "Июль",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ];
  return months[monthNumber - 1];
}

export function monthDiff(firstDate, secondDate) {
  if (firstDate.getFullYear() === secondDate.getFullYear()) {
    return secondDate.getMonth() - firstDate.getMonth() + 1;
  }
  if (secondDate.getFullYear() > firstDate.getFullYear()) {
    const yearDiff = secondDate.getFullYear() - firstDate.getFullYear();
    const monthsFromFirstYear = 12 - firstDate.getMonth() || 1;
    if (yearDiff === 1) {
      return monthsFromFirstYear + secondDate.getMonth() + 1;
    } else {
      return (
        monthsFromFirstYear + (yearDiff - 1) * 12 + secondDate.getMonth() + 1
      );
    }
  }
}

export function prepareGridMetaDataFromDates(from, till) {
  const dateFromYear = from.getFullYear();
  const monthsCount = monthDiff(from, till);
  const months = [];
  let currentYearCount = 0;
  let currentMonth = from.getMonth();
  for (let i = 0; monthsCount > i; i++) {
    const curMonth = from.getMonth() + 1 + i;
    if (currentMonth >= 12) {
      currentYearCount++;
      currentMonth = 1;
    } else {
      currentMonth++;
    }
    months.push({
      month: currentMonth,
      year: dateFromYear + currentYearCount,
    });
  }

  return months;
}

export function getSeasonDiscount(period, seasonalDiscounts) {
  if (!seasonalDiscounts || !seasonalDiscounts.length) {
    return 0;
  }
  const seasonDiscount = seasonalDiscounts.find(
    (d) => +d.year === +period.year && +d.month === +period.month
  );
  if (seasonDiscount) {
    return getNumberValue(formatDecimals(seasonDiscount.amount, true));
  }
  return 0;
}

export function getSeasonalByPeriod(period, seasonalDiscounts) {
  if (!seasonalDiscounts || !seasonalDiscounts.length) {
    return null;
  }
  const seasonDiscount = seasonalDiscounts.find(
    (d) => +d.year === +period.year && +d.month === +period.month
  );
  if (seasonDiscount) {
    return seasonDiscount;
  }
  return null;
}

export async function getDefaultProgramData(broadcastId, sponsorOffer) {
  const taskId = window.taskId || 0;
  let defaultData = null;

  let response = await fetch(
    "/app/v1.2/api/publications/action/getbroadcastdefaultvalues?broadcastid=" +
      broadcastId +
      "&sponsoroffer=" +
      sponsorOffer +
      "&currenttaskid=" +
      taskId
  );
  defaultData = await response.json();

  return defaultData;
}

export function getLastAppState(store, state, tab) {
  if (!store || !store.length) {
    return state;
  }
  let curTab;
  if (
    store &&
    store.length &&
    store[store.length - 1] &&
    store[store.length - 1][tab]
  ) {
    curTab = store[store.length - 1][tab];
  }
  if (curTab) {
    const curState = store.pop();
    store = [...JSON.parse(JSON.stringify(store))];
    return curState;
  } else {
    return [];
  }
}

export function setAppState(
  store,
  state,
  wholeSeasonDiscounts,
  selectedAdditionalDiscount,
  tab
) {
  if (store.length >= 100) {
    store = store.slice(1);
  }
  if (state[tab]) {
    store.update((s) => {
      return [
        ...s,
        {
          [tab]: {
            broadcastsData: JSON.parse(JSON.stringify(state[tab])),
            wholeSeasonDiscounts: JSON.parse(
              JSON.stringify(wholeSeasonDiscounts[tab])
            ),
            selectedAdditionalDiscount: JSON.parse(
              JSON.stringify(selectedAdditionalDiscount[tab] || [])
            ),
          },
        },
      ];
    });
  }
}

export async function getAdditionalDiscounts(
  sponsorOfferId,
  isBroadcast,
  esmi
) {
  // КП - esmi, taskid
  // отдельная программа - esmi, taskid, sponsorOfferId
  // isBroadcast - additionalBroadcast для GridItem
  const taskId = window.taskId || 0;
  esmi = esmi || null;
  let additionalDiscounts = null;
  let url =
    "/app/v1.2/api/publications/action/getadditionaldiscounts?esmi=" +
    esmi +
    "&currenttaskid=" +
    taskId;

  if (isBroadcast) {
    url =
      "/app/v1.2/api/publications/action/getadditionaldiscounts?esmi=" +
      esmi +
      "&sponsoroffer=" +
      sponsorOfferId +
      "&currenttaskid=" +
      taskId;
  }
  let response = await fetch(url);
  additionalDiscounts = await response.json();

  return additionalDiscounts.length
    ? { data: additionalDiscounts }
    : { data: [] };
}
export async function getDiscountScale(esmi) {
  const taskId = window.taskId || 0;
  let response = await fetch(
    "/app/v1.2/api/publications/action/getdiscountscale?esmi=" +
      esmi +
      "&currenttaskid=" +
      taskId
  );
  const discounts = await response.json();
  return discounts.length ? discounts : [];
}
export function saveBroadcasts(data) {
  const taskId = window.taskId || 0;
  return postData(
    "/app/v1.2/api/publications/action/saveofferdata?currenttaskid=" + taskId,
    { data: data }
  );
}

export async function getEsmiList() {
  let esmiList = [];
  let response = await fetch("/app/v1.2/api/publications/action/getesmilist");
  esmiList = await response.json();
  return esmiList;
}

export async function getKpVersions() {
  const taskId = window.taskId || 0;
  let response = await fetch(
    "/app/v1.2/api/publications/action/get-kp-versions?taskid=" + taskId
  );
  const versions = await response.json();
  return versions;
}

export async function getOffersEsmi() {
  const taskId = window.taskId || 0;
  let esmiList = [];
  let response = await fetch(
    "/app/v1.2/api/publications/action/getoffersesmi?currenttaskid=" + taskId
  );
  esmiList = await response.json();
  return esmiList;
}

function postData(url = "", data = {}) {
  return fetch(url, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow",
    referrer: "no-referrer",
    body: JSON.stringify(data),
  });
}

export function compareBroadcasts(a, b) {
  if (+a.year < +b.year || (+a.year === +b.year && +a.month < +b.month)) {
    return -1;
  }
  if (+a.year > +b.year || (+a.year === +b.year && +a.month > +b.month)) {
    return 1;
  }

  return 0;
}

export function changeAllowedOffersAmount(broadcasts, selectedTab) {
  broadcasts.update((broadcast) => {
    const newBroadcasts = broadcast;
    newBroadcasts[selectedTab].broadcasts = newBroadcasts[
      selectedTab
    ].broadcasts.map((broadcast) => {
      const name = broadcast.name;
      const sponsorofferId = broadcast.sponsoroffer.id;
      const broadcastId = broadcast.id;

      broadcast.detalization = broadcast.detalization.map(
        (broadcastDetalization) => {
          const allOffersByNameAndSponsor = newBroadcasts[
            selectedTab
          ].broadcasts.filter(
            (b) =>
              b.name === name &&
              +b.sponsoroffer.id === +sponsorofferId &&
              +b.id === +broadcastId
          );
          let isAllowedOffersAmount = true;
          let allowedOffersByMonth = 0;
          let currentOffersByMonth = 0;

          allOffersByNameAndSponsor.forEach((o) => {
            o.detalization.forEach((d) => {
              if (
                +broadcastDetalization.month === +d.month &&
                +broadcastDetalization.year === +d.year
              ) {
                allowedOffersByMonth = +d.broadcasts;
                currentOffersByMonth += +d.offer;
              }
            });
          });

          broadcastDetalization["isAllowedOffersAmount"] =
            allowedOffersByMonth >= currentOffersByMonth;
          return broadcastDetalization;
        }
      );

      return broadcast;
    });
    return newBroadcasts;
  });
}

export function getNumberValue(number) {
  if (Number.isInteger(number)) {
    return number;
  }
  return numeral(number).value();
}

export function getNumberFromString(num) {
  if (typeof num !== "string") {
    return num;
  }
  if (num.includes(".")) {
    num = num.replace(/\./i, ",");
  }
  return getNumberValue(num);
}
export async function removeEsmi(esmi) {
  const taskId = window.taskId || 0;
  let result = "";
  let response = await fetch(
    "/app/v1.2/api/publications/action/deleteesmi?commercialofferid=" +
      esmi +
      "&taskID=" +
      taskId
  );
  result = await response;
  return result;
}

export async function generateReport() {
  const taskId = window.taskId || 0;
  let result = "";
  let response = await fetch(
    "/app/v1.2/api/publications/action/genreport?TaskID=" + taskId
  );
  result = await response;
}

export async function asyncRemoveBroadcast(broadcastId) {
  let result = "";
  let response = await fetch(
    "/app/v1.2/api/publications/action/deletebroadcast?cobroadcastid=" +
      broadcastId
  );
  result = await response.json();
  return result;
}

export function formatNumber(number) {
  return numeral(number).format();
}

export function formatDecimals(number, byThousands = false) {
  if (Number.isInteger(number)) {
    return number;
  }
  if (byThousands) {
    return removeLastZeros(numeral(number).format("0.00000000"));
  }
  return numeral(number).format("0.00");
}

export function removeLastZeros(number) {
  if (typeof number !== "string") {
    return number;
  }
  if (!number.includes(",")) {
    return number;
  }
  let newNum = number;
  if (newNum.length === 1) {
    return newNum;
  }
  if (newNum[newNum.length - 1] === "0" || newNum[newNum.length - 1] === ",") {
    newNum = removeLastZeros(newNum.slice(0, -1));
  }
  return newNum;
  // let newNumber = (number).toString();
  // newNumber = newNumber.replace(/\./g, ",");
  // return newNumber;
}

export function getAdditionalGeneralDiscount(
  additionalDiscounts,
  selectedAdditionalDiscount
) {
  const additionalGeneralDiscountCounts = [];
  if (!selectedAdditionalDiscount || !selectedAdditionalDiscount.length) {
    return additionalGeneralDiscountCounts;
  }

  selectedAdditionalDiscount =
    selectedAdditionalDiscount.sort(sortByApplyOrder);
  // группируем скидки по applyOrder (скидки в одной группе должны складываться)
  const uniqueLevels = [
    ...new Set(selectedAdditionalDiscount.map((d) => d.applyOrder)),
  ];
  const groupedDiscounts = uniqueLevels.map((level) => {
    selectedAdditionalDiscount.reduce;
    const curLevelPercentageAmount = selectedAdditionalDiscount.reduce(
      (ac, discount) => {
        if (
          discount.applyOrder === level &&
          discount.percentageAmount != null
        ) {
          return ac + getNumberFromString(discount.percentageAmount);
        }
        return ac + 0;
      },
      0
    );

    const curLevelAbsoluteAmount = selectedAdditionalDiscount.reduce(
      (ac, discount) => {
        if (discount.applyOrder === level && discount.absoluteAmount != null) {
          return ac + getNumberFromString(discount.absoluteAmount);
        }
        return ac + 0;
      },
      0
    );

    return {
      percentageAmount: curLevelPercentageAmount,
      absoluteAmount: curLevelAbsoluteAmount,
      applyOrder: level,
      description: {
        percentageAmount: curLevelPercentageAmount,
        absoluteAmount: curLevelAbsoluteAmount,
      },
    };
  });

  groupedDiscounts.forEach((discount) => {
    let additionalGeneralDiscount = discount;
    let additionalPercentageDiscountCount = 1;
    let additionalAbsoluteDiscountCount = 0;
    if (additionalGeneralDiscount) {
      additionalPercentageDiscountCount =
        1 - getNumberValue(additionalGeneralDiscount.percentageAmount) / 100;
      additionalAbsoluteDiscountCount = getNumberValue(
        additionalGeneralDiscount.absoluteAmount
      );
    }
    let buffer = {
      percentageAmount: additionalPercentageDiscountCount,
      absoluteAmount: additionalAbsoluteDiscountCount,
    };

    additionalGeneralDiscountCounts.push(buffer);
  });
  return additionalGeneralDiscountCounts;
}

export function sortByApplyOrder(a, b) {
  if (a.applyOrder > b.applyOrder) {
    return 1;
  }
  if (a.applyOrder < b.applyOrder) {
    return -1;
  }
  return 0;
}

export function getFullPriceWithoutExtraDiscounts(
  broadcasts,
  seasonalDiscounts = []
) {
  const discounts = broadcasts.discounts;
  return broadcasts.broadcasts.reduce((accumulator, broadcast) => {
    const broadcastMonthSum = broadcast.detalization.reduce((ac, period) => {
      return (
        ac + getAmountByPeriod(broadcast, period, discounts, seasonalDiscounts)
      );
    }, 0);
    return +accumulator + +broadcastMonthSum;
  }, 0);
}

export function getPriceWithoutDiscountsForBroadcast(
  period,
  broadcast,
  withoutCoeff = false
) {
  const coeff = withoutCoeff
    ? 1
    : getNumberValue(formatDecimals(broadcast.defaultcoeff, true));
  return getNumberFromString(
    getPriceWithoutDiscountsAndCoeffForBroadcast(period, broadcast) * coeff
  );
}

export function getPriceWithoutDiscountsAndCoeffForBroadcast(
  period,
  broadcast
) {
  const amountsInOneProgram = +period.quantity || 0;
  const offersCount =
    broadcast.detalization.find(
      (d) => +d.year === +period.year && +d.month === +period.month
    ) || 0;
  const priceInSeconds = getNumberValue(broadcast.price)
    ? getNumberFromString(formatDecimals(broadcast.price, true)) / 60
    : 0;
  // console.log('getPriceWithoutDiscountsAndCoeffForBroadcast', period, priceInSeconds, broadcast.timing, amountsInOneProgram, offersCount.offer)
  // console.log('getPriceWithoutDiscountsAndCoeffForBroadcast', period, priceInSeconds * broadcast.timing * amountsInOneProgram * offersCount.offer)
  return (
    priceInSeconds * broadcast.timing * amountsInOneProgram * offersCount.offer
  );
}

export function compareDescriptions(a, b) {
  if (a.description < b.description) {
    return -1;
  }
  if (a.description > b.description) {
    return 1;
  }
  return 0;
}

export function getAmountByPeriod(
  broadcast,
  period,
  discounts,
  wholeSeasonDiscounts,
  withoutExtraDiscount = false,
  withoutCoeff = false,
  withoutSeasonalDiscount = false,
  withoutWholeSaleDiscount = false
) {
  const priceWithoutDiscount = getPriceWithoutDiscountsForBroadcast(
    period,
    broadcast,
    withoutCoeff
  );
  const extraDiscount = withoutExtraDiscount
    ? 1
    : 1 + discounts.additional / 100;
  const additionalSeasonDiscount = broadcast.detalization.find(
    (d) => +period.month === +d.month && +period.year === +d.year
  );
  const additionalSeasonDiscountAmount =
    1 + +additionalSeasonDiscount.additionalDiscount / 100 || 1;
  let seasonalDiscounts = [];

  if (
    wholeSeasonDiscounts &&
    wholeSeasonDiscounts.length &&
    broadcast.standartDeviationOptions &&
    broadcast.standartDeviationOptions.useSeasonalDiscount
  ) {
    seasonalDiscounts = wholeSeasonDiscounts;
  }
  let seasonalDiscount = 1;
  if (getSeasonDiscount(period, seasonalDiscounts)) {
    const seasonalAmount = getSeasonDiscount(period, seasonalDiscounts);
    if (seasonalAmount > 0) {
      seasonalDiscount = 1 + seasonalAmount / 100;
    } else {
      seasonalDiscount = 1 - -seasonalAmount / 100;
    }
  }
  if (withoutSeasonalDiscount) {
    seasonalDiscount = 1;
  }

  const wholesaleDiscount = withoutWholeSaleDiscount
    ? 1
    : 1 - +discounts.wholesale / 100;
  let priceWithoutAdditionalDiscount =
    priceWithoutDiscount *
    seasonalDiscount *
    (1 - +discounts.agency / 100) *
    wholesaleDiscount *
    extraDiscount *
    additionalSeasonDiscountAmount;
  // console.log('seasonalDiscount',seasonalDiscount)
  // console.log('(1 - (+discounts.agency/100))',(1 - (+discounts.agency/100)))
  // console.log('wholesaleDiscount',wholesaleDiscount)
  // console.log('extraDiscount',extraDiscount)
  // console.log('additionalSeasonDiscountAmount',additionalSeasonDiscountAmount)
  // console.log('with discounts:',priceWithoutAdditionalDiscount)

  let fulladditionalGeneralDiscount = 0;
  priceWithoutAdditionalDiscount =
    priceWithoutAdditionalDiscount * (1 - fulladditionalGeneralDiscount);

  broadcast.additional.forEach((additionalBroadcastDiscount) => {
    priceWithoutAdditionalDiscount =
      priceWithoutAdditionalDiscount *
      (1 - additionalBroadcastDiscount.amount / 100);
  });

  // console.log(period, priceWithoutAdditionalDiscount)

  return Math.round(priceWithoutAdditionalDiscount);
}

export function roundNum(num) {
  return Math.round(num * 100) / 100;
}

export function formatEventValue(event, value) {
  event.target.value = formatDecimals(getNumberFromString(value), true);
}

export function calculateDetalization(
  broadcast,
  detalization,
  $broadcasts,
  $selectedTab,
  $wholeSeasonDiscounts,
  $additionalDiscounts,
  $selectedAdditionalDiscount,
  defaultAdditionalDiscounts
) {
  // console.log('afterCalculationAmounts wholesale', $broadcasts[$selectedTab].discounts.wholesale)
  const amount = getNumberValue(
    getAmountByPeriod(
      broadcast,
      detalization,
      $broadcasts[$selectedTab].discounts,
      $wholeSeasonDiscounts[$selectedTab]
    )
  );
  const amountWithoutCoeff = getNumberValue(
    getAmountByPeriod(
      broadcast,
      detalization,
      $broadcasts[$selectedTab].discounts,
      $wholeSeasonDiscounts[$selectedTab],
      false,
      true
    )
  );

  const additionalDiscount = getAdditionalGeneralDiscount(
    $additionalDiscounts[$selectedTab] || defaultAdditionalDiscounts,
    $selectedAdditionalDiscount[$selectedTab]
  );
  let amountWithDiscount = amount;
  additionalDiscount.forEach((d) => {
    amountWithDiscount -= Math.round(
      amount * (1 - d.percentageAmount) + d.absoluteAmount
    );
  });
  detalization["amount"] = amount;
  detalization["amountWithoutCoeff"] = amountWithoutCoeff;
  detalization["amountWithoutAdditionalDiscount"] = getNumberValue(
    getAmountByPeriod(
      broadcast,
      detalization,
      $broadcasts[$selectedTab].discounts,
      $wholeSeasonDiscounts[$selectedTab],
      true
    )
  );
  detalization["amountWithoutDiscounts"] = getPriceWithoutDiscountsForBroadcast(
    detalization,
    broadcast
  );
  detalization["amountWithoutSeasonalDiscount"] = getNumberValue(
    getAmountByPeriod(
      broadcast,
      detalization,
      $broadcasts[$selectedTab].discounts,
      $wholeSeasonDiscounts[$selectedTab],
      false,
      false,
      true,
      false
    )
  );
  detalization["amountWithDiscount"] = amountWithDiscount;
  // console.log('broadcast.TVR', 20, 'broadcast.defaultquantity', 'broadcast.timing', 'broadcast.overallquantity');
  // console.log(+broadcast.TVR, '/', 20, +broadcast.defaultquantity, +broadcast.timing, +broadcast.overallquantity);
  broadcast.GRP =
    (+broadcast.TVR / 20) *
    +broadcast.defaultquantity *
    +broadcast.timing *
    +broadcast.overallquantity;
  // d.GRP20 = ((+d.TVR18 || 0) * broadcast.timing * +d.offer) / 20;
  detalization.GRP20 =
    (detalization.TVR18 *
      broadcast.timing *
      +broadcast.defaultquantity *
      +detalization.offer) /
    20;
  detalization.cppClassicPrice =
    detalization.GRP20 *
    (detalization.cppClient || detalization.cppClassic || 0);
  detalization.cppClassicDiff = 0;
  if (detalization.amount && detalization.cppClassicPrice) {
    detalization.cppClassicDiff =
      detalization.amount / detalization.cppClassicPrice;
  }
  return detalization;
}

export function toNumber(val) {
  if (typeof val == "number") return val;
  return parseFloat(val.replace(",", "."));
}
