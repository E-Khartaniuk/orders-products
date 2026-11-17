import type ru from "./messages/ru.json";
import type { Locale } from "./config";

declare module "use-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof ru;
  }
}
