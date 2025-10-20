import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      hero_title: "Let the <1>Best Traders</1> Make You Money",
      hero_text: "Copy the strategies of top-performing traders and grow your portfolio without effort.",
      hero_button: "MAKE MONEY NOW",
      login_button: "Enter System",
      stats_1: "Total Invested",
      stats_2: "Members Trust Us",
      stats_3: "Trading Volume",
    },
  },
  es: {
    translation: {
      hero_title: "Deja que los <1>Mejores Traders</1> Hagan Dinero por Ti",
      hero_text: "Copia las estrategias de los traders más exitosos y haz crecer tu portafolio sin esfuerzo.",
      hero_button: "GANA DINERO AHORA",
      login_button: "Entrar al Sistema",
      stats_1: "Total Invertido",
      stats_2: "Miembros Confían",
      stats_3: "Volumen de Trading",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
