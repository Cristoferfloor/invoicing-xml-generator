import { aTexto, formatearFecha } from './compatible/php';

// Módulo 11 con pesos 2 a 7 desde la derecha, como obtener_digito_verificador().
export function digitoVerificador(digitos: string): string {
  const pesos = [2, 3, 4, 5, 6, 7];
  let suma = 0;
  for (let i = digitos.length - 1, p = 0; i >= 0; i--, p++) {
    const digito = Number(digitos[i]);
    suma += (Number.isNaN(digito) ? 0 : digito) * pesos[p % 6];
  }
  const resultado = 11 - (suma % 11);
  return resultado === 11 ? '0' : resultado === 10 ? '1' : String(resultado);
}

// get_clave_acceso() de clave_helper.php: fecha, tipo de comprobante, RUC,
// ambiente, serie + punto de emisión + secuencial, código numérico (los
// últimos 8 dígitos del secuencial), tipo de emisión 1 y dígito verificador.
export function claveAccesoCompatible(
  empresa: Record<string, unknown>,
  comprobante: Record<string, unknown>,
  ambiente: string,
  tipoComprobante: string,
): string {
  const fecha = formatearFecha(comprobante.fecha, 'dmY');
  const secuencial = aTexto(comprobante.secuencial);

  const base =
    (fecha === false ? '' : fecha) +
    tipoComprobante.slice(0, 2) +
    aTexto(empresa.ruc) +
    ambiente +
    aTexto(comprobante.serie) +
    aTexto(comprobante.punto_emision) +
    secuencial +
    secuencial.slice(1, 9) +
    '1';

  return base + digitoVerificador(base);
}
