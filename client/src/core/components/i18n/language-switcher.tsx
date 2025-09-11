import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Globe } from "lucide-react";

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.resolvedLanguage) || languages[0];

  return (
    <div className="flex items-center gap-2" data-testid="language-switcher">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select 
        value={i18n.resolvedLanguage} 
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger className="w-auto min-w-[120px]" data-testid="select-language">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{currentLanguage.flag}</span>
              <span>{currentLanguage.name}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <span className="flex items-center gap-2">
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}