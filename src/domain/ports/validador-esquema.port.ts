import { ValidacionEsquema } from '../model/resultado-generacion.model';

export const VALIDADOR_ESQUEMA_PORT = Symbol('VALIDADOR_ESQUEMA_PORT');

export interface ValidadorEsquemaPort {
  // Lanza XmlNoCumpleEsquemaError si el XML no cumple el XSD del SRI.
  validar(xml: string, tipoComprobante: string): Promise<ValidacionEsquema>;
}
