/**
 * Tagalog / Filipino practice content — all offline. Expand anytime.
 * TTS/STT locale: use fil-PH (install Filipino voice & offline models in system settings when available).
 */
export const TAGALOG_SPEECH_LOCALE = 'fil-PH' as const;

export type TagalogTheme = {
  key: string;
  emoji: string;
  labelTl: string;
  labelEn: string;
  words: readonly string[];
};

/** Themed word pools — keeps rounds feeling fresh. */
export const TAGALOG_THEMES: readonly TagalogTheme[] = [
  {
    key: 'pagkain',
    emoji: '🍚',
    labelTl: 'Pagkain',
    labelEn: 'Food',
    words: [
      'kanin',
      'tinapay',
      'sabaw',
      'mansanas',
      'gatas',
      'itlog',
      'isda',
      'gulay',
      'prutas',
      'kendi',
      'manok',
      'baboy',
      'baka',
      'tubig',
      'asukal',
      'asin',
      'kamote',
      'mais',
      'saging',
      'pakwan',
      'pinya',
      'keso',
      'bigas',
    ],
  },
  {
    key: 'pamilya',
    emoji: '👨‍👩‍👧',
    labelTl: 'Pamilya',
    labelEn: 'Family',
    words: [
      'nanay',
      'tatay',
      'ate',
      'kuya',
      'bunso',
      'lola',
      'lolo',
      'pinsan',
      'kaibigan',
      'tito',
      'tita',
      'anak',
      'asawa',
      'pamilya',
      'pamangkin',
    ],
  },
  {
    key: 'kilos',
    emoji: '🏃',
    labelTl: 'Kilos',
    labelEn: 'Actions',
    words: [
      'tumakbo',
      'tumawa',
      'kumain',
      'uminom',
      'matulog',
      'bumangon',
      'maglaro',
      'magbasa',
      'kumanta',
      'sumayaw',
      'tumulong',
      'mag-isip',
      'magguhit',
      'maglinis',
      'magluto',
      'magbihis',
      'maghilamos',
      'magsepilyo',
      'magdasal',
    ],
  },
  {
    key: 'lugar',
    emoji: '🏠',
    labelTl: 'Lugar',
    labelEn: 'Places',
    words: [
      'bahay',
      'paaralan',
      'parke',
      'ospital',
      'tindahan',
      'simbahan',
      'dagat',
      'burol',
      'palengke',
      'aklatan',
      'paliparan',
      'istasyon',
      'tulay',
      'ilog',
      'bundok',
    ],
  },
  {
    key: 'damdamin',
    emoji: '💛',
    labelTl: 'Damdamin',
    labelEn: 'Feelings',
    words: [
      'masaya',
      'malungkot',
      'matapang',
      'mapagmahal',
      'kalmado',
      'sabik',
      'proud',
      'takot',
      'galit',
      'tuwa',
      'hiya',
      'pagod',
    ],
  },
  {
    key: 'pagbati',
    emoji: '👋',
    labelTl: 'Pagbati',
    labelEn: 'Greetings',
    words: [
      'kumusta',
      'salamat',
      'paalam',
      'magandang umaga',
      'magandang gabi',
      'pasensya',
      'tara',
      'mabuhay',
      'paumanhin',
      'ingat',
      'maligayang bati',
      'magandang tanghali',
    ],
  },
  {
    key: 'kalikasan',
    emoji: '🌿',
    labelTl: 'Kalikasan',
    labelEn: 'Nature',
    words: [
      'araw',
      'buwan',
      'ulan',
      'hangin',
      'punongkahoy',
      'bulaklak',
      'ibon',
      'alon',
      'bato',
      'ulap',
      'kidlat',
      'bituin',
      'lupa',
    ],
  },
  {
    key: 'laro',
    emoji: '🎲',
    labelTl: 'Laro',
    labelEn: 'Play',
    words: [
      'laruan',
      'bola',
      'muwebles',
      'luksohan',
      'taguan',
      'piko',
      'luksong tinik',
      'sungka',
      'dama',
      'teka-teka',
    ],
  },
  {
    key: 'kulay',
    emoji: '🎨',
    labelTl: 'Kulay',
    labelEn: 'Colors',
    words: ['pula', 'asul', 'dilaw', 'berde', 'puti', 'itim', 'kahel', 'lila', 'rosas', 'kayumanggi'],
  },
  {
    key: 'hayop',
    emoji: '🐾',
    labelTl: 'Hayop',
    labelEn: 'Animals',
    words: [
      'aso',
      'pusa',
      'kambing',
      'kalabaw',
      'baboy-damo',
      'langgam',
      'gagamba',
      'palaka',
      'daga',
      'lawin',
      'tuko',
      'ahas',
    ],
  },
  {
    key: 'katawan',
    emoji: '🧍',
    labelTl: 'Bahagi ng katawan',
    labelEn: 'Body',
    words: [
      'ulo',
      'mata',
      'ilong',
      'bibig',
      'tainga',
      'kamay',
      'paa',
      'braso',
      'binti',
      'daliri',
      'likod',
      'tiyan',
    ],
  },
  {
    key: 'paaralan',
    emoji: '📚',
    labelTl: 'Paaralan',
    labelEn: 'School',
    words: [
      'klase',
      'guro',
      'estudyante',
      'kuwaderno',
      'lapis',
      'pambura',
      'papel',
      'mesa',
      'upuan',
      'librong-aralin',
      'takdang-aralin',
      'silid-aralan',
    ],
  },
  {
    key: 'oras',
    emoji: '🕒',
    labelTl: 'Oras',
    labelEn: 'Time',
    words: [
      'umaga',
      'tanghali',
      'hapon',
      'gabi',
      'ngayon',
      'bukas',
      'kahapon',
      'minuto',
      'oras',
      'linggo',
    ],
  },
] as const;

