import { describe, expect, it } from 'vitest';
import { toCyrillicScript, toLatinScript } from '../lib/text/latinScript';

describe('toLatinScript', () => {
  it('transliterates RS station names to Bosnian/Serbian Latin script', () => {
    expect(toLatinScript('Калиновик')).toBe('Kalinovik');
    expect(toLatinScript('Бања Лука')).toBe('Banja Luka');
    expect(toLatinScript('Љубиње')).toBe('Ljubinje');
    expect(toLatinScript('Његошева')).toBe('Njegoševa');
    expect(toLatinScript('Џеп')).toBe('Džep');
    expect(toLatinScript('Чајниче')).toBe('Čajniče');
  });

  it('leaves existing Latin names unchanged', () => {
    expect(toLatinScript('Široki Brijeg')).toBe('Široki Brijeg');
  });
});

describe('toCyrillicScript', () => {
  it('transliterates station names and digraphs for the RS display', () => {
    expect(toCyrillicScript('Kalinovik')).toBe('\u041a\u0430\u043b\u0438\u043d\u043e\u0432\u0438\u043a');
    expect(toCyrillicScript('Banja Luka')).toBe('\u0411\u0430\u045a\u0430 \u041b\u0443\u043a\u0430');
    expect(toCyrillicScript('Ljubinje')).toBe('\u0409\u0443\u0431\u0438\u045a\u0435');
  });
});
