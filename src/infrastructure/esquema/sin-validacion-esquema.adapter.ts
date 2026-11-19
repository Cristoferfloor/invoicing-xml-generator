import { Injectable, Logger } from '@nestjs/common';

import { ValidadorEsquemaPort } from '../../domain/ports/validador-esquema.port';
import { ValidacionEsquema } from '../../domain/model/resultado-generacion.model';

// Mientras no estén los XSD oficiales del SRI, la validación queda
// explícitamente desactivada: la respuesta lo dice, no se da por válido.
@Injectable()
export class SinValidacionEsquemaAdapter implements ValidadorEsquemaPort {
  private readonly logger = new Logger(SinValidacionEsquemaAdapter.name);
  private avisado = false;

  async validar(): Promise<ValidacionEsquema> {
    if (!this.avisado) {
      this.logger.warn('Validación contra XSD del SRI no configurada: faltan los esquemas oficiales.');
      this.avisado = true;
    }
    return 'NO_CONFIGURADA';
  }
}