const ALL_TAGALOG_WORDS: string[] = TAGALOG_THEMES.flatMap((t) => [...t.words]);

export type TagalogWordRound = {
  word: string;
  theme: TagalogTheme;
};

/** One entry per unique word (first theme wins if a word appeared twice). Shuffled without repeat in games. */
export const TAGALOG_WORD_ROUNDS: readonly TagalogWordRound[] = (() => {
  const seen = new Set<string>();
  const rounds: TagalogWordRound[] = [];
  for (const theme of TAGALOG_THEMES) {
    for (const word of theme.words) {
      if (seen.has(word)) continue;
      seen.add(word);
      rounds.push({ word, theme });
    }
  }
  return rounds;
})();

export function pickTagalogWordRound(
  exclude: string | null,
  avoidThemeKey: string | null
): TagalogWordRound {
  const themes =
    avoidThemeKey && TAGALOG_THEMES.length > 1
      ? TAGALOG_THEMES.filter((t) => t.key !== avoidThemeKey)
      : [...TAGALOG_THEMES];
  const theme = themes[Math.floor(Math.random() * themes.length)]!;
  const pool = theme.words.filter((w) => w !== exclude);
  const word =
    pool[Math.floor(Math.random() * pool.length)] ??
    ALL_TAGALOG_WORDS.filter((w) => w !== exclude)[0] ??
    'salamat';
  return { word, theme };
}

/** Rotating “energy” lines so screens do not feel static. */
export const TAGALOG_ECHO_CHALLENGES: readonly string[] = [
  'Sabihin nang malakas — buhay ang salita!',
  'Gayahin ang tunog. Maaari ring maglaro ng boses!',
  'Sunod-sunod na tamang sagot? May bonus saya.',
  'Isang hininga, isang salita. Kayang-kaya!',
  'Bigyang-kulay ang bawat pantig.',
  'Listen, then say it like a little story.',
  'Pause. Smile. Speak. Repeat.',
] as const;

export const TAGALOG_ECHO_TIPS: readonly string[] = [
  'Tip: magpalit-palit ng tono — parang dula!',
  'Pwede kayong mag-duet ng bata at magulang.',
  'Walang pressure: ang boses ay parang laro.',
] as const;

