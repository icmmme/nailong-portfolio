export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  cover: string;
  images?: string[];
  client?: string;
  year?: string;
  video?: string;
  href?: string;
  source?: { label: string; href: string };
  featured: boolean;
}

// Edit this file to personalize the entire portfolio. Cards open local previews;
// href is an optional external link inside a project's preview.
export const profile = {
  name: 'NAILONG',
  title: 'A little yellow stranger.',
  intro: 'Wandering through borrowed worlds, finding familiar feelings in unfamiliar places. A little curiosity, a little mischief, and a soft spot for impossible dreams.',
  note: 'Twenty moments, somewhere between art and daydreams.',
  email: '',
  socials: [] as { label: string; href: string }[],
};

export const collection = {
  intro: 'Familiar worlds. Unexpected guests.',
  note: '20 reimagined classics · Open an image to explore',
  contactTitle: 'Somewhere else.',
  contactIntro: 'Borrowed worlds. Familiar dreams.\nA little yellow stranger passing through.\nStay a while.',
};

export const projects: Project[] = [
  {
    "id": "nailong-01",
    "title": "Four Horsemen of the Apocalypse",
    "category": "Reimagined Classics",
    "description": "Four small riders cross a restless sky. The end of the world takes on a softer shade of yellow.",
    "cover": "/assets/nailong/01.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-02",
    "title": "The Coronation of Napoleon",
    "category": "Reimagined Classics",
    "description": "Gold, velvet, and a room full of yellow faces. For a moment, even the smallest guest feels like royalty.",
    "cover": "/assets/nailong/02.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-03",
    "title": "The Calling of Saint Matthew",
    "category": "Reimagined Classics",
    "description": "A quiet table. A sudden beam of light. Something ordinary becomes a little mysterious.",
    "cover": "/assets/nailong/03.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-04",
    "title": "Creation of Adam",
    "category": "Reimagined Classics",
    "description": "Two fingertips almost meet. A whole world waits in the space between them.",
    "cover": "/assets/nailong/04.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-05",
    "title": "The Last Supper",
    "category": "Reimagined Classics",
    "description": "A familiar gathering. A few unexpected guests. Yellow faces around a table outside of time.",
    "cover": "/assets/nailong/05.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-06",
    "title": "Napoleon Crossing the Alps",
    "category": "Reimagined Classics",
    "description": "A red cloak catches the mountain wind. One little rider dreams far beyond the next bend.",
    "cover": "/assets/nailong/06.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-07",
    "title": "Washington Rallying the Troops at Monmouth",
    "category": "Reimagined Classics",
    "description": "Through smoke and restless horses, a warm yellow figure finds a place in the noise of history.",
    "cover": "/assets/nailong/07.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-08",
    "title": "Napoleon at Brienne",
    "category": "Reimagined Classics",
    "description": "A small figure reads beneath a quiet lamp. On the wall, a much larger dream begins to take shape.",
    "cover": "/assets/nailong/08.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-09",
    "title": "Napoleon near Borodino",
    "category": "Reimagined Classics",
    "description": "A pause in the dust of a distant battlefield. Yellow silhouettes wait while the world holds its breath.",
    "cover": "/assets/nailong/09.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-10",
    "title": "The Raft of the Medusa",
    "category": "Reimagined Classics",
    "description": "Between dark waves and a distant horizon, a few yellow souls hold on to the possibility of morning.",
    "cover": "/assets/nailong/10.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-11",
    "title": "Hellelil and Hildebrand, the Meeting on the Turret Stairs",
    "category": "Reimagined Classics",
    "description": "Two strangers meet on a narrow stair. A passing touch leaves the old stone a little warmer.",
    "cover": "/assets/nailong/11.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-12",
    "title": "The Night Watch",
    "category": "Reimagined Classics",
    "description": "Faces emerge from the shadows. Somewhere in the crowd, yellow turns a solemn night into a curious one.",
    "cover": "/assets/nailong/12.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-13",
    "title": "The Proclamation of the German Empire",
    "category": "Reimagined Classics",
    "description": "A grand hall fills with tiny yellow witnesses. History puts on its finest clothes for an unusual audience.",
    "cover": "/assets/nailong/13.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-14",
    "title": "The Surrender of Breda",
    "category": "Reimagined Classics",
    "description": "Two crowds meet beneath an open sky. For a moment, the distance between them disappears.",
    "cover": "/assets/nailong/14.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-15",
    "title": "Washington Crossing the Delaware",
    "category": "Reimagined Classics",
    "description": "A little boat moves through ice and pale light. Its yellow passengers carry their hopes toward the other shore.",
    "cover": "/assets/nailong/15.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-16",
    "title": "Springtime",
    "category": "Reimagined Classics",
    "description": "A swing, a shared glance, and a green world drifting past. Two yellow figures let the afternoon last a little longer.",
    "cover": "/assets/nailong/16.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-17",
    "title": "Woman with a Parasol — Madame Monet and Her Son",
    "category": "Reimagined Classics",
    "description": "A green parasol floats above the grass. The wind gathers clouds, sunlight, and one bright yellow daydream.",
    "cover": "/assets/nailong/17.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-18",
    "title": "Springtime",
    "category": "Reimagined Classics",
    "description": "Beneath the leaves, a yellow figure settles into the grass. The afternoon has nowhere else to be.",
    "cover": "/assets/nailong/18.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-19",
    "title": "Liberty Leading the People",
    "category": "Reimagined Classics",
    "description": "A flag rises through the smoke. A small yellow face carries a surprisingly large dream.",
    "cover": "/assets/nailong/19.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  },
  {
    "id": "nailong-20",
    "title": "The Storm",
    "category": "Reimagined Classics",
    "description": "Two yellow figures run toward a brighter shore. Behind them, the sky keeps its secrets.",
    "cover": "/assets/nailong/20.jpg",
    "source": {
      "label": "Naiwa Art Universe",
      "href": "https://nailong-studio.github.io/NaiLong-Universe/"
    },
    "featured": true
  }
];
