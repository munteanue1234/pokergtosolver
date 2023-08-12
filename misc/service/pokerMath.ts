export const potOdds = (raise : number, pot : number) => {
  const finalPot = pot + 2*raise
  return (raise / finalPot)
}

export const breakEven = (pot : number, raise : number) => {
  return (raise / (raise + pot))
}

export const roundNumberPercentange = (data : number) => {
  return String(parseFloat(((data) * 100).toFixed(2)))
}

export const calculateFoldEquity = (equity : string, foldProb : string) => {
  return Number(foldProb) * (1- Number(equity))
}