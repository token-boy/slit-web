'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bill, BillType } from '@/endpoints/bill'
import useSignAndSendTx from '@/hooks/use-sign-and-sign-tx'
import { toast } from '@/hooks/use-toast'
import { uiAmount } from '@/lib/game'
import { useEndpoint } from '@/lib/request'
import { motion } from 'framer-motion'
import { CheckCheck, Copy } from 'lucide-react'
import Link from 'next/link'

function getTxUrl(signature: string) {
  const url = new URL(process.env.NEXT_PUBLIC_SOLANA_EXPLORER!)
  url.pathname = `/tx/${signature}`
  return url.toString()
}

const BillCard: React.FC<{ bill: Bill; onConfirm: () => void }> = ({
  bill,
  onConfirm,
}) => {
  const { loading: tradeLoading, signAndSendTx } = useSignAndSendTx(onConfirm)

  const { run: redeem, loading: redeemLoading } = useEndpoint(
    'v1/game/:boardId/redeem',
    {
      method: 'POST',
      onSuccess({ tx }) {
        signAndSendTx(tx)
      },
    }
  )

  return (
    <motion.div
      initial={{ scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      className="w-full lg:w-auto"
    >
      <Card className="bg-gray-800 text-white mb-8 cursor-pointer">
        <CardHeader>
          <CardTitle>Bill #{bill._id}</CardTitle>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-2 gap-2">
          <span>Type: {BillType[bill.type]} </span>
          <span>Amount: {uiAmount(BigInt(bill.amount))} </span>
          {(bill.type === BillType.Stake || bill.type === BillType.Redeem) && (
            <span className="flex items-center gap-1">
              Game:
              <Link
                href={`/game/${bill.boardId}`}
                className="underline hover:text-sky-500"
              >
                {bill.boardId?.slice(0, 6)}...{bill.boardId?.slice(-6)}
              </Link>
              <Copy
                size={14}
                onClick={() => {
                  navigator.clipboard.writeText(bill.boardId!).then(() => {
                    toast({
                      title: 'Copied',
                      description: 'Game ID copied to clipboard',
                      duration: 2000,
                    })
                  })
                }}
              />
            </span>
          )}
          <span>Date: {new Date(bill.createdAt).toLocaleString()} </span>
          {bill.confirmed ? (
            <span className="flex items-center">
              <CheckCheck color="green" />
              <span className="ml-1 mr-2 text-green-500">Confirmed</span>
              {bill.signature && (
                <Link
                  href={getTxUrl(bill.signature)}
                  target="_blank"
                  className="underline hover:text-sky-500"
                >
                  Tx
                </Link>
              )}
            </span>
          ) : (
            <Button
              className="w-24"
              loading={redeemLoading || tradeLoading}
              onClick={() => {
                redeem({ seatKey: bill.seatKey! }, { boardId: bill.boardId! })
              }}
            >
              Trade
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default BillCard
