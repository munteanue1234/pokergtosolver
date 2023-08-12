import { Form } from "react-router-dom";
import { Link } from "@remix-run/react";
import { ActionArgs, LoaderArgs } from "@remix-run/node";
import { typedjson, useTypedActionData, useTypedLoaderData } from "remix-typedjson";
import { z } from "zod";
import { validateActionInput } from "~/misc/service/validate";
import React, { useEffect, useState } from "react";
import { CardPicker } from "~/misc/UI/cardUI";
import { processTableCards } from "~/misc/service/processUserInput";
import { breakEven, calculateFoldEquity, roundNumberPercentange } from "~/misc/service/pokerMath";
import { convertToUnicode } from "~/misc/UI/cardProcessUtility";

const schema = z.object({
  raiser: z.string(),
  cards: z.string(),
  table: z.string(),
  raiseAmount: z.string(),
  custom: z.string(),
  currentPot: z.string(),
  foldProb: z.string(),
  myCustom: z.string(),


});
type ActionInput = z.TypeOf<typeof schema>;
export async function action({request} : ActionArgs) {
  const { formData, errors } = await validateActionInput<ActionInput>({
    request,
    schema,
  });
  if (errors) {
    throw errors;
  }
  const table = formData.table;
  const raised = formData.raiser;
  const cards = formData.cards
  const custom = formData.custom
  const raiseAmount = formData.raiseAmount
  const currentPot = formData.currentPot
  const myRange = formData.myCustom
  const foldProb = formData.foldProb
  const tableCards = processTableCards(table, cards)
  //need to calculate both equities. in myRange, we are calculating perceived equity. If not, we only calculate true equity.
  if (!tableCards) {
    return typedjson({equity : "failure" ,failureReason : "You inputted duplicate cards", raise : null, pot : null, tableCards : null, perceivedEquity : null, perceivedRange : null, foldProb : null})
  }
  let response;
  let equity;
  const rangeEncoded = encodeURIComponent(myRange)
  const opponentEncoded = encodeURIComponent(custom)
  if (myRange) {
    response = await fetch(`http://127.0.0.1:5000/range?cards=${rangeEncoded}&table=${tableCards}&opponent=${opponentEncoded}&position=${raised}`)

  }
  if (custom) {
    equity = await fetch(`http://127.0.0.1:5000/call?cards=${cards}&position=${raised}&table=${tableCards}&range=${opponentEncoded}`)
  }
  else {
    equity = await fetch(`http://127.0.0.1:5000/call?cards=${cards}&position=${raised}&table=${tableCards}`)
  }

  if (response && !response.ok) {
    throw new Error("error")
  }

  if (!equity.ok) {
    throw new Error("error")
  }
  const trueEquity = await equity.json()
  const customEquityResponse = response ? await response.json() : ""
  const perceivedEquity = customEquityResponse.result ? customEquityResponse : ""
  return typedjson({tableCards : tableCards, equity : trueEquity.result, failureReason: trueEquity.reason, raise: raiseAmount, pot : currentPot, foldProb : foldProb, perceivedEquity : perceivedEquity.result, perceivedRange : myRange})

}
export async function loader({request} : LoaderArgs) {
  const url = new URL(request.url);
  const cards = url.searchParams.get("cards") ?? ""
  const position = url.searchParams.get("position") ?? ""
  return typedjson({cards: cards, position: position})

}
export default function Bluff() {
  const {cards, position} = useTypedLoaderData<typeof loader>()
  const [alert, setAlert] = useState("")
  const [perceivedEquity, setPerceivedEquity] = useState("")
  const [myEquity, setMyEquity] = useState("")
  const [foldEquity, setFoldEquity] = useState("")
  const [totalEquity, setTotalEquity] = useState("")
  const [even, setEven] = useState("")
  const [semiBluffRec, setSemiBluffRec] = useState("")
  const [bluffRec, setBluffRec] = useState("")
  const card1_unicode = convertToUnicode(cards[0] + cards[1]) ?? ""
  const card2_unicode = convertToUnicode(cards[2] + cards[3]) ?? ""
  const [selectedMap, setSelectedMap] = useState<Map<number, string>>(new Map([[
    -1, card1_unicode],
    [-2, card2_unicode]]));  const [selectedCards, setSelectedCards] = useState(Array<string>(5).fill(""));
  const actionData = useTypedActionData<typeof action>()

  const handleCardSelect = (index : number, card : string) => {
    const updatedCards = [...selectedCards];
    updatedCards[index] = card;
    setSelectedCards(updatedCards);
    const newMap = new Map(selectedMap);
    newMap.set(index, card)
    setSelectedMap(newMap);
  };

  useEffect(() => {
    if (actionData) {
      if (actionData?.equity === "failure") {
        setAlert(actionData.failureReason)
        setTimeout(() => {
          setAlert("");
        }, 5000);

      } else {
        setMyEquity(roundNumberPercentange(actionData.equity) + "%")
        const be = breakEven(Number(actionData.pot), Number(actionData.raise))
        setEven(roundNumberPercentange(be) + "%")
        if (actionData.perceivedEquity) {
          const result = roundNumberPercentange(actionData.perceivedEquity);
          setPerceivedEquity(String(result) + "%")
          setSemiBluffRec("")
          setFoldEquity("")
          setTotalEquity("")
          setBluffRec(`Your opponent needs to fold ${even} of the time for positive LR EV`)
        }

        else if (actionData.foldProb) {
          const foldEquity = calculateFoldEquity(actionData.equity, actionData.foldProb)
          setFoldEquity(roundNumberPercentange(foldEquity) + "%")
          setPerceivedEquity("")
          const totalEquity = foldEquity + Number(actionData.equity)
          if (totalEquity * 100 >= be) {
            setSemiBluffRec("This semi-bluff has POSITIVE LR expected value!")
          }
          else {
            setSemiBluffRec("This semi-bluff is NOT profitable in the LR")
          }
          setTotalEquity(roundNumberPercentange(totalEquity) + "%")

        }

        else {
          setAlert("Please fill out the necessary fields!")
          setTimeout(() => {
            setAlert("");
          }, 3000);
        }
      }
    }
  }, [actionData]);

  return(
    <>
      <div className={"flex justify-center text-4xl font-bold text-red-500"}>{alert} </div>
      <Form method={"post"}>
      <div className="mt-10" style={{
        display: 'flex',
        justifyContent: 'space-between',
        maxWidth: '75%',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <div className="text-xl text-black">
          <u> <b> Intend to Bluff: </b>  </u>
          <div className={"mt-4"}>
            Input your PERCEIVED range:
          </div>
          <input
            type="text"
            className="mt-4 border-2 border-black rounded"
            name={"myCustom"}
            placeholder="QQ+, AKo+, AJs+, KdJd"
            style={{ width: '230px' }}
          >

          </input>

        </div>

        <div className="text-xl text-black">
          <u> <b>
            <div className={"flex justify-center"}> Table Details </div> </b> </u>
          <div>
            <div className={"mt-4 flex justify-center"}>
              Input all available table cards:
            </div>
            <div className="flex font-normal mr-20 mb-6">
              {selectedCards.map((val : string, index : number) => (
                <CardPicker
                  key={index}
                  style={{ fontSize: "8rem" }}
                  onSelect={(card : string) => {handleCardSelect(index, card)}}
                  selectedCards={selectedMap}
                />
              ))}
            </div>
          </div>
          <label className={"flex justify-center"}> Input Raiser Position </label>
          <div className={"font-bold text-red-500 mt-4 flex justify-center"}>
            OR
          </div>
          <div className={"mt-4 flex justify-center"}>
            Input a custom range/hand:
          </div>
          <div className={"mt-4 flex justify-center"}>
            <select className={"mt-2 mr-4 flex justify-center font-bold"} name="raiser" >
              <option> N/A </option>
              <option> EP </option>
              <option> MP </option>
              <option> cutoff </option>
              <option> LP </option>
            </select>
            <input
              type="text"
              className="mt-2 border-2 border-black rounded flex justify-center"
              name={"custom"}
              placeholder="QQ+, AKo+, AJs+, KdJd"
              style={{ width: '230px' }}
            >

            </input>
          </div>
          <div className="flex justify-center mt-4" >
            Input Intended Bluff:
          </div>
          <div className={"flex justify-center"}>
            <input name = "raiseAmount" className={"flex justify-center mt-4 border-2 border-black rounded"} onKeyDown={(e) => {
            const key = e.key;
            if (
              !/[0-9]/.test(
                e.key
              ) &&
              key !== "Backspace" && e.key !== "."
            ) {
              e.preventDefault();
            }
          }} type="text">
          </input>
          </div>
          <div className={"flex justify-center mt-4"}>
            Input Current Pot:
          </div>
          <div className={"flex justify-center"}>
          <input name="currentPot" className="mt-4 border-2 border-black rounded" type="text" onKeyDown={(e) => {
            const key = e.key;
            if (
              !/[0-9]/.test(
                e.key
              ) &&
              key !== "Backspace" && e.key !== "."
            ) {
              e.preventDefault();
            }
          }}>

          </input>
          </div>
          <div className="flex justify-center space-x-4 mt-4 w-full">
            <button type="submit" className="inline-flex px-6 py-3 text-white bg-blue-500 rounded-lg shadow-lg hover:bg-blue-600">
              Submit
            </button>
          </div>
          <input type="hidden" name="cards" value={cards}/>
          <input type="hidden" name="table" value={selectedCards}/>
        </div>

        <div className="text-xl text-black">
          <u> <b>  Intend to Semi-Bluff:  </b> </u>
          <div>
          </div>
          <div className="mt-4" >
            Opponent fold probability:
          </div>
          <input name = "foldProb" placeholder={"0.5"} className={"mt-4 border-2 border-black rounded"} onKeyDown={(e) => {
            const key = e.key;
            if (
              !/[0-9]/.test(
                e.key
              ) &&
              key !== "Backspace" && e.key !== "."
            ) {
              e.preventDefault();
            }
          }} type="text">
          </input>
          </div>
      </div>
      </Form>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        maxWidth: '75%',
        marginLeft: 'auto',
        marginRight: 'auto',
        position: "relative",
      }} className={"mb-10"} >
        <div className={"mt-10 whitespace-normal w-1/5 mr-8 mb-10"}>
          <div className={"text-xl font-bold text-black"}>
            <u> Full-Bluff Information: </u>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4">
            <span className="text-blue-500">Perceived Equity: </span>
            <span className="text-black">{perceivedEquity}</span>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4 ">
            <span className="text-violet-500">Recommendation: </span>
            <span className="text-black flex-grow whitespace-normal"> {bluffRec}</span>
          </div>

        </div>
        <div>
          <div className="flex-grow"  />
          <div className="text-center text-xl font-bold mt-4 mb-4">
            <span className="text-blue-500">Your Cards: </span>
            <span className="text-black">{cards}</span>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4">
            <span className="text-red-500">Table Cards: </span>
            <span className="text-black">{actionData?.tableCards}</span>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4">
            <span className="text-green-500">Your True Equity: </span>
            <span className="text-black">{myEquity}</span>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4">
            <span className="text-violet-500">Pot Odd %: </span>
            <span className="text-black">{even}</span>
          </div>
          <div className="flex justify-center space-x-4 mt-4 mb-4 w-full">
            <Link to={`/?cards=${cards}&position=${position}`} className="inline-flex px-6 py-3 text-white bg-orange-400 rounded-lg shadow-lg hover:bg-orange-500 font-bold">
              Back
            </Link>
            <button onClick={() => window.location.reload()} className="inline-flex px-6 py-3 text-white bg-violet-400 rounded-lg shadow-lg hover:bg-violet-500 font-bold">
              Clear
            </button>
          </div>
        </div>
        <div className={"mt-10 whitespace-normal w-1/5"}>
          <div className={"text-xl font-bold text-black"}>
            <u> Semi-Bluff Information: </u>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4">
            <span className="text-blue-500">Fold Equity: </span>
            <span className="text-black">{foldEquity}</span>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4">
            <span className="text-red-500">Total Equity: </span>
            <span className="text-black">{totalEquity}</span>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4 whitespace-normal">
            <span className="text-violet-500">Recommendation: </span>
            <span className="text-black">{semiBluffRec}</span>
          </div>

        </div>

      </div>
    </>
  )
}