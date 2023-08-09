import { ActionArgs, LoaderArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";


export async function loader({request} : LoaderArgs) {
  const url = new URL(request.url);
  const cards = url.searchParams.get("cards") ?? ""
  const position = url.searchParams.get("position") ?? ""
  const response = await fetch(`http://127.0.0.1:5000/open?cards=${cards}&position=${position}`)
  if (!response.ok) {
    throw new Error("error")
  }
  const data = await response.json()
  return typedjson({cards: cards, position: position, action: data.result})
}

export async function action({request} : ActionArgs) {
    return null;
}

export default function PreFlop() {
  const {cards, position, action} = useTypedLoaderData<typeof loader>()

    return(
      <div className="flex flex-col h-screen">
        <div className="flex justify-center mt-14 text-4xl">
          <span className="text-black-500 mr-2"> You should:  </span>
          <span className= {`${action === "Fold" ? "text-red-500" : "text-green-500"}`}>{ action}</span>

        </div>
        <div className="flex flex-col justify-end flex-grow mb-2">
          <div>
            <div className="flex-grow"  />
            <div className="text-center text-xl font-bold mt-10 mb-4">
              <span className="text-blue-500">Your Cards: </span>
              <span className="text-black">{cards}</span>
            </div>
            <div className="text-center text-xl font-bold mt-2 mb-4">
              <span className="text-green-500">Your Position: </span>
              <span className="text-black">{position}</span>
            </div>
            <div className="flex justify-center space-x-4 mt-4 mb-4 w-full">
              <Link to={`/?cards=${cards}&position=${position}`} className="inline-flex px-6 py-3 text-white bg-orange-400 rounded-lg shadow-lg hover:bg-orange-400 font-bold">
                Back
              </Link>
            </div>
          </div>
        </div>
      </div>

    )
}