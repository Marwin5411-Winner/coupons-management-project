import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'th' ? 'en' : 'th';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-sm"
      title={i18n.language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
    >
      {i18n.language === 'th' ? 'EN' : 'ไทย'}
    </button>
  );
}
