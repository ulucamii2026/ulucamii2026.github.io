/** Native reads this closed numeric snapshot; no native-callable JS interface, timer or network work is installed. */
export function renderKur(pencere: object): { ilerle: () => void } {
  let sayac = 0;
  Object.defineProperty(pencere, 'UluRenderDurumu', {
    enumerable: false, configurable: false, writable: false,
    value: () => Object.freeze({ v: 1, sayfa: 'site', sayac }),
  });
  return { ilerle: () => { if (sayac < 2_147_483_647) sayac += 1; } };
}
