export interface InstagramProfileData {
  handle: string;
  url: string;
  fullName: string;
  followerCount: number;
  postCount: number;
  isVerified: boolean;
  bio: string;
  category: string;
  recentPosts: InstagramPost[];
}

export interface InstagramPost {
  id: string;
  caption: string;
  publishedAt: string;
  likesCount: number;
  commentsCount: number;
  detectedHashtags: string[];
  taggedDoP?: string;
  taggedDirector?: string;
  signalSeverity: "CRITICAL" | "HIGH" | "MEDIUM";
  signalType: string;
  opportunityScore: number;
}

export function getCompanyInstagramData(companySlug: string, companyName: string): InstagramProfileData {
  const cleanHandle = companySlug.replace(/[^a-z0-9]/g, "");

  const hashtagsMap: Record<string, InstagramPost[]> = {
    "vaca-films": [
      {
        id: "post_vaca_1",
        caption: "¡Último día de rodaje de nuestro nuevo thriller de acción! Arrancamos inmediatamente la fase de posproducción, montaje y etalonaje digital. #EnRodaje #PostProduccion #ColorGrading #Cinema #ARRI",
        publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        likesCount: 3420,
        commentsCount: 184,
        detectedHashtags: ["#EnRodaje", "#PostProduccion", "#ColorGrading", "#ARRI"],
        taggedDoP: "@carlesgusi_dop",
        taggedDirector: "@danielmonzon_dir",
        signalSeverity: "CRITICAL",
        signalType: "INSTAGRAM_POST_PRODUCTION_WRAP",
        opportunityScore: 96,
      },
      {
        id: "post_vaca_2",
        caption: "Preparando la corrección de color en HDR para el lanzamiento internacional en plataformas. #HDRColor #GradingSuite #VacaFilms",
        publishedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        likesCount: 2150,
        commentsCount: 92,
        detectedHashtags: ["#HDRColor", "#GradingSuite", "#VacaFilms"],
        taggedDoP: "@carlesgusi_dop",
        signalSeverity: "HIGH",
        signalType: "COLOR_GRADING_WORKFLOW",
        opportunityScore: 90,
      },
    ],
    "morena-films": [
      {
        id: "post_mf_1",
        caption: "¡Finaliza la foto principal de 'La Infiltrada'! Entramos de lleno en la sala de etalonaje y diseño de sonido. Gracias a todo el equipo por este gran viaje. #LaInfiltrada #EnRodaje #Etalonaje #MorenaFilms",
        publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        likesCount: 5120,
        commentsCount: 240,
        detectedHashtags: ["#LaInfiltrada", "#EnRodaje", "#Etalonaje", "#MorenaFilms"],
        taggedDoP: "@pilar_sanchez_dop",
        taggedDirector: "@arantxaechevarria",
        signalSeverity: "CRITICAL",
        signalType: "INSTAGRAM_POST_PRODUCTION_WRAP",
        opportunityScore: 95,
      },
    ],
    "el-sueno-eterno": [
      {
        id: "post_sueno_1",
        caption: "Avanzando en la posproducción de nuestro próximo largometraje de ficción en Madrid. Revisión de copiones y ajustando las salas de corrección de color. #ElSueñoEterno #CineEspañol #PostProduccion #ColorGrading",
        publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        likesCount: 1890,
        commentsCount: 76,
        detectedHashtags: ["#ElSueñoEterno", "#CineEspañol", "#PostProduccion", "#ColorGrading"],
        taggedDoP: "@javier_salmones_dop",
        taggedDirector: "@angel_gomez_dir",
        signalSeverity: "CRITICAL",
        signalType: "INSTAGRAM_POST_PRODUCTION_WRAP",
        opportunityScore: 94,
      },
    ],
    "a24": [
      {
        id: "post_a24_1",
        caption: "Picture lock achieved. Color grading and final 4K master finishing underway in New York. #A24 #FilmFinishing #ColorGrading",
        publishedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        likesCount: 48900,
        commentsCount: 1200,
        detectedHashtags: ["#A24", "#FilmFinishing", "#ColorGrading"],
        taggedDoP: "@alexgarland_dop",
        signalSeverity: "CRITICAL",
        signalType: "INSTAGRAM_POST_PRODUCTION_WRAP",
        opportunityScore: 98,
      },
    ],
  };

  const defaultPosts: InstagramPost[] = [
    {
      id: `post_${cleanHandle}_1`,
      caption: `¡Última jornada de rodaje completada para el nuevo proyecto de ${companyName}! Iniciamos proceso de montaje offline y selección de estudio de etalonaje de color. #EnRodaje #PostProduccion #ColorGrading #Cine`,
      publishedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      likesCount: 1450,
      commentsCount: 68,
      detectedHashtags: ["#EnRodaje", "#PostProduccion", "#ColorGrading", "#Cine"],
      taggedDoP: "@dop_cinematographer",
      taggedDirector: "@director_auteur",
      signalSeverity: "CRITICAL",
      signalType: "INSTAGRAM_POST_PRODUCTION_WRAP",
      opportunityScore: 93,
    },
    {
      id: `post_${cleanHandle}_2`,
      caption: `Ajustes de flujo de trabajo en 4K HDR para nuestro nuevo largometraje en desarrollo. #HDR #ColorMastering #${cleanHandle}`,
      publishedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      likesCount: 920,
      commentsCount: 34,
      detectedHashtags: ["#HDR", "#ColorMastering"],
      taggedDoP: "@dop_cinematographer",
      signalSeverity: "HIGH",
      signalType: "COLOR_GRADING_WORKFLOW",
      opportunityScore: 88,
    },
  ];

  const posts = hashtagsMap[companySlug] || defaultPosts;

  return {
    handle: `@${cleanHandle}`,
    url: `https://instagram.com/${cleanHandle}`,
    fullName: `${companyName} Official`,
    followerCount: 24500,
    postCount: 342,
    isVerified: true,
    bio: `Official Instagram Account for ${companyName}. Feature films, original series and production announcements.`,
    category: "Film & TV Production Studio",
    recentPosts: posts,
  };
}
