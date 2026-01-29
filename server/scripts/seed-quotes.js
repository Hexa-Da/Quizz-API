require('dotenv').config();
const connectDB = require('../config/database');
const Quote = require('../models/Quote');
const funnyQuotes = [ 
    {
      id: 1,
      text: "C'est drôle comme les gens qui se croient instruits éprouvent le besoin de faire chier le monde.",
      author: "Boris Vian",
      missingWord: "drôle",
      options: ["drôle", "étrange", "bizarre", "curieux"]
    },
    {
      id: 2,
      text: "Quand j'étais petit à la maison, le plus dur c'était la fin du mois... Surtout les trente derniers jours !",
      author: "Coluche",
      missingWord: "dur",
      options: ["dur", "difficile", "pénible", "compliqué"]
    },
    {
      id: 3,
      text: "C'est pas parce qu'on a rien à dire qu'il faut fermer sa gueule.",
      author: "Michel Audiard",
      missingWord: "fermer",
      options: ["fermer", "garder", "serrer", "boucher"]
    },
    {
      id: 4,
      text: "Il faut cueillir les cerises avec la queue. J'avais déjà du mal avec la main !",
      author: "Coluche",
      missingWord: "cueillir",
      options: ["cueillir", "ramasser", "prendre", "attraper"]
    },
    {
      id: 5,
      text: "Quand on mettra les cons sur orbite, t'as pas fini de tourner.",
      author: "Michel Audiard",
      missingWord: "orbite",
      options: ["orbite", "espace", "ciel", "lune"]
    },
    {
      id: 6,
      text: "Pourquoi essayer de faire semblant d'avoir l'air de travailler ? C'est de la fatigue inutile !",
      author: "Pierre Dac",
      missingWord: "fatigue",
      options: ["fatigue", "perte", "gaspillage", "effort"]
    },
    {
      id: 7,
      text: "Socrate disait: \"Je sais que je ne sais rien\", donc chacun de nous en sait plus que Socrate, puisque nous savons au moins que Socrate ne savait rien.",
      author: "Jean Amadou",
      missingWord: "sait",
      options: ["sait", "connaît", "apprend", "comprend"]
    },
    {
      id: 8,
      text: "Boire du café empêche de dormir. Par contre, dormir empêche de boire du café.",
      author: "Philippe Geluck",
      missingWord: "empêche",
      options: ["empêche", "interdit", "bloque", "arrête"]
    },
    {
      id: 9,
      text: "Si le ridicule se mettait à tuer, les problèmes démographiques seraient vite réglés.",
      author: "Gaëtan Faucer",
      missingWord: "ridicule",
      options: ["ridicule", "bêtise", "folie", "absurdité"]
    },
    {
      id: 10,
      text: "Un pigeon, c'est plus con qu'un dauphin, d'accord... mais ça vole.",
      author: "Michel Audiard",
      missingWord: "vole",
      options: ["vole", "plane", "s'envole", "décolle"]
    },
    {
      id: 11,
      text: "Le meilleur argument contre la démocratie est un entretien de cinq minutes avec un électeur moyen.",
      author: "Winston Churchill",
      missingWord: "démocratie",
      options: ["démocratie", "république", "politique", "gouvernement"]
    },
    {
      id: 12,
      text: "Une star, c'est quelqu'un qui travaille dur pour être connu et qui, ensuite, porte des lunettes noires pour qu'on ne le reconnaisse pas.",
      author: "Fred Allen",
      missingWord: "connu",
      options: ["connu", "célèbre", "fameux", "réputé"]
    },
    {
      id: 13,
      text: "Le premier homme qui est mort a dû être drôlement surpris.",
      author: "Georges Wolinski",
      missingWord: "surpris",
      options: ["surpris", "étonné", "choqué", "stupéfait"]
    },
    {
      id: 14,
      text: "Ça m'en touche une sans faire bouger l'autre",
      author: "Jacques Chirac",
      missingWord: "touche",
      options: ["touche", "atteint", "affecte", "intéresse"]
    },
    {
      id: 15,
      text: "Les femmes viennent de Venus. Les hommes mangent des Mars.",
      author: "MC Solaar",
      missingWord: "mangent",
      options: ["mangent", "consomment", "dévorent", "avalent"]
    },
    {
      id: 16,
      text: "Faut se méfier de la connerie, les gens s'en emparent facilement.",
      author: "Gaëtan Faucer",
      missingWord: "connerie",
      options: ["connerie", "bêtise", "folie", "absurdité"]
    },
    {
      id: 17,
      text: "Souffrant d'insomnie, j'échangerais un matelas de plumes contre un sommeil de plomb.",
      author: "Pierre Dac",
      missingWord: "sommeil",
      options: ["sommeil", "repos", "dodo", "sieste"]
    },
    {
      id: 18,
      text: "Si l'herbe est plus verte dans le jardin de ton voisin, laisse-le s'emmerder à la tondre.",
      author: "Fred Allen",
      missingWord: "verte",
      options: ["verte", "belle", "haute", "fraîche"]
    },
    {
      id: 19,
      text: "On dit que le ridicule tue. Est-ce vrai ? Pas du tout! Regardez autour de vous, il n'y a que des gens bien portants.",
      author: "Raymond Devos",
      missingWord: "ridicule",
      options: ["ridicule", "bêtise", "folie", "absurdité"]
    },
    {
      id: 20,
      text: "Je me suis marié deux fois: deux catastrophes. Ma première femme est partie, la deuxième est restée.",
      author: "Francis Blanche",
      missingWord: "catastrophes",
      options: ["catastrophes", "désastres", "échecs", "drames"]
    }
  ];

async function seed() {
  await connectDB();
  await Quote.deleteMany({});
  const toInsert = funnyQuotes.map(({ text, author, missingWord, options }) => ({
    text, author, missingWord, options
  }));
  await Quote.insertMany(toInsert);
  console.log(`${toInsert.length} citations insérées`);
  process.exit(0);
}
seed().catch((err) => { console.error(err); process.exit(1); });