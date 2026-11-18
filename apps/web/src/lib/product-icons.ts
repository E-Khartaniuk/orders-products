type IconRule = { icon: string; keywords: string[] };

const RULES: IconRule[] = [
  { icon: "bi-motherboard", keywords: ["motherboard", "mainboard", "материнск"] },
  { icon: "bi-laptop", keywords: ["laptop", "notebook", "macbook", "ноутбук"] },
  { icon: "bi-display", keywords: ["monitor", "display", "screen", "монитор", "дисплей"] },
  { icon: "bi-keyboard", keywords: ["keyboard", "клавиатур"] },
  { icon: "bi-mouse", keywords: ["mouse", "mice", "мыш"] },
  { icon: "bi-headphones", keywords: ["headphone", "headset", "наушник", "гарнитур"] },
  { icon: "bi-webcam", keywords: ["webcam", "веб-камер", "вебкамер"] },
  { icon: "bi-camera", keywords: ["camera", "камер", "фотоаппарат"] },
  { icon: "bi-printer", keywords: ["printer", "mfp", "принтер", "мфу"] },
  { icon: "bi-projector", keywords: ["projector", "проектор"] },
  { icon: "bi-tablet", keywords: ["tablet", "ipad", "планшет"] },
  { icon: "bi-phone", keywords: ["phone", "smartphone", "телефон", "смартфон"] },
  { icon: "bi-gpu-card", keywords: ["gpu", "graphics", "video card", "видеокарт"] },
  { icon: "bi-cpu", keywords: ["cpu", "processor", "процессор"] },
  { icon: "bi-memory", keywords: ["memory", "ram", "dimm", "памят"] },
  { icon: "bi-device-ssd", keywords: ["ssd", "nvme"] },
  { icon: "bi-device-hdd", keywords: ["hdd", "hard drive", "storage", "диск", "накопител"] },
  { icon: "bi-usb-drive", keywords: ["usb", "flash", "флеш"] },
  { icon: "bi-router", keywords: ["router", "wi-fi", "wifi", "роутер", "маршрутизатор"] },
  { icon: "bi-hdd-network", keywords: ["switch", "nas", "коммутатор"] },
  { icon: "bi-server", keywords: ["server", "сервер"] },
  { icon: "bi-speaker", keywords: ["speaker", "колонк", "акустик"] },
  { icon: "bi-mic", keywords: ["microphone", "микрофон"] },
  { icon: "bi-tv", keywords: ["tv", "television", "телевизор"] },
  { icon: "bi-pc-display", keywords: ["desktop", "computer", "pc", "компьютер", "системн"] },
  { icon: "bi-plug", keywords: ["cable", "adapter", "charger", "кабел", "адаптер", "заряд"] },
];

export const DEFAULT_PRODUCT_ICON = "bi-box-seam";

export function productIconFor(type: string) {
  const normalized = type.toLowerCase();
  const words = normalized.split(/[^\p{L}\p{N}-]+/u).filter(Boolean);
  const matches = (keyword: string) =>
    keyword.length <= 3 ? words.includes(keyword) : normalized.includes(keyword);

  return RULES.find((rule) => rule.keywords.some(matches))?.icon ?? DEFAULT_PRODUCT_ICON;
}
