
import { Form } from "react-router-dom";
import { typedjson, useTypedActionData, useTypedLoaderData } from "remix-typedjson";
import { ActionArgs, LoaderArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { z } from "zod";
import { validateActionInput } from "~/misc/validate";
import { useEffect, useState } from "react";

export async function loader({request} : LoaderArgs) {
  const url = new URL(request.url);
  const cards = url.searchParams.get("cards") ?? ""
  const position = url.searchParams.get("position") ?? ""
  return typedjson({cards: cards, position: position})

}

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
  currentPot: z.string(),
  riverCard: z.string(),
  riverSuit: z.string(),
  custom: z.string(),


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
  const raised = formData.raiser; //who raised (position), eventually also do range
  const cards = formData.cards //our cards
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
  const currentPot = formData.currentPot

  const filterTable: string[] = [flop1, suit1, flop2, suit2, flop3, suit3, turnCard, turnSuit, riverCard, riverSuit]
  let i = 0
  while (i < filterTable.length) {
    if (filterTable[i] !== "N/A" && filterTable[i + 1] !== "N/A") {
      tableCards += (filterTable[i] + filterTable[i + 1])

    }
    i += 2
  }
  let response;
  const customEncoded = encodeURIComponent(custom)
  if (custom) {
    response = await fetch(`http://127.0.0.1:5000/call?cards=${cards}&position=${raised}&table=${tableCards}&range=${customEncoded}`)

  }
  else {
    response = await fetch(`http://127.0.0.1:5000/call?cards=${cards}&position=${raised}&table=${tableCards}`)
  }
  if (!response.ok) {
    throw new Error("error")
  }
  const data = await response.json()
  return typedjson({tableCards : tableCards, data : data.result, failureReason: data.reason, pot : currentPot})}

export default function Raise() {
  const {cards, position} = useTypedLoaderData<typeof loader>();
  const actionData = useTypedActionData<typeof action>();
  const [alert, setAlert] = useState("")
  const [opponentRaise, setOpponentRaise] = useState("")
  const [recommendation, setRecommendation] = useState("")
  const [myEquity, setMyEquity] = useState("")
  const maximumRaise = (pot : number, equity : number) => {
    const numerator = pot * equity
    const denominator = 1 - (2*equity)
    return numerator/denominator
  }

  const roundNumberPercentange = (data : number) => {
    return String(parseFloat(((data) * 100).toFixed(2)))
  }


  useEffect(() => {
    if (actionData) {
      if (actionData?.data === "failure") {
        setAlert(actionData.failureReason)
        setTimeout(() => {
          setAlert("");
        }, 5000);

      }
      else {
        if (Number(actionData.data) <= 0.5) {
          setRecommendation("You are behind. Do not raise (unless you want to bluff, see the bluff page)")
          setOpponentRaise("Negative EV. N/A")
        }
        else {
          const opponentMaxRaise = maximumRaise(Number(actionData.pot), (1 - Number(actionData.data)))
          setRecommendation("You are ahead, maximum raise up to the threshold above")
          setOpponentRaise(String(roundNumberPercentange(opponentMaxRaise / 100)))

        }
        const result = parseFloat((Number(actionData.data) * 100).toFixed(2));
        setMyEquity(String(result) + "%")


      }
    }
  }, [actionData]);
  return(
    <div className="flex flex-col h-screen">
      <div className={"flex justify-center text-4xl font-bold text-red-500"}>{alert} </div>
      <div className="flex justify-center mt-6 text-xl ">
        <div className={"justify-center"}>
          <Form method="post">
            <label className={"font-bold"}> Opponent Position </label>
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
          </Form>
        </div>

      </div>


      <div className="flex flex-col justify-end flex-grow mb-2">
        <div>
          <div className="flex-grow"  />
          <div className="text-center text-xl font-bold mt-10 mb-4">
            <span className="text-blue-500">Your Cards: </span>
            <span className="text-black">{cards}</span>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4">
            <span className="text-red-500">Table Cards: </span>
            <span className="text-black">{actionData?.tableCards}</span>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4">
            <span className="text-green-500">Your Equity: </span>
            <span className="text-black">{myEquity}</span>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4">
            <span className="text-yellow-500">Maximum Value Bet Threshold: </span>
            <span className="text-black">{opponentRaise}</span>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4">
            <span className="text-indigo-500">Recommendation: </span>
            <span className={"text-black"}>{recommendation}</span>
          </div>
          <div className="flex justify-center space-x-4 mt-4 mb-4 w-full">
            {/* eslint-disable-next-line react/jsx-no-undef */}
            <Link to={`/?cards=${cards}&position=${position}`} className="inline-flex px-6 py-3 text-white bg-orange-400 rounded-lg shadow-lg hover:bg-orange-500 font-bold">
              Back
            </Link>
            <button onClick={() => window.location.reload()} className="inline-flex px-6 py-3 text-white bg-violet-400 rounded-lg shadow-lg hover:bg-violet-500 font-bold">
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}