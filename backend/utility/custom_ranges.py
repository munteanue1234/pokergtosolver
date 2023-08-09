

suits = ['d','s','c','h']
rank_order = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
pairs = ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22"]
banned = set()
hands_and_table = set()
def parent_decipher(opponent_range, hand, table):
    villain_range = []
    els = opponent_range.split(",")
    if len(hand) == 2:
        hands_and_table.add(hand[0])
        hands_and_table.add(hand[1])
    for i in range(len(table)):
        hands_and_table.add(table[i])
    for el in els:
        el = el.strip()
        if "+" in el:
            if el[-2] == "o":
                offsuit_cards = offsuit_decipher(el[:-2])
                villain_range += offsuit_cards

            elif el[-2] == "s":
                suited_cards = suited_decipher(el[:-2])
                villain_range += suited_cards

            else:
                paired_cards = pair_decipher(el[:-1])
                villain_range += paired_cards

        else:
            if len(el) == 4:
                card = [el[0:2], el[2:4]]
                if el not in banned:
                    villain_range.append(card)

            elif len(el) == 2 or (len(el) == 3 and el[-1] != "s"):
                for i in range(len(suits)):
                    if el[0] == el[1]:
                        start = i + 1
                    else:
                        start = 0
                    for j in range(start, len(suits)):
                        if len(el) == 3 and suits[i] == suits[j]:
                            continue
                        card = [el[0] + suits[i], el[1] + suits[j]]
                        if el[0] + suits[i] + el[1] + suits[j] not in banned and el[0] + suits[i] not in hands_and_table and el[1] + suits[j] not in hands_and_table:
                            villain_range.append(card)
                        banned.add(el[0] + suits[i] + el[1] + suits[j])

            else:
                for suit in suits:
                    card = [el[0] + suit, el[1] + suit]
                    if el[0] + suit + el[1] + suit not in banned and el[0] + suit not in hands_and_table and el[1] + suit not in hands_and_table:
                        villain_range.append(card)
                    banned.add(el[0] + suit + el[1] + suit)


    banned.clear()
    hands_and_table.clear()
    return villain_range

def pair_decipher(pair):
    ret = []
    for i in range(len(pairs)):
        for j in range(len(suits)):
            if pairs[i][0] + suits[j] in hands_and_table:
                continue
            for k in range(j + 1, len(suits)):
                if pairs[i][0] + suits[k] in hands_and_table:
                    continue
                card = [pairs[i][0] + suits[j], pairs[i][0] + suits[k]]
                ret.append(card)

        if pairs[i] == pair:
            break


    return ret

def offsuit_decipher(offsuit):
    res = []
    largest_rank = offsuit[0]
    smaller_rank = offsuit[1]
    right_idx = rank_order.index(largest_rank)
    left_idx = rank_order.index(smaller_rank)
    for j in range(left_idx, right_idx):
        for k in range(len(suits)):
            if rank_order[right_idx] + suits[k] in hands_and_table:
                continue
            for l in range(len(suits)):
                if rank_order[j] + suits[l] in hands_and_table:
                    continue
                if rank_order[right_idx] + suits[k] + rank_order[j] + suits[l] in banned:
                    continue
                if suits[l] == suits[k]:
                    continue
                card = [rank_order[right_idx] + suits[k], rank_order[j] + suits[l]]
                res.append(card)
                banned.add(rank_order[right_idx] + suits[k] + rank_order[j] + suits[l])



    return res


def suited_decipher(suited):
    res = []
    largest_rank = suited[0]
    smaller_rank = suited[1]
    right_idx = rank_order.index(largest_rank)
    left_idx = rank_order.index(smaller_rank)
    for j in range(left_idx, right_idx):
        for suit in suits:
            if rank_order[right_idx] + suit in hands_and_table or rank_order[j] + suit in hands_and_table:
                continue
            if rank_order[right_idx] + suit + rank_order[j] + suit in banned:
                continue
            card = [rank_order[right_idx] + suit, rank_order[j] + suit]
            res.append(card)
            banned.add(rank_order[right_idx] + suit + rank_order[j] + suit)
    return res




