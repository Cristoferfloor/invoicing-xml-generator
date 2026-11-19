import {
  aDecimal,
  aEntero,
  aTexto,
  formatearFecha,
  htmlEntityDecode,
  htmlentities,
  htmlspecialcharsSinDobleCodificar,
  numberFormat,
  substr,
  trim,
  UTF8_CORTADO,
  vacio,
} from './php';

describe('funciones equivalentes de PHP', () => {
  describe('number_format', () => {
    it.each([
      [1.005, 2, '1.01'],
      [2.675, 2, '2.68'],
      [3350, 2, '3350.00'],
      [3350, 4, '3350.0000'],
      [502.5, 2, '502.50'],
      [4.6, 0, '5'],
      [-2.5, 0, '-3'],
      [1.25, 1, '1.3'],
      [1234567.891, 2, '1234567.89'],
      [0, 2, '0.00'],
    ])('number_format(%p, %p) = %p', (valor, decimales, esperado) => {
      expect(numberFormat(valor, decimales)).toBe(esperado);
    });
  });

  describe('(float) y (int)', () => {
    it('toma el número del inicio del texto', () => {
      expect(aDecimal('12.345abc')).toBe(12.345);
      expect(aDecimal(' 12.5')).toBe(12.5);
      expect(aDecimal('1e3')).toBe(1000);
      expect(aDecimal('abc')).toBe(0);
      expect(aEntero('150')).toBe(150);
      expect(aEntero('12abc')).toBe(12);
      expect(aEntero(undefined)).toBe(0);
    });
  });

  describe('(string)', () => {
    it('convierte como PHP', () => {
      expect(aTexto(502.5)).toBe('502.5');
      expect(aTexto(3350)).toBe('3350');
      expect(aTexto(0.1 + 0.2)).toBe('0.3');
      expect(aTexto(true)).toBe('1');
      expect(aTexto(null)).toBe('');
    });
  });

  describe('substr cuenta bytes', () => {
    it('corta por bytes UTF-8', () => {
      expect(substr('abcdef', 3)).toBe('abc');
      expect(substr('abc', 10)).toBe('abc');
      expect(substr('abc', 0)).toBe('');
      expect(substr('ñandu', 2)).toBe('ñ');
    });

    it('devuelve false con texto vacío, como PHP 5', () => {
      expect(substr('', 5)).toBe(false);
    });

    it('marca el texto si parte un carácter por la mitad', () => {
      expect(substr('ñandu', 1)).toBe(UTF8_CORTADO);
    });
  });

  it('trim no quita espacios no separables', () => {
    expect(trim('  \t a \n')).toBe('a');
    expect(trim(' a ')).toBe(' a');
  });

  it('empty() de PHP', () => {
    expect(vacio('0')).toBe(true);
    expect(vacio('0.00')).toBe(false);
    expect(vacio([])).toBe(true);
    expect(vacio([1])).toBe(false);
  });

  describe('entidades HTML', () => {
    it('htmlentities con ENT_QUOTES', () => {
      expect(htmlentities(`Peña & 'Hijos' "S.A." <x>`)).toBe(
        'Pe&ntilde;a &amp; &#039;Hijos&#039; &quot;S.A.&quot; &lt;x&gt;',
      );
    });

    it('html_entity_decode no conoce &apos; en HTML 4.01', () => {
      expect(htmlEntityDecode('Pe&ntilde;a &amp; &#039; &apos; &#x41;')).toBe("Peña & ' &apos; A");
    });

    it('htmlspecialchars sin volver a codificar entidades válidas', () => {
      expect(htmlspecialcharsSinDobleCodificar("A &amp; B & C &ntilde; &apos; 'x'")).toBe(
        'A &amp; B &amp; C &ntilde; &amp;apos; &#039;x&#039;',
      );
    });

    it('htmlspecialchars devuelve vacío si hay un carácter partido', () => {
      expect(htmlspecialcharsSinDobleCodificar(`abc${UTF8_CORTADO}`)).toBe('');
    });
  });

  describe('fechas (date_create + date_format)', () => {
    it.each([
      ['2026-09-10', 'd/m/Y', '10/09/2026'],
      ['2026-09-10 08:39:05', 'd/m/Y H:i:s', '10/09/2026 08:39:05'],
      ['2026-09-10T08:39:05-05:00', 'Y-m-d', '2026-09-10'],
      ['10/09/2026', 'd/m/Y', '09/10/2026'],
      ['10-09-2026', 'd/m/Y', '10/09/2026'],
      ['2026-02-30', 'd/m/Y', '02/03/2026'],
      ['2026-09-10', 'dmY', '10092026'],
    ])('%p con formato %p = %p', (valor, formato, esperado) => {
      expect(formatearFecha(valor, formato)).toBe(esperado);
    });

    it('devuelve false si no reconoce la fecha', () => {
      expect(formatearFecha('31/31/2026', 'd/m/Y')).toBe(false);
      expect(formatearFecha('no es fecha', 'd/m/Y')).toBe(false);
    });

    it('sin fecha usa el momento actual', () => {
      expect(formatearFecha('', 'Y', new Date(2030, 0, 1))).toBe('2030');
    });
  });
});
