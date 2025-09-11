import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { ChevronDown } from "lucide-react";

const languages = [
  { code: 'en', name: 'EN', flag: '🇺🇸' },
  { code: 'pt', name: 'PT', flag: '🇧🇷' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.resolvedLanguage) || languages[0];

  return (
    <div data-testid="language-switcher">
      <Select 
        value={i18n.resolvedLanguage} 
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger className="w-auto min-w-[70px] h-8 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors" data-testid="select-language">
          <SelectValue>
            <span className="flex items-center gap-1.5">
              <span className="text-sm">{currentLanguage.flag}</span>
              <span className="text-sm font-medium">{currentLanguage.name}</span>
            </span>
          </SelectValue>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </SelectTrigger>
        <SelectContent className="min-w-[120px]">
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <span className="flex items-center gap-2">
                <span>{language.flag}</span>
                <span className="font-medium">{language.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}