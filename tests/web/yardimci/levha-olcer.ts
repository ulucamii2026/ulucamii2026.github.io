/* Playwright ekran testleri için: çiziciyi ve sığdırmayı sayfada doğrudan çağırmak üzere pencereye açar. Üretim
   paketine girmez; test anında esbuild ile paketlenip page.addScriptTag ile eklenir (ekran.spec.mjs → levhaOlcerYukle). */
import { levhaSigdir, slaytCiz } from '../../../src/ekran/slaytlar.ts';

(window as unknown as { __levha: unknown }).__levha = { slaytCiz, levhaSigdir };
