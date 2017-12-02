export default {
  title: 'Sconsigliato',
  subtitle: 'Bad companies',

  resources: {
    B: 'Barone',
    M: 'Money',
    S: 'Soldier',
    W: 'Weapon',
    C: 'Contact',
    I: 'Investigation'
  },

  wildcards: {
    B: ['M', 'S', 'W', 'C', 'I']
  },

  start: ((globals, hand, deck, discard, removed) => {
    hand.push('M', 'M', 'S', 'S', 'W', 'W', 'C', 'C')

    deck.push('Ascend in Power', 'ASDF', 'Lorem Ipsum')
  }),

  turn: ((globals, hand, deck, discard, removed) => {
  }),

  cards: {
    'Ascend in Power': {
      text: 'The foundations are shaking',
      actions: [
        {
          text: 'Accept',
          cost: ['S'],
          actions: {
            resources: ['B', 'W'],
            send: 'removed'
          }
        },

        {
          text: 'Deny',
          cost: [],
          actions: {
            resources: ['I']
          }
        },
      ],
    },

    'Lorem Ipsum': {
      text: 'Dolor sit amet',
      actions: [
        {
          text: 'Accept',
          cost: ['S'],
          actions: {
            resources: ['B', 'W'],
            send: 'removed'
          }
        },
      ],
    },

    'ASDF': {
      text: 'GH IJ KL',
      actions: [
        {
          text: 'Accept',
          cost: ['S'],
          actions: {
            resources: ['B', 'W'],
            send: 'removed'
          }
        },

        {
          text: 'C',
          cost: [],
          actions: {
            resources: ['I']
          }
        },

        {
          text: 'Deny',
          cost: [],
          actions: {
            resources: ['I']
          }
        },
      ],
    },
  }
}
