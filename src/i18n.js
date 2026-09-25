import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { registerInscriptEditorTranslations } from 'inscript-editor/locales';

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

// inscript-editor ships English only (since 0.3.0); the app supplies the editor's
// strings for every other language it supports.
import editorDe from './locales/editor/de.json';
import editorFr from './locales/editor/fr.json';
import editorEs from './locales/editor/es.json';
import editorPt from './locales/editor/pt.json';
import editorIt from './locales/editor/it.json';
import editorJa from './locales/editor/ja.json';
import editorZh from './locales/editor/zh.json';
import editorZhCN from './locales/editor/zh-CN.json';
import editorKo from './locales/editor/ko.json';
import editorRu from './locales/editor/ru.json';
import editorAf from './locales/editor/af.json';
import editorNe from './locales/editor/ne.json';
import editorHi from './locales/editor/hi.json';
import editorBn from './locales/editor/bn.json';
import editorTa from './locales/editor/ta.json';
import editorTe from './locales/editor/te.json';
import editorMl from './locales/editor/ml.json';
import editorKn from './locales/editor/kn.json';

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

// Registered explicitly (rather than relying on inscript-editor's own auto-registration)
// so the editor's strings are available in every one of the app's supported languages
// as soon as i18n is ready, with no dependency on component mount order.
registerInscriptEditorTranslations(i18n, {
  overrides: {
    de: editorDe,
    fr: editorFr,
    es: editorEs,
    pt: editorPt,
    it: editorIt,
    ja: editorJa,
    zh: editorZh,
    'zh-CN': editorZhCN,
    ko: editorKo,
    ru: editorRu,
    af: editorAf,
    ne: editorNe,
    hi: editorHi,
    bn: editorBn,
    ta: editorTa,
    te: editorTe,
    ml: editorMl,
    kn: editorKn
  }
});

export default i18n;
