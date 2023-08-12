import { cardToShorthand } from "~/misc/UI/cardProcessUtility";
import { typedjson } from "remix-typedjson";
type ActionType = {
  table: string;
  custom: string;
  cards: string;
  raiser: string;
  raiseAmount?: string;
  currentPot: string;
};

export function processTableCards(table : string, cards : string) {
  let tableFilter = ""
  let tableCards = new Set<string>([cards[0] + cards[1], cards[2] + cards[3]])
  for (const card of table) {
    if (card != ",") {
      const stringCard = cardToShorthand(card)
      if (tableCards.has(stringCard)) {
        return null
      }
      tableCards.add(stringCard)
      tableFilter += stringCard + ", "
    }
  }
  return tableFilter

}
export async function processTableElements(formData : ActionType) {
  const raised = formData.raiser;
  const cards = formData.cards
  const custom = formData.custom
  const raiseAmount = formData.raiseAmount
  const currentPot = formData.currentPot
  const table = formData.table
  const tableFilter = processTableCards(table, cards)
  if (!tableFilter) {
    return typedjson({data : "failure" ,failureReason : "You inputted duplicate cards", raise : null, pot : null, tableCards : null})
  }
  let response;
  const customEncoded = encodeURIComponent(custom)
  if (custom) {
    response = await fetch(`http://127.0.0.1:5000/call?cards=${cards}&position=${raised}&table=${tableFilter}&range=${customEncoded}`)
  }
  else {
    response = await fetch(`http://127.0.0.1:5000/call?cards=${cards}&position=${raised}&table=${tableFilter}`)
  }
  if (!response.ok) {
    throw new Error("error")  //should not ever get here.
  }
  const data = await response.json()
  return typedjson({tableCards : tableFilter, data : data.result, failureReason: data.reason, raise: raiseAmount, pot : currentPot})
}