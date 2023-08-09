from collections import defaultdict



suits = ['d','s','c','h']
ranks = ['A','2','3','4','5','6','7','8','9','T','J','Q','K']
cards = []
for r in ranks:
    for s in suits:
        cards.append(r+s)

EP = defaultdict(list)
MP = defaultdict(list)
cutoff = defaultdict(list)
LP = defaultdict(list)
dicts = {'EP': EP, 'LP': LP, "MP": MP, "cutoff": cutoff}

pairs = ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22"]
suited = ["AKs", "AQs", "AJs", "ATs", "KQs", "KJs", "KTs", "QJs", "QTs", "JTs", "A5s", "A4s", "A3s", "A2s", "T9s", "98s", "87s", "76s", "A9s", "54s", "65s", "A6s", "A7s", "A8s", "K9s", "K8s", "K7s", "Q9s", "Q8s", "J9s", "J8s", "T8s", "97s", "86s", "75s", "64s" ,"53s", "43s", "K6s", "K5s", "K4s", "K3s", "K2s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s", "J7s", "T6s", "T7s", "96s", "85s", "74s", "63s"]
offsuit = ["AKo", "AQo", "AJo", "ATo", "KQo", "A9o", "QJo", "KJo", "JTo", "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "A3o" ,"A2o" ,"K9o", "Q9o", "J9o", "T9o"]

def early_position():
    for i in range(8):
        EP["pairs"].append(pairs[i])

    for i in range(10):
        EP["suited"].append(suited[i])

    for i in range(3):
        EP["offsuit"].append(offsuit[i])


    return EP


def late_position():
    for i in range(len(pairs)):
        LP["pairs"].append(pairs[i])

    for i in range(len(suited)):
        LP["suited"].append(suited[i])

    for i in range(len(offsuit)):
        LP["offsuit"].append(offsuit[i])

    return LP

def middle_position():
    for i in range(13):
        MP["pairs"].append(pairs[i])

    for i in range(20):
        MP["suited"].append(suited[i])

    for i in range(6):
        MP["offsuit"].append(offsuit[i])

def make_cutoff():
    for i in range(len(pairs)):
        cutoff["pairs"].append(pairs[i])

    for i in range(37):
        cutoff["suited"].append(suited[i])

    for i in range(10):
        cutoff["offsuit"].append(offsuit[i])


def generate_pairs_and_offsuit(range_cards, banned):
    villain_cards = []
    for cards in range_cards:
        for i in range(len(suits)):
            if cards[0] + suits[i] in banned:
                continue
            for j in range(len(suits)):
                if cards[1] + suits[j] in banned or suits[i] == suits[j]:
                    continue
                card = [cards[0] + suits[i], cards[1] + suits[j]]
                villain_cards.append(card)

    return villain_cards


def generate_suited_combos(range_cards, banned):
    villain_cards = []
    for cards in range_cards:
        for suit in suits:
            if cards[0] + suit in banned or cards[1] + suit in banned:
                continue
            card = [cards[0] + suit, cards[1] + suit]
            villain_cards.append(card)
    return villain_cards


def polish_cards(cards):
    if cards[0] == cards[2]:
        return cards[0] + cards[2]

    if cards[1] == cards[3]:
        return cards[0] + cards[2] + "s"

    return cards[0] + cards[2] + "o"


early_position()
middle_position()
make_cutoff()
late_position()

def position_dict(name):
    return dicts[name]