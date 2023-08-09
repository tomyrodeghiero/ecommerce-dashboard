export function formatPriceARS(price: any): any {
  let priceStr = price.toFixed(2).replace(".", ",");

  let [entirePart, decimalPart] = priceStr.split(",");

  let regex = /\B(?=(\d{3})+(?!\d))/g;
  entirePart = entirePart.replace(regex, ".");

  priceStr = entirePart + "," + decimalPart;

  priceStr = `$ ${priceStr}`;

  return priceStr;
}

export const removeEnLangPrefix = (path: string): string => {
  const prefix = "/en";
  if (path.startsWith(prefix)) {
    return path.replace(prefix, "");
  }
  return path;
};
