import { NextPage } from 'next'

const GuidesPage: NextPage = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Slit Game Tutorial
        </h1>

        <div className="space-y-6">
          {/* Game Overview */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Game Overview</h2>
            <p className="text-gray-300 leading-relaxed">
              Welcome to <span className="font-bold">Slit</span>, an exciting
              card game where strategy meets chance! In this game, your assets
              are represented by chips, which are stored in a smart contract on
              the Solana blockchain. You can deposit and withdraw chips at any
              time using the exchange rate of{' '}
              <span className="font-bold">1 SOL = 1000 chips</span>.
            </p>
          </section>

          {/* Game Rules */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Game Rules</h2>

            {/* Starting the Game */}
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-2">1. Starting the Game</h3>
              <p className="text-gray-300 leading-relaxed">
                Each player starts by placing a minimum bet (called the{' '}
                <span className="font-bold">ante</span>) into the{' '}
                <span className="font-bold">chip pool</span>. The ante amount is
                set by the game creator. Players must also{' '}
                <span className="font-bold">stake</span> a certain number of
                chips to join the game. When leaving the game, players can{' '}
                <span className="font-bold">redeem</span> their remaining chips
                back to their accounts.
              </p>
            </div>

            {/* Dealing Cards */}
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-2">2. Dealing Cards</h3>
              <p className="text-gray-300 leading-relaxed">
                At the beginning of each round, every player is dealt{' '}
                <span className="font-bold">two cards</span> from a standard
                deck (Ace to King, where Ace = 1 and King = 13). For example, a
                player might receive the{' '}
                <span className="font-bold">2 of Hearts</span> and the{' '}
                <span className="font-bold">9 of Clubs</span>, corresponding to
                the numbers <span className="font-bold">2</span> and{' '}
                <span className="font-bold">9</span>.
              </p>
            </div>

            {/* Placing Bets */}
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-2">3. Placing Bets</h3>
              <p className="text-gray-300 leading-relaxed">
                When it’s your turn, you can choose to{' '}
                <span className="font-bold">bet</span> based on your hand. The
                size of your bet depends on the{' '}
                <span className="font-bold">quality of your hand</span>:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
                <li>
                  If the number of cards{' '}
                  <span className="font-bold">
                    between your two cards is large
                  </span>
                  , you have a higher chance of winning. For example, with the{' '}
                  <span className="font-bold">Ace of Spades (1)</span> and{' '}
                  <span className="font-bold">Jack of Hearts (11)</span>, there
                  are <span className="font-bold">9 cards</span> between them
                  (2, 3, 4, 5, 6, 7, 8, 9, 10). In this case, you can bet more.
                </li>
                <li>
                  If the number of cards{' '}
                  <span className="font-bold">
                    between your two cards is small
                  </span>
                  , you have a lower chance of winning. For example, with the{' '}
                  <span className="font-bold">6 of Spades</span> and{' '}
                  <span className="font-bold">8 of Hearts</span>, there is only{' '}
                  <span className="font-bold">1 card</span> between them (7). In
                  this case, you should bet less or not at all.
                </li>
                <li>
                  If there are{' '}
                  <span className="font-bold">
                    no cards between your two cards
                  </span>
                  , you <span className="font-bold">must fold</span> and cannot
                  bet.
                </li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-2">
                Your bet must be{' '}
                <span className="font-bold">at least the ante amount</span> if
                you choose to play.
              </p>
            </div>

            {/* Drawing a Card */}
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-2">4. Drawing a Card</h3>
              <p className="text-gray-300 leading-relaxed">
                After placing your bet, you draw the{' '}
                <span className="font-bold">top card</span> from the deck. If
                the drawn card’s number is{' '}
                <span className="font-bold">between your two cards</span>, you{' '}
                <span className="font-bold">win</span> and receive an amount
                equal to your bet from the chip pool. For example, if your hand
                is <span className="font-bold">2 and 9</span>, and you draw the{' '}
                <span className="font-bold">7 of Diamonds</span>, you win. If
                the drawn card’s number is{' '}
                <span className="font-bold">not between your two cards</span>,
                you <span className="font-bold">lose</span>, and your bet is
                added to the chip pool.
              </p>
            </div>

            {/* Chip Pool */}
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-2">5. Chip Pool</h3>
              <p className="text-gray-300 leading-relaxed">
                If the chip pool runs out of chips, all players must{' '}
                <span className="font-bold">replenish it</span> by placing the
                ante again.
              </p>
            </div>
          </section>

          {/* On-Chain Operations */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">On-Chain Operations</h2>

            {/* Depositing and Withdrawing Chips */}
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-2">
                1. Depositing and Withdrawing Chips
              </h3>
              <p className="text-gray-300 leading-relaxed">
                You can <span className="font-bold">deposit</span> SOL to
                receive chips or <span className="font-bold">withdraw</span>{' '}
                chips to receive SOL at any time. The exchange rate is{' '}
                <span className="font-bold">1 SOL = 1000 chips</span>. These
                transactions are completed on the Solana blockchain and require
                you to <span className="font-bold">sign the transaction</span>{' '}
                using your wallet.
              </p>
            </div>

            {/* Staking and Redeeming Chips */}
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-2">
                2. Staking and Redeeming Chips
              </h3>
              <p className="text-gray-300 leading-relaxed">
                To join the game, you must{' '}
                <span className="font-bold">stake</span> a certain number of
                chips. When you leave the game, you can{' '}
                <span className="font-bold">redeem</span> your remaining chips
                back to your account. Like deposits and withdrawals, these
                operations are completed on-chain and require your wallet
                signature.
              </p>
            </div>
          </section>

          {/* Playing on Mobile */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Playing on Mobile</h2>
            <p className="text-gray-300 leading-relaxed">
              If you’re playing on a mobile device, you can access the game
              through the in-app browsers of popular Solana wallets like{' '}
              <span className="font-bold">Phantom</span>,{' '}
              <span className="font-bold">Solflare</span>, or{' '}
              <span className="font-bold">Backpack</span>.
            </p>
          </section>

          {/* Key Points to Remember */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Key Points to Remember
            </h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>
                <span className="font-bold">
                  Deposits, withdrawals, staking, and redeeming
                </span>{' '}
                are completed on the Solana blockchain. The platform{' '}
                <span className="font-bold">
                  does not hold your private keys
                </span>
                , ensuring full control over your assets.
              </li>
              <li>
                All other operations (e.g., dealing cards, placing bets) are
                completed <span className="font-bold">off-chain</span> for a
                seamless gaming experience.
              </li>
              <li>
                <span className="font-bold">Bet wisely</span> based on the
                quality of your hand to maximize your chances of winning.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default GuidesPage
