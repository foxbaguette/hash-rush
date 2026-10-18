'use strict';
/*
  Alien Worlds crew (crew.worlds) and weapon (arms.worlds) templates from the alien.worlds
  collection, grouped: every card lists its shines (Stone, Gold, XDimension, Stardust,
  Antimatter - lowest to highest) with their template ids. Crew cards that share a name are
  variants of one crew type. Pulled from wax.api.atomicassets.io on 2026-10-18.
*/
const AW_DATA = {
 "crew": [
  {
   "name": "Mysterious Hacker",
   "race": "Unknown",
   "rarity": "Epic",
   "variants": [
    {
     "cardid": 1,
     "element": "Air",
     "description": "This unidentified alien has been caught on camera in various restricted zones",
     "img": "Qme6fvdPzMbJ7zip2c33JPizGgL6P6uMkLz5HpXyrFfG3a",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19624
       ],
       "img": "Qme6fvdPzMbJ7zip2c33JPizGgL6P6uMkLz5HpXyrFfG3a",
       "attack": 14,
       "defense": 16
      },
      {
       "shine": "Gold",
       "templates": [
        141516
       ],
       "img": "QmUaX71sZaw4UAPEhqVvUziMAboi1SnHiCA2nbPXUdc4Da",
       "attack": 14,
       "defense": 18
      },
      {
       "shine": "Stardust",
       "templates": [
        141542
       ],
       "img": "QmdRAkEyEvdrJwDQ9NhWj98cCpfp5pFazTaviJhjtsCN2L",
       "attack": 16,
       "defense": 18
      },
      {
       "shine": "Antimatter",
       "templates": [
        141563
       ],
       "img": "Qmd6WjiSznkEftkEzrpMeVjatkdzoCtELSCDRtah3kRkhL",
       "attack": 18,
       "defense": 19
      }
     ]
    },
    {
     "cardid": 13,
     "element": "Gem",
     "description": "You think your password is safe heh?",
     "img": "QmVMAjAc83vzoLcB4uEEocrMtYLdX9Q8azSBVhBE7GfVip",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19636
       ],
       "img": "QmVMAjAc83vzoLcB4uEEocrMtYLdX9Q8azSBVhBE7GfVip",
       "attack": 15,
       "defense": 15
      },
      {
       "shine": "Gold",
       "templates": [
        141529
       ],
       "img": "QmaJx47876hS4jESxxB8hgoDh2TXpnWKB5VZiZS11w3s5t",
       "attack": 15,
       "defense": 17
      },
      {
       "shine": "Stardust",
       "templates": [
        141552
       ],
       "img": "QmUFmR6MnDcUxPEP9scnsN7vGwfffpRUzqGtrMfXozYvkB",
       "attack": 17,
       "defense": 17
      },
      {
       "shine": "Antimatter",
       "templates": [
        141569
       ],
       "img": "QmenPB3ZHa4S5b5EmtPUG9sp5nMs2JfLQmkk5arXVsDydX",
       "attack": 19,
       "defense": 19
      }
     ]
    }
   ]
  },
  {
   "name": "Stealth Mercenary",
   "race": "Unknown",
   "rarity": "Abundant",
   "variants": [
    {
     "cardid": 2,
     "element": "Neutral",
     "description": "The stealth comes from the tech, not from the mercenary",
     "img": "QmVRduT9RoAh4kq3srY52uEWe7MgEnUoteM2mMV4fVJWrq",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19625
       ],
       "img": "QmVRduT9RoAh4kq3srY52uEWe7MgEnUoteM2mMV4fVJWrq",
       "attack": 13,
       "defense": 11
      },
      {
       "shine": "Gold",
       "templates": [
        141517
       ],
       "img": "QmekpimMv4JeRjMJr5eyhgmDbnS8S99YCt4aB277UvLu1R",
       "attack": 14,
       "defense": 11
      }
     ]
    },
    {
     "cardid": 14,
     "element": "Air",
     "description": "Swift as an arrow and stealthy as a shadow",
     "img": "QmVXsVEkT5fuASSexrcMQuuXWZFFSuGRSyRkLGghq1yhpW",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19637
       ],
       "img": "QmVXsVEkT5fuASSexrcMQuuXWZFFSuGRSyRkLGghq1yhpW",
       "attack": 8,
       "defense": 8
      },
      {
       "shine": "Gold",
       "templates": [
        141530
       ],
       "img": "QmabApW5LGu4KeDFnBwMipwwDEWS5NCctA34uVtkMWrx57",
       "attack": 9,
       "defense": 8
      }
     ]
    }
   ]
  },
  {
   "name": "LG Soldier",
   "race": "LGP",
   "rarity": "Common",
   "variants": [
    {
     "cardid": 3,
     "element": "Neutral",
     "description": "The LG fighting style is based around speed and the element of surprise",
     "img": "QmSEZR4YEoudRvJTCK8XZy3TMGG4PYEjmmPKA1YPCT5Zod",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19626
       ],
       "img": "QmSEZR4YEoudRvJTCK8XZy3TMGG4PYEjmmPKA1YPCT5Zod",
       "attack": 4,
       "defense": 4
      },
      {
       "shine": "Gold",
       "templates": [
        141518
       ],
       "img": "QmWvaykUd9PZbu6UpHtSqSSFsvwwpmWKUc6NXMK81XK4cL",
       "attack": 4,
       "defense": 5
      },
      {
       "shine": "Stardust",
       "templates": [
        141543
       ],
       "img": "QmcXDZSau78ARPhNWgF9RdgiFhiuzD7x94oSACbLH3uEDy",
       "attack": 6,
       "defense": 5
      }
     ]
    },
    {
     "cardid": 15,
     "element": "Metal",
     "description": "LG soldiers prefer lightweight armor that doest hamper their fighting style",
     "img": "QmdS22WuoCWbv8eMPNiqB5CmZWTA8uxsAXeKTgR2iekszj",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19638
       ],
       "img": "QmdS22WuoCWbv8eMPNiqB5CmZWTA8uxsAXeKTgR2iekszj",
       "attack": 10,
       "defense": 7
      },
      {
       "shine": "Gold",
       "templates": [
        141531
       ],
       "img": "QmdpedR6K3LbXd9MJKGQJm6aUPVbsJatH63cnfnjrVvrCE",
       "attack": 11,
       "defense": 7
      },
      {
       "shine": "Stardust",
       "templates": [
        141553
       ],
       "img": "QmRkaEtFAXdYPZCHPwdSvCMDHxpb77jx6LqpwodnciKfCL",
       "attack": 11,
       "defense": 9
      }
     ]
    }
   ]
  },
  {
   "name": "Grey Scientist",
   "race": "Grey",
   "rarity": "Common",
   "variants": [
    {
     "cardid": 4,
     "element": "Air",
     "description": "Ethics are subjective, knowledge is power",
     "img": "QmQ6xzHJBdaQ82a9PXsciXjzCrkxa1MX2YmR562q7YHjir",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19627
       ],
       "img": "QmQ6xzHJBdaQ82a9PXsciXjzCrkxa1MX2YmR562q7YHjir",
       "attack": 16,
       "defense": 25
      },
      {
       "shine": "Gold",
       "templates": [
        141519
       ],
       "img": "QmerJ8fiUfq3N9GCFyEpw4Se8Aj582PnJkCqqstfJK3JMu",
       "attack": 16,
       "defense": 27
      },
      {
       "shine": "Stardust",
       "templates": [
        141544
       ],
       "img": "QmUBGpCjKqrXEUU5xQD6iwjRkLBwgzzBs6Lfd5Bzi8Uomb",
       "attack": 18,
       "defense": 27
      }
     ]
    },
    {
     "cardid": 16,
     "element": "Nature",
     "description": "What if your clone is better than you",
     "img": "QmXv4dduAzZH3shM89PTbfpA1xRbLnDLyCoRbhbKdhg4AD",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19639
       ],
       "img": "QmXv4dduAzZH3shM89PTbfpA1xRbLnDLyCoRbhbKdhg4AD",
       "attack": 19,
       "defense": 22
      },
      {
       "shine": "Gold",
       "templates": [
        141532
       ],
       "img": "QmQ8hqdUkfmMVdd4CF1bAwVMkLoLE2q9nqasRLPKbwh7oh",
       "attack": 19,
       "defense": 24
      },
      {
       "shine": "Stardust",
       "templates": [
        141554
       ],
       "img": "QmUi1VL14Z9QQwuuJDbYcfJvsY6RB3muXYk568mfAwp2tD",
       "attack": 21,
       "defense": 24
      }
     ]
    }
   ]
  },
  {
   "name": "Nordic Warrior",
   "race": "Nordic",
   "rarity": "Common",
   "variants": [
    {
     "cardid": 5,
     "element": "Fire",
     "description": "Nordic's traditional fighting style has changed little in the last 2000 years",
     "img": "QmfLRhL5r1yb51y3A7nsXJ5mNxFyVebTAzhn6pxBZN2Tpk",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19628
       ],
       "img": "QmfLRhL5r1yb51y3A7nsXJ5mNxFyVebTAzhn6pxBZN2Tpk",
       "attack": 18,
       "defense": 8
      },
      {
       "shine": "Gold",
       "templates": [
        141520
       ],
       "img": "QmaZYhgksXg9HXuaUzTmjfbo6iYnL4go7PAHwsRghEM1rN",
       "attack": 19,
       "defense": 8
      },
      {
       "shine": "Stardust",
       "templates": [
        141545
       ],
       "img": "QmXV2hTWKy5sJceEzTFxr4cQBe8SnYAGVB4Qe6b7kP3TMD",
       "attack": 19,
       "defense": 10
      }
     ]
    },
    {
     "cardid": 17,
     "element": "Nature",
     "description": "A Nordic without a sword is still a warrior, but one with no shield is just a target.",
     "img": "QmRsc874QBk4NZDczAQUFhdUcPAoU6YM2TNLUzxEzyf6nB",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19640
       ],
       "img": "QmRsc874QBk4NZDczAQUFhdUcPAoU6YM2TNLUzxEzyf6nB",
       "attack": 16,
       "defense": 10
      },
      {
       "shine": "Gold",
       "templates": [
        141533
       ],
       "img": "QmPmWF5N12jv9dgnqFfT53PfvwLaskGcWYjjTNfR4KN3Pw",
       "attack": 17,
       "defense": 10
      },
      {
       "shine": "Stardust",
       "templates": [
        141555
       ],
       "img": "QmXizRsgb2xUwyYd7gc4L6ngvT1r3rXdHAJfxD55HfxfD4",
       "attack": 17,
       "defense": 12
      }
     ]
    }
   ]
  },
  {
   "name": "Wise Ancient One",
   "race": "Nordic",
   "rarity": "Rare",
   "variants": [
    {
     "cardid": 6,
     "element": "Air",
     "description": "The only true wisdom is in knowing you know nothing",
     "img": "QmSaVvk6qyj7dH6pTTcxSdx1UEw8rKexEiUNVUmEjsMGu5",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19629
       ],
       "img": "QmSaVvk6qyj7dH6pTTcxSdx1UEw8rKexEiUNVUmEjsMGu5",
       "attack": 6,
       "defense": 28
      },
      {
       "shine": "Gold",
       "templates": [
        141522
       ],
       "img": "QmfS75oP8rWrhLWSnKyLHuaTXh6dHRjejQbTNRHHrp4k6u",
       "attack": 6,
       "defense": 30
      },
      {
       "shine": "XDimension",
       "templates": [
        20988
       ],
       "img": "QmSK5nzVVRk4igw62SMY4NKWT7uj9s7Qn6oo5eBnW8kHf7",
       "attack": 7,
       "defense": 30
      },
      {
       "shine": "Stardust",
       "templates": [
        141546
       ],
       "img": "QmWmp7UR5NrprVqtkCALwHScAEnFGhcHGQP3wfCTBBaQ2Y",
       "attack": 8,
       "defense": 30
      },
      {
       "shine": "Antimatter",
       "templates": [
        141564
       ],
       "img": "QmVZBMGf32XBJ7DwLjw7tgZNqnpbNZTTVwKkNeSE2uXqnM",
       "attack": 10,
       "defense": 31
      }
     ]
    },
    {
     "cardid": 18,
     "element": "Gem",
     "description": "Even the very wise cannot see all ends",
     "img": "QmPBHFLnc1bbEXZxUo5ee5PKz6ChSQsZqXVdMtYdTAfvTj",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19641
       ],
       "img": "QmPBHFLnc1bbEXZxUo5ee5PKz6ChSQsZqXVdMtYdTAfvTj",
       "attack": 8,
       "defense": 25
      },
      {
       "shine": "Gold",
       "templates": [
        141534
       ],
       "img": "QmZVyJqqKHoXosUC44XV97Kc8eTkQD8N8kAVGqtE4zvZmA",
       "attack": 8,
       "defense": 27
      },
      {
       "shine": "XDimension",
       "templates": [
        20991
       ],
       "img": "QmYUnd7s42EcRjTzmLkMHJUkpDM2U9Y7tkpi5Kj6kLBrU6",
       "attack": 10,
       "defense": 27
      },
      {
       "shine": "Stardust",
       "templates": [
        141556
       ],
       "img": "QmbE9KJ4KH2K2J9fsV2J4CkL3hsPPQeYxWcLMLxnG5Gf7s",
       "attack": 10,
       "defense": 27
      },
      {
       "shine": "Antimatter",
       "templates": [
        141570
       ],
       "img": "QmVA3wxdustSs2NooQNREygitwC1YB19Tj9T6ykLwRoPKT",
       "attack": 13,
       "defense": 27
      }
     ]
    }
   ]
  },
  {
   "name": "Storm Giant",
   "race": "Nordic",
   "rarity": "Legendary",
   "variants": [
    {
     "cardid": 7,
     "element": "Nature",
     "description": "Slow and powerful Storm Giants can have a devastating effect in any ground battle",
     "img": "QmZBdDixC1wFiPh8b9ozn1k9Ge4wDqA7PzweNHYKpjtDea",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19630
       ],
       "img": "QmZBdDixC1wFiPh8b9ozn1k9Ge4wDqA7PzweNHYKpjtDea",
       "attack": 56,
       "defense": 17
      },
      {
       "shine": "Gold",
       "templates": [
        141523
       ],
       "img": "QmVr8GuX6mxVj9Y5ujrdxvEqoGrRa8QHThSQbzpGFRc9XF",
       "attack": 60,
       "defense": 17
      },
      {
       "shine": "XDimension",
       "templates": [
        28423
       ],
       "img": "QmXA4fXA8tErEj9kJ787hBMDy7vKZXhXXCDkRUJaeS6rbN",
       "attack": 54,
       "defense": 23
      },
      {
       "shine": "Stardust",
       "templates": [
        141547
       ],
       "img": "QmdWLeEB1q7FCyKu6cJ9iTLnifnkXith5Xu9QP4fXwUf7Y",
       "attack": 60,
       "defense": 20
      },
      {
       "shine": "Antimatter",
       "templates": [
        141565
       ],
       "img": "QmVYeL8t4bdSs38vz1FJEMCmiFkc264kWqXpCdSCMBwPau",
       "attack": 61,
       "defense": 23
      }
     ]
    },
    {
     "cardid": 19,
     "element": "Neutral",
     "description": "Storm giants are mentioned in the ancient tomes of Aioshi",
     "img": "Qmb78MVB1H2Za4GDKQSgm7WwCzwf7sjqQAtrHJVsKAgM5Q",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19642
       ],
       "img": "Qmb78MVB1H2Za4GDKQSgm7WwCzwf7sjqQAtrHJVsKAgM5Q",
       "attack": 50,
       "defense": 21
      },
      {
       "shine": "Gold",
       "templates": [
        141535
       ],
       "img": "QmTUzFNUDiit1oxSoQtVkPpntRx9CQm81g1YLGrkW8Zydw",
       "attack": 55,
       "defense": 21
      },
      {
       "shine": "XDimension",
       "templates": [
        28424
       ],
       "img": "QmTo8fNgWALohA9qfsP86eFKsbtic98RzkWqovr5uEmBZP",
       "attack": 58,
       "defense": 20
      },
      {
       "shine": "Stardust",
       "templates": [
        141557
       ],
       "img": "QmRkzReiTskhgPtEEwji1JSTcS156rV2ifukktgP93EVEG",
       "attack": 55,
       "defense": 24
      },
      {
       "shine": "Antimatter",
       "templates": [
        141571
       ],
       "img": "QmXC4eAukN8whDKCJdL6wzKhaZKia4t83ysmQ8AtDspGkv",
       "attack": 57,
       "defense": 27
      }
     ]
    }
   ]
  },
  {
   "name": "Explosives Specialist",
   "race": "Human",
   "rarity": "Rare",
   "variants": [
    {
     "cardid": 8,
     "element": "Fire",
     "description": "Cut the red wire, no, no, NO, the blue wire ...",
     "img": "QmRZUFM8snsdJ8qabrFdmpKjRVmpZ1v4YeNj6CKHWMnVFx",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19631
       ],
       "img": "QmRZUFM8snsdJ8qabrFdmpKjRVmpZ1v4YeNj6CKHWMnVFx",
       "attack": 18,
       "defense": 34
      },
      {
       "shine": "Gold",
       "templates": [
        141524
       ],
       "img": "QmXBkQcbfne24jCUDV1AXQX8qoP6Pxk4afwvcn4Jcj3ycW",
       "attack": 18,
       "defense": 37
      },
      {
       "shine": "XDimension",
       "templates": [
        20989
       ],
       "img": "QmPggSfj6UoVUZbKVE4RKjsMaed75pLjC17s6RL7fVqDKU",
       "attack": 20,
       "defense": 36
      },
      {
       "shine": "Stardust",
       "templates": [
        141548
       ],
       "img": "QmU7USzZ7QfXJLRhGBj7rhC97XJADHvPsoTUD6GEGM8QHz",
       "attack": 20,
       "defense": 37
      },
      {
       "shine": "Antimatter",
       "templates": [
        141566
       ],
       "img": "QmUa323XRkmyoUaLqG5msNNWRSDbwbwqp8p8S9SzJB1iiC",
       "attack": 22,
       "defense": 39
      }
     ]
    },
    {
     "cardid": 20,
     "element": "Neutral",
     "description": "You don't have to be crazy to be an Explosive Specialist but it helps",
     "img": "QmZiMoSCVrFqRFsDnb3ULUDo4KNGw7y2hmmuzZqU3rMkNt",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19643
       ],
       "img": "QmZiMoSCVrFqRFsDnb3ULUDo4KNGw7y2hmmuzZqU3rMkNt",
       "attack": 14,
       "defense": 37
      },
      {
       "shine": "Gold",
       "templates": [
        141536
       ],
       "img": "QmfGwBNypKd9sdhbtoMTV37bijx1Q8isJ3GZpuoW2Z8o8U",
       "attack": 14,
       "defense": 40
      },
      {
       "shine": "XDimension",
       "templates": [
        20992
       ],
       "img": "QmQ1ujxwGZmkZA1XtZtebhzQfwi2dDPGYdGmFvkrevWh3p",
       "attack": 15,
       "defense": 40
      },
      {
       "shine": "Stardust",
       "templates": [
        141558
       ],
       "img": "QmfQMji5xVXwuhW7zNHnKjEZCkS9MtZPY5sWPDJKA18YDE",
       "attack": 17,
       "defense": 40
      },
      {
       "shine": "Antimatter",
       "templates": [
        141572
       ],
       "img": "QmVLfLPD3SSyVGbrVSwze8pM3ni9gwMhx2FCPa8G2aGL7g",
       "attack": 20,
       "defense": 41
      }
     ]
    }
   ]
  },
  {
   "name": "Grey Peacemaker",
   "race": "Grey",
   "rarity": "Abundant",
   "variants": [
    {
     "cardid": 9,
     "element": "Nature",
     "description": "Grey's are particularly skilled at using the idea of peace to their advantage",
     "img": "QmeNWTL3EPT1nM9P8bM2PrAy38bTc9ZTg91P7XntwLmr8Q",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19632
       ],
       "img": "QmeNWTL3EPT1nM9P8bM2PrAy38bTc9ZTg91P7XntwLmr8Q",
       "attack": 17,
       "defense": 16
      },
      {
       "shine": "Gold",
       "templates": [
        141525
       ],
       "img": "QmQCwxyU8kAG8b3wfmZvgsPrkgZ2jjHXvRV2Jjt3YU5eQ9",
       "attack": 18,
       "defense": 16
      }
     ]
    },
    {
     "cardid": 21,
     "element": "Gem",
     "description": "Beware of Greys bearing gifts",
     "img": "Qme5HWgJritQsBFeGsbYW1XCpe9YBmJY5z6SLq8aGbWQtP",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19644
       ],
       "img": "Qme5HWgJritQsBFeGsbYW1XCpe9YBmJY5z6SLq8aGbWQtP",
       "attack": 16,
       "defense": 17
      },
      {
       "shine": "Gold",
       "templates": [
        141537
       ],
       "img": "QmYXpXga3uYgJny7UJtnHk5Xxrxd1FvjRyzYhQxDrCNgKB",
       "attack": 16,
       "defense": 19
      }
     ]
    }
   ]
  },
  {
   "name": "Enhanced Reptiloid",
   "race": "Reptiloid",
   "rarity": "Epic",
   "variants": [
    {
     "cardid": 10,
     "element": "Gem",
     "description": "Why on Magor would anyone want to enhance a Reptiloid?",
     "img": "QmP3d2dYQseBb5WuEYU7h5hityyfmqGfp15ozefqHdnWTR",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19633
       ],
       "img": "QmP3d2dYQseBb5WuEYU7h5hityyfmqGfp15ozefqHdnWTR",
       "attack": 15,
       "defense": 15
      },
      {
       "shine": "Gold",
       "templates": [
        141526
       ],
       "img": "QmZoNp7KE53pMG4PKkuMUU36sVNdobrgAppoNXm5kw52h8",
       "attack": 15,
       "defense": 17
      },
      {
       "shine": "Stardust",
       "templates": [
        141549
       ],
       "img": "QmZTYVtaCHr7A9vzoFDuJcuK5n5CkDfZagPTTWZpXxY7bu",
       "attack": 17,
       "defense": 17
      },
      {
       "shine": "Antimatter",
       "templates": [
        141567
       ],
       "img": "QmWyAMn61s75vwHw4XwT2eNWEe9n5wcS3bDVzBqdvcJbwm",
       "attack": 18,
       "defense": 19
      }
     ]
    },
    {
     "cardid": 22,
     "element": "Fire",
     "description": "Hiding will not save you",
     "img": "Qmcuhm2XjJPeDeo95vSaZjCQCJn7ghrUawsDX24s1dc5yD",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19645
       ],
       "img": "Qmcuhm2XjJPeDeo95vSaZjCQCJn7ghrUawsDX24s1dc5yD",
       "attack": 18,
       "defense": 13
      },
      {
       "shine": "Gold",
       "templates": [
        141538
       ],
       "img": "QmeVNpdTpyCKVLZrmpRiNxd2L3SYQAyVK7Pg6hLXJTgcBh",
       "attack": 20,
       "defense": 13
      },
      {
       "shine": "Stardust",
       "templates": [
        141559
       ],
       "img": "QmPan7Yd3Speposw1oG1e3pNW5aoZLLPoPsX11gUfFeXhr",
       "attack": 20,
       "defense": 15
      },
      {
       "shine": "Antimatter",
       "templates": [
        141573
       ],
       "img": "QmYuXESZHhsezrKWzrhJ4mo71qPRZ4qEnFJ1jQaQd2UdUQ",
       "attack": 23,
       "defense": 15
      }
     ]
    }
   ]
  },
  {
   "name": "Robot Supersoldier",
   "race": "Robotron",
   "rarity": "Rare",
   "variants": [
    {
     "cardid": 11,
     "element": "Metal",
     "description": "Early robotic killing machines - still highly effective",
     "img": "Qmd2Xi4ro9kyubbqWRJzEJYhCkeN96xFYqxVN5NoUwWiug",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19634
       ],
       "img": "Qmd2Xi4ro9kyubbqWRJzEJYhCkeN96xFYqxVN5NoUwWiug",
       "attack": 14,
       "defense": 14
      },
      {
       "shine": "Gold",
       "templates": [
        141527
       ],
       "img": "QmbqsVcPFVhuC5fHoVZXD2f5Zn8xbfBfrJoCCjoEgjiGK7",
       "attack": 16,
       "defense": 14
      },
      {
       "shine": "XDimension",
       "templates": [
        20990
       ],
       "img": "QmZrBRpFtvwLhs13zSeR8PzjZt6cAeS7jSZLxhrnBK8N4Y",
       "attack": 16,
       "defense": 16
      },
      {
       "shine": "Stardust",
       "templates": [
        141550
       ],
       "img": "QmWaDkEz79ycPQ292ezXGvCwue2bt413Mwy9nouPb7swPm",
       "attack": 16,
       "defense": 16
      },
      {
       "shine": "Antimatter",
       "templates": [
        141568
       ],
       "img": "QmS9uJYdT1ZTJLGH4xKnsX8iW4nodeWHqiNjqWDYBRyxgg",
       "attack": 18,
       "defense": 17
      }
     ]
    },
    {
     "cardid": 23,
     "element": "Neutral",
     "description": "I'm am not a %&@&$! toaster",
     "img": "QmPpUYaczvcKgyV9iDXCLU2cgw5TNp3ocxgARjsN59NATa",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19646
       ],
       "img": "QmPpUYaczvcKgyV9iDXCLU2cgw5TNp3ocxgARjsN59NATa",
       "attack": 15,
       "defense": 13
      },
      {
       "shine": "Gold",
       "templates": [
        141539
       ],
       "img": "QmewTqNky1Fx8KM3aDFpGufXEogUgyeqTmzxMf8hLvCiqx",
       "attack": 17,
       "defense": 13
      },
      {
       "shine": "XDimension",
       "templates": [
        20993
       ],
       "img": "QmeWLCKSeZtJB7bKCty5GEtVKB7tVScFZuEUjgtSYe3amt",
       "attack": 18,
       "defense": 14
      },
      {
       "shine": "Stardust",
       "templates": [
        141560
       ],
       "img": "QmZwbNiiatrxwaH8YCKcwkYqSaNUMRPbyo1ennZVBT9Miz",
       "attack": 17,
       "defense": 15
      },
      {
       "shine": "Antimatter",
       "templates": [
        141574
       ],
       "img": "QmPjTK5tS8yjm86W64Zx6LiaqtUs1LMnXu12qXsJ5LnDFW",
       "attack": 20,
       "defense": 15
      }
     ]
    }
   ]
  },
  {
   "name": "Terminator",
   "race": "Robotron",
   "rarity": "Common",
   "variants": [
    {
     "cardid": 12,
     "element": "Metal",
     "description": "Terminate or be terminated - choose one",
     "img": "QmW489ditKNMNCPm9rS45eQ7a7UfPyvQtBSZGpDqzX1zJz",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19635
       ],
       "img": "QmW489ditKNMNCPm9rS45eQ7a7UfPyvQtBSZGpDqzX1zJz",
       "attack": 16,
       "defense": 10
      },
      {
       "shine": "Gold",
       "templates": [
        141528
       ],
       "img": "QmP6EyPtMtR9kAdEp61JQgcBMiwjmG8B4rzhwdJaN9fkvw",
       "attack": 17,
       "defense": 10
      },
      {
       "shine": "Stardust",
       "templates": [
        141551
       ],
       "img": "QmdVHZRJ9yMyqodvM9E7JUhTzrKVPboc2yAssbqghTB9gr",
       "attack": 17,
       "defense": 12
      }
     ]
    },
    {
     "cardid": 24,
     "element": "Fire",
     "description": "Dead or dead, you are coming with me",
     "img": "QmcdVGSJrQJfB4mQWqK23gd1uu8sJG9bvPDuTdRH57wi5C",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        19647
       ],
       "img": "QmcdVGSJrQJfB4mQWqK23gd1uu8sJG9bvPDuTdRH57wi5C",
       "attack": 18,
       "defense": 9
      },
      {
       "shine": "Gold",
       "templates": [
        141540
       ],
       "img": "QmdbFumP72gYtUXwN1wTswXHnM9bmNGNqyzns6nLpR4X5x",
       "attack": 19,
       "defense": 9
      },
      {
       "shine": "Stardust",
       "templates": [
        141561
       ],
       "img": "QmVWhM6u3Ucta741ZQMBKKnBqkUmZfizKkVpH4w5fF6SRH",
       "attack": 19,
       "defense": 11
      }
     ]
    }
   ]
  },
  {
   "name": "Astronaut (KOGs)",
   "race": "Human",
   "rarity": "Epic",
   "variants": [
    {
     "cardid": 25,
     "element": "Neutral",
     "description": "Pulled from the KOGs universe by an unidentified anomoly - always trying to find a way home",
     "img": "QmV3r3VUefmgh5wvmUAWEkdKbFFF6FfE9obgQsAwZrii7u",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        28422
       ],
       "img": "QmV3r3VUefmgh5wvmUAWEkdKbFFF6FfE9obgQsAwZrii7u",
       "attack": 33,
       "defense": 17
      },
      {
       "shine": "Gold",
       "templates": [
        141541
       ],
       "img": "QmZJKQmrGs1RsKeqHcJYYpnhubiJupu85rMBktZi5GyBXB",
       "attack": 37,
       "defense": 17
      },
      {
       "shine": "Stardust",
       "templates": [
        141562
       ],
       "img": "QmSinpDZaqFrAa5GcNF9B5RyhaqUSwtDsPELkqT7Z4NAf3",
       "attack": 37,
       "defense": 20
      }
     ]
    }
   ]
  },
  {
   "name": "Alien Bat (Horrors)",
   "race": "Unknown",
   "rarity": "Epic",
   "variants": [
    {
     "cardid": 28,
     "element": "Nature",
     "description": "Feeding on the nightmares of Trilium miners since time began",
     "img": "QmaX16aMZuppcnUfS6gv84bYRr2y4xYfhV17LpWVd8zh1F",
     "shines": [
      {
       "shine": "XDimension",
       "templates": [
        44933
       ],
       "img": "QmaX16aMZuppcnUfS6gv84bYRr2y4xYfhV17LpWVd8zh1F",
       "attack": 14,
       "defense": 7
      }
     ]
    }
   ]
  },
  {
   "name": "Intergalactic Zombie",
   "race": "Unknown",
   "rarity": "Rare",
   "variants": [
    {
     "cardid": 29,
     "element": "Neutral",
     "description": "In the deepest space, an ancient, undying evil reawakens",
     "img": "QmNxjDDSCWA2CpbUvrYVCfz4fixAy2Le35gw1pRoSGYKYd",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        235640,
        254350
       ],
       "img": "QmNxjDDSCWA2CpbUvrYVCfz4fixAy2Le35gw1pRoSGYKYd",
       "attack": 18,
       "defense": 10
      },
      {
       "shine": "Gold",
       "templates": [
        235642,
        254352
       ],
       "img": "Qmd499F22h4LPTZkrqeambQGnTzVJ5Lxn6RX6cKBdYmbGh",
       "attack": 19,
       "defense": 10
      },
      {
       "shine": "Stardust",
       "templates": [
        235644,
        254354
       ],
       "img": "QmTMfZ3b3WfuPDLZyeYiZY1KsW8HKusXqtXgihE7VuV6Rw",
       "attack": 19,
       "defense": 11
      },
      {
       "shine": "Antimatter",
       "templates": [
        235646,
        254356
       ],
       "img": "QmRzvXRMwRWt98Au7YGdLps9RQXQ5oXiRv73Srg7SuEhTV",
       "attack": 20,
       "defense": 11
      }
     ]
    }
   ]
  },
  {
   "name": "Interstellar Emissary",
   "race": "Unknown",
   "rarity": "Epic",
   "variants": [
    {
     "cardid": 30,
     "element": "Air",
     "description": "Travelling between worlds, heralding darkness and dread",
     "img": "QmcgerxREiHk5Sg5y6KHERjaTDorWFaCZfqTPKFySZCuKA",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        235641,
        254351
       ],
       "img": "QmcgerxREiHk5Sg5y6KHERjaTDorWFaCZfqTPKFySZCuKA",
       "attack": 7,
       "defense": 13
      },
      {
       "shine": "Gold",
       "templates": [
        235643,
        254353
       ],
       "img": "QmXasj6ZV7u4ukdw7pme3LJZT61miCh9wJ2wELLBNoS58o",
       "attack": 7,
       "defense": 14
      },
      {
       "shine": "Stardust",
       "templates": [
        235645,
        254355
       ],
       "img": "QmTKLaWzEawMYdnwrQJf5MZYVC7SCCYcTff6sqCnkuKvRj",
       "attack": 8,
       "defense": 14
      },
      {
       "shine": "Antimatter",
       "templates": [
        235647,
        254357
       ],
       "img": "QmedQrH84cXNHK2ApHV8MXzZsM4wPw1QM41zkU5EBJ1Jew",
       "attack": 8,
       "defense": 15
      }
     ]
    }
   ]
  },
  {
   "name": "Altan Diplomat",
   "race": "Altan",
   "rarity": "Mythical",
   "variants": [
    {
     "cardid": 31,
     "element": "Nature",
     "description": "The role of Diplomat is not coveted among the Altans, who see it as an unfortunate necessity that gets in the way of their research. As such, Diplomatic roles are assigned temporarily, so that no single Altan must bear such a burden for long. \"The political machinations of the Federation races are quaint and a little primitive by our standards.\" - Soloth'Dal, first Diplomat",
     "img": "QmYKj1QNi3JZ25ZVJ4Dvr3qWqEzsWKYBPnSkC1X6eZEnAY",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        906454
       ],
       "img": "QmYKj1QNi3JZ25ZVJ4Dvr3qWqEzsWKYBPnSkC1X6eZEnAY",
       "attack": 22,
       "defense": 35
      }
     ]
    }
   ]
  },
  {
   "name": "Augment Rebel",
   "race": "Augment",
   "rarity": "Common",
   "variants": [
    {
     "cardid": 32,
     "element": "Fire",
     "description": "A small faction within the rapidly growing Augment community, the rebels staunchly reject the Federation's increasing reliance on Trilium, and the burgeoning wealth inequality that it is causing. Not content to merely abstain from using Trilium, they perform acts of sabotage and raids on Trilium operations. \"My right arm may be a scrap reclaim, but it lays out the bourgeoisie just fine.\" - Salira, former cell leader (deceased)",
     "img": "QmTPjkRYfz73kKChX6frCsC9DSWQ1YmXrH1vY5Gu3JLDDZ",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        906455
       ],
       "img": "QmTPjkRYfz73kKChX6frCsC9DSWQ1YmXrH1vY5Gu3JLDDZ",
       "attack": 12,
       "defense": 5
      }
     ]
    }
   ]
  },
  {
   "name": "Elgem Trader",
   "race": "Elgem",
   "rarity": "Common",
   "variants": [
    {
     "cardid": 33,
     "element": "Nature",
     "description": "Brightly clothed, generously bejewelled, and with their organic flower-like accoutrements always on full display, Elgem Traders offer a vibrant and inviting sight wherever they are. Don't be fooled by the cheery exterior though, such is their mastery in the art of haggling, they'll have the clothes off your back and leave you thinking you got a bargain.",
     "img": "QmVTtmmhAEUHUBfaqUxLaKBbMFwG3YTBUsqdRBaPaxeHjB",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        906456
       ],
       "img": "QmVTtmmhAEUHUBfaqUxLaKBbMFwG3YTBUsqdRBaPaxeHjB",
       "attack": 14,
       "defense": 21
      }
     ]
    }
   ]
  },
  {
   "name": "Khaured Commander",
   "race": "Khaured",
   "rarity": "Legendary",
   "variants": [
    {
     "cardid": 34,
     "element": "Fire",
     "description": "It takes a combination of martial prowess and tactical acuity to achieve the rank of Commander among the Khaureds - though the bar for the latter is set quite low compared to many other Federation races. Other races employ complex strategies in battle, while Khaureds prefer the direct approach; \"fist-to-face\", if you will.",
     "img": "QmY3bS2JLp4cVE9UvQqfK1U4eQRNa9ZWfEmQugLBLttEVy",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        906457
       ],
       "img": "QmY3bS2JLp4cVE9UvQqfK1U4eQRNa9ZWfEmQugLBLttEVy",
       "attack": 27,
       "defense": 20
      }
     ]
    }
   ]
  },
  {
   "name": "Lopati Technician",
   "race": "Lopati",
   "rarity": "Common",
   "variants": [
    {
     "cardid": 35,
     "element": "Metal",
     "description": "Prized among the Federation for their resourcefulness and keen problem-solving abilities, Lopati Technicians never find themselves short of work opportunities. They are typically easy to find as well; just visit the nearest scrap facility. \"The junk yards of the Federation are a treasure trove for the resourceful\" - Lopati Elder Olbost",
     "img": "QmRbzrQFiJmnhwGdHtVXbofruT84L12Lb8E8VJYjeHCkNN",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        906458
       ],
       "img": "QmRbzrQFiJmnhwGdHtVXbofruT84L12Lb8E8VJYjeHCkNN",
       "attack": 11,
       "defense": 15
      }
     ]
    }
   ]
  },
  {
   "name": "Onoros Drone",
   "race": "Onoros",
   "rarity": "Common",
   "variants": [
    {
     "cardid": 36,
     "element": "Gem",
     "description": "The vast majority of the Onoros race are Drones, capable of performing any duty required by the Maxa. They are small - around 3ft tall - and not particularly strong, but they are resilient to almost atmospheric composition, and their numbers & flawless collaboration counteract their lack of individual strength. Drones are known to hum in unison while they work, a sound that is both beautiful and unsettling.",
     "img": "QmWQZa5A4b6Qs6UBTtLx9VJRvNbDJJeNZzunvysVMebAJV",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        906459
       ],
       "img": "QmWQZa5A4b6Qs6UBTtLx9VJRvNbDJJeNZzunvysVMebAJV",
       "attack": 6,
       "defense": 11
      }
     ]
    }
   ]
  },
  {
   "name": "Infected Khaured",
   "race": "Khaured",
   "rarity": "Epic",
   "variants": [
    {
     "cardid": 37,
     "element": "Nature",
     "description": "Once a member of an exoplanetary mission security detail, this Khaured was exposed to the spores of an aggressive parasitic fungus during off-world operations. The organism's rapid growth, adaptive resilience, and neural integration defeated all extraction efforts. It now overrides the host's brain and central nervous system, reducing the Khaured to a biological vessel. What remains moves, fights, and endures not by will or instinct, but by the invasive intent of the fungus itself.",
     "img": "QmQJoKebwyritNQbayPFynkbCWn1hPyS9TUWQQVGqo675L",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        908722
       ],
       "img": "QmQJoKebwyritNQbayPFynkbCWn1hPyS9TUWQQVGqo675L",
       "attack": 17,
       "defense": 2
      },
      {
       "shine": "Gold",
       "templates": [
        908723
       ],
       "img": "QmeNsHQGYsGvjXyTNmGk5mDjyvqzPt8ZjVyqHnjGwk5WQb",
       "attack": 18,
       "defense": 3
      },
      {
       "shine": "Stardust",
       "templates": [
        908724
       ],
       "img": "QmQ2MBMpUkkqqPmcBvn8Xqh9v1N8TYbtv9Wj1NrVzYYHbL",
       "attack": 20,
       "defense": 3
      },
      {
       "shine": "Antimatter",
       "templates": [
        908725
       ],
       "img": "QmWonkm4sTNZFw7XHn6mmTQBU9Q7ANAX891YdcTSTYjbH5",
       "attack": 20,
       "defense": 5
      }
     ]
    }
   ]
  },
  {
   "name": "R 3 X",
   "race": "Robotron",
   "rarity": "Epic",
   "variants": [
    {
     "cardid": 38,
     "element": "Metal",
     "description": "R.3X is among the earliest Robotrons to receive the Great Blessing, a transformation granting sentience beyond its original guardian design. Altered by Altan reprogramming, it emerged burdened by conflicting directives: protector, servitor, and seeker. With much of its guardian code fractured yet persistent, R.3X departed structured society and became a perennial traveler, drifting between colonies and factions, carrying decades of wear, data, and unresolved purpose across the stars.",
     "img": "QmTTk7kgeT3vB8yURKWS3BBXdudEvhPfbDbTw5DfDGuAEZ",
     "shines": [
      {
       "shine": "Stone",
       "templates": [
        908726
       ],
       "img": "QmTTk7kgeT3vB8yURKWS3BBXdudEvhPfbDbTw5DfDGuAEZ",
       "attack": 14,
       "defense": 14
      },
      {
       "shine": "Gold",
       "templates": [
        908727
       ],
       "img": "QmbC3TqjGCgct2g9EBuKokJucXhP5BuSry8TjUzGzbe6dF",
       "attack": 15,
       "defense": 15
      },
      {
       "shine": "Stardust",
       "templates": [
        908728
       ],
       "img": "QmYhrEy7JPmeNzQMvYsmMmoN7Ab9H3qJMoNCZKUVZ2TViU",
       "attack": 16,
       "defense": 16
      },
      {
       "shine": "Antimatter",
       "templates": [
        908729
       ],
       "img": "QmbNubrenKwBvTBQwgc4NgjxvNV3dtG8a9X3ZmtSFwijpm",
       "attack": 17,
       "defense": 17
      }
     ]
    }
   ]
  }
 ],
 "arms": [
  {
   "cardid": 1,
   "name": "Waxon Fire Sword",
   "class": "Fire",
   "rarity": "Mythical",
   "description": "Waxon is an especially rare mineral, The Fire Waxon form is very powerful",
   "img": "QmbwsoeaUnbEy6abAE2sQJ6coy9eFzLP2SiNTi9hgb15Rp",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19582
     ],
     "img": "QmbwsoeaUnbEy6abAE2sQJ6coy9eFzLP2SiNTi9hgb15Rp",
     "attack": 15,
     "defense": 9
    },
    {
     "shine": "Gold",
     "templates": [
      141406
     ],
     "img": "QmWqtQgs7GsmQ3wUgfucWQach6nWpjTVE5JGruxYrd18vU",
     "attack": 16,
     "defense": 9
    },
    {
     "shine": "Stardust",
     "templates": [
      141449
     ],
     "img": "QmZyRvtSAhsfswnC2K7pVDCL29mRLJHUvVoehXUzxQi9r3",
     "attack": 16,
     "defense": 10
    },
    {
     "shine": "Antimatter",
     "templates": [
      141488
     ],
     "img": "QmVvSoqUdALzsSomb8uzwLNzFFjyTGPxdMiCmf82WuUpGb",
     "attack": 17,
     "defense": 11
    }
   ]
  },
  {
   "cardid": 2,
   "name": "Standard Sword",
   "class": "Neutral",
   "rarity": "Abundant",
   "description": "The Standard Sword Company was the first non-mining company on Eyeke",
   "img": "QmYfMb6jv4fAkYKCYn36kHeXE1PpPhqwCuh5jP9KbJs8jC",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19583
     ],
     "img": "QmYfMb6jv4fAkYKCYn36kHeXE1PpPhqwCuh5jP9KbJs8jC",
     "attack": 11,
     "defense": 5
    },
    {
     "shine": "Gold",
     "templates": [
      141407
     ],
     "img": "QmSPqLNB13FJFw8BSGFeUqoM7wsJ4dyK59sPRU8LBXdLai",
     "attack": 12,
     "defense": 5
    }
   ]
  },
  {
   "cardid": 3,
   "name": "Rock Blade",
   "class": "Nature",
   "rarity": "Common",
   "description": "Choosing the right rock is the key. Too round and it just won't make the cut.",
   "img": "QmVAoDXfmabrp1g9Fk1KxRqqzerp4CUXfpU2S9HB6NSPbv",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19584
     ],
     "img": "QmVAoDXfmabrp1g9Fk1KxRqqzerp4CUXfpU2S9HB6NSPbv",
     "attack": 13,
     "defense": 4
    },
    {
     "shine": "Gold",
     "templates": [
      141408
     ],
     "img": "Qmcu69GqpJqQdFHFdX7KeMSZRECqCNDWjZCe74JBkPSDjB",
     "attack": 14,
     "defense": 4
    },
    {
     "shine": "Stardust",
     "templates": [
      141450
     ],
     "img": "QmYFb4ocL5sGyLKiKMZ1wAqaPh2fnCtyU1YUnRj77CjiFs",
     "attack": 14,
     "defense": 5
    }
   ]
  },
  {
   "cardid": 4,
   "name": "Stave of Deception",
   "class": "Fire",
   "rarity": "Common",
   "description": "Whatever you do .. Don't look into its eyes!",
   "img": "QmS1vdZR4LYcYZMcGXHc9twRfUNy811gEoEv1bb1Nrti94",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19585
     ],
     "img": "QmS1vdZR4LYcYZMcGXHc9twRfUNy811gEoEv1bb1Nrti94",
     "attack": 6,
     "defense": 11
    },
    {
     "shine": "Gold",
     "templates": [
      141409
     ],
     "img": "QmShRQEokyLrbikzYvdfaMqRV1xxzecainQb6QXGTfrWQv",
     "attack": 6,
     "defense": 12
    },
    {
     "shine": "Stardust",
     "templates": [
      141451
     ],
     "img": "QmaR6y4nvJLdDFMHQhuvQBbgqez9SLEsQiaudVhjfJ3xBV",
     "attack": 7,
     "defense": 12
    }
   ]
  },
  {
   "cardid": 5,
   "name": "Titanium Dagger",
   "class": "Metal",
   "rarity": "Common",
   "description": "Titanium was highly prized by ancient Greys",
   "img": "Qmf8XMEn7rBuVE7qZQ6kiStgdwp13fLLp8bxLtQe8fW9Hx",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19586
     ],
     "img": "Qmf8XMEn7rBuVE7qZQ6kiStgdwp13fLLp8bxLtQe8fW9Hx",
     "attack": 12,
     "defense": 5
    },
    {
     "shine": "Gold",
     "templates": [
      141410
     ],
     "img": "QmeYd2rSTZ1sodKxSCiyfMK7WZTsi3kqCRMkMXCzAqX9ak",
     "attack": 13,
     "defense": 5
    },
    {
     "shine": "Stardust",
     "templates": [
      141452
     ],
     "img": "QmV5ii84iwpavZTbGCyDcLhQcyMgeu27XoctUdiNqnf2Rq",
     "attack": 13,
     "defense": 6
    }
   ]
  },
  {
   "cardid": 6,
   "name": "Jaggered Spear",
   "class": "Air",
   "rarity": "Rare",
   "description": "Warning: Object has jaggered edges",
   "img": "QmVv8spPgvwdY8JPztXpHkit9vrZVLCYgc5ob6yXhwCfjQ",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19587
     ],
     "img": "QmVv8spPgvwdY8JPztXpHkit9vrZVLCYgc5ob6yXhwCfjQ",
     "attack": 14,
     "defense": 4
    },
    {
     "shine": "Gold",
     "templates": [
      141411
     ],
     "img": "Qmejoy8axNLXSuu4LrVnCehHEgrecdt84BDEtngK6sCbH5",
     "attack": 15,
     "defense": 4
    },
    {
     "shine": "XDimension",
     "templates": [
      20973
     ],
     "img": "QmaywLvkZRTFX962pgqfRrsBzV9QesHC4iA2eYGKdNXXHr",
     "attack": 16,
     "defense": 7
    },
    {
     "shine": "Stardust",
     "templates": [
      141453
     ],
     "img": "QmbGhpo5pNzMCdNnunrSapjpo4xxNfBqE1EzWR6hmwcQos",
     "attack": 15,
     "defense": 5
    },
    {
     "shine": "Antimatter",
     "templates": [
      141489
     ],
     "img": "QmP7r3MbTGvXL3TnK4ATNCK8fe3WWtnd2z2DUDhRUEAd7K",
     "attack": 16,
     "defense": 6
    }
   ]
  },
  {
   "cardid": 7,
   "name": "Kite Axe",
   "class": "Neutral",
   "rarity": "Common",
   "description": "Warning: This kite is for use as a weapon only and will not fly for long",
   "img": "QmPXDcGLNPyJP3vH34w45dvyqNNsRyhDFiq6oz85uuT4WE",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19588
     ],
     "img": "QmPXDcGLNPyJP3vH34w45dvyqNNsRyhDFiq6oz85uuT4WE",
     "attack": 9,
     "defense": 8
    },
    {
     "shine": "Gold",
     "templates": [
      141412
     ],
     "img": "QmYFTJbmQsZ9ZBoRUFhaNVsbqjBmAFHmE2K1k9Fpja3G1B",
     "attack": 10,
     "defense": 8
    },
    {
     "shine": "Stardust",
     "templates": [
      141454
     ],
     "img": "QmZ9oPJHgsdaUbieRzUTBroapaf5CKzE8mZpAPaoAbVQUo",
     "attack": 10,
     "defense": 9
    }
   ]
  },
  {
   "cardid": 8,
   "name": "Emerald Dagger",
   "class": "Gem",
   "rarity": "Rare",
   "description": "The Little Green People love emeralds for some reason",
   "img": "QmVZcV2BdNAxyrortmE1j5u5KUywUQCXUuG2uNHvaL8hxU",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19589
     ],
     "img": "QmVZcV2BdNAxyrortmE1j5u5KUywUQCXUuG2uNHvaL8hxU",
     "attack": 14,
     "defense": 5
    },
    {
     "shine": "Gold",
     "templates": [
      141413
     ],
     "img": "QmZLE7zaXHhMRMzJA2zWsJi9NgWTLXtiwWmeCKAjSwbMUk",
     "attack": 15,
     "defense": 5
    },
    {
     "shine": "XDimension",
     "templates": [
      20974
     ],
     "img": "QmbS5cj59Gr4nWrTha9EWPiNjtouPX7kHhinMWH7L1PGwh",
     "attack": 16,
     "defense": 7
    },
    {
     "shine": "Stardust",
     "templates": [
      141455
     ],
     "img": "QmRPKRD6m9wPptSwFyPUuLzVcqScZbVADnZTbSt7j4uYAQ",
     "attack": 15,
     "defense": 6
    },
    {
     "shine": "Antimatter",
     "templates": [
      141490
     ],
     "img": "QmXJF3Tkq2ExBJQMANJW8UycAdfV1FbAxE6fVyKZVaB8L2",
     "attack": 16,
     "defense": 7
    }
   ]
  },
  {
   "cardid": 9,
   "name": "Equalizer Bow",
   "class": "Neutral",
   "rarity": "Rare",
   "description": "An extremely fragile weapon which can cause serious damage",
   "img": "QmU5x3spraNBnE96XaRWDewNDoYtAeSj7CRyx49uwuMQGR",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19590
     ],
     "img": "QmU5x3spraNBnE96XaRWDewNDoYtAeSj7CRyx49uwuMQGR",
     "attack": 15,
     "defense": 3
    },
    {
     "shine": "Gold",
     "templates": [
      141414
     ],
     "img": "QmZmWwQL3qdeWhkrHvNZYevkLKcLd7VDT3BTUACfVXvEtc",
     "attack": 16,
     "defense": 3
    },
    {
     "shine": "XDimension",
     "templates": [
      20975
     ],
     "img": "Qma9auPSkpAotYKMbhFH7B67kwK656BURF85MFPKqNnGG2",
     "attack": 17,
     "defense": 5
    },
    {
     "shine": "Stardust",
     "templates": [
      141456
     ],
     "img": "QmesN7jQc5k71wyJM3FKQv6vuJ4iV5hnguuDQN8UhQwovz",
     "attack": 16,
     "defense": 4
    },
    {
     "shine": "Antimatter",
     "templates": [
      141491
     ],
     "img": "QmS4Vk5JLiAVPXEQH78x22J4vq2EYR3gaBekWBjZBaCpt1",
     "attack": 17,
     "defense": 5
    }
   ]
  },
  {
   "cardid": 10,
   "name": "Widow Maker",
   "class": "Metal",
   "rarity": "Common",
   "description": "Does exactly what it says on the card",
   "img": "QmbvNr7HqQoNCqryfQC4X2J3fz5MzAtW7YyjBxNdsALeBB",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19591
     ],
     "img": "QmbvNr7HqQoNCqryfQC4X2J3fz5MzAtW7YyjBxNdsALeBB",
     "attack": 10,
     "defense": 7
    },
    {
     "shine": "Gold",
     "templates": [
      141415
     ],
     "img": "QmSgpMoPnRPxuFu6ngZXW79ZxUroNPnVNakepLmbEpXQHq",
     "attack": 11,
     "defense": 7
    },
    {
     "shine": "Stardust",
     "templates": [
      141457
     ],
     "img": "QmeXCZbGg6WLiZ9iAKu46Vkiagn4vQPLepsXM3auWKrZHG",
     "attack": 11,
     "defense": 8
    }
   ]
  },
  {
   "cardid": 11,
   "name": "Storm Edge Sword",
   "class": "Air",
   "rarity": "Rare",
   "description": "This awesome sword harnesses the power of the atmosphere",
   "img": "QmZcquuMDjjQbzSezubQTvSctr7U3BSvY5i8rfrTTFM8LD",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19592
     ],
     "img": "QmZcquuMDjjQbzSezubQTvSctr7U3BSvY5i8rfrTTFM8LD",
     "attack": 11,
     "defense": 8
    },
    {
     "shine": "Gold",
     "templates": [
      141416
     ],
     "img": "QmXndkJF71xdFbiCeDF2gcxKRXU5thB4SwsiHK2tmZejT8",
     "attack": 12,
     "defense": 8
    },
    {
     "shine": "XDimension",
     "templates": [
      20976
     ],
     "img": "QmcNgrezkCPoEX4R4ESUN3EsdUKPRrjNHxZdsF8DKayV5U",
     "attack": 13,
     "defense": 10
    },
    {
     "shine": "Stardust",
     "templates": [
      141458
     ],
     "img": "Qmb3VTP5yGSazQo4vPJvvwMMAKVgCjjoBvoX2Kb9Yr8aY8",
     "attack": 13,
     "defense": 8
    },
    {
     "shine": "Antimatter",
     "templates": [
      141492
     ],
     "img": "QmezrQKiuykMng1X7pnhwuETt1MC9NSjQLzWJWdbrXMCPe",
     "attack": 14,
     "defense": 9
    }
   ]
  },
  {
   "cardid": 12,
   "name": "Waxon Staff",
   "class": "Nature",
   "rarity": "Epic",
   "description": "Wax on ... Wax off ",
   "img": "QmVxmdvnfbnjnRPE81LSBcJoVdx4ikxTEF9rSKzWyjZGpH",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19593
     ],
     "img": "QmVxmdvnfbnjnRPE81LSBcJoVdx4ikxTEF9rSKzWyjZGpH",
     "attack": 9,
     "defense": 12
    },
    {
     "shine": "Gold",
     "templates": [
      141417
     ],
     "img": "QmfQdmtzd4PLseGB9dwoVGJc89zvdwhqpgVC59HJ7S7GQg",
     "attack": 9,
     "defense": 13
    },
    {
     "shine": "Stardust",
     "templates": [
      141459
     ],
     "img": "QmYer7BgPAGRAbFUbtV7uhSRCbmkQdiX1kYRkVLFH8GQEK",
     "attack": 10,
     "defense": 13
    },
    {
     "shine": "Antimatter",
     "templates": [
      141493
     ],
     "img": "QmZUisLHbFYrADNYn6wrzUFdCBMJCyY1FuJaBD4YCQTQBG",
     "attack": 11,
     "defense": 14
    }
   ]
  },
  {
   "cardid": 13,
   "name": "Spike Hammer",
   "class": "Metal",
   "rarity": "Common",
   "description": "What ... you wanted more spikes?",
   "img": "QmUQUBLRm7sJUkJaiMHdgECKFfFxrKJLVP228Q1HL1XAu7",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19594
     ],
     "img": "QmUQUBLRm7sJUkJaiMHdgECKFfFxrKJLVP228Q1HL1XAu7",
     "attack": 12,
     "defense": 5
    },
    {
     "shine": "Gold",
     "templates": [
      141418
     ],
     "img": "QmP74Xgy3p8eGdD412aDbWiA3YMcmgi1AqQnvzWYCk67eM",
     "attack": 13,
     "defense": 5
    },
    {
     "shine": "Stardust",
     "templates": [
      141460
     ],
     "img": "QmbxCqGeQnSTRRukMy7DknxY3QuWtpdHiU6Cmu5ix2LFda",
     "attack": 13,
     "defense": 6
    }
   ]
  },
  {
   "cardid": 14,
   "name": "Star Fire Sword",
   "class": "Fire",
   "rarity": "Epic",
   "description": "Warning: Do not look directly at Star Fire",
   "img": "QmcwJwqB2GSmkbPiAYrHM7rAiJ45JmBS6shHiGbbtme3Xp",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19595
     ],
     "img": "QmcwJwqB2GSmkbPiAYrHM7rAiJ45JmBS6shHiGbbtme3Xp",
     "attack": 13,
     "defense": 7
    },
    {
     "shine": "Gold",
     "templates": [
      141419
     ],
     "img": "QmYRdBvd9z16xjmTvqHmMHUdkyjzbN1h8yaj4uuFfwqMY5",
     "attack": 14,
     "defense": 7
    },
    {
     "shine": "Stardust",
     "templates": [
      141461
     ],
     "img": "QmQxP6LiQ5jWkkFkBRGt1YAy2Vx3uRnY5TixhhSWNRNvgB",
     "attack": 14,
     "defense": 8
    },
    {
     "shine": "Antimatter",
     "templates": [
      141494
     ],
     "img": "QmPvY16AiLnu81DJtKFLHmyfnytHhd6JYgLfNF95RTdkbe",
     "attack": 15,
     "defense": 9
    }
   ]
  },
  {
   "cardid": 15,
   "name": "Sandmaster Spear",
   "class": "Nature",
   "rarity": "Epic",
   "description": "Favoured by the Sandmasters of Neri",
   "img": "QmeG68PrWhNkKtG43QNFWNhRa6nDUh4iHLX3hy9FxXLtsA",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19596
     ],
     "img": "QmeG68PrWhNkKtG43QNFWNhRa6nDUh4iHLX3hy9FxXLtsA",
     "attack": 15,
     "defense": 5
    },
    {
     "shine": "Gold",
     "templates": [
      141420
     ],
     "img": "QmNvbB4tyMu9iadGEeLKed2Z8pEQ5diTjNtW8KjhupP3QC",
     "attack": 16,
     "defense": 5
    },
    {
     "shine": "Stardust",
     "templates": [
      141462
     ],
     "img": "QmSZU2XemaKZ1FB9vobhjKzLN4pmPGaNGevUezpERboLk9",
     "attack": 16,
     "defense": 6
    },
    {
     "shine": "Antimatter",
     "templates": [
      141495
     ],
     "img": "QmVkGJLU8bnwJmyWHK8etpNbPzeyx8vhPXQvupNgE5S5wc",
     "attack": 17,
     "defense": 7
    }
   ]
  },
  {
   "cardid": 16,
   "name": "Waxon Sword",
   "class": "Gem",
   "rarity": "Rare",
   "description": "Finest Waxon with a sharp edge",
   "img": "QmVTtT1L5AKmZjLomg5kzBGbRY8WiUgER5SEdkYGKDqCHs",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19597
     ],
     "img": "QmVTtT1L5AKmZjLomg5kzBGbRY8WiUgER5SEdkYGKDqCHs",
     "attack": 11,
     "defense": 8
    },
    {
     "shine": "Gold",
     "templates": [
      141421
     ],
     "img": "QmY9CB5QbmGYJZEddtixdAnzcVvmSzDXCA1y6gGG5mLLTL",
     "attack": 12,
     "defense": 8
    },
    {
     "shine": "XDimension",
     "templates": [
      20977
     ],
     "img": "QmVtbBgD46imEG3iddpZpbpta1wb5uQ627r1HTHDRHzXDY",
     "attack": 13,
     "defense": 10
    },
    {
     "shine": "Stardust",
     "templates": [
      141463
     ],
     "img": "QmNPrAfSXUVo4jBuDuPVCs1kjHsj2Mi7jPLZGRyZBfUziD",
     "attack": 12,
     "defense": 9
    },
    {
     "shine": "Antimatter",
     "templates": [
      141496
     ],
     "img": "QmdyM299wSVTb2PCpPaCewUF2fWAxDShk1ZPYy6tAqqeV5",
     "attack": 13,
     "defense": 10
    }
   ]
  },
  {
   "cardid": 17,
   "name": "Healing Blade",
   "class": "Air",
   "rarity": "Legendary",
   "description": "A legendary weapon with extreme defensive abilities",
   "img": "Qmf6rVpa7SZFApUwg7aDQQRNEPxZbhxvVcsubb94gWoEHM",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19598
     ],
     "img": "Qmf6rVpa7SZFApUwg7aDQQRNEPxZbhxvVcsubb94gWoEHM",
     "attack": 7,
     "defense": 15
    },
    {
     "shine": "Gold",
     "templates": [
      141422
     ],
     "img": "Qma3rV1Cw7e3Dj2T4xyNga9C9xUF8QvVhwCmkR2adijfHa",
     "attack": 7,
     "defense": 16
    },
    {
     "shine": "Stardust",
     "templates": [
      141464
     ],
     "img": "QmS2beADMfRbEeTWMd2bL5nf8xf6PXJ8fitiu1T6bTxiJk",
     "attack": 8,
     "defense": 16
    },
    {
     "shine": "Antimatter",
     "templates": [
      141497
     ],
     "img": "QmNMviUdh9GkZPrCPHrhVCfz7woxwLNoyfai4e567mpNxu",
     "attack": 9,
     "defense": 17
    }
   ]
  },
  {
   "cardid": 18,
   "name": "Elite Dagger",
   "class": "Neutral",
   "rarity": "Epic",
   "description": "Once the official weapon of the Grey special forces. Still elite.",
   "img": "QmYHGx46XC9F3RozxrA1i4eZMdnGwawWGsRksNVZX6GAKZ",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19599
     ],
     "img": "QmYHGx46XC9F3RozxrA1i4eZMdnGwawWGsRksNVZX6GAKZ",
     "attack": 16,
     "defense": 5
    },
    {
     "shine": "Gold",
     "templates": [
      141423
     ],
     "img": "QmVj1rp11TnGjgMVDAyBEu9onuxGUD3XSu4sBckDW4JJ6n",
     "attack": 17,
     "defense": 5
    },
    {
     "shine": "Stardust",
     "templates": [
      141465
     ],
     "img": "QmTCgPdTqvruaCzrsQrtU26pK3x6ptgdp3ewuyQeJGwoqB",
     "attack": 17,
     "defense": 6
    },
    {
     "shine": "Antimatter",
     "templates": [
      141498
     ],
     "img": "QmQU3hWBbYQfWAdM1DAmBkgiHevPsQYsSEqSRtsfFjs7pN",
     "attack": 18,
     "defense": 7
    }
   ]
  },
  {
   "cardid": 19,
   "name": "Eternal Blade",
   "class": "Gem",
   "rarity": "Legendary",
   "description": "An Eternal Blade is for life and beyond ",
   "img": "Qme2veDybAw4MCgq9Ymv5s6uKcCWRwm7HgRYSsN6PArTyp",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19600
     ],
     "img": "Qme2veDybAw4MCgq9Ymv5s6uKcCWRwm7HgRYSsN6PArTyp",
     "attack": 10,
     "defense": 13
    },
    {
     "shine": "Gold",
     "templates": [
      141424
     ],
     "img": "QmSRdhsXQLACEmKas7GPWHt42cRcqji6jYvgAL5bumN5RJ",
     "attack": 10,
     "defense": 14
    },
    {
     "shine": "Stardust",
     "templates": [
      141466
     ],
     "img": "QmaUvafXBACKTNKE2A8E8qHUzTUq6yZMsvv8msoNUtZAqs",
     "attack": 11,
     "defense": 14
    },
    {
     "shine": "Antimatter",
     "templates": [
      141499
     ],
     "img": "QmbB7BQCsWjAQQnTFtq2NCp9P3UEk8nSUAmXrvPaRu7qnu",
     "attack": 12,
     "defense": 15
    }
   ]
  },
  {
   "cardid": 20,
   "name": "Randomizer Bow",
   "class": "Gem",
   "rarity": "Epic",
   "description": "Nothing random about that damage",
   "img": "QmTU6CJBxJfLDGHWDpjU6aST7sJSLZVjBQB6Y6UgKuUdER",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19601
     ],
     "img": "QmTU6CJBxJfLDGHWDpjU6aST7sJSLZVjBQB6Y6UgKuUdER",
     "attack": 16,
     "defense": 4
    },
    {
     "shine": "Gold",
     "templates": [
      141425
     ],
     "img": "QmXjrF81w69McS7euLQDTxCxQmwRmJ7yq8ytFVpyRk2nEY",
     "attack": 17,
     "defense": 4
    },
    {
     "shine": "Stardust",
     "templates": [
      141467
     ],
     "img": "QmQXCPjipygXAbo6opLUbFDYQjuKAbdx3gsmJkU2huomEr",
     "attack": 17,
     "defense": 5
    },
    {
     "shine": "Antimatter",
     "templates": [
      141500
     ],
     "img": "QmW59Z62GgpCRbHj1um84NYPqjL4EXekzVS8Dnz6UZvfQf",
     "attack": 18,
     "defense": 6
    }
   ]
  },
  {
   "cardid": 21,
   "name": "Moonshot Blade",
   "class": "Air",
   "rarity": "Rare",
   "description": "Made from strange meteorites which bombarded Veles",
   "img": "QmPJmBxGccWdHJ3dWP87mNg9J6NNNzVMta6W1ahStz4MTu",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19602
     ],
     "img": "QmPJmBxGccWdHJ3dWP87mNg9J6NNNzVMta6W1ahStz4MTu",
     "attack": 13,
     "defense": 5
    },
    {
     "shine": "Gold",
     "templates": [
      141426
     ],
     "img": "QmYdrn6PVpoinxCmWvGSeSEfZcw9x5nKvDLpWCBVRPo6U9",
     "attack": 14,
     "defense": 5
    },
    {
     "shine": "XDimension",
     "templates": [
      20978
     ],
     "img": "QmQWZtrts6VqwmfAc5gSdPWexYVaPkvwW3o7Q2G5K535hj",
     "attack": 15,
     "defense": 7
    },
    {
     "shine": "Stardust",
     "templates": [
      141468
     ],
     "img": "QmaDwhGrkxewbHwsEwCzfYs3iz6Lfnu9GeBbz2tWWuBsg1",
     "attack": 14,
     "defense": 6
    },
    {
     "shine": "Antimatter",
     "templates": [
      141501
     ],
     "img": "QmQV5oV326dZLt3JMQwA7DLLKGgughfmt37GU17Qi3EJTv",
     "attack": 15,
     "defense": 7
    }
   ]
  },
  {
   "cardid": 22,
   "name": "Dawn Sword",
   "class": "Metal",
   "rarity": "Rare",
   "description": "The gem encases a chestahedron with special powers",
   "img": "QmPBRF42tR2VVozFxUTHC6XUeXmxsM33reN3ZuRN8BFgyd",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19603
     ],
     "img": "QmPBRF42tR2VVozFxUTHC6XUeXmxsM33reN3ZuRN8BFgyd",
     "attack": 10,
     "defense": 9
    },
    {
     "shine": "Gold",
     "templates": [
      141427
     ],
     "img": "QmPomH2gF21EhrPcXxyRqJg4nFb7L8wZsfspfL11Lz9V5L",
     "attack": 11,
     "defense": 9
    },
    {
     "shine": "XDimension",
     "templates": [
      20979
     ],
     "img": "QmTHdA5kviQYVGWP2APRTFxb8SHUdwkiAW2GpfFhnBaJMa",
     "attack": 12,
     "defense": 11
    },
    {
     "shine": "Stardust",
     "templates": [
      141469
     ],
     "img": "QmeZugmm4v9kUX3rL9PCLobWkUxkc3WDFDySihEydXNQgk",
     "attack": 11,
     "defense": 10
    },
    {
     "shine": "Antimatter",
     "templates": [
      141502
     ],
     "img": "QmT72pm7h5pAX4U3UybqoUakAEzhLTyVWiqzP6jAQD1y6k",
     "attack": 12,
     "defense": 11
    }
   ]
  },
  {
   "cardid": 23,
   "name": "Confuser",
   "class": "Neutral",
   "rarity": "Common",
   "description": "Hang on ... What on Magor is going on!",
   "img": "QmRcyzmjWAcXLi2uXPbzGCejw2yXndKVsQwmWEK1y5pMUR",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19604
     ],
     "img": "QmRcyzmjWAcXLi2uXPbzGCejw2yXndKVsQwmWEK1y5pMUR",
     "attack": 4,
     "defense": 13
    },
    {
     "shine": "Gold",
     "templates": [
      141428
     ],
     "img": "QmdbQh8VZvetB6aC5gdYAww9Vffs5etBXGw26RCSG8XJN4",
     "attack": 4,
     "defense": 14
    },
    {
     "shine": "Stardust",
     "templates": [
      141470
     ],
     "img": "QmbnawWyuTC3CXVn5avntptsqqoHEKYpMxGsT3RMaZRixZ",
     "attack": 5,
     "defense": 14
    }
   ]
  },
  {
   "cardid": 24,
   "name": "Necromancers Hammer",
   "class": "Gem",
   "rarity": "Rare",
   "description": "Crafted by the legendary guild of Necromancers",
   "img": "QmepYeviPfEEEEws8PURpSkTQYSUPAueAgXMqCfZ7WTU3r",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19605
     ],
     "img": "QmepYeviPfEEEEws8PURpSkTQYSUPAueAgXMqCfZ7WTU3r",
     "attack": 10,
     "defense": 9
    },
    {
     "shine": "Gold",
     "templates": [
      141429
     ],
     "img": "QmR39whiQiHZbsgSN13txUC44u3tyjQuLFWYk6LtQKgskX",
     "attack": 11,
     "defense": 9
    },
    {
     "shine": "XDimension",
     "templates": [
      20980
     ],
     "img": "QmNeWZC9SxF68TnZCPmibftE9yDWVn9gbAeJQKeua9Toob",
     "attack": 12,
     "defense": 11
    },
    {
     "shine": "Stardust",
     "templates": [
      141471
     ],
     "img": "QmZMzpuno58o6C9j8tDxfNsxPiTn15c31Hb56jEbxuQQuK",
     "attack": 11,
     "defense": 11
    },
    {
     "shine": "Antimatter",
     "templates": [
      141503
     ],
     "img": "QmQt4RbuzTvLuBv9cERpFsEgmamYeuXZYPCy6fxF88cxst",
     "attack": 12,
     "defense": 12
    }
   ]
  },
  {
   "cardid": 25,
   "name": "Green Axe",
   "class": "Nature",
   "rarity": "Rare",
   "description": "This axe harnesses the inherent power of the forests",
   "img": "QmYy1wpiBHjJM4Upu5xJj6eVLWvmsNPPaHFSKoM3RMp3ak",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19606
     ],
     "img": "QmYy1wpiBHjJM4Upu5xJj6eVLWvmsNPPaHFSKoM3RMp3ak",
     "attack": 9,
     "defense": 10
    },
    {
     "shine": "Gold",
     "templates": [
      141430
     ],
     "img": "QmTBVXdRb1g2RiMA2hYtwLyDQNH4oNC5ko3ZoszLhE4Ms7",
     "attack": 9,
     "defense": 11
    },
    {
     "shine": "XDimension",
     "templates": [
      20981
     ],
     "img": "QmemD6CxZ9woSrND1utrRM7xPSjwAmecojMeq3nAJCkEmr",
     "attack": 11,
     "defense": 12
    },
    {
     "shine": "Stardust",
     "templates": [
      141472
     ],
     "img": "QmTnfgcgW66ZnzUjL84UqAYMF9BNK9tDvin6khuEXSVW4e",
     "attack": 10,
     "defense": 11
    },
    {
     "shine": "Antimatter",
     "templates": [
      141504
     ],
     "img": "QmVMpEgwJJxywqbo9zHsB5RtUsN2CeaJ6RNgmaMeNCiCdN",
     "attack": 11,
     "defense": 12
    }
   ]
  },
  {
   "cardid": 26,
   "name": "Nordic Warhammer",
   "class": "Metal",
   "rarity": "Rare",
   "description": "There is nothing most species fear more than a Nordic in full Wargear",
   "img": "QmSHc7gzuSqQckuNr1moYKBMY9TNQX1E7L4EC3i4mRzuV6",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19607
     ],
     "img": "QmSHc7gzuSqQckuNr1moYKBMY9TNQX1E7L4EC3i4mRzuV6",
     "attack": 12,
     "defense": 7
    },
    {
     "shine": "Gold",
     "templates": [
      141431
     ],
     "img": "QmY2NQSsv8y6aLu9GDKHcDBYX2cDgam4EGSTnC7YVYGQhL",
     "attack": 13,
     "defense": 7
    },
    {
     "shine": "XDimension",
     "templates": [
      20982
     ],
     "img": "QmcvE3iXRaj63eTaueBYy86TQNzPjcxaWhniif7pWTQytU",
     "attack": 14,
     "defense": 9
    },
    {
     "shine": "Stardust",
     "templates": [
      141473
     ],
     "img": "QmS9bvombxYwdrFwqGDRy2ywLztWnLtXuXSegqNQhcfsEe",
     "attack": 13,
     "defense": 8
    },
    {
     "shine": "Antimatter",
     "templates": [
      141505
     ],
     "img": "QmdRvqNhLwKB2hh3pSHA24wQ8uJb9ogJ4iU6KFRBekUphw",
     "attack": 14,
     "defense": 9
    }
   ]
  },
  {
   "cardid": 27,
   "name": "Galatic Fireblade",
   "class": "Fire",
   "rarity": "Legendary",
   "description": "Crafted in the fires of the Azingoth Volcano",
   "img": "QmaucxgkiGwm1aJ1dMCvqfMoZJP6wBzLKcjCpe9pA3ZMzc",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19608
     ],
     "img": "QmaucxgkiGwm1aJ1dMCvqfMoZJP6wBzLKcjCpe9pA3ZMzc",
     "attack": 13,
     "defense": 10
    },
    {
     "shine": "Gold",
     "templates": [
      141432
     ],
     "img": "QmdRojMeEP3ZGxU3c7ErM1JbdjJWUtaAEVrqncrc5ATsci",
     "attack": 14,
     "defense": 10
    },
    {
     "shine": "Stardust",
     "templates": [
      141474
     ],
     "img": "QmQMd8thXzbLoWzS6hp56SXPyLVMUcsAByUWTi7Ab4YP5q",
     "attack": 14,
     "defense": 11
    },
    {
     "shine": "Antimatter",
     "templates": [
      141506
     ],
     "img": "QmduVkYWv7qaMDVv77xThQU5NpH9jKgFQ7xKpeYnLpg9Sr",
     "attack": 15,
     "defense": 12
    }
   ]
  },
  {
   "cardid": 28,
   "name": "Rock Cudgel",
   "class": "Nature",
   "rarity": "Abundant",
   "description": "Hit it with a rock ... and then we'll eat it ...",
   "img": "QmWaWj1K2yvVbQWMiePHR5scbpus3hXYHEwWi5wJDjhTVf",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19609
     ],
     "img": "QmWaWj1K2yvVbQWMiePHR5scbpus3hXYHEwWi5wJDjhTVf",
     "attack": 8,
     "defense": 8
    },
    {
     "shine": "Gold",
     "templates": [
      141433
     ],
     "img": "QmVECSENYLYpJugNW94vuvrDYwVki1M76t8wP72F74asZL",
     "attack": 8,
     "defense": 9
    }
   ]
  },
  {
   "cardid": 29,
   "name": "Standard Issue Axe",
   "class": "Neutral",
   "rarity": "Abundant",
   "description": "You get an Axe .. Everyone gets an Axe!",
   "img": "QmPSjMKxC6aZYJiKxSVtb6yVRB7CYC327zUt7dpEbMXot2",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19610
     ],
     "img": "QmPSjMKxC6aZYJiKxSVtb6yVRB7CYC327zUt7dpEbMXot2",
     "attack": 10,
     "defense": 6
    },
    {
     "shine": "Gold",
     "templates": [
      141434
     ],
     "img": "QmUz6NgZwVYE3MZ9y8Jc5eBe1V8ZknpAvzQ8eZiS5J9GPK",
     "attack": 11,
     "defense": 6
    }
   ]
  },
  {
   "cardid": 30,
   "name": "Divine Blade",
   "class": "Metal",
   "rarity": "Legendary",
   "description": "The Divine blade glows by tapping into some mysterious cosmic force",
   "img": "QmRP36nkVQxknGRX8sA1D5Rrg36pvvTbQvs4Fy6HRQGcPi",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19611
     ],
     "img": "QmRP36nkVQxknGRX8sA1D5Rrg36pvvTbQvs4Fy6HRQGcPi",
     "attack": 12,
     "defense": 11
    },
    {
     "shine": "Gold",
     "templates": [
      141435
     ],
     "img": "QmZuQQfBy1nnMgmWeqStkv4CLMaG5aWPZoxZKrt65TBbQ5",
     "attack": 13,
     "defense": 11
    },
    {
     "shine": "Stardust",
     "templates": [
      141475
     ],
     "img": "Qmaz18TtZDTRSb4xTj5ced9RCqwmwLchdhVfMq5dDtQFcp",
     "attack": 13,
     "defense": 12
    },
    {
     "shine": "Antimatter",
     "templates": [
      141507
     ],
     "img": "QmTVaGAboaZKeRRKQE1UHxEqZNLANfLMPhxAUgDLkniHzz",
     "attack": 14,
     "defense": 13
    }
   ]
  },
  {
   "cardid": 31,
   "name": "Dagger of Creation",
   "class": "Nature",
   "rarity": "Epic",
   "description": "Warning: Contains Permalava which is extremely hot",
   "img": "QmVhQkDRKkWUivn34niz7LThbaBujTRALCZ6zLqJQVTuKT",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19612
     ],
     "img": "QmVhQkDRKkWUivn34niz7LThbaBujTRALCZ6zLqJQVTuKT",
     "attack": 15,
     "defense": 6
    },
    {
     "shine": "Gold",
     "templates": [
      141436
     ],
     "img": "QmQqRwibP31xYrBXRCcaqrWqjHfaXfMLp8ypDfigcRV3rm",
     "attack": 16,
     "defense": 6
    },
    {
     "shine": "Stardust",
     "templates": [
      141476
     ],
     "img": "Qmc6GE9LgtP8GvAETaUsBqQvsKa8duGKqdKUYSXNPV1Ppt",
     "attack": 16,
     "defense": 7
    },
    {
     "shine": "Antimatter",
     "templates": [
      141508
     ],
     "img": "QmU89vCXvUu1AG1Kp8ERg5fqXFxinRDTC23ndyYKcG1rD8",
     "attack": 17,
     "defense": 8
    }
   ]
  },
  {
   "cardid": 32,
   "name": "Lithium Dagger",
   "class": "Air",
   "rarity": "Common",
   "description": "Super light dagger that also sends out powerful air blasts",
   "img": "QmNWcW1W8HPAFwxUMTctSrmTGDv1S1A8d87uxjEW1kiw4R",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19613
     ],
     "img": "QmNWcW1W8HPAFwxUMTctSrmTGDv1S1A8d87uxjEW1kiw4R",
     "attack": 13,
     "defense": 4
    },
    {
     "shine": "Gold",
     "templates": [
      141437
     ],
     "img": "QmPDMfztKvUJ9kV3kHnr8UDr2v8HtejQHQgvCqhf5BoB4x",
     "attack": 14,
     "defense": 4
    },
    {
     "shine": "Stardust",
     "templates": [
      141477
     ],
     "img": "QmYoZqZ1dvdaTb8RVEXPDkPG2CX3yxzzkMeETLcdeA7nje",
     "attack": 14,
     "defense": 5
    }
   ]
  },
  {
   "cardid": 33,
   "name": "Sungorger",
   "class": "Gem",
   "rarity": "Mythical",
   "description": "Can withstand the heat of a blazing star and amplifies energy",
   "img": "QmawqkcVKKKGvDCcR9KqZB7Dt2Vz7D2EhvyA191yMTMQcD",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19614
     ],
     "img": "QmawqkcVKKKGvDCcR9KqZB7Dt2Vz7D2EhvyA191yMTMQcD",
     "attack": 13,
     "defense": 10
    },
    {
     "shine": "Gold",
     "templates": [
      141438
     ],
     "img": "QmbVs5od6i7QYKqRLYRmFqLFsH7SchwUKLHPAfW7a7Zpdr",
     "attack": 14,
     "defense": 10
    },
    {
     "shine": "Stardust",
     "templates": [
      141478
     ],
     "img": "QmabdczVJ3EkEcHWXizXk9C9kLHVnv6GnZ5rBj8d8mrHA7",
     "attack": 14,
     "defense": 11
    },
    {
     "shine": "Antimatter",
     "templates": [
      141509
     ],
     "img": "QmPWMZTPSwoAYzQNMah8311R9ZnJwrkMhaT3zYT9xZobBX",
     "attack": 15,
     "defense": 12
    }
   ]
  },
  {
   "cardid": 34,
   "name": "Toothed Dagger",
   "class": "Neutral",
   "rarity": "Epic",
   "description": "The teeth come from fallen reptiloid beasts",
   "img": "QmNsHCG4Kfi1VP8s7x6xdqbxGrZMGfHuuH81G3TYvGqzA1",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19615
     ],
     "img": "QmNsHCG4Kfi1VP8s7x6xdqbxGrZMGfHuuH81G3TYvGqzA1",
     "attack": 12,
     "defense": 8
    },
    {
     "shine": "Gold",
     "templates": [
      141439
     ],
     "img": "Qmd5gkokMYUGEehETqfYQ7ebo3FV33qanS4y9piaaej5UR",
     "attack": 13,
     "defense": 8
    },
    {
     "shine": "Stardust",
     "templates": [
      141479
     ],
     "img": "QmQDJGFmHv97o1uMxtGYt9pKigo7xkAx2TKirLmp8NBTm2",
     "attack": 13,
     "defense": 9
    },
    {
     "shine": "Antimatter",
     "templates": [
      141510
     ],
     "img": "QmeMsZ2LMwwPcMRUZYq49yQYm48KsJDS72pGmXKn6R3mFg",
     "attack": 14,
     "defense": 10
    }
   ]
  },
  {
   "cardid": 35,
   "name": "Infernal Axe",
   "class": "Fire",
   "rarity": "Common",
   "description": "What it lacks in power it makes up for in lighting effects",
   "img": "QmWajBsRjC2AuATWaiLU1Tit1nxmeDnQjk2oZ8yy2AG9vb",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19616
     ],
     "img": "QmWajBsRjC2AuATWaiLU1Tit1nxmeDnQjk2oZ8yy2AG9vb",
     "attack": 12,
     "defense": 5
    },
    {
     "shine": "Gold",
     "templates": [
      141440
     ],
     "img": "QmR8DMjT3bHKP8KUMHMZoPNjUCu23yMtJurzB6qvbr5q8b",
     "attack": 13,
     "defense": 5
    },
    {
     "shine": "Stardust",
     "templates": [
      141480
     ],
     "img": "Qmc2NjU1ULRQtQCh7qZKZipGGKxJTXdk8VdkxGZrZEw6th",
     "attack": 13,
     "defense": 6
    }
   ]
  },
  {
   "cardid": 36,
   "name": "Reptiloid Blade",
   "class": "Fire",
   "rarity": "Rare",
   "description": "Customary weapon of the Reptiloid Guard",
   "img": "QmWQ5dCGq8sgM6d4MvZdtMPyszYZQyu9mggAdpd4sY4FHJ",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19617
     ],
     "img": "QmWQ5dCGq8sgM6d4MvZdtMPyszYZQyu9mggAdpd4sY4FHJ",
     "attack": 13,
     "defense": 5
    },
    {
     "shine": "Gold",
     "templates": [
      141441
     ],
     "img": "QmYZcqTJFAdGFjtGara8yoqVgRBtQjqsPc5ZuFvVnciEVh",
     "attack": 14,
     "defense": 5
    },
    {
     "shine": "XDimension",
     "templates": [
      20983
     ],
     "img": "QmaW3rAdc1xDPcDq5eWYQTyZPMkYTRc8gA7oxp71BFuQsK",
     "attack": 15,
     "defense": 8
    },
    {
     "shine": "Stardust",
     "templates": [
      141481
     ],
     "img": "QmXEKethqHGyPmmEaqt6pvEDDuwiFaURoBMoYH4oLk5UoD",
     "attack": 14,
     "defense": 6
    },
    {
     "shine": "Antimatter",
     "templates": [
      141511
     ],
     "img": "QmZvssDo12XFw2XZNSwaRcfsWqvzgLidrjMuLx4SunfzMV",
     "attack": 15,
     "defense": 7
    }
   ]
  },
  {
   "cardid": 37,
   "name": "AI Sword",
   "class": "Metal",
   "rarity": "Legendary",
   "description": "Much smarter than your average sword - it senses opponents' weaknesses",
   "img": "QmNcfk2AfPb9TMRH7xnTKTgRwNyXX5WXF5MkU3Y5fjfa55",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19618
     ],
     "img": "QmNcfk2AfPb9TMRH7xnTKTgRwNyXX5WXF5MkU3Y5fjfa55",
     "attack": 12,
     "defense": 11
    },
    {
     "shine": "Gold",
     "templates": [
      141442
     ],
     "img": "QmVTAdMgSx5Jk3zcxC7prbfXYK454yyx9FoeBDKScXayzM",
     "attack": 13,
     "defense": 11
    },
    {
     "shine": "Stardust",
     "templates": [
      141482
     ],
     "img": "QmQ64UUuRKB9wD7ShzV6NPzUz5MM7DtZiWXjxcBjPxV3XU",
     "attack": 13,
     "defense": 12
    },
    {
     "shine": "Antimatter",
     "templates": [
      141512
     ],
     "img": "QmUgHGrnZbW2oiCMRYsxtcbHCWE7csF2pTkjCRW1NFb1VP",
     "attack": 14,
     "defense": 13
    }
   ]
  },
  {
   "cardid": 38,
   "name": "Standard Shield",
   "class": "Neutral",
   "rarity": "Abundant",
   "description": "Standard shield for basic level protection",
   "img": "Qmd9MPkRCXxgxLaAfs39sHYiQEvQ8w9zb6HQ4i6PJWTHrb",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19619
     ],
     "img": "Qmd9MPkRCXxgxLaAfs39sHYiQEvQ8w9zb6HQ4i6PJWTHrb",
     "attack": 3,
     "defense": 13
    },
    {
     "shine": "Gold",
     "templates": [
      141443
     ],
     "img": "QmVzrhqD6yWaQSu6XLAY7m5Qdt1rzL4tQRdGMBYJ6PtE6w",
     "attack": 3,
     "defense": 14
    }
   ]
  },
  {
   "cardid": 39,
   "name": "Sky Shield",
   "class": "Air",
   "rarity": "Common",
   "description": "Has the ability to blow strong jets of air",
   "img": "QmRkAmq8kJaWJniQTKVLVP5F4WoVdLLjxaSm3DYtowARWN",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19620
     ],
     "img": "QmRkAmq8kJaWJniQTKVLVP5F4WoVdLLjxaSm3DYtowARWN",
     "attack": 4,
     "defense": 13
    },
    {
     "shine": "Gold",
     "templates": [
      141444
     ],
     "img": "QmazwXQpB6n8twaHXJJXQbAJo2AxNA3WmS9crgYQ6iDij4",
     "attack": 4,
     "defense": 14
    },
    {
     "shine": "Stardust",
     "templates": [
      141483
     ],
     "img": "Qmc1z76vKBAWehaz6omVPrekDsXTjyF2sDdUkGKAosFBeq",
     "attack": 5,
     "defense": 14
    }
   ]
  },
  {
   "cardid": 40,
   "name": "Plasma Shield",
   "class": "Fire",
   "rarity": "Common",
   "description": "When Plasma guns were outlawed many were turned into shields",
   "img": "QmVJSA6EJs8VrDECwJHC674yBhPTab7Nh5CPS84rQBjLaN",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19621
     ],
     "img": "QmVJSA6EJs8VrDECwJHC674yBhPTab7Nh5CPS84rQBjLaN",
     "attack": 5,
     "defense": 12
    },
    {
     "shine": "Gold",
     "templates": [
      141445
     ],
     "img": "QmbrBC1xdUMWtNk6YgKBQ9TDV7CCcP3vXAzhntiXnHfQUX",
     "attack": 5,
     "defense": 13
    },
    {
     "shine": "Stardust",
     "templates": [
      141484
     ],
     "img": "QmeNuQH3kntPGJM4bJYdB3ZUh3C5mq94TX6TVGQkA9e24d",
     "attack": 6,
     "defense": 13
    }
   ]
  },
  {
   "cardid": 41,
   "name": "Waxon Shield",
   "class": "Nature",
   "rarity": "Epic",
   "description": "Waxon crafted into its strongest protective form",
   "img": "QmYoCRv2kbwVQBAMxbneyVibhEhjoDqYkKchY1MuuvV4iw",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19622
     ],
     "img": "QmYoCRv2kbwVQBAMxbneyVibhEhjoDqYkKchY1MuuvV4iw",
     "attack": 8,
     "defense": 12
    },
    {
     "shine": "Gold",
     "templates": [
      141446
     ],
     "img": "QmcU7bpmisd5b7NafQad95h4KN5WWhaj7JCjHUyFRj645q",
     "attack": 8,
     "defense": 13
    },
    {
     "shine": "Stardust",
     "templates": [
      141485
     ],
     "img": "QmdoxVGEpiQqWK3ioe7Vr7BZCrmvtpu5d8Vz4J3L9wxMZk",
     "attack": 9,
     "defense": 13
    },
    {
     "shine": "Antimatter",
     "templates": [
      141513
     ],
     "img": "Qmdu8FrDjTySTDPKjifDCt9C6dFFCp8qQQREXrFPE8ScoW",
     "attack": 10,
     "defense": 14
    }
   ]
  },
  {
   "cardid": 42,
   "name": "Leveller Bow",
   "class": "Gem",
   "rarity": "Mythical",
   "description": "This Mythical bow provides a protective shield around the creature holding it",
   "img": "QmTfp2Tnkm89TECjuCjnhkMBu9USTRVjh7kRKpYTAVvcip",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      19623
     ],
     "img": "QmTfp2Tnkm89TECjuCjnhkMBu9USTRVjh7kRKpYTAVvcip",
     "attack": 12,
     "defense": 12
    },
    {
     "shine": "Gold",
     "templates": [
      141447
     ],
     "img": "Qma9UZGSquKb763JW7p3mJCjB8at1dsAFKVckocXdWd5h3",
     "attack": 12,
     "defense": 13
    },
    {
     "shine": "Stardust",
     "templates": [
      141486
     ],
     "img": "QmacyEM8Kq3Uen5eEMh7D5Edw889MMKT89hcKzoW839ZEJ",
     "attack": 13,
     "defense": 13
    },
    {
     "shine": "Antimatter",
     "templates": [
      141514
     ],
     "img": "QmXpiFZSk1Se3SNXLhJscA2yoHtXucQYvr5VkPassh3cyF",
     "attack": 14,
     "defense": 14
    }
   ]
  },
  {
   "cardid": 43,
   "name": "Moonkey Scepter",
   "class": "Air",
   "rarity": "Legendary",
   "description": "Beatings with the Scepter actually feel quite good",
   "img": "QmUVngi2ZwB9mxpkBe6Yc2TdFXaGJcAkVZPdio1Hbptkbg",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      56042
     ],
     "img": "QmUVngi2ZwB9mxpkBe6Yc2TdFXaGJcAkVZPdio1Hbptkbg",
     "attack": 11,
     "defense": 11
    },
    {
     "shine": "Gold",
     "templates": [
      141448
     ],
     "img": "QmaTGdLoBWBXew95Y2iCbag8hCKjK6bc9sZNyTmJxAXdDh",
     "attack": 12,
     "defense": 11
    },
    {
     "shine": "Stardust",
     "templates": [
      141487
     ],
     "img": "QmdbFLcNJk6ZqBNN2ZSdoPyVQdjzha51p41AZptBo9CMXz",
     "attack": 12,
     "defense": 12
    },
    {
     "shine": "Antimatter",
     "templates": [
      141515
     ],
     "img": "QmRVewosBPivNGGaXzxDPFbo1qMSVkYRqc5pgtHbtfteWx",
     "attack": 13,
     "defense": 13
    }
   ]
  },
  {
   "cardid": 44,
   "name": "Blackbolt Arbalest",
   "class": "Neutral",
   "rarity": "Common",
   "description": "An ode to more primitive times, this hand-crank arbalest is easy to maintain and adapt to a wide variety of atmospheres. It lacks the range and armor-piercing potential of gun- or launcher-style r-casters that use explosive propellants, but backfire risk - particularly using biometal bolts - is minimal. As such, it has become a popular choice among certain mercenary bands, and communities of a more clandestine nature.",
   "img": "QmaEsoRYhTBEtAyWgqR96xs5e1cNL42B9R5iScituGsb4C",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      906460
     ],
     "img": "QmaEsoRYhTBEtAyWgqR96xs5e1cNL42B9R5iScituGsb4C",
     "attack": 11,
     "defense": 6
    }
   ]
  },
  {
   "cardid": 45,
   "name": "Elgem Dartgun",
   "class": "Gem",
   "rarity": "Common",
   "description": "The dartgun is a long-standing favourite among the Elgem. It is composed mainly of velocite fiber to keep it lightweight, with a bio-engineered harvester that can extract & compress propellant gas from almost any atmosphere. It also incorporates the Elgem's chromatophore technology, allowing it to become almost invisible to sensors and the naked eye - or be recoloured to match the latest Elgem fashion.",
   "img": "Qmau3ncs6acUpJjxhBtNQsystZVZ8pASuadqdnvnmkj7Eu",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      906461
     ],
     "img": "Qmau3ncs6acUpJjxhBtNQsystZVZ8pASuadqdnvnmkj7Eu",
     "attack": 8,
     "defense": 9
    }
   ]
  },
  {
   "cardid": 46,
   "name": "Emberfire Shotgun",
   "class": "Fire",
   "rarity": "Rare",
   "description": "The product of Lopati resourcefulness and a keen awareness that most of their fighting is done defensively in the close quarters of their warren-like Arkships, this shotgun is fed with pellets of ground up scrap which it then super-heats before dispensing in a fiery short-range spread. The super-heated pellets \"scream\" as they exit the barrel and come into contact with cooler air, barraging raiders audially as well as physically.",
   "img": "QmeTeFMjWD7qb81hSRGLytvn8TZKuSTWgmJGNFZtMpoQ9S",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      906462
     ],
     "img": "QmeTeFMjWD7qb81hSRGLytvn8TZKuSTWgmJGNFZtMpoQ9S",
     "attack": 16,
     "defense": 3
    }
   ]
  },
  {
   "cardid": 47,
   "name": "Magori Revolver",
   "class": "Fire",
   "rarity": "Common",
   "description": "Developed by Magmazone Industries, this six-shot revolver reminiscent of what Humans refer to as \"the Wild West\", is a reliable sidearm that operates almost flawlessly in Magor's extreme atmosphere. It can be loaded with standard or Trilium-infused biometal ammo - though the latter is expensive and ill-advised, as the rate of explosive backfires increases perilously.",
   "img": "QmYPHp21akMww1W1mSovx67Vv2RCxEXA6sKFeXJjuQ1RXs",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      906463
     ],
     "img": "QmYPHp21akMww1W1mSovx67Vv2RCxEXA6sKFeXJjuQ1RXs",
     "attack": 14,
     "defense": 3
    }
   ]
  },
  {
   "cardid": 48,
   "name": "Thunders Requiem",
   "class": "Air",
   "rarity": "Legendary",
   "description": "This bulky quad-barrel launcher was custom built for Khaured General Ershok U'Thun, one of the tallest and strongest Khaureds in Militarist history. It garnered its name from the special ultrasonic explosive rounds it was designed to fire, which vaporise their target before the sonic boom reaches the target's location. Numerous Khaureds have tried to lay claim to U'Thun's fabled r-caster since his death, but none has managed to withstand the vicious recoil. Most have been lucky to leave with naught but fractured wrists and shattered pride.",
   "img": "QmZ4yvFr1W9FE1eYbEK9N5FDf8UdZb2zoZH5yHpHdHBrUa",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      906464
     ],
     "img": "QmZ4yvFr1W9FE1eYbEK9N5FDf8UdZb2zoZH5yHpHdHBrUa",
     "attack": 15,
     "defense": 7
    }
   ]
  },
  {
   "cardid": 49,
   "name": "Waxon Mortar",
   "class": "Metal",
   "rarity": "Epic",
   "description": "Never a race to shrink from the concept of \"with great risk, comes great reward\", the Khaured Dominium worked with a small breakaway group of Eyekese Splicers, to produce a biometal mortar capable of firing Trilium-infused shells with precision accuracy up to 6 km. The mortar uses compressed gas to launch shells, reducing potential range while dramatically reducing explosive backfires.",
   "img": "QmXHzdok8Sxvhj1tPXYk7vG6hnWayFU1WnvoPpieDsh55X",
   "shines": [
    {
     "shine": "Stone",
     "templates": [
      906465
     ],
     "img": "QmXHzdok8Sxvhj1tPXYk7vG6hnWayFU1WnvoPpieDsh55X",
     "attack": 11,
     "defense": 10
    }
   ]
  }
 ]
};
