import { claveAccesoCompatible, digitoVerificador } from './clave-acceso';

describe('clave de acceso', () => {
  it('reproduce una clave real autorizada por el SRI', () => {
    const clave = claveAccesoCompatible(
      { ruc: '1790598616001' },
      { fecha: '2026-09-10', serie: '001', punto_emision: '001', secuencial: '000016089' },
      '2',
      '01',
    );

    expect(clave).toBe('1009202601179059861600120010010000160890001608911');
  });

  it('usa solo los dos primeros caracteres del tipo de comprobante', () => {
    const exportacion = claveAccesoCompatible(
      { ruc: '1790598616001' },
      { fecha: '2026-09-10', serie: '001', punto_emision: '001', secuencial: '000016089' },
      '2',
      '01-E',
    );

    expect(exportacion.slice(8, 10)).toBe('01');
  });

  it('calcula el dígito verificador con módulo 11', () => {
    expect(digitoVerificador('100920260117905986160012001001000016089000160891')).toBe('1');
  });
});