export type ReadTier = 1 | 2 | 3;

export type TagalogReadFlair = 'tanong' | 'tuwa' | 'kuwento' | 'paalala';

export type TagalogReadSentence = {
  text: string;
  tier: ReadTier;
  flair: TagalogReadFlair;
};

export const TAGALOG_READ_SENTENCES: readonly TagalogReadSentence[] = [
  { text: 'Magandang umaga sa iyo.', tier: 1, flair: 'paalala' },
  { text: 'Kumusta ka ngayon?', tier: 1, flair: 'tanong' },
  { text: 'Salamat sa iyong tulong.', tier: 1, flair: 'tuwa' },
  { text: 'Gusto kong maglaro sa labas.', tier: 1, flair: 'kuwento' },
  { text: 'Ang langit ay mapusyaw na asul.', tier: 1, flair: 'kuwento' },
  { text: 'Kumain ka na ba?', tier: 1, flair: 'tanong' },
  { text: 'Mahal kita, anak.', tier: 1, flair: 'tuwa' },
  { text: 'Tara, maglakad tayo.', tier: 1, flair: 'paalala' },
  { text: 'May bagong araw bukas.', tier: 1, flair: 'kuwento' },
  { text: 'Nakakatuwang magbasa.', tier: 1, flair: 'tuwa' },
  { text: 'Mainit ang sabaw.', tier: 1, flair: 'kuwento' },
  { text: 'Nasaan ang lapis ko?', tier: 1, flair: 'tanong' },
  { text: 'Magandang tanghali po.', tier: 1, flair: 'paalala' },
  { text: 'Laro tayo ng taguan.', tier: 1, flair: 'tuwa' },
  { text: 'Uminom ka ng tubig.', tier: 1, flair: 'paalala' },
  { text: 'Masaya ako ngayon.', tier: 1, flair: 'tuwa' },
  { text: 'Ang aso ay tumatahol.', tier: 1, flair: 'kuwento' },
  { text: 'Bilis ng ulan!', tier: 1, flair: 'kuwento' },
  { text: 'Pakihatid ang plato.', tier: 1, flair: 'paalala' },
  { text: 'Nakita ko ang bahaghari.', tier: 1, flair: 'kuwento' },
  { text: 'Tulog na ang sanggol.', tier: 1, flair: 'kuwento' },
  { text: 'Mag-ingat sa kalsada.', tier: 1, flair: 'paalala' },
  { text: 'Gusto ko ng tinapay.', tier: 1, flair: 'kuwento' },
  { text: 'Sino ang kasama mo?', tier: 1, flair: 'tanong' },
  { text: 'Malinis ang mesa.', tier: 1, flair: 'kuwento' },
  { text: 'Sabay tayong kumanta.', tier: 1, flair: 'tuwa' },
  { text: 'May bulaklak sa hardin.', tier: 1, flair: 'kuwento' },
  { text: 'Hapunan na ba?', tier: 1, flair: 'tanong' },
  { text: 'Mahaba ang pila.', tier: 1, flair: 'kuwento' },
  { text: 'Ngitian mo ang guro.', tier: 1, flair: 'paalala' },
  { text: 'Tumalon ang palaka.', tier: 1, flair: 'kuwento' },
  { text: 'Malamig ang gatas.', tier: 1, flair: 'kuwento' },
  { text: 'Magdasal bago kumain.', tier: 1, flair: 'paalala' },
  { text: 'Bumili kami ng prutas.', tier: 1, flair: 'kuwento' },
  { text: 'Nasaan ang parke?', tier: 1, flair: 'tanong' },
  { text: 'Mabango ang tinapay.', tier: 1, flair: 'kuwento' },
  { text: 'Mahaba ang gabi.', tier: 1, flair: 'kuwento' },
  { text: 'Ayaw kong mag-away.', tier: 1, flair: 'kuwento' },
  { text: 'Tumulong ako kay nanay.', tier: 1, flair: 'tuwa' },
  { text: 'Bukas ay Linggo.', tier: 1, flair: 'paalala' },
  { text: 'May puting ulap.', tier: 1, flair: 'kuwento' },
  { text: 'Tumakbo ang kuneho.', tier: 1, flair: 'kuwento' },
  { text: 'Mahal ko ang pamilya.', tier: 1, flair: 'tuwa' },
  { text: 'Paumanhin po, late ako.', tier: 1, flair: 'paalala' },

  { text: 'Ang libro ay puno ng mga kuwento.', tier: 2, flair: 'kuwento' },
  { text: 'Huwag kalimutang mag-toothbrush bago matulog.', tier: 2, flair: 'paalala' },
  { text: 'Bakit kaya umuulan ngayon?', tier: 2, flair: 'tanong' },
  { text: 'Mas masaya kapag magkasama tayo.', tier: 2, flair: 'tuwa' },
  { text: 'Tumakbo nang dahan-dahan sa daan.', tier: 2, flair: 'paalala' },
  { text: 'Narinig ko ang mga ibon sa umaga.', tier: 2, flair: 'kuwento' },
  { text: 'Pumili ako ng mansanas sa tindahan.', tier: 2, flair: 'kuwento' },
  { text: 'Matutong maghintay — sulit ang oras.', tier: 2, flair: 'paalala' },
  { text: 'Ngiti muna bago magsalita.', tier: 2, flair: 'tuwa' },
  { text: 'Ang kaibigan ay parang bituin sa gabi.', tier: 2, flair: 'kuwento' },
  { text: 'Nagpraktis ako ng pagbigkas bago pumasok sa klase.', tier: 2, flair: 'kuwento' },
  { text: 'Huminto muna tayo at huminga nang malalim.', tier: 2, flair: 'paalala' },
  { text: 'Bakit kaya makulay ang mga bulaklak sa burol?', tier: 2, flair: 'tanong' },
  { text: 'Masarap ang kanin kapag may kasamang pamilya.', tier: 2, flair: 'tuwa' },
  { text: 'Dahan-dahan sa hagdan — madulas kapag maulan.', tier: 2, flair: 'paalala' },
  { text: 'Nagtanim kami ng kamote sa maliit na paso.', tier: 2, flair: 'kuwento' },
  { text: 'Ano ang paborito mong kuwento sa aklatan?', tier: 2, flair: 'tanong' },
  { text: 'Tumulong akong magligpit matapos ang meryenda.', tier: 2, flair: 'tuwa' },
  { text: 'Ang hangin sa dagat ay maalat at malamig.', tier: 2, flair: 'kuwento' },
  { text: 'Magbihis ng maayos bago lumabas ng bahay.', tier: 2, flair: 'paalala' },
  { text: 'Nakita kong lumipad ang mga ibon patungong timog.', tier: 2, flair: 'kuwento' },
  { text: 'Mas gusto ko ang mansanas kaysa pakwan ngayon.', tier: 2, flair: 'kuwento' },
  { text: 'Paano mo pinapakita ang pasasalamat sa matatanda?', tier: 2, flair: 'tanong' },
  { text: 'Ngiti lang — kayang-kaya ang bagong aralin.', tier: 2, flair: 'tuwa' },
  { text: 'Ang tren ay huminto nang sandali sa istasyon.', tier: 2, flair: 'kuwento' },
  { text: 'Magsepilyo ng dalawang minuto bago matulog.', tier: 2, flair: 'paalala' },
  { text: 'Nagguhit ako ng bundok at ilog sa kuwaderno.', tier: 2, flair: 'kuwento' },
  { text: 'Bakit mahalaga ang tubig sa ating katawan?', tier: 2, flair: 'tanong' },
  { text: 'Masaya kaming naglaro ng sungka pagkatapos ng klase.', tier: 2, flair: 'tuwa' },
  { text: 'May mga bato sa tabi ng ilog na makintab sa araw.', tier: 2, flair: 'kuwento' },
  { text: 'Huwag magmadali — may oras pa para mag-aral.', tier: 2, flair: 'paalala' },
  { text: 'Nakinig ako sa payo ng lolo bago umuwi.', tier: 2, flair: 'kuwento' },
  { text: 'Sino ang nagtanim ng punongkahoy sa paaralan?', tier: 2, flair: 'tanong' },
  { text: 'Salamat sa payo mo kahapon — nakatulong iyon.', tier: 2, flair: 'tuwa' },
  { text: 'Ang simbahan sa bayan ay matanda na ngunit maalaga.', tier: 2, flair: 'kuwento' },
  { text: 'Maghilamos pagkagising at bago matulog.', tier: 2, flair: 'paalala' },
  { text: 'Nagpatuloy ang ulan kaya nagdala ako ng payong.', tier: 2, flair: 'kuwento' },
  { text: 'Ano ang pinakamasayang laro sa iyong paaralan?', tier: 2, flair: 'tanong' },
  { text: 'Mas magaan ang loob kapag may kausap kang kaibigan.', tier: 2, flair: 'tuwa' },
  { text: 'Ang palengke ay maingay ngunit puno ng sariwang gulay.', tier: 2, flair: 'kuwento' },
  { text: 'Mag-ipon ng lakas bago sumayaw sa entablado.', tier: 2, flair: 'paalala' },
  { text: 'Nagbasa ako ng maikling tula bago matulog.', tier: 2, flair: 'kuwento' },
  { text: 'Bakit kaya umuugong ang hangin sa mga puno?', tier: 2, flair: 'tanong' },
  { text: 'Natutuwa ako kapag may bagong salitang natutunan.', tier: 2, flair: 'tuwa' },
  { text: 'May mga bituin na parang munting lampara sa langit.', tier: 2, flair: 'kuwento' },

  { text: 'Kapag may tinanim, may aanihin — magtiwala sa maliit na hakbang araw-araw.', tier: 3, flair: 'paalala' },
  { text: 'Nais kong matuto ng bagong salita bawat linggo, kahit isa lang.', tier: 3, flair: 'kuwento' },
  { text: 'Ang tunay na tapang ay marunong huminga bago magsalita.', tier: 3, flair: 'kuwento' },
  { text: 'Paano mo ipapakita ang pasasalamat nang walang salita?', tier: 3, flair: 'tanong' },
  { text: 'Sa ilalim ng ulan, may saya pa ring natatago.', tier: 3, flair: 'tuwa' },
  { text: 'Ang dila ay maliit, ngunit kayang magdala ng malaking kabaitan.', tier: 3, flair: 'kuwento' },
  { text: 'Magbasa nang mahinahon — ang bawat pantig ay yaman.', tier: 3, flair: 'paalala' },
  { text: 'Kapag napagod, huminto, uminom ng tubig, at bumalik sa kwento.', tier: 3, flair: 'paalala' },
  { text: 'Ang tunay na yaman ay hindi nasusukat sa ingay ng boses kundi sa bait ng ginawa.', tier: 3, flair: 'kuwento' },
  { text: 'Paano mo hahatiin ang mahabang pangungusap upang hindi mawala ang diin?', tier: 3, flair: 'tanong' },
  { text: 'Nang maglakad kami sa tabing-dagat, parang humihikayat ang alon na magpatuloy.', tier: 3, flair: 'tuwa' },
  { text: 'Ang kuwento ng lola ay may tinig na parang mainit na tsaa sa tag-ulan.', tier: 3, flair: 'kuwento' },
  { text: 'Magtanim ng pasensya sa bawat aralin — lalaki rin iyon tulad ng halaman.', tier: 3, flair: 'paalala' },
  { text: 'Kung ang salita ay buto ng katotohanan, ang pakikinig ay lupa kung saan ito tumutubo.', tier: 3, flair: 'kuwento' },
  { text: 'Bakit mahalaga ang tahimik na sandali bago magsalita nang mahaba?', tier: 3, flair: 'tanong' },
  { text: 'Natutuwa ako kapag ang klase ay nagbabasa nang sabay-sabay na parang awit.', tier: 3, flair: 'tuwa' },
  { text: 'Sa ilalim ng mga ulap, may liwanag pa ring nag-aabang sa mga handang tumingin.', tier: 3, flair: 'kuwento' },
  { text: 'Huwag kalimutang magpasalamat sa guro na naglaan ng oras para sa iyo.', tier: 3, flair: 'paalala' },
  { text: 'Ang dula sa entablado ay hindi lamang linya — ito ay hininga ng maraming kamay.', tier: 3, flair: 'kuwento' },
  { text: 'Paano mo ipapakita ang tapat na pakikinig kahit hindi ka sumasang-ayon?', tier: 3, flair: 'tanong' },
  { text: 'Nang makita kong bumalik ang ibon, parang may munting pag-asa sa bintana.', tier: 3, flair: 'tuwa' },
  { text: 'Ang librong may mga pahinang kulubot ay maaaring may pinakamatamis na kuwento.', tier: 3, flair: 'kuwento' },
  { text: 'Mag-aral ng isang salita bawat araw — darating ang araw na buo na ang pangungusap.', tier: 3, flair: 'paalala' },
  { text: 'Ang ulan sa bubong ay ritmong hinihintay ng mga halaman sa hardin.', tier: 3, flair: 'kuwento' },
  { text: 'Ano ang ginagawa ng tapang kapag hindi ito sumisigaw?', tier: 3, flair: 'tanong' },
  { text: 'Masaya ang hapag-kainan kapag may tawanan kahit simple lang ang ulam.', tier: 3, flair: 'tuwa' },
  { text: 'Ang tulay sa ilog ay tanda na may daan patungo sa kabila ng takot.', tier: 3, flair: 'kuwento' },
  { text: 'Bago magsalita nang tulin, tiyakin ang hangin sa dibdib — mahaba pa ang araw.', tier: 3, flair: 'paalala' },
  { text: 'Ang mga bituin sa probinsiya ay mas malinaw dahil banayad ang ilaw ng lungsod.', tier: 3, flair: 'kuwento' },
  { text: 'Paano mo babalikan ang isang pangakong nasabi nang malumanay?', tier: 3, flair: 'tanong' },
  { text: 'Natutuwa ako sa mga salitang may lambing — parang kumot sa malamig na gabi.', tier: 3, flair: 'tuwa' },
  { text: 'Ang dagat ay hindi sumusuko sa dalampasigan kahit ilang alon pa ang dumaan.', tier: 3, flair: 'kuwento' },
  { text: 'Mag-ipon ng mga kuwentong mabuti — sila ang magiging ilaw sa mga pagod na gabi.', tier: 3, flair: 'paalala' },
  { text: 'Ang tinig ng kuya ay may tibay, ngunit may lambing kapag pinapayuhan ang bunso.', tier: 3, flair: 'kuwento' },
  { text: 'Bakit kaya mas malalim ang pakikinig kapag tahimik ang paligid?', tier: 3, flair: 'tanong' },
  { text: 'Kapag nagkasundo ang mga kaibigan, parang bumagal ang oras upang magpakabusog sa usapan.', tier: 3, flair: 'tuwa' },
  { text: 'Ang mga salitang hinabi nang maingat ay kumot na hindi nagkukulang sa init.', tier: 3, flair: 'kuwento' },
  { text: 'Maglakad nang may layunin — kahit maliit — at lalapad ang daan.', tier: 3, flair: 'paalala' },
  { text: 'Sa likod ng simbahan may halaman na tahimik na lumalago sa lilim ng kasaysayan.', tier: 3, flair: 'kuwento' },
  { text: 'Ano ang iyong gagawin kung ang salita mo ay maaaring masaktan ang iba?', tier: 3, flair: 'tanong' },
  { text: 'Nakakagaan ng dibdib ang tunay na paumanhin na sinabi nang malinaw at tapat.', tier: 3, flair: 'tuwa' },
  { text: 'Ang hangin sa burol ay parang payo: hindi mo makita, ngunit ramdam sa balat.', tier: 3, flair: 'kuwento' },
  { text: 'Magbasa ng malakas sa harap ng salamin — makikita mo ang tapang sa iyong mga mata.', tier: 3, flair: 'paalala' },
  { text: 'Ang mga punongkahoy sa paaralan ay saksi sa maraming unang salitang binibigkas.', tier: 3, flair: 'kuwento' },
  { text: 'Paano mo ipagdadamayan ang kaibigan nang hindi kinakailangang sumigaw?', tier: 3, flair: 'tanong' },
  { text: 'Masaya ang paglalakbay kapag may baon kang awit at munting sanaysay sa bulsa.', tier: 3, flair: 'tuwa' },
  { text: 'Ang liwanag ng buwan ay sapat upang maglakad nang may pag-iingat sa daan.', tier: 3, flair: 'kuwento' },
  { text: 'Huwag ipagpaliban ang pasasalamat — may mga taong naghihintay sa liit na salita.', tier: 3, flair: 'paalala' },
  { text: 'Ang tinig ng batang nagbabasa ay parang buto ng puno — lalaki at lalapit sa langit.', tier: 3, flair: 'kuwento' },
  { text: 'Ano ang kahulugan ng “magandang umaga” kapag sinabi ito nang tapat?', tier: 3, flair: 'tanong' },
  { text: 'Natutuwa ako kapag ang salitang bago ay tumigas sa dila at bumalik bilang kaibigan.', tier: 3, flair: 'tuwa' },
  { text: 'Ang ulan sa lungsod ay may tunog na iba sa ulan sa bukid — parehong nagdidilig ng lupa.', tier: 3, flair: 'kuwento' },
  { text: 'Mag-ipon ng mga tanong — ang isang matalinong tanong ay pintuan ng maraming sagot.', tier: 3, flair: 'paalala' },
  { text: 'Ang mga salitang binibigkas nang may respeto ay lumalakad nang walang ingay ng away.', tier: 3, flair: 'kuwento' },
  { text: 'Paano mo ipaparamdam ang alaga nang hindi mo kailangang ipaalam ang lahat?', tier: 3, flair: 'tanong' },
  { text: 'Masaya ang munting tagumpay kapag may humahabi ng mga salitang “magaling ka”.', tier: 3, flair: 'tuwa' },
  { text: 'Ang kuwento ng bayan ay nabubuhay kapag may batang handang magbasa nang malakas.', tier: 3, flair: 'kuwento' },
] as const;

