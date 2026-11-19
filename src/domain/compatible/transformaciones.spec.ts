import { objetoConValoresPorDefecto, replaceCaracter, replaceCoheco, xmlEscape } from './transformaciones';

describe('transformaciones de xml_model.php', () => {
  describe('replace_caracter', () => {
    it('quita tildes y eñes, y cambia & por espacio', () => {
      expect(replaceCaracter('PEÑA Ñandú & Cía')).toBe('PENA Nandu   Cia');
    });

    it('borra $ ~ ° y signos de pregunta, y cambia : por espacio', () => {
      expect(replaceCaracter('Precio: $100 ~ 50° ¿?')).toBe('Precio  100  50   ');
    });

    it('un carácter no permitido de 2 bytes deja 2 espacios', () => {
      expect(replaceCaracter('ü')).toBe('  ');
    });

    it('conserva los caracteres permitidos', () => {
      expect(replaceCaracter('a@b.com;c-d_e/f (g) #10 50%')).toBe('a@b.com;c-d_e/f (g) #10 50%');
    });
  });

  describe('xml_escape', () => {
    it('vacío se escribe como guion', () => {
      expect(xmlEscape('')).toBe('-');
      expect(xmlEscape(false)).toBe('-');
    });

    it('decodifica entidades y vuelve a escapar solo lo necesario', () => {
      expect(xmlEscape('Pe&ntilde;a')).toBe('Peña');
      expect(xmlEscape('A & B')).toBe('A &amp; B');
    });
  });

  it('replace_coheco arregla doble codificación', () => {
    expect(replaceCoheco('ConstrucciÃ³n Ãšnica')).toBe('Construcción Única');
  });

  it('aplica valores por defecto y cambia | por ; en el email', () => {
    const objeto = objetoConValoresPorDefecto({ email: 'a@b.com|c@d.com', ciudad: null });

    expect(objeto.email).toBe('a@b.com;c@d.com');
    expect(objeto.telefono).toBe('000');
    expect(objeto.direccion).toBe('Av');
    expect(objeto.orden_compra).toBe('-');
    expect(objeto.ciudad).toBeNull();
  });
});
