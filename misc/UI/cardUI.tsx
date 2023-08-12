
import React, { CSSProperties, useState } from "react";
import { card_mapping, CardRank } from "~/misc/UI/cardProcessUtility";


interface CardPickerProps {
  onSelect: (card: string) => void;
  defaultValue?: string;
  style?: CSSProperties;
  selectedCards: Map<number, string>;
}

export const CardPicker: React.FC<CardPickerProps> = ({ onSelect, defaultValue, style, selectedCards }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(defaultValue ||  "🂠");
  const cardOrder: CardRank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
  const cards = ["🂠", ...cardOrder.flatMap(rank => Object.values(card_mapping[rank]))];
  const getCardColor = (card: string) => {
    if([
      "🃑" ,"🃞" ,"🃝" ,"🃛" ,"🃚" ,"🃙" ,"🃘" ,"🃗" ,"🃖" ,"🃕" ,"🃔" ,"🃓", "🃒", "🂡" ,"🂮" ,"🂭" ,"🂫" ,"🂪" ,"🂩" ,"🂨" ,"🂧" ,"🂦" ,"🂥" ,"🂤" ,"🂣" ,'🂢',"🂠"
  ].includes(card)) {
      return "text-black";
    } else {
      return "text-red-500";
    }
  };
  const disabledCards = Array.from(selectedCards.values());
  return (
    <>
      <div className="flex items-center justify-center h-full"> {/* This is the wrapper */}
        <div onClick={() => setIsModalOpen(true)}      style={style}
             className={`w-1/6 h-1/6 cursor-pointer mb-10 mt-10 p-5 rounded hover:scale-110 transform transition ${getCardColor(selectedCard)}`}>
          {selectedCard}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-30 rounded-lg shadow-2xl max-w-6xl text-center">
            {cards.map((card, index) => (
              <span
                key={index}
                className={`
              cursor-pointer 
              text-9xl 
              m-5 
              hover:scale-110 
              transform 
              transition 
              ${getCardColor(card)}
              ${disabledCards.includes(card) && card != "🂠" && card != selectedCard ? 'text-gray-400 cursor-not-allowed' : ''}
            `} onClick={() => {
              if (!disabledCards.includes(card) || card === "🂠" || card === selectedCard) {
                setSelectedCard(card);
                onSelect(card);
                setIsModalOpen(false);
              }
            }}>
                        {card}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
};