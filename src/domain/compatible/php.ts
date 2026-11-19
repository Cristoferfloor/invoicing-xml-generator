// Equivalentes exactos de las funciones de PHP que usa xml_model.php. El
// modo compatible tiene que producir el mismo XML que el sistema actual, y
// varias de estas funciones se comportan distinto a sus parecidas de JS
// (substr cuenta bytes, trim quita otros caracteres, el redondeo, etc.).

import { CODIGO_POR_ENTIDAD, ENTIDAD_POR_CODIGO } from './entidades-html401';

// Marca un texto al que substr() le partio un caracter UTF-8 por la mitad.
// En PHP ese texto queda con bytes invalidos y htmlspecialchars() lo
// convierte en cadena vacia; aqui se representa con este caracter, que no
// puede venir en datos reales.
export const UTF8_CORTADO = '\u{10FFFF}';

const ESPACIOS_TRIM = ' \t\n\r\0\x0B';

export function aTexto(valor: unknown): string {
  if (valor === null || valor === undefined || valor === false) return '';
  if (valor === true) return '1';
  if (typeof valor === 'number') return numeroATexto(valor);
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'object') return 'Array';
  return String(valor);
}

// (string) de un float en PHP: 14 digitos significativos (precision=14).
function numeroATexto(numero: number): string {
  if (Number.isNaN(numero)) return 'NAN';
  if (!Number.isFinite(numero)) return numero > 0 ? 'INF' : '-INF';
  if (Number.isInteger(numero) && Math.abs(numero) < 1e15) return String(numero);

  const [mantisa, exponenteTexto] = numero.toExponential(13).split('e');
  const exponente = Number(exponenteTexto);

  if (exponente < -4 || exponente >= 14) {
    let base = mantisa.replace(/\.?0+$/, '');
    if (!base.includes('.')) base += '.0';
    return `${base}E${exponente < 0 ? '-' : '+'}${Math.abs(exponente)}`;
  }

  return numero.toFixed(Math.max(0, 13 - exponente)).replace(/\.?0+$/, '');
}

export function trim(texto: string): string {
  let inicio = 0;
  let fin = texto.length;
  while (inicio < fin && ESPACIOS_TRIM.includes(texto[inicio])) inicio++;
  while (fin > inicio && ESPACIOS_TRIM.includes(texto[fin - 1])) fin--;
  return texto.slice(inicio, fin);
}

// isset($objeto->campo)
export function isset(objeto: Record<string, unknown>, campo: string): boolean {
  return Object.prototype.hasOwnProperty.call(objeto, campo) && objeto[campo] !== null && objeto[campo] !== undefined;
}

// empty($valor)
export function vacio(valor: unknown): boolean {
  if (valor === null || valor === undefined || valor === false) return true;
  if (valor === '' || valor === '0' || valor === 0) return true;
  if (Array.isArray(valor)) return valor.length === 0;
  if (typeof valor === 'object') return Object.keys(valor).length === 0;
  return false;
}

// (int)$texto
export function aEntero(valor: unknown): number {
  const coincidencia = /^[ \t\n\r\v\f]*([+-]?\d+)/.exec(aTexto(valor));
  return coincidencia ? parseInt(coincidencia[1], 10) : 0;
}

// (float)$valor
export function aDecimal(valor: unknown): number {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === 'boolean') return valor ? 1 : 0;
  if (valor === null || valor === undefined) return 0;
  if (typeof valor === 'object') return vacio(valor) ? 0 : 1;

  const coincidencia = /^[ \t\n\r\v\f]*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/.exec(valor as string);
  return coincidencia ? Number(coincidencia[1]) : 0;
}

// explode(',', $texto)
export function explode(separador: string, texto: string | undefined): string[] {
  return (texto ?? '').split(separador);
}

