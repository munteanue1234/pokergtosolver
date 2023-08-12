import {Outlet} from "@remix-run/react";
import { Form } from "react-router-dom";
import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node";
import { z } from "zod";
import { validateActionInput } from "~/misc/service/validate";
import { typedjson, useTypedActionData, useTypedLoaderData } from "remix-typedjson";
import React, { useEffect, useState } from "react";
import { CardPicker } from "~/misc/UI/cardUI";
import { cardToShorthand, convertToUnicode } from "~/misc/UI/cardProcessUtility";

const schema = z.object({
  card1: z.string().optional(),
  card2: z.string().optional(),
  position: z.string(),
  preflop: z.string().optional(),
  flop: z.string().optional(),
  raise: z.string().optional(),
  bluff: z.string().optional()

});
type ActionInput = z.TypeOf<typeof schema>;

export async function loader({request} : LoaderArgs ) {
  const url = new URL(request.url)
  const cards = url.searchParams.get("cards") ?? ""
  const position = url.searchParams.get("position") ?? ""
  return typedjson({cards : cards, position : position})
}

export async function action({request} : ActionArgs) {
  const { formData, errors } = await validateActionInput<ActionInput>({
    request,
    schema,
  });
  if (errors) {
    throw errors;
  }
  const card1Raw = formData.card1
  const card2Raw = formData.card2
  const position = formData.position
  const preflop = formData.preflop
  const flop = formData.flop
  const raise = formData.raise
  const bluff = formData.bluff
  if (!card1Raw || !card2Raw) {
    return typedjson({error : "Please input both your cards!"})
  }
  const card1 = cardToShorthand(card1Raw)
  const card2 = cardToShorthand(card2Raw)
  if (card1 === card2) {
    return typedjson({error : "Duplicate Cards"})
  }
  const cards = card1 + card2
  if (preflop) {
    return redirect(  `/preflop?cards=${cards}&position=${position}`)
  }
  else if (flop) {
    return redirect(`/call?cards=${cards}&position=${position}`)

  }
  else if (raise) {
    return redirect(`/raise?cards=${cards}&position=${position}`)

  }
  else if (bluff) {
    return redirect(`/bluff?cards=${cards}&position=${position}`)

  }

  return null;
}

export default function Index() {
  const {cards, position} = useTypedLoaderData<typeof loader>();
  const [alert, setAlert] = useState("")
  const actionData = useTypedActionData<typeof action>();
  const [pickedCardOne, setPickedCardOne] = useState<string>("");
  const [pickedCardTwo, setPickedCardTwo] = useState<string>("");
  const [selectedMap, setSelectedMap] = useState<Map<number, string>>(new Map());
  let defaultCard1 = ""
  let defaultCard2 = ""
  if (cards) {
    defaultCard1 = convertToUnicode(cards[0] + cards[1]) ?? ""
    defaultCard2 = convertToUnicode(cards[2] + cards[3]) ?? ""
  }
  const handlePick = (index : number, card : string) => {
    const newMap = new Map(selectedMap);
    newMap.set(index, card)
    setSelectedMap(newMap);
  };
  useEffect(() => {
    if (actionData) {
      if ("error" in actionData) {
        setAlert(String(actionData.error))
        setTimeout(() => {
          setAlert("");
        }, 3000);
      }
    }
  }, [actionData]);

  return (
      <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
        <div>
        </div>
        <div className={"flex justify-center text-4xl font-bold text-red-500"}>{alert} </div>
        <div className="absolute top-0 left-0 w-full sm:pb-16 sm:pt-8 text-center text-4xl font-bold">
              Welcome to GTO Poker Helper!
          <Form method={"post"}>
            <div className="absolute top-10 left-0 w-full sm:pb-16 sm:pt-8 mt-2 flex items-center justify-center text-4xl font-bold" style={{pointerEvents : "none"}}>
              Input your cards to be provided optimal strategy:
            </div>
          <div className="mt-8 mb-4 flex justify-center font-normal mr-24">
            <CardPicker style={{ fontSize: "10rem" }} onSelect={(card : any) =>  {
              setPickedCardOne(card);
              handlePick(0,card)
            }} selectedCards={selectedMap}
            defaultValue={defaultCard1}
          />

            <CardPicker style={{ fontSize: "10rem" }} onSelect={(card : any) =>  {
              setPickedCardTwo(card)
              handlePick(1, card)
            }} defaultValue={defaultCard2}
                        selectedCards={selectedMap}
            />
          </div>
            <div>
              <label className="font-bold text-xl text-blue-600">
                Position
              </label>
              <select className={"text-xl"} name="position" defaultValue={position}>
                <option>
                  EP
                </option>
                <option>
                  MP
                </option>
                <option>
                  cutoff
                </option>
                <option>
                  LP
                </option>
              </select>
            </div>
            <input type={"hidden"} name={"card1"} value={pickedCardOne || defaultCard1}/>
            <input type={"hidden"} name={"card2"} value={pickedCardTwo || defaultCard2}/>
            <div className="flex justify-center space-x-4 mt-10 w-full">
              <button type="submit" name="preflop" value="toPreflop" className="inline-flex px-6 py-3 text-white bg-blue-500 rounded-lg shadow-lg hover:bg-blue-600">
                Should I Open?
              </button>
              <button type="submit" name="flop" value="toFlop" className="inline-flex px-6 py-3 text-white bg-green-500 rounded-lg shadow-lg hover:bg-green-600">
                Should I Call?
              </button>
              <button type="submit" name="raise" value="toRaise" className="inline-flex px-6 py-3 text-white bg-red-500 rounded-lg shadow-lg hover:bg-red-600">
                Should I Raise?
              </button>
              <button type="submit" name="bluff" value="toBluff" className="inline-flex px-6 py-3 text-white bg-orange-500 rounded-lg shadow-lg hover:bg-orange-600">
                Should I Bluff?
              </button>
           </div>
          </Form>
          </div>
          <Outlet/>
      </main>



  );
}