const FLAIR_LABEL: Record<TagalogReadFlair, { tl: string; en: string }> = {
  tanong: { tl: 'Tanong', en: 'Question' },
  tuwa: { tl: 'Tuwa', en: 'Joy' },
  kuwento: { tl: 'Kuwento', en: 'Story' },
  paalala: { tl: 'Paalala', en: 'Reminder' },
};

export function flairLabel(flair: TagalogReadFlair): { tl: string; en: string } {
  return FLAIR_LABEL[flair];
}

export function maxReadTierForLevel(level: number): ReadTier {
  if (level >= 50) return 3;
  if (level >= 20) return 2;
  return 1;
}

/** Tier-filtered list for shuffle-without-repeat in read-aloud. */
export function tagalogReadPoolForLevel(level: number): readonly TagalogReadSentence[] {
  const maxTier = maxReadTierForLevel(level);
  return TAGALOG_READ_SENTENCES.filter((s) => s.tier <= maxTier);
}

export function pickTagalogReadSentence(
  level: number,
  exclude: string | null
): TagalogReadSentence {
  const maxTier = maxReadTierForLevel(level);
  const pool = TAGALOG_READ_SENTENCES.filter(
    (s) => s.tier <= maxTier && s.text !== exclude
  );
  const list = pool.length > 0 ? pool : [...TAGALOG_READ_SENTENCES];
  return list[Math.floor(Math.random() * list.length)]!;
}

export const TAGALOG_READ_ROTATORS: readonly string[] = [
  'Bawat pangungusap ay parang isang yugto ng dula.',
  'Hatiin sa maliliit na bahagi kung mahaba.',
  'Mag-enjoy sa tunog ng Wikang Filipino!',
] as const;
