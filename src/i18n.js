import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import zhCN from './locales/zh-CN.json';
import ko from './locales/ko.json';
import ru from './locales/ru.json';
import af from './locales/af.json';
import ne from './locales/ne.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import ml from './locales/ml.json';
import kn from './locales/kn.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
      pt: { translation: pt },
      it: { translation: it },
      ja: { translation: ja },
      zh: { translation: zh },
      'zh-CN': { translation: zhCN },
      ko: { translation: ko },
      ru: { translation: ru },
      af: { translation: af },
      ne: { translation: ne },
      hi: { translation: hi },
      bn: { translation: bn },
      ta: { translation: ta },
      te: { translation: te },
      ml: { translation: ml },
      kn: { translation: kn }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
