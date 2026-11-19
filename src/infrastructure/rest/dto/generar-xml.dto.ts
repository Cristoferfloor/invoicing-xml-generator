import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

import { ModoGeneracion } from '../../../domain/model/solicitud-generacion.model';

export class GenerarXmlRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  documentoId?: string;

  @IsIn(['compatible'])
  modo!: ModoGeneracion;

  // Los códigos de types_documents() del sistema actual.
  @IsIn(['01', '01-E', '01-R', '03-L', '04', '05', '06', '07'])
  tipoComprobante!: string;

  @IsString()
  @IsNotEmpty()
  plantilla!: string;

  @IsObject()
  empresa!: Record<string, unknown>;

  @IsObject()
  comprobante!: Record<string, unknown>;
}

export class GenerarXmlResponseDto {
  estado!: 'GENERADO';
  documentoId?: string;
  xmlBase64!: string;
  huella!: string;
  validacionEsquema!: string;
  generadoEn!: string;
}

export class ErrorGeneradorDto {
  estado!: 'RECHAZADO';
  error!: string;
  mensaje!: string;
}
