import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import es from "./locales/es.json";
import gl from "./locales/gl.json";

const LANGUAGE_KEY = "@opo-tracker:language";

const resources = {
  es: { translation: es },
  //gl: { translation: gl },
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

  if (!savedLanguage) {
    const deviceLanguage = Localization.getLocales()[0]?.languageCode || "es";
    //savedLanguage = deviceLanguage === 'gl' ? 'gl' : 'es'; TODO: FINISH TO TRANSLATE ALL TEXTS
    savedLanguage = "es";
  }

  i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: "es",
    interpolation: {
      escapeValue: false,
    },
  });
};

export const changeLanguage = async (language: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
  await i18n.changeLanguage(language);
};

export const getCurrentLanguage = () => i18n.language;

initI18n();

export default i18n;
