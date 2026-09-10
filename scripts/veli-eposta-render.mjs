import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const data=JSON.parse(readFileSync(0,'utf8'));
const c=vm.createContext({});
vm.runInContext(readFileSync(new URL('./apps-script/veli-eposta-sablon.gs',import.meta.url),'utf8'),c);
process.stdout.write(c.veliEpostaDuzMetin(data.metin,data.dil,data.baslik));
