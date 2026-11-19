import { MotorCompatible } from '../src/domain/compatible/motor-compatible';
import { XmldomLectorPlantillaAdapter } from '../src/infrastructure/plantillas/xmldom-lector-plantilla.adapter';

const lector = new XmldomLectorPlantillaAdapter();
const motor = new MotorCompatible();

const EMPRESA = {
  ruc: '1790598616001',
  name: 'EMPRESA DE PRUEBA S.A.',
  environment: '2',
  accounting: 'SI',
  code_contributor: '5',
};

function generar(props: string, comprobante: Record<string, unknown>, tipoComprobante = '01'): string {
  const plantilla = `<?xml version="1.0" encoding="UTF-8"?><tags><prop name="raiz" type="padre">${props}</prop></tags>`;
  return motor.generar(lector.leer(plantilla), comprobante, { empresa: EMPRESA, tipoComprobante });
}

// Texto del primer elemento con ese nombre.
function texto(xml: string, elemento: string): string | undefined {
  const coincidencia = new RegExp(`<${elemento}(?: [^>]*)?>([^<]*)</${elemento}>`).exec(xml);
  return coincidencia?.[1];
}

describe('motor compatible con xml_model.php', () => {
  describe('formato de salida', () => {
    it('indenta como DOMDocument con formatOutput', () => {
      const xml = generar(
        '<prop name="grupo" type="padre" add="id,version" values="comprobante,1.1.0">' +
          '<prop name="campo" type="fix" value="01"/>' +
          '<prop name="vacio" type="fix" value=""/>' +
          '</prop>',
        {},
      );

      expect(xml).toBe(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<raiz>\n' +
          '  <grupo id="comprobante" version="1.1.0">\n' +
          '    <campo>01</campo>\n' +
          '    <vacio/>\n' +
          '  </grupo>\n' +
          '</raiz>\n',
      );
    });

    it('con más etiquetas que valores en add, los atributos sobrantes quedan vacíos', () => {
      const xml = generar('<prop name="campo" type="fix" value="X" add="a,b,c" values="1,2"/>', {});
      expect(xml).toContain('<campo a="1" b="2" c="">X</campo>');
    });
  });

  describe('textos', () => {
    it('quita tildes y eñes, y & queda como " amp;"', () => {
      const xml = generar('<prop name="nombre" type="string" model="vw" var="nombre" size="300"/>', {
        nombre: 'PEÑA & Cía',
      });
      expect(texto(xml, 'nombre')).toBe('PENA  amp; Cia');
    });

    it('leer el mismo campo dos veces en el mismo nivel lo codifica encima', () => {
      const xml = generar(
        '<prop name="primera" type="string" model="vw" var="nombre" size="300"/>' +
          '<prop name="segunda" type="string" model="vw" var="nombre" size="300"/>',
        { nombre: 'PEÑA & Cía' },
      );
      expect(texto(xml, 'primera')).toBe('PENA  amp; Cia');
      expect(texto(xml, 'segunda')).toBe('PE Ntilde;A  amp; C iacute;a');
    });

    it('un nivel nuevo vuelve a partir del dato original', () => {
      const xml = generar(
        '<prop name="primera" type="string" model="vw" var="nombre" size="300"/>' +
          '<prop name="hijo" type="padre"><prop name="otraVez" type="string" model="vw" var="nombre" size="300"/></prop>',
        { nombre: 'PEÑA & Cía' },
      );
      expect(texto(xml, 'otraVez')).toBe('PENA  amp; Cia');
    });

    it('el corte por tamaño se hace sobre el texto con entidades', () => {
      const xml = generar('<prop name="corto" type="string" model="vw" var="dato" size="10"/>', {
        dato: 'ABCDEá',
      });
      expect(texto(xml, 'corto')).toBe('ABCDE amp;aacu');
    });

    it('si el corte parte un carácter, el campo queda como guion', () => {
      const xml = generar('<prop name="corto" type="string" model="vw" var="dato" size="100"/>', {
        dato: 'x'.repeat(98) + '😀',
      });
      expect(texto(xml, 'corto')).toBe('-');
    });

    it('un campo que no existe se escribe como guion', () => {
      const xml = generar('<prop name="falta" type="string" model="vw" var="no_existe" size="10"/>', {});
      expect(texto(xml, 'falta')).toBe('-');
    });

    it('un valor que queda vacío tras limpiar caracteres deja la etiqueta abierta y cerrada', () => {
      const xml = generar('<prop name="asterisco" type="string" model="vw" var="dato" size="10"/>', {
        dato: '*',
      });
      expect(xml).toContain('<asterisco></asterisco>');
    });

    it('usa los valores por defecto de campos que faltan', () => {
      const xml = generar(
        '<prop name="direccion" type="string" model="vw" var="direccion" size="50"/>' +
          '<prop name="email" type="string" model="vw" var="email" size="50"/>',
        {},
      );
      expect(texto(xml, 'direccion')).toBe('Av');
      expect(texto(xml, 'email')).toBe('notiene@notiene.com');
    });

    it('varias variables separadas por coma se unen con ;', () => {
      const xml = generar(
        '<prop name="unidos" type="string" model="vw" var="telefono,ciudad" size="100"/>' +
          '<prop name="ciudadDespues" type="string" model="vw" var="ciudad" size="100"/>',
        { ciudad: 'Cañar' },
      );
      expect(texto(xml, 'unidos')).toBe('000;Canar');
      // La unión quedó guardada en la última variable, ya codificada.
      expect(texto(xml, 'ciudadDespues')).toBe('000;Ca ntilde;ar');
    });

    it('regimenMicroempresas y contribuyenteRimpe conservan las tildes', () => {
      const xml = generar('<prop name="contribuyenteRimpe" type="string" model="vw" var="rimpe" size="100"/>', {
        rimpe: 'CONTRIBUYENTE RÉGIMEN RIMPE',
      });
      expect(texto(xml, 'contribuyenteRimpe')).toBe('CONTRIBUYENTE RÉGIMEN RIMPE');
    });

    it('contribuyenteEspecial se rellena con ceros a la izquierda', () => {
      const xml = generar(
        '<prop name="contribuyenteEspecial" type="string" model="db" var="code_contributor" size="10"/>',
        {},
      );
      expect(texto(xml, 'contribuyenteEspecial')).toBe('005');
    });
  });

  describe('números y fechas', () => {
    it('redondea como number_format', () => {
      const xml = generar(
        '<prop name="a" type="float" model="vw" var="a" decimal="2"/>' +
          '<prop name="b" type="float" model="vw" var="b" decimal="4"/>' +
          '<prop name="c" type="float" model="vw" var="c"/>' +
          '<prop name="d" type="float" model="vw" var="d" decimal="2"/>',
        { a: 1.005, b: '3350', c: 4.6, d: 'abc' },
      );
      expect(texto(xml, 'a')).toBe('1.01');
      expect(texto(xml, 'b')).toBe('3350.0000');
      expect(texto(xml, 'c')).toBe('5');
      expect(texto(xml, 'd')).toBe('0.00');
    });

    it('formatea fechas y deja guion si no la reconoce', () => {
      const xml = generar(
        '<prop name="fecha" type="date" model="vw" var="fecha" format="d/m/Y"/>' +
          '<prop name="mala" type="date" model="vw" var="mala" format="d/m/Y"/>',
        { fecha: '2026-09-10', mala: '31/31/2026' },
      );
      expect(texto(xml, 'fecha')).toBe('10/09/2026');
      expect(texto(xml, 'mala')).toBe('-');
    });
  });

  describe('otros tipos de prop', () => {
    it('cond: "0" y vacío son falsos, "0.00" es verdadero', () => {
      const xml = generar(
        '<prop name="texto" type="cond" model="vw" var="t" true="SI" false="NO"/>' +
          '<prop name="cero" type="cond" model="vw" var="c" true="SI" false="NO"/>' +
          '<prop name="ceroDecimal" type="cond" model="vw" var="cd" true="SI" false="NO"/>' +
          '<prop name="falta" type="cond" model="vw" var="f" true="SI" false="NO"/>',
        { t: 'hola', c: '0', cd: '0.00' },
      );
      expect(texto(xml, 'texto')).toBe('SI');
      expect(texto(xml, 'cero')).toBe('NO');
      expect(texto(xml, 'ceroDecimal')).toBe('SI');
      expect(texto(xml, 'falta')).toBe('NO');
    });

    it('info: el valor va en el segundo atributo, o "vacio"', () => {
      const xml = generar(
        '<prop name="lleno" type="info" model="vw" var="v" size="5" add="nombre,valor" values="Etiqueta,x"/>' +
          '<prop name="sinValor" type="info" model="vw" var="nada" size="5" add="nombre,valor" values="Otra"/>',
        { v: 'abcdefgh' },
      );
      expect(xml).toContain('<lleno nombre="Etiqueta" valor="abcde"/>');
      expect(xml).toContain('<sinValor nombre="Otra" valor="vacio"/>');
    });

    it('sri: calcula la clave de acceso con ambiente 2', () => {
      const xml = generar('<prop name="clave" type="string" model="sri" var="clave" size="50"/>', {
        fecha: '2026-09-10',
        serie: '001',
        punto_emision: '001',
        secuencial: '000016089',
      });
      expect(texto(xml, 'clave')).toBe('1009202601179059861600120010010000160890001608911');
    });

    it('array: una lista vacía no genera la etiqueta', () => {
      const xml = generar(
        '<prop name="lista" type="array" model="vw" var="items"><item name="item" type="padre"><prop name="x" type="string" model="index" var="x" size="5"/></item></prop>',
        { items: [] },
      );
      expect(xml).not.toContain('<lista');
    });

    it('array: cada elemento arranca con sus propios valores por defecto', () => {
      const xml = generar(
        '<prop name="lista" type="array" model="vw" var="items">' +
          '<item name="item" type="padre">' +
          '<prop name="x" type="string" model="index" var="x" size="5"/>' +
          '<prop name="direccion" type="string" model="index" var="direccion" size="20"/>' +
          '</item></prop>',
        { items: [{ x: 'abcdefg' }, { x: 'z', direccion: 'Quito' }] },
      );
      expect(xml).toContain('<item>\n      <x>abcde</x>\n      <direccion>Av</direccion>\n    </item>');
      expect(xml).toContain('<item>\n      <x>z</x>\n      <direccion>Quito</direccion>\n    </item>');
    });
  });
});
