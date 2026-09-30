const CYRILLIC_TO_LATIN: Record<string, string> = {
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Ђ: 'Đ', Е: 'E', Ж: 'Ž', З: 'Z', И: 'I', Ј: 'J',
  К: 'K', Л: 'L', Љ: 'Lj', М: 'M', Н: 'N', Њ: 'Nj', О: 'O', П: 'P', Р: 'R', С: 'S', Т: 'T',
  Ћ: 'Ć', У: 'U', Ф: 'F', Х: 'H', Ц: 'C', Ч: 'Č', Џ: 'Dž', Ш: 'Š',
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z', и: 'i', ј: 'j',
  к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'č', џ: 'dž', ш: 'š',
};

/** Converts Serbian Cyrillic to Latin for stable station keys. */
export function toLatinScript(value: string): string {
  return Array.from(value, (character) => CYRILLIC_TO_LATIN[character] ?? character).join('');
}

const LATIN_TO_CYRILLIC: Record<string, string> = Object.fromEntries(
  Object.entries(CYRILLIC_TO_LATIN)
    .filter(([, latin]) => latin.length === 1)
    .map(([cyrillic, latin]) => [latin, cyrillic]),
);

const DIGRAPHS: Record<string, string> = {
  lj: 'љ', nj: 'њ', dž: 'џ',
  Lj: 'Љ', Nj: 'Њ', Dž: 'Џ',
  LJ: 'Љ', NJ: 'Њ', DŽ: 'Џ',
};

/** Converts Bosnian/Serbian Latin station labels to Serbian Cyrillic for RS users. */
export function toCyrillicScript(value: string): string {
  return toLatinScript(value).replace(/DŽ|Dž|dž|LJ|Lj|lj|NJ|Nj|nj|[A-Za-zČĆĐŠŽčćđšž]/g,
    (part) => DIGRAPHS[part] ?? LATIN_TO_CYRILLIC[part] ?? part);
}
