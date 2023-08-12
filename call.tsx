import { Link } from "@remix-run/react";
import { ActionArgs, LoaderArgs } from "@remix-run/node";
import { typedjson, useTypedActionData, useTypedLoaderData } from "remix-typedjson";
import { Form } from "react-router-dom";
import { z } from "zod";
import { validateActionInput } from "~/misc/service/validate";
import React, { useEffect, useState } from "react";
import { CardPicker } from "~/misc/UI/cardUI";
import { potOdds, roundNumberPercentange } from "~/misc/service/pokerMath";
import { processTableElements } from "~/misc/service/processUserInput";
import { convertToUnicode } from "~/misc/UI/cardProcessUtility";

const schema = z.object({
  raiser: z.string(),
  cards: z.string(),
  table: z.string(),
  custom : z.string(),
  raiseAmount : z.string(),
  currentPot : z.string()
});
type ActionInput = z.TypeOf<typeof schema>;

export async function loader({request} : LoaderArgs) {
  const url = new URL(request.url);
  const cards = url.searchParams.get("cards") ?? ""
  const position = url.searchParams.get("position") ?? ""
  return typedjson({cards: cards, position: position})

}

export async function action({request} : ActionArgs) {
  const { formData, errors } = await validateActionInput<ActionInput>({
    request,
    schema,
  });
  if (errors) {
    throw errors;
  }
  return processTableElements(formData)
}

export default function Call() {
  const [alert, setAlert] = useState("")
  const [requiredEquity, setRequiredEquity] = useState("")
  const [myEquity, setMyEquity] = useState("")
  const [recommendation, setRecommendation] = useState("")
  const [selectedCards, setSelectedCards] = useState(Array<string>(5).fill(""));
  const [callFlag, setCallFlag] = useState(false)
  const {cards, position} = useTypedLoaderData<typeof loader>();
  const card1_unicode = convertToUnicode(cards[0] + cards[1]) ?? ""
  const card2_unicode = convertToUnicode(cards[2] + cards[3]) ?? ""
  const [selectedMap, setSelectedMap] = useState<Map<number, string>>(new Map([[
    -1, card1_unicode],
  [-2, card2_unicode]]));
  const actionData = useTypedActionData<typeof action>();
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
    if (actionData?.data === "failure") {
      setAlert(actionData.failureReason)
      setTimeout(() => {
        setAlert("");
      }, 5000);
      setRecommendation("Invalid Input")
      setCallFlag(false)

    }
    //round before returning
    else {
      const requiredEquity = potOdds(Number(actionData.raise), Number(actionData.pot))
      setRequiredEquity((roundNumberPercentange(requiredEquity) + "%"))
      const equity = Number(actionData.data)
      setMyEquity(roundNumberPercentange(equity) + "%")

      if (equity >= requiredEquity) {
        setRecommendation("You should call")
        setCallFlag(true)
      }
      else {
        setRecommendation("Fold to be profitable in the long run")
        setCallFlag(false)
      }
    }
    }
    }, [actionData]);
  return(
  <div className="flex flex-col h-screen">
    <div className={"flex justify-center text-4xl font-bold text-red-500"}>{alert} </div>
    <div className="flex justify-center mt-6 text-xl ">
        <div className={"flex justify-center"}>
          <Form method="post">
            <label className={"flex justify-center"}> Input Raiser Position </label>
          <div className={"font-bold text-red-500 mt-4 flex justify-center"}>
            OR
          </div>
          <div className={"mt-4 flex justify-center"}>
            Input a custom range/hand:
          </div>
            <div className={"mt-4 flex justify-center"}>
              <select className={"mt-4 mr-4 flex justify-center font-bold"} name="raiser" >
                <option> N/A </option>
                <option> EP </option>
                <option> MP </option>
                <option> cutoff </option>
                <option> LP </option>
              </select>
            <input
            type="text"
            className="mt-4 border-2 border-black rounded flex justify-center"
            name={"custom"}
            placeholder="QQ+, AKo+, AJs+, KdJd"
            style={{ width: '230px' }}
            >

            </input>
            </div>
            <div className={"mt-6 flex justify-center"}>
              Input all available table cards:
            </div>
            <div className="flex font-normal mr-20">
                {selectedCards.map((val : string, index : number) => (
                  <CardPicker
                    key={index}
                    style={{ fontSize: "8rem" }}
                    onSelect={(card : string) => {handleCardSelect(index, card)}}
                    selectedCards={selectedMap}
                  />
                ))}
            </div>
            <div className="mt-4 flex justify-center" >
              Input Raise Amount:
            </div>
            <div className={"mt-4 flex justify-center"}>
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
            </div>
            <div className={"mt-4 flex justify-center"}>
              Input Current Pot:
            </div>
            <div className={"mt-2 flex justify-center"}>
            <input name="currentPot" className="mt-2 border-2 border-black rounded" type="text" onKeyDown={(e) => {
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
            <input type={"hidden"} name="table" value={selectedCards}/>
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
            <span className="text-yellow-500">Equity Required to Call: </span>
            <span className="text-black">{requiredEquity}</span>
          </div>
          <div className="text-center text-xl font-bold mt-2 mb-4">
            <span className="text-indigo-500">Recommended Action: </span>
            <span className={callFlag ? "text-green-500" : "text-red-500"}>{recommendation}</span>
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
      </div>
    </div>
  )
}