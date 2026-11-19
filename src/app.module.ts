import { Module } from '@nestjs/common';

import { GENERAR_XML_PROVIDER } from './application/generar-xml.service';
import { LECTOR_PLANTILLA_PORT } from './domain/ports/lector-plantilla.port';
import { VALIDADOR_ESQUEMA_PORT } from './domain/ports/validador-esquema.port';
import { XmldomLectorPlantillaAdapter } from './infrastructure/plantillas/xmldom-lector-plantilla.adapter';
import { SinValidacionEsquemaAdapter } from './infrastructure/esquema/sin-validacion-esquema.adapter';
import { XmlController } from './infrastructure/rest/xml.controller';
import { SaludController } from './infrastructure/rest/salud.controller';

@Module({
  controllers: [XmlController, SaludController],
  providers: [
    GENERAR_XML_PROVIDER,
    { provide: LECTOR_PLANTILLA_PORT, useClass: XmldomLectorPlantillaAdapter },
    { provide: VALIDADOR_ESQUEMA_PORT, useClass: SinValidacionEsquemaAdapter },
  ],
})
export class AppModule {}
