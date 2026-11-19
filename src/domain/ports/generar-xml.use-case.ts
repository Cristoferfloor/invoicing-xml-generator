import { SolicitudGeneracion } from '../model/solicitud-generacion.model';
import { ResultadoGeneracion } from '../model/resultado-generacion.model';

export const GENERAR_XML_USE_CASE = Symbol('GENERAR_XML_USE_CASE');

export interface GenerarXmlUseCase {
  generar(solicitud: SolicitudGeneracion): Promise<ResultadoGeneracion>;
}
