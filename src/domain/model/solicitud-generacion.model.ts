// Por ahora solo existe el modo que replica al sistema actual. Las
// correcciones (datos tributarios desde la empresa, sin double-encoding)
// llegan como un modo aparte para poder comparar ambos.
export type ModoGeneracion = 'compatible';

export interface SolicitudGeneracion {
  documentoId?: string;
  modo: ModoGeneracion;
  // Codigo del tipo de comprobante del sistema actual ("01", "01-E", "03-L"...).
  tipoComprobante: string;
  // Plantilla en el lenguaje actual: <tags><prop name=... type=... /></tags>.
  plantilla: string;
  // Campos de la empresa con los nombres de tb_enterprise (ruc, name, address...).
  empresa: Record<string, unknown>;
  // Comprobante con los nombres de campos que hoy llegan del ERP a Mongo.
  comprobante: Record<string, unknown>;
}
