"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function FilterBar() {
  return (
    <div className="flex justify-end w-full mb-8">
      <div className="mr-4">
        <Label htmlFor="players" className="text-white">Min players</Label>
        <Input id="players" name="players" placeholder="All" className="bg-gray-800 text-white" />
      </div>
      <div className="mr-4">
        <Label htmlFor="potSize" className="text-white">Min chips</Label>
        <Input id="potSize" name="potSize" placeholder="All" className="bg-gray-800 text-white" />
      </div>
      <Button type="submit" className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">Filter</Button>
    </div>
  )
}
