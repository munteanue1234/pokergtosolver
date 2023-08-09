
from multiprocessing import Pool
from flask import Flask, request, jsonify
from utility.custom_ranges import parent_decipher
from utility.position_ranges import position_dict, polish_cards
from monte_carlo import monte_carlo, range_vs_range_monte_carlo

num_processes = 8
app = Flask(__name__)
@app.route("/open")
def check_open():
    ret = {
        "result": "",
    }
    cards = request.args.get("cards")
    position = request.args.get("position")
    if not cards or not position:
        return jsonify(ret), 200
    polished = polish_cards(cards)
    dict = position_dict(position)
    for category in dict:
        if polished in dict[category]:
            ret["result"] = "Open! Raise to 3x the big blind"
            return jsonify(ret), 200

    ret["result"] = "Fold"
    return jsonify(ret), 200


@app.route("/call")
def check_raise():
    ret = {
        "result": "",
        "reason": ""

    }
    try:
        myCards = request.args.get("cards")
        position = request.args.get("position")
        tableCards = request.args.get("table")
        customRange = request.args.get("range")
        card1 = myCards[0:2]
        card2 = myCards[2:4]
        table = []
        if (card1 == card2):
            ret["result"] = "failure"
            ret["reason"] = "Your cards are identical"
            return jsonify(ret), 200
        individual_cards = tableCards.split(",")
        for tableCard in individual_cards:
            if tableCard == card1 or tableCard == card2 or tableCard in table:
                ret["result"] = "failure"
                ret["reason"] = "You inputted duplicate cards"
                return jsonify(ret), 200

            tableCard = tableCard.strip()
            print(tableCard)
            if tableCard != "":
                table.append(tableCard)

        if not customRange:
            args_list = [([card1, card2], table, position, False) for _ in range(1000)]
            with Pool(num_processes) as p:
                results = p.starmap(monte_carlo, args_list)
            equity = sum(results) / 1000

        else:
            custom_range = parent_decipher(customRange, [card1, card2], table)
            args_list = [([card1, card2], table, custom_range, True) for _ in range(1000)]
            with Pool(num_processes) as p:
                results = p.starmap(monte_carlo, args_list)
            equity = sum(results) / 1000
        ret["result"] = str(round(equity, 4))
        print(ret["result"])
        return jsonify(ret), 200

    except:
        ret["result"] = "failure"
        ret["reason"] = "Invalid Custom Input"
        return jsonify(ret), 200

@app.route("/range")
def range_vs_range():
    ret = {
        "result": "",
        "reason": ""

    }
    try:
        my_range = request.args.get("cards")
        opponent_range = request.args.get("opponent")
        position = request.args.get("position")
        table = []
        tableCards = request.args.get("table")
        individual_cards = tableCards.split(",")
        for tableCard in individual_cards:
            tableCard = tableCard.strip()
            if tableCard != "":
                table.append(tableCard)

        print(table)
        our_range = parent_decipher(my_range, [], table)
        if opponent_range:
            args_list = [(our_range, opponent_range, table, True) for _ in range(50)]
        else:
            args_list = [(our_range, position, table, False) for _ in range(50)]

        with Pool(num_processes) as p:
            results = p.starmap(range_vs_range_monte_carlo, args_list)

        equity = sum(results) / 50
        ret["result"] = str(round(equity, 4))
        print(ret["result"])
        return jsonify(ret), 200



    except:
        ret["result"] = "failure"
        ret["reason"] = "Invalid Custom Input"
        return jsonify(ret), 200



if __name__ == "__main__":
    app.run(debug=True)