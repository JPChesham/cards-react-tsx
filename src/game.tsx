import { useState } from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from "./types";

//UI Elements
const CardBackImage = () => (
  <img src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
    />
  );
};

//Setup
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been give theirs
    turn: "player_turn",
  };
};

const getCardRankValue = (rank: CardRank, acc?: number): number => {
  // if (acc && acc < 10 && rank === CardRank.Ace) return 11;
  switch (rank) {
    case CardRank.Ace:
      return 1;
    case CardRank.Jack:
    case CardRank.Queen:
    case CardRank.King:
      return 10;
    default:
      return parseInt(rank);
  }
};

//Scoring
const calculateHandScore = (hand: Hand): number => {
  const sortedHand = hand.sort(
    (a, b) => getCardRankValue(b.rank) - getCardRankValue(a.rank)
  );

  let currentScore = sortedHand.reduce(
    (acc, _card) => getCardRankValue(_card.rank, acc) + acc,
    0
  );

  let countedAces = sortedHand.filter((_card) => _card.rank === CardRank.Ace);

  for (const _ace of countedAces) {
    if (currentScore >= 21) return currentScore;
    if (currentScore <= 11) currentScore += 10;
  }

  return currentScore;
};

const isHandBlackJack = (hand: Hand): Boolean => {
  if (hand.length !== 2) return false;

  if (
    hand.some((_card: Card) => _card.rank === CardRank.King) &&
    hand.some((_card: Card) => _card.rank === CardRank.Ace)
  ) {
    return true;
  }

  return false;
};

const determineGameResult = (state: GameState): GameResult => {
  const { dealerHand, playerHand } = state;

  const dealerScore = calculateHandScore(dealerHand),
    isDealerHandBlackJack = isHandBlackJack(dealerHand);

  if (dealerScore > 21) return "player_win";

  const playerScore = calculateHandScore(playerHand),
    isPlayerHandBlackJack = isHandBlackJack(dealerHand);

  if (playerScore > 21) return "dealer_win";

  if (playerScore > dealerScore) return "player_win";
  else if (dealerScore > playerScore) return "dealer_win";
  else if (dealerScore === playerScore) {
    if (isDealerHandBlackJack && isPlayerHandBlackJack) return "draw";
    if (playerScore === 21 && dealerScore === 21) return "player_win";
    return "draw";
  }

  return "no_result";
};

//Player Actions
const playerStands = (state: GameState): GameState => {
  const { dealerHand, cardDeck } = state;

  if (calculateHandScore(dealerHand) >= 17)
    return {
      ...state,
      turn: "dealer_turn",
    };

  const { card, remaining } = takeCard(cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    dealerHand: [...dealerHand, card],
    turn: "dealer_turn",
  };
};

const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
  };
};
//UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());

  return (
    <>
      <div>
        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerHits)}
        >
          Hit
        </button>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerStands)}
        >
          Stand
        </button>
        <button onClick={(): void => setState(setupGame())}>Reset</button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score {calculateHandScore(state.playerHand)}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === "player_turn" && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score {calculateHandScore(state.dealerHand)}</p>
        </div>
      )}
      {state.turn === "dealer_turn" &&
      determineGameResult(state) != "no_result" ? (
        <p>{determineGameResult(state)}</p>
      ) : (
        <p>{state.turn}</p>
      )}
    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};
