// Árbol del XML que se va armando y su serialización con el mismo formato
// que DOMDocument::saveXML() con formatOutput = true (libxml2).

export interface TextoXml {
  texto: string;
}

export interface ElementoXml {
  nombre: string;
  atributos: Array<[string, string]>;
  hijos: NodoXml[];
}

export type NodoXml = ElementoXml | TextoXml;

export interface ContenedorXml {
  hijos: NodoXml[];
}

export function crearElemento(nombre: string): ElementoXml {
  return { nombre, atributos: [], hijos: [] };
}

// setAttribute(): si el atributo ya existe se reemplaza en su lugar.
export function fijarAtributo(elemento: ElementoXml, nombre: string, valor: string): void {
  const existente = elemento.atributos.find(([actual]) => actual === nombre);
  if (existente) existente[1] = valor;
  else elemento.atributos.push([nombre, valor]);
}

function esTexto(nodo: NodoXml): nodo is TextoXml {
  return (nodo as TextoXml).texto !== undefined;
}

function escaparTexto(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#13;');
}

function escaparAtributo(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;')
    .replace(/\t/g, '&#9;');
}

function apertura(elemento: ElementoXml): string {
  const atributos = elemento.atributos.map(([nombre, valor]) => ` ${nombre}="${escaparAtributo(valor)}"`).join('');
  return `<${elemento.nombre}${atributos}`;
}

function sinFormato(nodo: NodoXml): string {
  if (esTexto(nodo)) return escaparTexto(nodo.texto);
  if (nodo.hijos.length === 0) return `${apertura(nodo)}/>`;
  return `${apertura(nodo)}>${nodo.hijos.map(sinFormato).join('')}</${nodo.nombre}>`;
}

// libxml2 solo indenta un elemento si ninguno de sus hijos es texto.
function conFormato(elemento: ElementoXml, nivel: number): string {
  const sangria = '  '.repeat(nivel);

  if (elemento.hijos.length === 0) return `${sangria}${apertura(elemento)}/>`;
  if (elemento.hijos.some(esTexto)) return sangria + sinFormato(elemento);

  const hijos = elemento.hijos.map((hijo) => conFormato(hijo as ElementoXml, nivel + 1)).join('\n');
  return `${sangria}${apertura(elemento)}>\n${hijos}\n${sangria}</${elemento.nombre}>`;
}

export function serializarDocumento(raices: NodoXml[]): string {
  const cuerpo = raices
    .filter((nodo): nodo is ElementoXml => !esTexto(nodo))
    .map((raiz) => `${conFormato(raiz, 0)}\n`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n${cuerpo}`;
}
