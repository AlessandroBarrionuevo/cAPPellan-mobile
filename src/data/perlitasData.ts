export interface Perlita {
  id: string;
  phrase: string;
  author: string;
  category: 'Esperanza' | 'Paz' | 'Fortaleza' | 'Propósito' | 'Gratitud';
  verseReference?: string;
  backgroundColor?: string;
}

export const PERLITAS_DATA: Perlita[] = [
  {
    id: 'p1',
    phrase: 'No mires la tormenta que te rodea; mira al Dios que camina sobre las aguas contigo.',
    author: 'Reflexión de Paz',
    category: 'Paz',
    verseReference: 'Mateo 14:27',
  },
  {
    id: 'p2',
    phrase: 'Cada día que comienzas es una página nueva que Dios te regala para escribir una historia de fe y superación.',
    author: 'Palabras de Aliento',
    category: 'Esperanza',
    verseReference: 'Lamentaciones 3:22-23',
  },
  {
    id: 'p3',
    phrase: 'El servicio que brindas con el corazón no siempre es visto por todos, pero nunca pasa desapercibido para el cielo.',
    author: 'Voz Pastoral',
    category: 'Propósito',
    verseReference: 'Hebreos 6:10',
  },
  {
    id: 'p4',
    phrase: 'Tu valor no depende de tus circunstancias ni de tus fuerzas de hoy, sino del amor incondicional que sostiene tu vida.',
    author: 'Cuidado del Alma',
    category: 'Fortaleza',
    verseReference: 'Isaías 43:4',
  },
  {
    id: 'p5',
    phrase: 'Cuando sientas que tus fuerzas se agotan, recuerda que la gracia de Dios se perfecciona justamente en tu debilidad.',
    author: 'Promesa Diaria',
    category: 'Fortaleza',
    verseReference: '2 Corintios 12:9',
  },
  {
    id: 'p6',
    phrase: 'Agradecer en medio de la dificultad no cambia el pasado, pero transforma completamente tu presente y abre las puertas del futuro.',
    author: 'Reflexión de Gratitud',
    category: 'Gratitud',
    verseReference: '1 Tesalonicenses 5:18',
  },
  {
    id: 'p7',
    phrase: 'La paz no es la ausencia de problemas, sino la presencia constante de Dios en medio de ellos.',
    author: 'Acompañamiento Espiritual',
    category: 'Paz',
    verseReference: 'Juan 14:27',
  },
];
