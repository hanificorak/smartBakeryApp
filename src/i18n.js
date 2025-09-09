import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import tr from "./locales/tr.json";
import de from "./locales/de.json";
import en from "./locales/en.json";
import AsyncStorage from "@react-native-async-storage/async-storage";

const resources = {
  tr: { translation: tr },
  de: { translation: de },
  en: { translation: en },
};

const deviceLanguage = "de";

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    resources,
    lng: deviceLanguage, // cihaz diliyle başla
    fallbackLng: "tr",   // bulamazsa türkçe
    interpolation: { escapeValue: false },
  });

export default i18n;
