'use client'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useContext } from 'react'
import { AccountContext } from '@/lib/providers'
import WalletConnector from '@/components/WalletConnector'
import { useEndpoint } from '@/lib/request'
import { useBoolean } from 'ahooks'
import useSignAndSendTx from '@/hooks/use-sign-and-sign-tx'

const CreateGameButton: React.FC<{ onCreated: VoidFunction }> = (props) => {
  const { account } = useContext(AccountContext)

  const [open, setOpen] = useBoolean(false)

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues: {
      minChips: '',
    },
  })

  const { loading: sendTxLoading, signAndSendTx } = useSignAndSendTx(() => {
    setOpen.setFalse()
    props.onCreated()
  })

  const { loading: createGameLoading, run: createGame } = useEndpoint(
    'v1/boards',
    {
      method: 'POST',
      async onSuccess(data) {
        signAndSendTx(data.tx)
      },
    }
  )

  const button = (
    <Button className="bg-green-600 hover:bg-green-700 text-white">
      <PlusCircle className="h-4 w-4" />
      Create
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen.toggle}>
      <DialogTrigger asChild>
        {account ? button : <WalletConnector>{button}</WalletConnector>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new game</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="minChips" className="block mb-2">
            Min chips
          </Label>
          <Controller
            name="minChips"
            control={control}
            rules={{ required: 'Min chips is required' }}
            render={({ field }) => <Input {...field} placeholder="Min chips" />}
          />
          {errors.minChips && (
            <p className="text-red-500">{errors.minChips.message}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="submit"
            loading={createGameLoading || sendTxLoading}
            onClick={handleSubmit((data) => {
              createGame({ minChips: parseInt(data.minChips) })
            })}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateGameButton
