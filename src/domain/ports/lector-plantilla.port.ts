import { NodoPlantilla } from '../compatible/plantilla';

export const LECTOR_PLANTILLA_PORT = Symbol('LECTOR_PLANTILLA_PORT');

export interface LectorPlantillaPort {
  // Devuelve los <prop> de primer nivel de la plantilla.
  leer(contenido: string): NodoPlantilla[];
}
