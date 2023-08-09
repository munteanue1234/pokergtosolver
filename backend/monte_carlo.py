from phevaluator import evaluate_cards
import random
from utility.position_ranges import generate_suited_combos, position_dict, generate_pairs_and_offsuit, cards
from utility.custom_ranges import parent_decipher

def simulate(hand, table, opponent_hands):
    result_state = 0
    hand_set = set(hand)
    table_set = set(table)
    for villain in opponent_hands:
        villain_set = set(villain)
        hand = hand[:]
        new_table = table[:]
        full = new_table + hand
        deck = list(set(cards) - hand_set - table_set - villain_set)
        random.shuffle(deck)
        while len(new_table) < 5:
            card = deck.pop(0)
            new_table.append(card)
            full.append(card)

        my_hand_rank = evaluate_cards(full[0],full[1],full[2],full[3],full[4],full[5],full[6])
        all_cards = new_table + villain
        opponent = evaluate_cards(all_cards[0],all_cards[1],all_cards[2],all_cards[3],all_cards[4],all_cards[5],all_cards[6])
        if opponent >= my_hand_rank:
            result_state += 1

    return result_state / len(opponent_hands)

def monte_carlo(hand, table, opponent_range, custom):
    banned = set()
    for h in hand:
        banned.add(h)
    for t in table:
        banned.add(t)
    if custom:
        villain = opponent_range
    else:
        position = position_dict(opponent_range)
        pairs = position["pairs"]
        suited = position["suited"]
        offsuit = position["offsuit"]
        first_villains = generate_pairs_and_offsuit(pairs + offsuit, banned)
        second_villains = generate_suited_combos(suited, banned)
        villain = first_villains + second_villains
    outcome = simulate(hand, table, villain)
    return outcome

def range_vs_range_monte_carlo(our_hands, opponent_hands, table, custom):
    res = 0
    banned = set()
    for t in table:
        banned.add(t)
    for hand in our_hands:
        if custom:
            given_range = parent_decipher(opponent_hands, hand, table)
        else:
            for h in hand:
                banned.add(h)
            position = position_dict(opponent_hands)
            pairs = position["pairs"]
            suited = position["suited"]
            offsuit = position["offsuit"]
            first_villains = generate_pairs_and_offsuit(pairs + offsuit, banned)
            second_villains = generate_suited_combos(suited, banned)
            given_range = first_villains + second_villains
        outcome = simulate(hand, table, given_range)
        res += outcome

    return res / len(our_hands)