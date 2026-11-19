// Transformaciones que xml_model.php aplica a cada valor antes de escribirlo
// en el XML. Se replican tal cual, incluidos sus efectos raros: son lo que
// el SRI viene recibiendo hoy.

import { aTexto, htmlEntityDecode, htmlspecialcharsSinDobleCodificar, isset } from './php';

// replace_caracter(): mismo orden que en xml_model.php. Cada par se aplica
// dos veces, en UTF-8 y con utf8_decode(), como hace el original.
const REEMPLAZOS_CARACTER: Array<[string, string]> = [
  ['Ñ', 'N'], ['ñ', 'n'], ['*', ''], ['Ã‘', 'N'],
  ['Á', 'A'], ['á', 'a'], ['À', 'A'],
  ['É', 'E'], ['é', 'e'], ['È', 'E'], ['è', 'e'],
  ['Í', 'I'], ['í', 'i'], ['Ì', 'I'], ['ì', 'i'],
  ['Ó', 'O'], ['ó', 'o'], ['Ò', 'O'], ['ò', 'o'],
  ['Ú', 'U'], ['ú', 'u'], ['Ù', 'U'], ['ù', 'u'],
  ['', ''], ['$', ''], ['ñ', 'n'],
  ['Ñ', 'N'], ['~', ''],
  ['°', ''], ["\\'", ''], ['"', ''],
  ['‘', ''], ['&', ' '], ['à', 'a'], [':', ' '],
  ['$', ' '],
];

const PERMITIDOS = new Set(
  Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -@()#_./;%', 'latin1'),
);

// utf8_decode(): caracteres hasta U+00FF quedan como un byte; el resto, '?'.
function utf8Decode(texto: string): Buffer {
  const bytes: number[] = [];
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0)!;
    bytes.push(codigo <= 0xff ? codigo : 0x3f);
  }
  return Buffer.from(bytes);
}

function reemplazarBytes(origen: Buffer, buscar: Buffer, reemplazo: Buffer): Buffer {
  if (buscar.length === 0) return origen;

  const partes: Buffer[] = [];
  let desde = 0;
  let posicion = origen.indexOf(buscar, desde);
  while (posicion !== -1) {
    partes.push(origen.subarray(desde, posicion), reemplazo);
    desde = posicion + buscar.length;
    posicion = origen.indexOf(buscar, desde);
  }
  if (partes.length === 0) return origen;
  partes.push(origen.subarray(desde));
  return Buffer.concat(partes);
}

// Se trabaja en bytes porque el original es str_replace() y preg_replace()
// sin modificador /u: un caracter no permitido de 2 bytes deja 2 espacios.
export function replaceCaracter(texto: string): string {
  let bytes: Buffer = Buffer.from(texto, 'utf8');

  for (const [buscar, reemplazo] of REEMPLAZOS_CARACTER) {
    const reemplazoBytes = Buffer.from(reemplazo, 'utf8');
    bytes = reemplazarBytes(bytes, Buffer.from(buscar, 'utf8'), reemplazoBytes);
    bytes = reemplazarBytes(bytes, utf8Decode(buscar), reemplazoBytes);
  }

  const limpio = Buffer.from(bytes);
  for (let i = 0; i < limpio.length; i++) {
    if (!PERMITIDOS.has(limpio[i])) limpio[i] = 0x20;
  }
  return limpio.toString('latin1');
}

// xml_escape()
export function xmlEscape(valor: unknown): string {
  const escapado = htmlspecialcharsSinDobleCodificar(htmlEntityDecode(aTexto(valor)));
  return escapado === '' ? '-' : escapado;
}

// replace_coheco(): arregla texto con doble codificación que llega del ERP.
// Las variantes con utf8_decode() del original no pueden coincidir con
// texto UTF-8 válido, así que no hace falta repetirlas.
export function replaceCoheco(texto: string): string {
  return texto
    .split('Ãš').join('Ú')
    .split('Ã³').join('ó')
    .split('Ã¡').join('á')
    .split('Ã©').join('é');
}

const VALORES_POR_DEFECTO: Array<[string, string]> = [
  ['pais_origen', '0'], ['capacidad', '0'], ['cilindraje', '0'], ['tonelaje', '0'], ['tipo', '0'],
  ['numero_chasis', '0'], ['numero_motor', '0'], ['cam', '0'], ['anio', '0'], ['color', '0'],
  ['email', 'notiene@notiene.com'], ['telefono', '000'], ['direccion', 'Av'], ['orden_compra', '-'],
  ['observaciones2', '-'], ['observacion', '-'], ['Observaciones', '-'],
];

// (object)$bill: copia superficial del comprobante.
export function copiarObjeto(datos: unknown): Record<string, unknown> {
  if (datos !== null && typeof datos === 'object') return { ...(datos as Record<string, unknown>) };
  return {};
}

// Inicio de build_data(): copia del comprobante con el reemplazo del email
// y los valores por defecto de los campos que faltan.
export function objetoConValoresPorDefecto(datos: unknown): Record<string, unknown> {
  const objeto = copiarObjeto(datos);

  if (isset(objeto, 'email')) objeto.email = aTexto(objeto.email).split('|').join(';');

  for (const [campo, valor] of VALORES_POR_DEFECTO) {
    if (!isset(objeto, campo)) objeto[campo] = valor;
  }
  return objeto;
}
