
export type CardRank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K";
type CardSuit = "s" | "d" | "c" | "h";
type CardMapping = {
  [K in CardRank]: {
    [S in CardSuit]: string;
  }
};
export const card_mapping : CardMapping  = {
  "A": {
    "s": "🂡",
    "d": "🃁",
    "c": "🃑",
    "h": "🂱"
  },
  "2": {
    "s": "🂢",
    "d": "🃂",
    "c": "🃒",
    "h": "🂲"
  },
  "3": {
    "s": "🂣",
    "d": "🃃",
    "c": "🃓",
    "h": "🂳"
  },
  "4": {
    "s": "🂤",
    "d": "🃄",
    "c": "🃔",
    "h": "🂴"
  },
  "5": {
    "s": "🂥",
    "d": "🃅",
    "c": "🃕",
    "h": "🂵"
  },
  "6": {
    "s": "🂦",
    "d": "🃆",
    "c": "🃖",
    "h": "🂶"
  },
  "7": {
    "s": "🂧",
    "d": "🃇",
    "c": "🃗",
    "h": "🂷"
  },
  "8": {
    "s": "🂨",
    "d": "🃈",
    "c": "🃘",
    "h": "🂸"
  },
  "9": {
    "s": "🂩",
    "d": "🃉",
    "c": "🃙",
    "h": "🂹"
  },
  "T": {
    "s": "🂪",
    "d": "🃊",
    "c": "🃚",
    "h": "🂺"
  },
  "J": {
    "s": "🂫",
    "d": "🃋",
    "c": "🃛",
    "h": "🂻"
  },
  "Q": {
    "s": "🂭",
    "d": "🃍",
    "c": "🃝",
    "h": "🂽"
  },
  "K": {
    "s": "🂮",
    "d": "🃎",
    "c": "🃞",
    "h": "🂾"
  }
}
export function convertToUnicode(hand: string): string | null {
  const match = hand.match(/^([A-KQJ2-9]|T)([sdch])$/);
  if (!match) return null;
  const rank = match[1] as CardRank;
  const suit = match[2] as CardSuit;
  return card_mapping[rank][suit];
}

export const cardToShorthand = (card: string): string => {
  for (const value in card_mapping) {
    for (const suit in card_mapping[value as CardRank]) {
      if (card_mapping[value as CardRank][suit as CardSuit] === card) {
        return `${value}${suit}`;
      }
    }
  }
  return "";
};
