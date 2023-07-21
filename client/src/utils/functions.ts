export function formatPriceARS(precio: any): any {
  let priceStr = precio.toFixed(2).replace(".", ",");

  let [entirePart, decimalPart] = priceStr.split(",");

  let regex = /\B(?=(\d{3})+(?!\d))/g;
  entirePart = entirePart.replace(regex, ".");

  priceStr = entirePart + "," + decimalPart;

  priceStr = `$ ${priceStr}`;

  return priceStr;
}
