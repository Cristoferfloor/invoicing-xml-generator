import { Injectable } from '@nestjs/common';
import { DOMParser } from '@xmldom/xmldom';

import { LectorPlantillaPort } from '../../domain/ports/lector-plantilla.port';
import { NodoPlantilla } from '../../domain/compatible/plantilla';
import { PlantillaInvalidaError } from '../../domain/errors/generador.errors';

type Documento = ReturnType<InstanceType<typeof DOMParser>['parseFromString']>;
type Elemento = NonNullable<Documento['documentElement']>;

const NODO_ELEMENTO = 1;

@Injectable()
export class XmldomLectorPlantillaAdapter implements LectorPlantillaPort {
  leer(contenido: string): NodoPlantilla[] {
    let documento: Documento;
    try {
      documento = new DOMParser().parseFromString(contenido, 'application/xml');
    } catch (error) {
      throw new PlantillaInvalidaError(
        `La plantilla no es un XML válido: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const raiz = documento.documentElement;
    if (!raiz) {
      throw new PlantillaInvalidaError('La plantilla no tiene elemento raíz.');
    }

    // Igual que $xml->prop de SimpleXML: los <prop> hijos directos de la raíz.
    const nodos = this.convertir(raiz).hijos.filter((hijo) => hijo.etiqueta === 'prop');
    if (nodos.length === 0) {
      throw new PlantillaInvalidaError('La plantilla no tiene elementos <prop>.');
    }
    return nodos;
  }

  private convertir(elemento: Elemento): NodoPlantilla {
    const atributos: Record<string, string> = {};
    for (let i = 0; i < elemento.attributes.length; i++) {
      const actual = elemento.attributes.item(i)!;
      atributos[actual.name] = actual.value;
    }

    const hijos: NodoPlantilla[] = [];
    for (let i = 0; i < elemento.childNodes.length; i++) {
      const hijo = elemento.childNodes.item(i)!;
      if (hijo.nodeType === NODO_ELEMENTO) hijos.push(this.convertir(hijo as unknown as Elemento));
    }

    return { etiqueta: elemento.nodeName, atributos, hijos };
  }
}
