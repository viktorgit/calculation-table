import { writable } from "svelte/store";

export const broadcasts = writable({});
export const selectedTab = writable(0);
export const additionalDiscounts = writable([]);
export const selectedAdditionalDiscount = writable([]);
export const wholeSeasonDiscounts = writable([]);
export const tvChannels = writable();
export const selectedProgram = writable([]);
export const sponsors = writable([]);
export const selectedSponsor = writable([]);
export const preparedPeriods = writable([]);
export const programs = writable([]);
export const discountsScale = writable([]);
export const isDirty = writable(false);
export const selectedCalulatingParamsType = writable("");
export const singleSeasonalDiscountBroadcast = writable("");
export const singleSeasonalDiscountMonth = writable("");
export const seasonalDiscountMonth = writable("");
export const coefficientDiscountBroadcast = writable("");
export const fullPrice = writable([]);
export const fullPriceWithoutExtraDiscounts = writable([]);
export const standartConditionDeviation = writable([]);
export const fullAmountWithDiscounts = writable([]);
export const isDataSaving = writable(false);
export const sumByMonth = writable([]);
export const discountsEmitter = writable([]);
export const readMode = writable(false);
export const isTableUnlocked = writable(false);
export const actionStore = writable([]);
export const grpByMonth = writable([]);
// установлена ли Объемная скидка вручную
export const isWholesaleCustom = writable(true);

//изминение коеффициента, стор нужен для костыля, чтоб отловить коеффициент после расчета при подборе параметров
export const changeCoeff = writable(0);
