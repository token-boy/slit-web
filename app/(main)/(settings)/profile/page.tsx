'use client'

import { NextPage } from 'next'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CDN_URL } from '@/lib/constants'
import { useEndpoint } from '@/lib/request'

import Upload from './_components/Upload'
import { toast } from '@/hooks/use-toast'

const ProfilePage: NextPage = () => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm({
    defaultValues: {
      avatarUrl: '',
      nickname: '',
    },
  })

  const { refresh: refreshProfile } = useEndpoint('v1/players/profile', {
    method: 'GET',
    manual: false,
    onSuccess(profile) {
      setValue('avatarUrl', `${CDN_URL}/${profile.avatarUrl}`)
      setValue('nickname', profile.nickname)
    },
  })

  const { runAsync: updateProfile, loading } = useEndpoint(
    'v1/players/profile',
    {
      method: 'PUT',
      onSuccess: () => {
        refreshProfile()
        toast({
          title: 'Success',
          description: 'Your profile has been updated',
          duration: 2000,
        })
      },
    }
  )

  return (
    <div className="flex flex-col">
      <div className="py-4">
        <Controller
          name="avatarUrl"
          control={control}
          rules={{ required: 'Avatar is required' }}
          render={({ field }) => <Upload {...field} />}
        />
        {errors.avatarUrl && (
          <p className="text-red-500">{errors.avatarUrl.message}</p>
        )}
      </div>
      <div className="py-4">
        <Label htmlFor="nickname" className="block mb-2">
          Nickname
        </Label>
        <Controller
          name="nickname"
          control={control}
          rules={{ required: 'Nickname is required' }}
          render={({ field }) => (
            <Input {...field} placeholder="Max 24 characters" />
          )}
        />
        {errors.nickname && (
          <p className="text-red-500">{errors.nickname.message}</p>
        )}
      </div>
      <Button
        type="submit"
        loading={loading}
        onClick={handleSubmit(updateProfile)}
      >Submit</Button>
    </div>
  )
}

export default ProfilePage
