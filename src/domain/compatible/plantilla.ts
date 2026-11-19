// Nodo del lenguaje de plantillas actual (<prop>, <item>), ya leido del XML.
export interface NodoPlantilla {
  etiqueta: string;
  atributos: Record<string, string>;
  hijos: NodoPlantilla[];
}

export function atributo(nodo: NodoPlantilla, nombre: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(nodo.atributos, nombre)
    ? nodo.atributos[nombre]
    : undefined;
}

export function hijosLlamados(nodo: NodoPlantilla, etiqueta: string): NodoPlantilla[] {
  return nodo.hijos.filter((hijo) => hijo.etiqueta === etiqueta);
}
