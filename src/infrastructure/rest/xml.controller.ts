import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';

import { GENERAR_XML_USE_CASE, GenerarXmlUseCase } from '../../domain/ports/generar-xml.use-case';
import { GenerarXmlRequestDto, GenerarXmlResponseDto } from './dto/generar-xml.dto';

@Controller('v1/xml')
export class XmlController {
  constructor(
    @Inject(GENERAR_XML_USE_CASE)
    private readonly generarXml: GenerarXmlUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async generar(@Body() peticion: GenerarXmlRequestDto): Promise<GenerarXmlResponseDto> {
    const resultado = await this.generarXml.generar(peticion);

    return {
      estado: 'GENERADO',
      documentoId: resultado.documentoId,
      xmlBase64: Buffer.from(resultado.xml, 'utf8').toString('base64'),
      huella: resultado.huella,
      validacionEsquema: resultado.validacionEsquema,
      generadoEn: resultado.generadoEn,
    };
  }
}
