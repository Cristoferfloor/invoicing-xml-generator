export type ValidacionEsquema = 'VALIDO' | 'NO_CONFIGURADA';

export interface ResultadoGeneracion {
  documentoId?: string;
  xml: string;
  huella: string;
  validacionEsquema: ValidacionEsquema;
  generadoEn: string;
}
