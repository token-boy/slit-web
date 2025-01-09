import GameList from './_components/GameList'
import FilterBar from './_components/FilterBar'
import CreateGameButton from './_components/CreateGameButton'

const play = () => {
  return (
    <div className="px-5 py-8">
      <div className="flex-between mb-8">
        <h1 className="text-3xl font-bold">Game Hall</h1>
        <CreateGameButton />
      </div>
      <FilterBar />
      <GameList />
    </div>
  )
}

export default play
