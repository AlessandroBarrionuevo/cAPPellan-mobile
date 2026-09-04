export interface Verse {
  num: number;
  text: string;
}

export interface Chapter {
  chapter: number;
  verses: Verse[];
}

export interface Book {
  id: string;
  name: string;
  testament: 'AT' | 'NT';
  chapters: Chapter[];
}

export const BIBLE_DATA: Book[] = [
  {
    id: 'salmos',
    name: 'Salmos',
    testament: 'AT',
    chapters: [
      {
        chapter: 23,
        verses: [
          { num: 1, text: 'El Señor es mi pastor; nada me faltará.' },
          { num: 2, text: 'En verdes pastos me hace descansar; junto a aguas tranquilas me conduce.' },
          { num: 3, text: 'Renueva mis fuerzas y me guía por senderos de justicia por amor a su nombre.' },
          { num: 4, text: 'Aunque camine por valles oscuros y tenebrosos, no temeré mal alguno, porque tú estás conmigo; tu vara y tu bastón me dan aliento.' },
          { num: 5, text: 'Preparas una mesa delante de mí en presencia de mis enemigos. Has ungido mi cabeza con perfume; mi copa rebosa de bendición.' },
          { num: 6, text: 'Tu bondad y tu gran amor me acompañarán todos los días de mi vida, y en la casa del Señor habitaré para siempre.' },
        ],
      },
      {
        chapter: 91,
        verses: [
          { num: 1, text: 'El que habita al amparo del Altísimo se acoge a la sombra del Todopoderoso.' },
          { num: 2, text: 'Yo le digo al Señor: «Tú eres mi refugio, mi fortaleza, el Dios en quien confío».' },
          { num: 3, text: 'Él te librará de las trampas del cazador y de las enfermedades mortales.' },
          { num: 4, text: 'Con sus plumas te cubrirá, y bajo sus alas encontrarás refugio; su fidelidad será tu escudo y tu armadura.' },
          { num: 5, text: 'No tendrás que temer el terror de la noche, ni la flecha que vuela de día.' },
          { num: 9, text: 'Porque has puesto al Señor por tu refugio, y al Altísimo por tu protección.' },
          { num: 11, text: 'Pues ordenará a sus ángeles que te cuiden en todos tus caminos.' },
        ],
      },
      {
        chapter: 121,
        verses: [
          { num: 1, text: 'Levanto mis ojos hacia las montañas: ¿de dónde vendrá mi ayuda?' },
          { num: 2, text: 'Mi socorro viene del Señor, creador del cielo y de la tierra.' },
          { num: 3, text: 'No permitirá que tu pie tropiece; jamás duerme quien te cuida.' },
          { num: 4, text: 'No se adormecerá ni dormirá el guardián de su pueblo.' },
          { num: 7, text: 'El Señor te librará de todo mal; él cuidará tu vida.' },
          { num: 8, text: 'El Señor cuidará tus salidas y tus entradas, desde ahora y para siempre.' },
        ],
      },
    ],
  },
  {
    id: 'proverbios',
    name: 'Proverbios',
    testament: 'AT',
    chapters: [
      {
        chapter: 3,
        verses: [
          { num: 1, text: 'Hijo mío, no olvides mis enseñanzas; guarda en tu corazón mis mandamientos.' },
          { num: 3, text: 'Que el amor fiel y la lealtad nunca te abandonen; átalos a tu cuello y escríbelos en la tabla de tu corazón.' },
          { num: 5, text: 'Confía en el Señor con todo tu corazón, y no te apoyes en tu propia prudencia.' },
          { num: 6, text: 'Reconócelo en todos tus caminos, y él enderezará tus sendas.' },
          { num: 7, text: 'No seas sabio en tu propia opinión; teme al Señor y apártate del mal.' },
        ],
      },
    ],
  },
  {
    id: 'mateo',
    name: 'Mateo',
    testament: 'NT',
    chapters: [
      {
        chapter: 5,
        verses: [
          { num: 3, text: 'Dichosos los humildes de espíritu, porque de ellos es el reino de los cielos.' },
          { num: 4, text: 'Dichosos los que lloran, porque serán consolados.' },
          { num: 5, text: 'Dichosos los bondadosos, porque recibirán la tierra por herencia.' },
          { num: 6, text: 'Dichosos los que tienen hambre y sed de justicia, porque serán saciados.' },
          { num: 7, text: 'Dichosos los compasivos, porque serán tratados con misericordia.' },
          { num: 8, text: 'Dichosos los limpios de corazón, porque ellos verán a Dios.' },
          { num: 9, text: 'Dichosos los constructores de paz, porque serán llamados hijos de Dios.' },
          { num: 14, text: 'Ustedes son la luz del mundo. Una ciudad construida sobre una colina no se puede ocultar.' },
          { num: 16, text: 'Hagan brillar su luz delante de todos, para que vean sus buenas obras y honren a su Padre que está en los cielos.' },
        ],
      },
      {
        chapter: 6,
        verses: [
          { num: 25, text: 'Por eso les digo: No se preocupen por su vida, qué van a comer o beber; ni por su cuerpo, con qué se van a vestir.' },
          { num: 26, text: 'Miren las aves del cielo: no siembran ni cosechan ni guardan en graneros; sin embargo, el Padre celestial las alimenta. ¿No valen ustedes mucho más que ellas?' },
          { num: 33, text: 'Busquen primeramente el reino de Dios y su justicia, y todas estas cosas les serán añadidas.' },
          { num: 34, text: 'Así que no se angustien por el mañana, porque el mañana traerá sus propios afanes. Cada día tiene ya su propio reto.' },
        ],
      },
    ],
  },
  {
    id: 'juan',
    name: 'Juan',
    testament: 'NT',
    chapters: [
      {
        chapter: 14,
        verses: [
          { num: 1, text: 'No se angustien. Confíen en Dios; confíen también en mí.' },
          { num: 2, text: 'En el hogar de mi Padre hay muchas moradas; si no fuera así, ya se lo habría dicho. Voy a prepararles un lugar.' },
          { num: 6, text: 'Jesús le contestó: —Yo soy el camino, la verdad y la vida. Nadie llega al Padre sino por mí.' },
          { num: 27, text: 'La paz les dejo; mi paz les doy. Yo no se la doy a ustedes como la da el mundo. No se angustien ni tengan miedo.' },
        ],
      },
    ],
  },
  {
    id: 'filipenses',
    name: 'Filipenses',
    testament: 'NT',
    chapters: [
      {
        chapter: 4,
        verses: [
          { num: 4, text: 'Alégrense siempre en el Señor. Insisto: ¡Alégrense!' },
          { num: 6, text: 'No se inquieten por nada; más bien, en toda ocasión, con oración y ruego, presenten sus peticiones a Dios con gratitud.' },
          { num: 7, text: 'Y la paz de Dios, que sobrepasa todo entendimiento, cuidará sus corazones y sus pensamientos en Cristo Jesús.' },
          { num: 8, text: 'Por último, hermanos, consideren todo lo que es verdadero, todo lo noble, todo lo justo, todo lo puro, todo lo amable, todo lo que merece honor.' },
          { num: 13, text: 'Todo lo puedo en Cristo que me fortalece.' },
        ],
      },
    ],
  },
  {
    id: 'romanos',
    name: 'Romanos',
    testament: 'NT',
    chapters: [
      {
        chapter: 8,
        verses: [
          { num: 28, text: 'Ahora bien, sabemos que Dios dispone todas las cosas para el bien de quienes lo aman, los que han sido llamados según su propósito.' },
          { num: 31, text: '¿Qué diremos frente a esto? Si Dios está de nuestra parte, ¿quién podrá estar en contra nuestra?' },
          { num: 38, text: 'Pues estoy convencido de que ni la muerte ni la vida, ni los ángeles ni los gobernantes espirituales, ni lo presente ni lo por venir, ni los poderes,' },
          { num: 39, text: 'ni lo alto ni lo profundo, ni ninguna otra cosa creada nos podrá separar del amor que Dios nos ha mostrado en Cristo Jesús nuestro Señor.' },
        ],
      },
    ],
  },
];
