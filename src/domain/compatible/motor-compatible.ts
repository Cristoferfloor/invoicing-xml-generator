// Recorre una plantilla del lenguaje actual y arma el XML igual que
// xml_model.php::build_data(). Cada rama del switch corresponde a un "type"
// de <prop>.

import { claveAccesoCompatible } from '../clave-acceso';
import { atributo, hijosLlamados, NodoPlantilla } from './plantilla';
import {
  aDecimal,
  aEntero,
  aTexto,
  explode,
  formatearFecha,
  htmlentities,
  isset,
  numberFormat,
  rellenarIzquierda,
  substr,
  trim,
  vacio,
} from './php';
import { copiarObjeto, objetoConValoresPorDefecto, replaceCaracter, replaceCoheco, xmlEscape } from './transformaciones';
import {
  ContenedorXml,
  crearElemento,
  ElementoXml,
  fijarAtributo,
  NodoXml,
  serializarDocumento,
} from './xml-salida';

export interface ContextoCompatible {
  empresa: Record<string, unknown>;
  tipoComprobante: string;
}

// Estos dos campos se escriben sin quitar tildes (replace_caracter no se
// les aplica): llevan textos legales como "RÉGIMEN".
const SIN_REEMPLAZO_DE_CARACTERES = new Set(['regimenMicroempresas', 'contribuyenteRimpe']);

// get_value_from_clave() calcula la clave con ambiente 2 fijo.
const AMBIENTE_CLAVE_COMPATIBLE = '2';

export class MotorCompatible {
  generar(plantilla: NodoPlantilla[], comprobante: Record<string, unknown>, contexto: ContextoCompatible): string {
    const documento: ContenedorXml = { hijos: [] };
    this.construir(plantilla, comprobante, documento, contexto);
    return serializarDocumento(documento.hijos);
  }

  private construir(
    nodos: NodoPlantilla[],
    datos: unknown,
    padre: ContenedorXml,
    contexto: ContextoCompatible,
  ): void {
    // Cada nivel trabaja sobre su propia copia: las lecturas "vw" la
    // modifican (ver leerValorComprobante) y eso no pasa a los hijos.
    const objeto = objetoConValoresPorDefecto(datos);

    for (const prop of nodos) {
      const nombre = atributo(prop, 'name') ?? '';
      const variable = atributo(prop, 'var');

      switch (atributo(prop, 'type')) {
        case 'array': {
          const detalles = variable === undefined ? undefined : objeto[variable];
          if (vacio(detalles)) break;

          const lista = crearElemento(nombre);
          agregar(padre, lista);
          for (const item of valoresIterables(detalles)) {
            this.construir(hijosLlamados(prop, 'item'), item, lista, contexto);
          }
          break;
        }

        case 'padre': {
          const elemento = crearElemento(nombre);
          // Los hijos reciben el comprobante original, no la copia de este nivel.
          this.construir(hijosLlamados(prop, 'prop'), datos, elemento, contexto);
          agregarAtributos(prop, elemento);
          agregar(padre, elemento);
          break;
        }

        case 'fix': {
          const elemento = elementoConValor(nombre, atributo(prop, 'value'));
          agregarAtributos(prop, elemento);
          agregar(padre, elemento);
          break;
        }

        case 'cond': {
          // Se evalúa sobre una copia sin valores por defecto.
          const valor = leerValorComprobante(copiarObjeto(datos), variable);
          const elemento = elementoConValor(nombre, esVerdadero(valor) ? atributo(prop, 'true') : atributo(prop, 'false'));
          agregarAtributos(prop, elemento);
          agregar(padre, elemento);
          break;
        }

        case 'info': {
          const valor = convertirSalida(prop, this.leerValor(prop, objeto, variable, contexto));
          const elemento = crearElemento(nombre);
          if (atributo(prop, 'add') !== undefined) agregarAtributosInfo(prop, elemento, valor);
          agregar(padre, elemento);
          break;
        }

        default: {
          let valor = xmlEscape(convertirSalida(prop, this.leerValor(prop, objeto, variable, contexto)));
          if (!SIN_REEMPLAZO_DE_CARACTERES.has(nombre)) valor = replaceCaracter(valor);
          if (nombre === 'contribuyenteEspecial') valor = rellenarIzquierda(valor, 3, '0');

          const elemento = crearElemento(trim(nombre));
          elemento.hijos.push({ texto: valor });
          agregarAtributos(prop, elemento);
          agregar(padre, elemento);
        }
      }
    }
  }

