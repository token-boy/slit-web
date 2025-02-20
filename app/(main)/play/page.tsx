'use client'

import { NextPage } from 'next'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import useSignAndSendTx from '@/hooks/use-sign-and-sign-tx'
import { CHIPS_RATE, SOL_DECIMALS } from '@/lib/constants'
import { useEndpoint } from '@/lib/request'

import CreateGameButton from './_components/CreateGameButton'
import GameCard from './_components/GameCard'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useBoolean } from 'ahooks'
import { toast } from '@/hooks/use-toast'
import { Controller, useForm } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

const PlayPage: NextPage = () => {
  const [chipsInputOpen, setChipsInputOpen] = useBoolean(false)
  const chipsInput = useRef<HTMLInputElement>(null)

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues: {
      minPlayers: '',
      limit: '',
    },
  })

  const { loading: tradeLoading, signAndSendTx } = useSignAndSendTx()

  const { loading: depositLoading, runAsync: deposit } = useEndpoint(
    'v1/chips',
    {
      method: 'POST',
    }
  )

  const [filterParams, setFilterParams] = useState({
    minPlayers: '0',
    limit: '0',
    page: 1,
  })

  const {
    data: { boards = [], total = 0 } = {},
    refresh,
    loading,
  } = useEndpoint('v1/boards', {
    method: 'GET',
    manual: false,
    params: filterParams,
  })
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="px-5 py-8">
      <div className="flex-between mb-8">
        <h1 className="text-3xl font-bold">Game Hall</h1>
        <div className="flex items-center">
          <Dialog open={chipsInputOpen} onOpenChange={setChipsInputOpen.toggle}>
            <DialogTrigger asChild>
              <Button className="mr-4">Deposit</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Input sols</DialogTitle>
              </DialogHeader>
              <p>1 SOL = {CHIPS_RATE} Chips</p>
              <Input ref={chipsInput} placeholder="min 0.001 sol" />
              <DialogFooter>
                <Button
                  loading={depositLoading || tradeLoading}
                  onClick={async () => {
                    const value = parseFloat(chipsInput.current!.value)
                    if (isNaN(value) || value < 0.001) {
                      toast({ title: 'Incorrect input' })
                      return
                    }
                    const { tx } = await deposit({
                      amount: (
                        BigInt(value * CHIPS_RATE) * SOL_DECIMALS
                      ).toString(),
                    })
                    await signAndSendTx(tx)
                    setChipsInputOpen.setFalse()
                  }}
                >
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <CreateGameButton onCreated={refresh} />
        </div>
      </div>

      {/* FilterBar */}
      <div className="flex justify-end w-full mb-8">
        <div className="mr-4">
          <Label htmlFor="minPlayers" className="text-white">
            Min players
          </Label>
          <Controller
            name="minPlayers"
            control={control}
            rules={{ validate: (value) => !value || parseInt(value) >= 0 }}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="All"
                className="bg-gray-800 text-white"
              />
            )}
          />
          {errors.minPlayers && <p className="text-red-500">Invalid value</p>}
        </div>
        <div className="mr-4">
          <Label htmlFor="limit" className="text-white">
            Limit
          </Label>
          <Controller
            name="limit"
            control={control}
            rules={{ validate: (value) => !value || parseInt(value) >= 0 }}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="All"
                className="bg-gray-800 text-white"
              />
            )}
          />
          {errors.limit && <p className="text-red-500">Invalid value</p>}
        </div>
        <Button
          type="submit"
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
          loading={loading}
          onClick={handleSubmit((formData) => {
            setFilterParams({
              minPlayers: formData.minPlayers,
              limit: (BigInt(formData.limit ?? '0') * SOL_DECIMALS).toString(),
              page: 1,
            })
          })}
        >
          Filter
        </Button>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {loading &&
            Array(10)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-[125px] w-[20vw] rounded-xl" />
              ))}

          {boards.map((board) => (
            <GameCard key={board.id} board={board} />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center space-x-2">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={filterParams.page === 1}
            onClick={() =>
              setFilterParams({ ...filterParams, page: filterParams.page - 1 })
            }
          >
            上一页
          </Button>
          <span className="py-2 px-4 bg-gray-800 text-white rounded">
            {filterParams.page} / {totalPages}
          </span>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={filterParams.page === totalPages}
            onClick={() =>
              setFilterParams({ ...filterParams, page: filterParams.page + 1 })
            }
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PlayPage