// substr($texto, 0, $largo): cuenta bytes, no caracteres. PHP 5 devuelve
// false si el texto de entrada esta vacio.
export function substr(texto: string, largo: number): string | false {
  const bytes = Buffer.from(texto, 'utf8');
  if (bytes.length === 0) return false;
  if (largo <= 0) return '';
  if (largo >= bytes.length) return texto;

  const corte = bytes.subarray(0, largo);
  let inicioSecuencia = corte.length - 1;
  while (inicioSecuencia > 0 && (corte[inicioSecuencia] & 0xc0) === 0x80) inicioSecuencia--;

  const lider = corte[inicioSecuencia];
  const largoEsperado = lider >= 0xf0 ? 4 : lider >= 0xe0 ? 3 : lider >= 0xc0 ? 2 : 1;
  const completo = corte.length - inicioSecuencia >= largoEsperado;

  return completo
    ? corte.toString('utf8')
    : corte.subarray(0, inicioSecuencia).toString('utf8') + UTF8_CORTADO;
}

// str_pad($texto, $largo, $relleno, STR_PAD_LEFT)
export function rellenarIzquierda(texto: string, largo: number, relleno: string): string {
  const faltan = largo - Buffer.byteLength(texto, 'utf8');
  return faltan > 0 ? relleno.repeat(faltan).slice(0, faltan) + texto : texto;
}

// htmlentities($texto, ENT_QUOTES, 'UTF-8')
export function htmlentities(texto: string): string {
  let salida = '';
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0)!;
    if (codigo === 39) salida += '&#039;';
    else {
      const entidad = ENTIDAD_POR_CODIGO.get(codigo);
      salida += entidad ? `&${entidad};` : caracter;
    }
  }
  return salida;
}

const ENTIDAD = /&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([A-Za-z][A-Za-z0-9]*));/g;
const ENTIDAD_EN_POSICION = /&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([A-Za-z][A-Za-z0-9]*));/y;

function codigoValido(codigo: number): boolean {
  return codigo > 0 && codigo <= 0x10ffff && !(codigo >= 0xd800 && codigo <= 0xdfff);
}

// html_entity_decode($texto, ENT_QUOTES, 'UTF-8')
export function htmlEntityDecode(texto: string): string {
  return texto.replace(ENTIDAD, (completa, decimal?: string, hexadecimal?: string, nombre?: string) => {
    if (nombre !== undefined) {
      const codigo = CODIGO_POR_ENTIDAD.get(nombre);
      return codigo === undefined ? completa : String.fromCodePoint(codigo);
    }
    const codigo = decimal !== undefined ? parseInt(decimal, 10) : parseInt(hexadecimal!, 16);
    return codigoValido(codigo) ? String.fromCodePoint(codigo) : completa;
  });
}

// htmlspecialchars($texto, ENT_QUOTES, 'UTF-8', false): sin volver a
// codificar entidades que ya lo estan.
export function htmlspecialcharsSinDobleCodificar(texto: string): string {
  if (texto.includes(UTF8_CORTADO)) return '';

  let salida = '';
  for (let i = 0; i < texto.length; i++) {
    const caracter = texto[i];
    switch (caracter) {
      case '&': {
        ENTIDAD_EN_POSICION.lastIndex = i;
        const coincidencia = ENTIDAD_EN_POSICION.exec(texto);
        const esEntidadValida =
          coincidencia !== null &&
          (coincidencia[3] !== undefined
            ? CODIGO_POR_ENTIDAD.has(coincidencia[3])
            : codigoValido(
                coincidencia[1] !== undefined ? parseInt(coincidencia[1], 10) : parseInt(coincidencia[2], 16),
              ));
        salida += esEntidadValida ? '&' : '&amp;';
        break;
      }
      case '"': salida += '&quot;'; break;
      case "'": salida += '&#039;'; break;
      case '<': salida += '&lt;'; break;
      case '>': salida += '&gt;'; break;
      default: salida += caracter;
    }
  }
  return salida;
}

// number_format($valor, $decimales, '.', ''): redondeo "mitad hacia afuera"
// con el pre-redondeo de PHP, para que 1.005 dé 1.01 y no 1.00 como en JS.
export function numberFormat(valor: number, decimales: number): string {
  const lugares = Math.max(0, Math.trunc(decimales));
  const numero = Number.isFinite(valor) ? valor : 0;
  const escalado = Number((Math.abs(numero) * 10 ** lugares).toPrecision(15));
  const redondeado = Math.round(escalado);

  let digitos = BigInt(redondeado).toString();
  if (lugares > 0) {
    digitos = digitos.padStart(lugares + 1, '0');
    digitos = `${digitos.slice(0, -lugares)}.${digitos.slice(-lugares)}`;
  }

  return numero < 0 && redondeado !== 0 ? `-${digitos}` : digitos;
}

