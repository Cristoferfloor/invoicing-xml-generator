import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { GENERAR_XML_USE_CASE, GenerarXmlUseCase } from '../domain/ports/generar-xml.use-case';
import { LECTOR_PLANTILLA_PORT, LectorPlantillaPort } from '../domain/ports/lector-plantilla.port';
import { VALIDADOR_ESQUEMA_PORT, ValidadorEsquemaPort } from '../domain/ports/validador-esquema.port';
import { SolicitudGeneracion } from '../domain/model/solicitud-generacion.model';
import { ResultadoGeneracion } from '../domain/model/resultado-generacion.model';
import { MotorCompatible } from '../domain/compatible/motor-compatible';
import { ErrorGenerador, GeneracionFallidaError } from '../domain/errors/generador.errors';

@Injectable()
export class GenerarXmlService implements GenerarXmlUseCase {
  private readonly logger = new Logger(GenerarXmlService.name);
  private readonly motor = new MotorCompatible();

  constructor(
    @Inject(LECTOR_PLANTILLA_PORT) private readonly lectorPlantilla: LectorPlantillaPort,
    @Inject(VALIDADOR_ESQUEMA_PORT) private readonly validadorEsquema: ValidadorEsquemaPort,
  ) {}

  async generar(solicitud: SolicitudGeneracion): Promise<ResultadoGeneracion> {
    const inicio = Date.now();
    const plantilla = this.lectorPlantilla.leer(solicitud.plantilla);

    let xml: string;
    try {
      xml = this.motor.generar(plantilla, solicitud.comprobante, {
        empresa: solicitud.empresa,
        tipoComprobante: solicitud.tipoComprobante,
      });
    } catch (error) {
      if (error instanceof ErrorGenerador) throw error;
      throw new GeneracionFallidaError(
        `No se pudo armar el XML: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const validacionEsquema = await this.validadorEsquema.validar(xml, solicitud.tipoComprobante);
    const huella = 'sha256:' + createHash('sha256').update(xml, 'utf8').digest('hex');

    this.logger.log(
      JSON.stringify({
        evento: 'xml_generado',
        documentoId: solicitud.documentoId,
        tipoComprobante: solicitud.tipoComprobante,
        modo: solicitud.modo,
        validacionEsquema,
        huella,
        duracionMs: Date.now() - inicio,
      }),
    );

    return {
      documentoId: solicitud.documentoId,
      xml,
      huella,
      validacionEsquema,
      generadoEn: new Date().toISOString(),
    };
  }
}

export const GENERAR_XML_PROVIDER = {
  provide: GENERAR_XML_USE_CASE,
  useClass: GenerarXmlService,
};
