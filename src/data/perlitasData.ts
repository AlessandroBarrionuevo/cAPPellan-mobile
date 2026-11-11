import type { Perlita as BiblePerlita } from '../types/bible';

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
    phrase: '¿No te lo ordené Yo? ¡Sé fuerte y valiente! No temas ni desmayes, porque Yavé tu ʼElohim está contigo dondequiera que vayas.',
    author: 'Voz Pastoral de Guardia',
    category: 'Fortaleza Operativa',
    verseReference: 'Josué 1:9',
    reflection: 'El verdadero coraje no es la ausencia de peligro, sino la certeza de que tu vocación y tu andar están guiados y respaldados por el Todopoderoso.',
  },
  {
    id: 'pf-2',
    phrase: 'El que mora al abrigo del ʼElyón Morará bajo la sombra del Shadday. Diré yo a Yavé: ¡Refugio mío y Fortaleza mía, Mi ʼElohim, en Quien confío! Él te librará de la trampa del cazador, Y de la mortal pestilencia. Con sus plumas te cubrirá, Y debajo de sus alas te refugiarás. Escudo y adarga es su verdad.',
    author: 'Cobertura en el Servicio',
    category: 'Guardia & Cobertura',
    verseReference: 'Salmos 91:1-4',
    reflection: 'En cada turno silencioso de la noche, hay un guardián superior que no duerme y vela sobre la integridad de quienes cuidan a la comunidad.',
  },
  {
    id: 'pf-3',
    phrase: 'Yavé te protegerá de todo mal. Él guardará tu alma. Yavé guardará tu salida y tu entrada Desde ahora y para siempre.',
    author: 'Promesa de Retorno',
    category: 'Retorno Seguro',
    verseReference: 'Salmos 121:7-8',
    reflection: 'Tu familia te espera y reza por tu regreso. Serví con dignidad sabiendo que cada paso de vuelta a casa está bajo la custodia divina.',
  },
  {
    id: 'pf-4',
    phrase: 'Inmensamente felices los que procuran la paz, porque ellos serán llamados hijos de Dios.',
    author: 'Vocación & Deber',
    category: 'Vocación de Paz',
    verseReference: 'Mateo 5:9',
    reflection: 'Ser pacificador en medio del conflicto requiere temple, rectitud y un corazón noble. Tu labor es un ministerio de contención y preservación de la vida.',
  },
  {
    id: 'pf-5',
    phrase: 'Porque Dios no nos dio espíritu de cobardía, sino de poder, de amor y de dominio propio.',
    author: 'Templanza Táctica',
    category: 'Templanza en Crisis',
    verseReference: '2 Timoteo 1:7',
    reflection: 'La serenidad mental en momentos de máxima presión nace de saber que tus emociones y tu espíritu están anclados en una fe inconmovible.',
  },
  {
    id: 'pf-6',
    phrase: 'Él fortalece al cansado y aumenta la fuerza al que no tiene vigor. Aun los muchachos se fatigan y se cansan. Los jóvenes tropiezan y caen, pero los que esperan en Yavé tienen nuevas fuerzas. Levantarán las alas como águilas, correrán y no se cansarán, caminarán y no se fatigarán.',
    author: 'Aliento en el Desgaste',
    category: 'Cansancio & Aliento',
    verseReference: 'Isaías 40:29-31',
    reflection: 'Cuando las largas horas de turno pesen sobre tu cuerpo y tu mente, recordá elevar tu espíritu: la fuerza interior se renueva en la oración humilde.',
  },
  {
    id: 'pf-7',
    phrase: 'Yavé es mi Luz y mi Salvación, ¿De quién temeré? Yavé es la Fortaleza de mi vida, ¿De quién me aterrorizaré?',
    author: 'Firmeza Moral',
    category: 'Fortaleza Operativa',
    verseReference: 'Salmos 27:1',
    reflection: 'Enfrentar el peligro con rectitud exige un cimiento moral firme. Quien camina en la verdad de Dios posee una muralla impenetrable en su alma.',
  },
  {
    id: 'pf-8',
    phrase: 'Por nada estén ansiosos, sino sean conocidas sus peticiones ante Dios, en toda conversación con Dios y súplica, con acción de gracias. La paz de Dios, que sobrepasa todo entendimiento, guardará sus corazones y sus pensamientos en Cristo Jesús.',
    author: 'Cuidado y Desahogo Pastoral',
    category: 'Templanza en Crisis',
    verseReference: 'Filipenses 4:6-7',
    reflection: 'Callar el dolor no es signo de fortaleza. Desahogate en la presencia de Dios y en el acompañamiento pastoral para liberar la carga acumulada del servicio.',
  },
  {
    id: 'pf-9',
    phrase: 'No desmayemos en hacer lo bueno, porque si no desmayamos, a su tiempo cosecharemos.',
    author: 'Abnegación y Camaradería',
    category: 'Vocación de Paz',
    verseReference: 'Gálatas 6:9',
    reflection: 'La lealtad hacia tus camaradas y el compromiso ético con la comunidad son legados indestructibles que trascienden cualquier dificultad pasajera.',
  },
  {
    id: 'pf-10',
    phrase: 'ʼElohim es nuestro Refugio y Fortaleza, Un auxilio muy presente en la tribulación. Por tanto, no temeremos aunque la tierra sea removida, Y las montañas se traspasen al corazón del mar, Aunque bramen y espumen sus aguas, Y tiemblen las montañas a causa de su ímpetu. Selah',
    author: 'Refugio Ministerial',
    category: 'Guardia & Cobertura',
    verseReference: 'Salmos 46:1-3',
    reflection: 'Aun en las circunstancias operativas más complejas, nunca estás desamparado. Hay una roca firme bajo tus pies que sostiene tu vida.',
  },
];

export const DEFAULT_FALLBACK_PERLITA = {
  reference: PERLITAS_DATA[0].verseReference,
  text: PERLITAS_DATA[0].phrase,
  translation: 'PDDPT',
} as const;

export type Perlita = PerlitaForce;

function toBiblePerlita(item: PerlitaForce, now: Date): BiblePerlita {
  return {
    date: now.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    translation: 'PDDPT',
    reference: item.verseReference,
    text: item.phrase,
    attribution: `${item.author} (${item.category})`,
  };
}

/**
 * Returns deterministic Forces Perlita for today (modulo day-of-year)
 */
export function getDeterministicForcePerlita(dateStr?: string): BiblePerlita {
  const now = dateStr ? new Date(dateStr) : new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = Math.abs(dayOfYear) % PERLITAS_DATA.length;

  return toBiblePerlita(PERLITAS_DATA[index], now);
}

/**
 * Returns a random Forces Perlita
 */
export function getRandomForcePerlita(): BiblePerlita {
  const index = Math.floor(Math.random() * PERLITAS_DATA.length);
  return toBiblePerlita(PERLITAS_DATA[index], new Date());
}
