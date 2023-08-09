import {Outlet} from "@remix-run/react";
import { Form } from "react-router-dom";
import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node";
import { z } from "zod";
import { validateActionInput } from "~/misc/validate";
import { typedjson, useTypedActionData, useTypedLoaderData } from "remix-typedjson";
import { useEffect, useState } from "react";

const schema = z.object({
  card1: z.string(),
  suit1: z.string(),
  card2: z.string(),
  suit2: z.string(),
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
  const card1 = formData.card1
  const card2 = formData.card2
  const suit1 = formData.suit1
  const suit2 = formData.suit2
  const position = formData.position
  const preflop = formData.preflop
  const flop = formData.flop
  const raise = formData.raise
  const bluff = formData.bluff
  const cards = card1 + suit1 + card2 + suit2
  if (card1 + suit1 === card2 + suit2) {
    return typedjson({error : "Duplicate Cards"})
  }
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
  useEffect(() => {
    if (actionData) {
      setAlert("You inputted duplicate cards!")
      setTimeout(() => {
        setAlert("");
      }, 3000);
    }
  }, [actionData]);
  const card1 = cards[0]
  const suit1 = cards[1]
  const card2 = cards[2]
  const suit2 = cards[3]

  return (
      <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
        <div className={"flex justify-center text-4xl font-bold text-red-500"}>{alert} </div>
        <div className="absolute top-0 left-0 w-full sm:pb-16 sm:pt-8 text-center text-4xl font-bold">
              Welcome to GTO Poker Helper!
            <div className="absolute top-10 left-0 w-full sm:pb-16 sm:pt-8 mt-2 flex items-center justify-center text-4xl font-bold" style={{pointerEvents : "none"}}>
              Input your cards to be provided optimal strategy:
            </div>
              <div className={"mt-12"}>
                <Form method="post">
                  <label className="font-bold text-xl text-blue-500">
                    Card 1
                  </label>
                  <select className="text-xl" name="card1" defaultValue={card1}>
                    {(() => {
                      const options = ["A", "2", "3", "4", "5", "6","7","8","9","T","J","Q","K"]
                      return options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ));
                    })()}
                  </select>

                  <div>
                    <label className="font-bold text-xl text-blue-500">
                      Suit 1
                    </label>
                    <select className={"text-xl"} name="suit1" defaultValue={suit1}>
                      <option>
                        s
                      </option>
                      <option>
                        c
                      </option>
                      <option>
                        d
                      </option>
                      <option>
                        h
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-xl text-green-500">
                      Card 2
                    </label>
                    <select className="text-xl" name="card2" defaultValue={card2}>
                      {(() => {
                        const options = ["A", "2", "3", "4", "5", "6","7","8","9", "T", "J","Q","K"]

                        return options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-xl text-green-500">
                      Suit 2
                    </label>
                    <select className={"text-xl"} name="suit2" defaultValue={suit2}>
                      <option>
                        s
                      </option>
                      <option>
                        c
                      </option>
                      <option>
                        d
                      </option>
                      <option>
                        h
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-xl text-orange-600">
                      Position
                    </label>
                    <select className={"text-xl"} name="position" defaultValue={position}>
                      <option>
                        EP
                      </option>
                      <option>MP
                      </option>
                      <option>
                        cutoff
                      </option>
                      <option>
                        LP
                      </option>
                    </select>

                  </div>

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
          </div>
          <Outlet/>
      </main>



  );
}
