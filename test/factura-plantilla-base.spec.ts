import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MotorCompatible } from '../src/domain/compatible/motor-compatible';
import { XmldomLectorPlantillaAdapter } from '../src/infrastructure/plantillas/xmldom-lector-plantilla.adapter';

// Plantilla base generica de facturas (template_enterprise/template_sri del
// sistema actual). No es de ninguna empresa: solo prueba el motor.
const plantilla = new XmldomLectorPlantillaAdapter().leer(
  readFileSync(join(__dirname, 'fixtures/factura-base.xml'), 'utf8'),
);

const empresa = {
  ruc: '9999999999001',
  name: 'EMPRESA DE PRUEBA S.A.',
  address: 'Av. de las Pruebas N° 123 y Principal',
  environment: '1',
  accounting: 'SI',
};

const comprobante = {
  fecha: '2026-09-10',
  serie: '001',
  punto_emision: '001',
  secuencial: '000000123',
  clave_acceso: '1009202601999999999900110010010000001230000012312',
  agente: '1',
  tipo_ruc: '04',
  nombre_cliente: 'CLIENTE FICTICIO C.A.',
  ruc: '9999999998001',
  subtotalP: 3350,
  descuento: 0,
  base_sin_iva: 0,
  codigo_iva: 4,
  base_iva: 3350,
  valor_impuesto: 502.5,
  total: 3852.5,
  pagos: [{ codigo_pago: '20', total: 3852.5, plazo: '1', tiempo: 'Dias' }],
  productos: [
    {
      codigo_producto: '411.06',
      descripcion_producto: 'Servicio de soporte técnico',
      cantidad: 1,
      precio_unitario: 3350,
      descuento: 0,
      precio_venta: 3350,
      codigo_iva_p: 4,
      impuesto: 15,
      valor_impuesto: 502.5,
    },
  ],
  email: 'cliente@ejemplo.test|facturas@ejemplo.test',
  vendedor: 'María Ñúñez',
};

const xml = new MotorCompatible().generar(plantilla, comprobante, { empresa, tipoComprobante: '01' });

function texto(elemento: string): string | undefined {
  return new RegExp(`<${elemento}(?: [^>]*)?>([^<]*)</${elemento}>`).exec(xml)?.[1];
}

describe('factura con la plantilla base', () => {
  it('arranca con la raíz y sus atributos', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<factura id="comprobante" version="1.1.0">\n')).toBe(true);
  });

  it('infoTributaria toma datos de la empresa y del comprobante', () => {
    expect(texto('ambiente')).toBe('1');
    expect(texto('tipoEmision')).toBe('1');
    expect(texto('razonSocial')).toBe('EMPRESA DE PRUEBA S.A.');
    expect(texto('claveAcceso')).toBe(comprobante.clave_acceso);
    expect(texto('codDoc')).toBe('01');
    expect(texto('secuencial')).toBe('000000123');
    expect(texto('dirMatriz')).toBe('Av. de las Pruebas N 123 y Principal');
    expect(texto('agenteRetencion')).toBe('1');
  });

  it('infoFactura con fechas y montos formateados', () => {
    expect(texto('fechaEmision')).toBe('10/09/2026');
    expect(texto('totalSinImpuestos')).toBe('3350.00');
    expect(texto('importeTotal')).toBe('3852.50');
    expect(texto('moneda')).toBe('DOLAR');
    expect(xml).toContain('<codigoPorcentaje>4</codigoPorcentaje>');
  });

  it('pagos y detalles', () => {
    expect(xml).toContain('<formaPago>20</formaPago>');
    expect(xml).toContain('<precioUnitario>3350.0000</precioUnitario>');
    expect(xml).toContain('<descripcion>Servicio de soporte tecnico</descripcion>');
    expect(xml).toContain('<tarifa>15.00</tarifa>');
  });

  it('campos adicionales, con valores por defecto y guion donde falta el dato', () => {
    expect(xml).toContain('<campoAdicional nombre="Email">cliente@ejemplo.test;facturas@ejemplo.test</campoAdicional>');
    expect(xml).toContain('<campoAdicional nombre="Vendedor">Maria Nunez</campoAdicional>');
    expect(xml).toContain('<campoAdicional nombre="Direccion">Av</campoAdicional>');
    expect(xml).toContain('<campoAdicional nombre="Telefono">000</campoAdicional>');
    expect(xml).toContain('<campoAdicional nombre="Ciudad">-</campoAdicional>');
  });
});
