# Simple Poker GTO Solver

# Overview

When I was learning how to play poker “optimally”, I was having trouble finding simple (and free!) poker solvers that would help give me advice. All poker solvers I could find were on two extremes: extremely complex, paid and robust poker solvers, which were more like poker trainers, and very run-down, old, poker solvers that were really just equity calculators. I decided to build a very simple game theory optimal (GTO) Poker Solver that gives general advice to players based on their cards, table cards, position, and opponent range/cards. This is NOT a poker trainer -- it will not tell players how to act at any given circumstance -- but more a tool that could be used by players to understand if the move they are thinking of doing is a mathematically sound one. In other words, it helps them answer: “in a perfect world, would this move make me money?” Technically speaking, this tool helps users maximize their long run expected value playing poker. This tool will not do the work for the user, but will rather supplement their game.

# Tech Stack Overview

The frontend of this project was done in TypeScript, React and Remix. Remix has a lot of boilerplate, most of which is not here for the sake of readability. The backend, including the monte-carlo simulations and equity calculations, are done in Python. The backend Python server is done using Flask. 

# Elements

On the home screen, players can choose their cards and their position. I’ve simplified the positions to four main categories: EP (contains all UTG players), MP (contains the lo-jack, hi-jack), cutoff, and LP (button, SB). These positions share very similar ranges, so for simplicity's sake, I’ve combined them into 4 major categories.

Then, I’ve simplified poker actions into four main categories: opening, calling, raising, and bluffing. Based on what the user is thinking of doing, they can transition to the given page. 

*Note that* this application is based on cash-game (6-9 player) format, and NOT tournament style poker.

Home Screen:

![Screen Shot 2023-08-09 at 6 48 04 PM](https://github.com/munteanue1234/pokergtosolver/assets/90631000/e36a033a-5bdf-40ac-8abc-50d696a7deb5)

## Opening

The most simple part of the application is opening. The rule of thumb in poker is, when opening, to raise to 3x the big blind to weed out any limpers. This suggestion is based on the player’s card and position.
![Screen Shot 2023-08-09 at 6 48 42 PM](https://github.com/munteanue1234/pokergtosolver/assets/90631000/acdbdeb4-c285-41d4-ae30-28cc58f140a4)

## Calling

If the user is facing a raise, users can input any available table cards (or none, if there are none). They can then input either the opponent’s position, or a custom range (if they know the opponent and can pin them on a range themselves. This range can also be composed of individual hands, if they can put the opponent on several hands). This is used for calculating the user’s equity against the opponent’s range. This equity calculation is then used to determine if the user should call using pot odds. Using the pot information (pot and raise), we can calculate pot odds, and determine if the user should call (if the equity against the opponent makes calling a profitable long run decision).

Example Input:

![Screen Shot 2023-08-09 at 6 54 06 PM](https://github.com/munteanue1234/pokergtosolver/assets/90631000/a2cb3255-ed05-4535-a348-4cda5e1d1f31)

*Important note*: In my case, I’m considering a draw (chop pot) as part of user equity.

## Raising

The functionality of this page is similar to the calling page, except the user now assumes the raising position. Putting their raise against a singular opponent, they can calculate their equity against the opponent again, and figure out if:
- They are ahead in the hand
- What is the maximum value bet they can make. In other words, up to what amount is the opponent indifferent to calling or folding.  Note that if the user is behind, this is impossible (there is negative EV for the user, hence they should not raise… unless they are trying to bluff!)

Example usage (note that for this example, I'm using the opponent's position instead of range to demonstrate that both could be used. The grey text inside the box is placeholder so the user knows acceptable format).

![Screen Shot 2023-08-09 at 6 58 08 PM](https://github.com/munteanue1234/pokergtosolver/assets/90631000/4ab9cfb3-03a1-45ea-af1a-1b48c7c3a831)


## Bluffing

Bluffing in poker is made up of two main categories: semi-bluffs and regular bluffs. Semi-bluffs are usually done when you still have some equity in the hand, but are behind your opponent’s range. For this, a concept known as fold equity is used. For this, the user predicts the probability that their opponent will fold based on the bluff they are going to make. If their fold equity is high, it brings up the user’s total equity (fold equity + poker equity). This could make the bluff a long run +EV move. Note here how fold equity is related to semi-bluffs: since poker equity constitutes a portion of total equity, fold equity, alone, would almost never constitute a +EV move.

Example of usage when we have a gutshot straight draw and flush draw on the flop against an opponent who we are fairly certain has a premium hand. Alone, we do not have enough equity to make a bluff of 100 into a pot of 100. However, let's assume the user knows that the opponent is prone to folding against bluffs with probability 0.5. Suddenly, using fold equity, this becomes a profitable semi-bluff (semi-bluff because, of course, we still have outs).

![Screen Shot 2023-08-09 at 7 26 43 PM](https://github.com/munteanue1234/pokergtosolver/assets/90631000/9c5be122-4040-4fc2-a9a0-1aa9036009f3)

As for other bluffs (presumably when you have no equity in the hand left), you have to determine how often the bluff you are making should be successful to be a +EV move. This is called a break-even percentage, and is essentially the same calculation as pot odds, but for a different purpose (but uses the same risk-reward formula: risk / risk + reward). If your break even percentage is 50%, your bluff needs to be successful 50% of the time for your bluff to have +EV. Usually with bluffs, you are trying to portray another hand, or range of hands. I have the option that allows users to input their perceived range, which is essentially, assuming the opponent believes them, the range of hands or hand the opponent believes the user is playing. I use this to calculate a user's perceived equity to help them understand how much equity their OPPONENT believes they have, helping to guide their bluff.

Example use case, user thinking of bluffing 100 dollars into a 100 dollar pot using a missed straight and flush draw as their perceived range:

![Screen Shot 2023-08-09 at 7 12 14 PM](https://github.com/munteanue1234/pokergtosolver/assets/90631000/3d997dcc-22b7-4e3d-a73c-ad5bc7f4d3a7)


# Summary and Limitations

Very rarely do players, particularly novices, play GTO poker. Poker is very much a human game, and there is a lot more that goes into being a winning player than GTO plays. As for this specific tool, note that there is a tradeoff between simplicity and accuracy. More robust poker solvers, such as paid versions online, would be able to consider a multitude of other factors (opponent playing style, table format, more specific position) to give more accurate advice. Therefore, this poker tool is far from the key to being a winning player. Again, I designed it to be a supplement to players, particularly those who are learning, and it should be used as such.
