import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

import { ErrorGenerador } from '../../domain/errors/generador.errors';
import { ErrorGeneradorDto } from './dto/generar-xml.dto';

const ESTADO_HTTP: Record<string, HttpStatus> = {
  PLANTILLA_INVALIDA: HttpStatus.BAD_REQUEST,
  XML_NO_CUMPLE_ESQUEMA: HttpStatus.UNPROCESSABLE_ENTITY,
  GENERACION_FALLIDA: HttpStatus.INTERNAL_SERVER_ERROR,
};

@Catch(ErrorGenerador)
export class ErrorGeneradorFilter implements ExceptionFilter<ErrorGenerador> {
  private readonly logger = new Logger(ErrorGeneradorFilter.name);

  catch(excepcion: ErrorGenerador, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();

    this.logger.warn(
      JSON.stringify({ evento: 'generacion_rechazada', error: excepcion.codigo, mensaje: excepcion.message }),
    );

    const cuerpo: ErrorGeneradorDto = { estado: 'RECHAZADO', error: excepcion.codigo, mensaje: excepcion.message };
    respuesta.status(ESTADO_HTTP[excepcion.codigo] ?? HttpStatus.INTERNAL_SERVER_ERROR).json(cuerpo);
  }
}
