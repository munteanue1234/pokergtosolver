import { Form } from "react-router-dom";
import { Link } from "@remix-run/react";
import { ActionArgs, LoaderArgs } from "@remix-run/node";
import { typedjson, useTypedActionData, useTypedLoaderData } from "remix-typedjson";
import { z } from "zod";
import { validateActionInput } from "~/misc/validate";
import { useEffect, useState } from "react";

const schema = z.object({
  raiser: z.string(),
  cards: z.string(),
  flop1: z.string(),
  suit1: z.string(),
  flop2: z.string(),
  suit2: z.string(),
  flop3: z.string(),
  suit3: z.string(),
  turnCard: z.string(),
  turnSuit: z.string(),
  riverCard: z.string(),
  riverSuit: z.string(),
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
  let tableCards = ""
  const raised = formData.raiser;
  const cards = formData.cards
  const flop1 = formData.flop1
  const flop2 = formData.flop2
  const flop3 = formData.flop3
  const suit1 = formData.suit1
  const suit2 = formData.suit2
  const suit3 = formData.suit3
  const custom = formData.custom
  const turnCard = formData.turnCard
  const turnSuit = formData.turnSuit
  const riverCard = formData.riverCard
  const riverSuit = formData.riverSuit
  const raiseAmount = formData.raiseAmount
  const currentPot = formData.currentPot
  const myRange = formData.myCustom
  const foldProb = formData.foldProb
  const filterTable: string[] = [flop1, suit1, flop2, suit2, flop3, suit3, turnCard, turnSuit, riverCard, riverSuit]
  let i = 0
  while (i < filterTable.length) {
    if (filterTable[i] !== "N/A" && filterTable[i + 1] !== "N/A") {
      tableCards += (filterTable[i] + filterTable[i + 1] + ", ")

    }
    i += 2
  }
  //need to calculate both equities. in myRange, we are calculating perceived equity. If not, we only ccaclulate true equity.
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

  const actionData = useTypedActionData<typeof action>()

  const breakEven = (pot : number, raise : number) => {
    return (raise / (raise + pot)) * 100


  }

  const roundNumberPercentange = (data : number) => {
    return String(parseFloat(((data) * 100).toFixed(2)))
  }


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
        setEven(String(parseFloat(be.toFixed(2))) + "%")
        if (actionData.perceivedEquity) {
          const result = roundNumberPercentange(actionData.perceivedEquity);
          setPerceivedEquity(String(result) + "%")
          setSemiBluffRec("")
          setFoldEquity("")
          setTotalEquity("")
          setBluffRec(`Your opponent needs to fold ${even} of the time for positive LR EV`)
        }

        else if (actionData.foldProb) {
          const foldEquity = Number(actionData.foldProb) * (1 - Number(actionData.equity))
          setFoldEquity(roundNumberPercentange(foldEquity))
          setPerceivedEquity("")
          const totalEquity = foldEquity + Number(actionData.equity)
          console.log((totalEquity))
          console.log(be)
          if (totalEquity * 100 >= be) {
            setSemiBluffRec("This semi-bluff has POSITIVE LR expected value!")
          }
          else {
            setSemiBluffRec("This semi-bluff is NOT profitable in the LR")
          }
          setTotalEquity(roundNumberPercentange(totalEquity))

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
          <u> <b> Table Details </b> </u>
          <div>
            <div className={"mt-4"}>
              Input all available table cards:
            </div>
            <select className={"font-bold mt-5"} name={"flop1"}>
              {(() => {
                const options = ["N/A", "A", "2", "3", "4", "5", "6","7","8","9","T","J","Q","K"]
                return options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ));
              })()}
            </select>
            <select name={"suit1"}>
              <option> N/A </option>
              <option> s</option>
              <option> c</option>
              <option> h</option>
              <option> d</option>

            </select>
            <div>
            </div>
            <select className={"font-bold"} name={"flop2"}>
              {(() => {
                const options = ["N/A", "A", "2", "3", "4", "5", "6","7","8","9","T","J","Q","K"]
                return options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ));
              })()}
            </select>
            <select name={"suit2"}>
              <option> N/A </option>
              <option> s</option>
              <option> c</option>
              <option> h</option>
              <option> d</option>
            </select>
            <div>
            </div>
            <select className={"font-bold"} name={"flop3"}>
              {(() => {
                const options = ["N/A", "A", "2", "3", "4", "5", "6","7","8","9","T","J","Q","K"]
                return options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ));
              })()}
            </select>
            <select name={"suit3"}>
              <option> N/A </option>
              <option> s</option>
              <option> c</option>
              <option> h</option>
              <option> d</option>

            </select>
            <div>
            </div>
            <select className={"font-bold "} name={"turnCard"}>
              {(() => {
                const options = ["N/A", "A", "2", "3", "4", "5", "6","7","8","9","T","J","Q","K"]
                return options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ));
              })()}
            </select>
            <select name={"turnSuit"}>
              <option> N/A </option>
              <option> s</option>
              <option> c</option>
              <option> h</option>
              <option> d</option>

            </select>
            <div>
            </div>
            <select className={"font-bold"} name={"riverCard"}>
              {(() => {
                const options = ["N/A", "A", "2", "3", "4", "5", "6","7","8","9","T","J","Q","K"]
                return options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ));
              })()}
            </select>
            <select name={"riverSuit"}>
              <option> N/A </option>
              <option> s</option>
              <option> c</option>
              <option> h</option>
              <option> d</option>
            </select>
          </div>
          <div className={"mt-4"}>
            <label className={"font-bold"}> Opponent Position: </label>
            <select name="raiser" >
              <option> N/A </option>
              <option> EP </option>
              <option> MP </option>
              <option> cutoff </option>
              <option> LP </option>
            </select>
            <div className={"font-bold text-red-500 mt-4 flex justify-center"}>
              OR
            </div>
            <div className={"mt-4"}>
              Input a custom range/hand:
            </div>
            <input
              type="text"
              className="mt-4 border-2 border-black rounded"
              name={"custom"}
              placeholder="QQ+, AKo+, AJs+, KdJd"
              style={{ width: '230px' }}
            >

            </input>
          </div>
          <div className="mt-4" >
            Input Intended Bluff:
          </div>
          <input name = "raiseAmount" className={"mt-4 border-2 border-black rounded"} onKeyDown={(e) => {
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
          <div className={"mt-4"}>
            Input Current Pot:
          </div>
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
          <div className="flex justify-center space-x-4 mt-4 w-full">
            <button type="submit" className="inline-flex px-6 py-3 text-white bg-blue-500 rounded-lg shadow-lg hover:bg-blue-600">
              Submit
            </button>
          </div>
          <input type="hidden" name="cards" value={cards}/>



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