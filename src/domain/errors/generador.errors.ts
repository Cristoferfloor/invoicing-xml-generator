export abstract class ErrorGenerador extends Error {
  abstract readonly codigo: string;

  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class PlantillaInvalidaError extends ErrorGenerador {
  readonly codigo = 'PLANTILLA_INVALIDA';
}

export class XmlNoCumpleEsquemaError extends ErrorGenerador {
  readonly codigo = 'XML_NO_CUMPLE_ESQUEMA';
}

export class GeneracionFallidaError extends ErrorGenerador {
  readonly codigo = 'GENERACION_FALLIDA';
}
