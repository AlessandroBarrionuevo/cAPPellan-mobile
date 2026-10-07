export interface PerlitaForce {
  id: string;
  phrase: string;
  author: string;
  category: 'Guardia & Cobertura' | 'Fortaleza Operativa' | 'Retorno Seguro' | 'Vocación de Paz' | 'Templanza en Crisis' | 'Cansancio & Aliento';
  verseReference: string;
  reflection: string;
}

export const PERLITAS_DATA: PerlitaForce[] = [
  {
    id: 'pf-1',
    phrase: 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque el Señor tu Dios estará contigo en cada servicio, patrulla y misión.',
    author: 'Voz Pastoral de Guardia',
    category: 'Fortaleza Operativa',
    verseReference: 'Josué 1:9',
    reflection: 'El verdadero coraje no es la ausencia de peligro, sino la certeza de que tu vocación y tu andar están guiados y respaldados por el Todopoderoso.',
  },
  {
    id: 'pf-2',
    phrase: 'El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente. Escudo y protección es su verdad; no temerás el peligro nocturno.',
    author: 'Cobertura en el Servicio',
    category: 'Guardia & Cobertura',
    verseReference: 'Salmos 91:1-4',
    reflection: 'En cada turno silencioso de la noche, hay un guardián superior que no duerme y vela sobre la integridad de quienes cuidan a la comunidad.',
  },
  {
    id: 'pf-3',
    phrase: 'El Señor te guardará de todo mal; Él cuidará tu vida. El Señor protegerá tu salida al servicio y tu retorno seguro al calor del hogar.',
    author: 'Promesa de Retorno',
    category: 'Retorno Seguro',
    verseReference: 'Salmos 121:7-8',
    reflection: 'Tu familia te espera y reza por tu regreso. Serví con dignidad sabiendo que cada paso de vuelta a casa está bajo la custodia divina.',
  },
  {
    id: 'pf-4',
    phrase: 'Bienaventurados los que con integridad procuran la paz y la justicia, porque en su entrega se refleja el verdadero carácter de Dios.',
    author: 'Vocación & Deber',
    category: 'Vocación de Paz',
    verseReference: 'Mateo 5:9',
    reflection: 'Ser pacificador en medio del conflicto requiere temple, rectitud y un corazón noble. Tu labor es un ministerio de contención y preservación de la vida.',
  },
  {
    id: 'pf-5',
    phrase: 'No nos ha dado Dios espíritu de cobardía ni de turbación, sino de poder, de amor fraternal y de dominio propio ante la emergencia.',
    author: 'Templanza Táctica',
    category: 'Templanza en Crisis',
    verseReference: '2 Timoteo 1:7',
    reflection: 'La serenidad mental en momentos de máxima presión nace de saber que tus emociones y tu espíritu están anclados en una fe inconmovible.',
  },
  {
    id: 'pf-6',
    phrase: 'Él da esfuerzo al camarada fatigado y multiplica las fuerzas cuando el cansancio arrecia. Los que esperan en el Señor renovarán su vigor como las águilas.',
    author: 'Aliento en el Desgaste',
    category: 'Cansancio & Aliento',
    verseReference: 'Isaías 40:29-31',
    reflection: 'Cuando las largas horas de turno pesen sobre tu cuerpo y tu mente, recordá elevar tu espíritu: la fuerza interior se renueva en la oración humilde.',
  },
  {
    id: 'pf-7',
    phrase: 'El Señor es mi luz y mi escudo protector; ¿a quién temeré? El Señor es la fortaleza inexpugnable de mi vida; ante nada habré de doblegarme.',
    author: 'Firmeza Moral',
    category: 'Fortaleza Operativa',
    verseReference: 'Salmos 27:1',
    reflection: 'Enfrentar el peligro con rectitud exige un cimiento moral firme. Quien camina en la verdad de Dios posee una muralla impenetrable en su alma.',
  },
  {
    id: 'pf-8',
    phrase: 'No cargues en soledad el peso de la guardia; derrama tus inquietudes delante de Dios. Y su paz, que sobrepasa todo entendimiento, guardará tu corazón.',
    author: 'Cuidado y Desahogo Pastoral',
    category: 'Templanza en Crisis',
    verseReference: 'Filipenses 4:6-7',
    reflection: 'Callar el dolor no es signo de fortaleza. Desahogate en la presencia de Dios y en el acompañamiento pastoral para liberar la carga acumulada del servicio.',
  },
  {
    id: 'pf-9',
    phrase: 'No nos cansemos de hacer el bien, de cuidar al compañero y de proteger al desvalido; porque a su tiempo cosecharemos con honor si perseveramos.',
    author: 'Abnegación y Camaradería',
    category: 'Vocación de Paz',
    verseReference: 'Gálatas 6:9',
    reflection: 'La lealtad hacia tus camaradas y el compromiso ético con la comunidad son legados indestructibles que trascienden cualquier dificultad pasajera.',
  },
  {
    id: 'pf-10',
    phrase: 'Dios es nuestro amparo y fortaleza, nuestro pronto y seguro auxilio en medio de la adversidad. Por tanto, no temeremos aunque la tormenta golpee fuerte.',
    author: 'Refugio Ministerial',
    category: 'Guardia & Cobertura',
    verseReference: 'Salmos 46:1-2',
    reflection: 'Aun en las circunstancias operativas más complejas, nunca estás desamparado. Hay una roca firme bajo tus pies que sostiene tu vida.',
  },
];

export type Perlita = PerlitaForce;

/**
 * Returns deterministic Forces Perlita for today (modulo day-of-year)
 */
export function getDeterministicForcePerlita(dateStr?: string): {
  date: string;
  translation: string;
  reference: string;
  text: string;
  attribution: string;
} {
  const now = dateStr ? new Date(dateStr) : new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = Math.abs(dayOfYear) % PERLITAS_DATA.length;
  const item = PERLITAS_DATA[index];

  return {
    date: now.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    translation: 'Biblia de la Guardia · RVA-2015',
    reference: item.verseReference,
    text: item.phrase,
    attribution: `${item.author} (${item.category})`,
  };
}

/**
 * Returns a random Forces Perlita
 */
export function getRandomForcePerlita(): {
  date: string;
  translation: string;
  reference: string;
  text: string;
  attribution: string;
} {
  const index = Math.floor(Math.random() * PERLITAS_DATA.length);
  const item = PERLITAS_DATA[index];
  const now = new Date();

  return {
    date: now.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    translation: 'Biblia de la Guardia · RVA-2015',
    reference: item.verseReference,
    text: item.phrase,
    attribution: `${item.author} (${item.category})`,
  };
}