// date_create($valor) + date_format($fecha, $formato). Cubre los formatos en
// que llegan fechas del ERP; si no la reconoce devuelve false, igual que
// date_format() cuando date_create() falla.
export function formatearFecha(valor: unknown, formato: string, ahora: Date = new Date()): string | false {
  const texto = trim(aTexto(valor));
  const partes = texto === '' ? partesDeFecha(ahora) : leerFecha(texto);
  if (!partes) return false;

  let salida = '';
  for (let i = 0; i < formato.length; i++) {
    const letra = formato[i];
    switch (letra) {
      case 'd': salida += dos(partes.dia); break;
      case 'j': salida += String(partes.dia); break;
      case 'm': salida += dos(partes.mes); break;
      case 'n': salida += String(partes.mes); break;
      case 'Y': salida += String(partes.anio); break;
      case 'y': salida += dos(partes.anio % 100); break;
      case 'H': salida += dos(partes.hora); break;
      case 'G': salida += String(partes.hora); break;
      case 'i': salida += dos(partes.minuto); break;
      case 's': salida += dos(partes.segundo); break;
      case '\\': i++; salida += formato[i] ?? ''; break;
      default: salida += letra;
    }
  }
  return salida;
}

interface PartesFecha {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  segundo: number;
}

function dos(numero: number): string {
  return String(numero).padStart(2, '0');
}

function partesDeFecha(fecha: Date): PartesFecha {
  return {
    anio: fecha.getFullYear(),
    mes: fecha.getMonth() + 1,
    dia: fecha.getDate(),
    hora: fecha.getHours(),
    minuto: fecha.getMinutes(),
    segundo: fecha.getSeconds(),
  };
}

const HORA = '(?:[T ](\\d{1,2}):(\\d{2})(?::(\\d{2})(?:\\.\\d+)?)?)?(?:Z|[+-]\\d{2}:?\\d{2})?';

const FORMATOS: Array<{ patron: RegExp; orden: [number, number, number] }> = [
  { patron: new RegExp(`^(\\d{4})-(\\d{1,2})-(\\d{1,2})${HORA}$`), orden: [1, 2, 3] },
  { patron: new RegExp(`^(\\d{4})/(\\d{1,2})/(\\d{1,2})${HORA}$`), orden: [1, 2, 3] },
  // Con barras y el año al final, PHP lo interpreta como mes/dia/año.
  { patron: new RegExp(`^(\\d{1,2})/(\\d{1,2})/(\\d{4})${HORA}$`), orden: [3, 1, 2] },
  { patron: new RegExp(`^(\\d{1,2})-(\\d{1,2})-(\\d{4})${HORA}$`), orden: [3, 2, 1] },
  { patron: new RegExp(`^(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})${HORA}$`), orden: [3, 2, 1] },
];

function leerFecha(texto: string): PartesFecha | null {
  for (const { patron, orden } of FORMATOS) {
    const c = patron.exec(texto);
    if (!c) continue;

    const anio = Number(c[orden[0]]);
    const mes = Number(c[orden[1]]);
    const dia = Number(c[orden[2]]);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

    // PHP acepta dias fuera de rango (30 de febrero) y los pasa al mes siguiente.
    const fecha = new Date(Date.UTC(anio, mes - 1, dia, Number(c[4] ?? 0), Number(c[5] ?? 0), Number(c[6] ?? 0)));
    return {
      anio: fecha.getUTCFullYear(),
      mes: fecha.getUTCMonth() + 1,
      dia: fecha.getUTCDate(),
      hora: fecha.getUTCHours(),
      minuto: fecha.getUTCMinutes(),
      segundo: fecha.getUTCSeconds(),
    };
  }
  return null;
}
