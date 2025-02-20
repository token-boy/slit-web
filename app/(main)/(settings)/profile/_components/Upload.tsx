'use client'

import { useRef, useState } from 'react'
import { CloudUpload, LoaderIcon } from 'lucide-react'
import Image from 'next/image'

import { encode } from '@/lib/webp'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

const MAX_SIZE = 365 * 1024

const supportedTypes = ['image/jpeg', 'image/png', 'image/webp']

const Upload: React.FC<{
  value?: string
  onChange: (data: string) => void
}> = ({ value, onChange }) => {
  const ref = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState<boolean>()

  const processFile = async (file: File) => {
    const reader = new FileReader()

    reader.readAsDataURL(file)
    reader.onload = async () => {
      try {
        setIsLoading(true)

        if (!supportedTypes.includes(file.type)) {
          toast({ title: 'Unsupported file type' })
          return
        }

        const img = document.createElement('img')
        img.src = reader.result as string
        await new Promise((resolve) => (img.onload = resolve))
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const rawImageData = ctx.getImageData(0, 0, img.width, img.height)

        const webpBuffer = await encode(rawImageData)
        if (webpBuffer.byteLength > MAX_SIZE) {
          toast({ title: 'The compressed size of the image exceed 365kb' })
          return
        }

        const uint8Array = new Uint8Array(webpBuffer)
        const base64String = btoa(
          String.fromCharCode.apply(null, Array.from(uint8Array))
        )
        onChange(`data:image/webp;base64,${base64String}`)
      } catch (error: any) {
        toast({ title: error.message })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="inline-flex items-center gap-6">
      <input
        type="file"
        ref={ref}
        style={{ display: 'none' }}
        accept="image/jpeg, image/png, image/webp"
        onChange={(e) => {
          processFile(e.target.files![0])
        }}
      />
      <div
        className="relative cursor-pointer w-[100px] h-[100px] flex-shrink-0"
        onClick={() => {
          if (isLoading) return
          ref.current?.click()
        }}
      >
        {value && (
          <Image
            src={value}
            alt=""
            width={100}
            height={100}
            className="rounded-full"
          />
        )}
        <Button className="absolute right-0 bottom-0 bg-gray-800 text-white size-6 px-5 py-2 hover:bg-gray-700">
          {isLoading ? <LoaderIcon size={14} /> : <CloudUpload size={14} />}
        </Button>
      </div>
      <div className="flex flex-col">
        <p>Support .jpg, .png, .webp</p>
        <p className="text-xs text-gray-400">
          The compressed size of the image should be less than 365kb
        </p>
      </div>
    </div>
  )
}

export default Upload
