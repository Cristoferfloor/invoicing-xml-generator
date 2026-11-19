// Tabla de entidades de HTML 4.01: la que usan htmlentities() y
// html_entity_decode() de PHP con ENT_HTML401, que es como las llama
// xml_model.php. Comillas simples van aparte (&#039;) por ENT_QUOTES.

const LATIN1 = [
  'nbsp', 'iexcl', 'cent', 'pound', 'curren', 'yen', 'brvbar', 'sect', 'uml', 'copy', 'ordf', 'laquo',
  'not', 'shy', 'reg', 'macr', 'deg', 'plusmn', 'sup2', 'sup3', 'acute', 'micro', 'para', 'middot',
  'cedil', 'sup1', 'ordm', 'raquo', 'frac14', 'frac12', 'frac34', 'iquest', 'Agrave', 'Aacute', 'Acirc',
  'Atilde', 'Auml', 'Aring', 'AElig', 'Ccedil', 'Egrave', 'Eacute', 'Ecirc', 'Euml', 'Igrave', 'Iacute',
  'Icirc', 'Iuml', 'ETH', 'Ntilde', 'Ograve', 'Oacute', 'Ocirc', 'Otilde', 'Ouml', 'times', 'Oslash',
  'Ugrave', 'Uacute', 'Ucirc', 'Uuml', 'Yacute', 'THORN', 'szlig', 'agrave', 'aacute', 'acirc', 'atilde',
  'auml', 'aring', 'aelig', 'ccedil', 'egrave', 'eacute', 'ecirc', 'euml', 'igrave', 'iacute', 'icirc',
  'iuml', 'eth', 'ntilde', 'ograve', 'oacute', 'ocirc', 'otilde', 'ouml', 'divide', 'oslash', 'ugrave',
  'uacute', 'ucirc', 'uuml', 'yacute', 'thorn', 'yuml',
];

const GRIEGO_MAYUSCULAS = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu',
  'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', '', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega',
];

const GRIEGO_MINUSCULAS = [
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu',
  'nu', 'xi', 'omicron', 'pi', 'rho', 'sigmaf', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
];

const OTROS: Array<[number, string]> = [
  [34, 'quot'], [38, 'amp'], [60, 'lt'], [62, 'gt'],
  [338, 'OElig'], [339, 'oelig'], [352, 'Scaron'], [353, 'scaron'], [376, 'Yuml'], [402, 'fnof'],
  [710, 'circ'], [732, 'tilde'], [977, 'thetasym'], [978, 'upsih'], [982, 'piv'],
  [8194, 'ensp'], [8195, 'emsp'], [8201, 'thinsp'], [8204, 'zwnj'], [8205, 'zwj'], [8206, 'lrm'],
  [8207, 'rlm'], [8211, 'ndash'], [8212, 'mdash'], [8216, 'lsquo'], [8217, 'rsquo'], [8218, 'sbquo'],
  [8220, 'ldquo'], [8221, 'rdquo'], [8222, 'bdquo'], [8224, 'dagger'], [8225, 'Dagger'], [8226, 'bull'],
  [8230, 'hellip'], [8240, 'permil'], [8242, 'prime'], [8243, 'Prime'], [8249, 'lsaquo'],
  [8250, 'rsaquo'], [8254, 'oline'], [8260, 'frasl'], [8364, 'euro'], [8465, 'image'], [8472, 'weierp'],
  [8476, 'real'], [8482, 'trade'], [8501, 'alefsym'], [8592, 'larr'], [8593, 'uarr'], [8594, 'rarr'],
  [8595, 'darr'], [8596, 'harr'], [8629, 'crarr'], [8656, 'lArr'], [8657, 'uArr'], [8658, 'rArr'],
  [8659, 'dArr'], [8660, 'hArr'], [8704, 'forall'], [8706, 'part'], [8707, 'exist'], [8709, 'empty'],
  [8711, 'nabla'], [8712, 'isin'], [8713, 'notin'], [8715, 'ni'], [8719, 'prod'], [8721, 'sum'],
  [8722, 'minus'], [8727, 'lowast'], [8730, 'radic'], [8733, 'prop'], [8734, 'infin'], [8736, 'ang'],
  [8743, 'and'], [8744, 'or'], [8745, 'cap'], [8746, 'cup'], [8747, 'int'], [8756, 'there4'],
  [8764, 'sim'], [8773, 'cong'], [8776, 'asymp'], [8800, 'ne'], [8801, 'equiv'], [8804, 'le'],
  [8805, 'ge'], [8834, 'sub'], [8835, 'sup'], [8836, 'nsub'], [8838, 'sube'], [8839, 'supe'],
  [8853, 'oplus'], [8855, 'otimes'], [8869, 'perp'], [8901, 'sdot'], [8968, 'lceil'], [8969, 'rceil'],
  [8970, 'lfloor'], [8971, 'rfloor'], [9001, 'lang'], [9002, 'rang'], [9674, 'loz'], [9824, 'spades'],
  [9827, 'clubs'], [9829, 'hearts'], [9830, 'diams'],
];

function construir(): Array<[number, string]> {
  const pares: Array<[number, string]> = [...OTROS];
  LATIN1.forEach((nombre, i) => pares.push([0xa0 + i, nombre]));
  GRIEGO_MAYUSCULAS.forEach((nombre, i) => nombre && pares.push([913 + i, nombre]));
  GRIEGO_MINUSCULAS.forEach((nombre, i) => pares.push([945 + i, nombre]));
  return pares;
}

const PARES = construir();

export const ENTIDAD_POR_CODIGO: ReadonlyMap<number, string> = new Map(PARES);
export const CODIGO_POR_ENTIDAD: ReadonlyMap<string, number> = new Map(
  PARES.map(([codigo, nombre]) => [nombre, codigo]),
);
