/** Yalnız ihtida formunun aşamalı görünümü; veri ve gönderim ortak çekirdekte kalır. */
import { formAdimlariniBaslat } from './form-adimlari';

export function ihtidaAdimlariniBaslat(form: HTMLFormElement, dogrula: (bolumler: HTMLElement[]) => boolean) {
  return formAdimlariniBaslat(form, dogrula, { kok: '[data-ihtida-adimlar]' });
}
