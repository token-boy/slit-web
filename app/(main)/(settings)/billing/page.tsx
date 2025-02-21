'use client'

import { NextPage } from 'next'

import { Button } from '@/components/ui/button'
import { useEndpoint } from '@/lib/request'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Controller, useForm } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { BillType } from '@/endpoints/bill'
import BillCard from './_components/BillCard'
import { Skeleton } from '@/components/ui/skeleton'

const BillingPage: NextPage = () => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      type: '',
      boardId: '',
    },
  })

  const [filterParams, setFilterParams] = useState({
    type: '-1',
    boardId: '',
    page: 1,
  })

  const {
    data: { bills = [], total = 0 } = {},
    refresh,
    loading,
  } = useEndpoint('v1/bills', {
    method: 'GET',
    manual: false,
    params: filterParams,
  })
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="px-5 py-8">
      {/* FilterBar */}
      <div className="flex justify-end w-full mb-8">
        <div className="mr-4 w-32">
          <Label htmlFor="type" className="text-white">
            Type
          </Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">All</SelectItem>
                  <SelectItem value={BillType.Deposit.toString()}>
                    {BillType[0]}
                  </SelectItem>
                  <SelectItem value={BillType.Withdraw.toString()}>
                    {BillType[1]}
                  </SelectItem>
                  <SelectItem value={BillType.Stake.toString()}>
                    {BillType[2]}
                  </SelectItem>
                  <SelectItem value={BillType.Redeem.toString()}>
                    {BillType[3]}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="mr-4">
          <Label htmlFor="boardId" className="text-white">
            Game Id
          </Label>
          <Controller
            name="boardId"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="All"
                className="bg-gray-800 text-white"
              />
            )}
          />
        </div>
        <Button
          type="submit"
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
          loading={loading}
          onClick={handleSubmit((formData) => {
            setFilterParams({
              ...formData,
              page: 1,
            })
          })}
        >
          Filter
        </Button>
      </div>

      <div>
        <div className="flex flex-col gap-1">
          {loading
            ? Array(10)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-[125px] w-full rounded-xl" />
                ))
            : bills.map((bill) => (
                <BillCard key={bill._id} bill={bill} onConfirm={refresh} />
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

export default BillingPage