  private leerValor(
    prop: NodoPlantilla,
    objeto: Record<string, unknown>,
    variable: string | undefined,
    contexto: ContextoCompatible,
  ): unknown {
    switch (atributo(prop, 'model')) {
      case 'db':
        return variable === undefined ? null : contexto.empresa[variable];
      case 'sri':
        return claveAccesoCompatible(contexto.empresa, objeto, AMBIENTE_CLAVE_COMPATIBLE, contexto.tipoComprobante);
      default:
        return leerValorComprobante(objeto, variable);
    }
  }
}

// get_value_from_vw(). Ojo: guarda el valor ya pasado por htmlentities() en
// el objeto. Si el mismo campo se lee otra vez en el mismo nivel, se vuelve a
// codificar encima. Con varias variables separadas por coma, las une con ";"
// y guarda el resultado en la última de ellas.
function leerValorComprobante(objeto: Record<string, unknown>, variable: string | undefined): unknown {
  if (variable === undefined) return '';

  let valor: unknown = isset(objeto, variable) ? objeto[variable] : '';
  let campoDestino = variable;

  if (variable.indexOf(',') > 0) {
    const variables = variable.split(',');
    valor = variables
      .map((actual) => replaceCoheco(aTexto(objeto[actual])).split('Ã').join('í'))
      .join(';');
    campoDestino = variables[variables.length - 1];
  }

  // Con un arreglo, str_replace() y htmlentities() de PHP terminan en null.
  if (valor !== null && typeof valor === 'object') {
    objeto[campoDestino] = null;
    return null;
  }

  const codificado = htmlentities(replaceCoheco(aTexto(valor)).split('Ã').join('í'));
  objeto[campoDestino] = codificado;
  return codificado;
}

// convert_output()
function convertirSalida(prop: NodoPlantilla, valor: unknown): unknown {
  switch (atributo(prop, 'type')) {
    case 'string':
    case 'info':
      return substr(trim(aTexto(valor)), aEntero(atributo(prop, 'size')));
    case 'float':
      return numberFormat(aDecimal(valor), aEntero(atributo(prop, 'decimal')));
    case 'date':
      return formatearFecha(valor, atributo(prop, 'format') ?? '');
    default:
      return valor;
  }
}

// if ($valor) de PHP: "0" y "" son falsos, "0.00" es verdadero.
function esVerdadero(valor: unknown): boolean {
  if (typeof valor === 'string') return valor !== '' && valor !== '0';
  return !vacio(valor);
}

function agregar(padre: ContenedorXml, nodo: NodoXml): void {
  padre.hijos.push(nodo);
}

// createElement($nombre, $valor): con valor vacío no crea nodo de texto.
function elementoConValor(nombre: string, valor: string | undefined): ElementoXml {
  const elemento = crearElemento(nombre);
  if (valor !== undefined && valor !== '') elemento.hijos.push({ texto: valor });
  return elemento;
}

function valoresIterables(valor: unknown): unknown[] {
  if (Array.isArray(valor)) return valor;
  if (valor !== null && typeof valor === 'object') return Object.values(valor);
  return [];
}

// add_attributes()
function agregarAtributos(prop: NodoPlantilla, elemento: ElementoXml): void {
  const add = atributo(prop, 'add');
  if (add === undefined) return;

  const valores = explode(',', atributo(prop, 'values'));
  explode(',', add).forEach((etiqueta, i) => fijarAtributo(elemento, etiqueta, valores[i] ?? ''));
}

// add_attributesInfo(): el segundo atributo lleva el valor del comprobante,
// o "vacio" si no hay.
function agregarAtributosInfo(prop: NodoPlantilla, elemento: ElementoXml, valor: unknown): void {
  const valoresPlantilla = explode(',', atributo(prop, 'values'));
  const sinValor = valor === false || valor === null || valor === undefined || valor === '';
  const valores = [valoresPlantilla[0], sinValor ? 'vacio' : aTexto(valor)];

  explode(',', atributo(prop, 'add')).forEach((etiqueta, i) => fijarAtributo(elemento, etiqueta, valores[i] ?? ''));
}
