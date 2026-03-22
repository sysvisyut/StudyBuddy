import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
function TopicInput({ setTopic, setDifficulty }) {
  return (
    <div className='mt-20 w-full flex flex-col gap-16 max-w-4xl mx-auto'>
      <div className='flex flex-col gap-6'>
        <h2 className='text-2xl font-black uppercase tracking-tight text-white'>Enter Your Topic</h2>
        <p className='text-slate-400 text-lg'>What do you want to master today? Provide a topic or paste your notes below.</p>
        <Textarea
          placeholder="e.g. Quantum Physics, History of Civilizations..."
          className='w-full h-48 rounded-3xl border-white/10 bg-white/5 focus:border-white/30 focus:bg-white/10 transition-all p-8 text-xl text-white placeholder:text-slate-600 resize-none shadow-2xl'
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>

      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-2'>
          <h2 className='text-2xl font-black uppercase tracking-tight text-white'>Set Difficulty</h2>
          <p className='text-slate-400 text-lg'>Choose the level of challenge that fits your current knowledge.</p>
        </div>
        <Select onValueChange={(v) => setDifficulty(v)}>
          <SelectTrigger className="w-full md:w-[300px] h-16 rounded-full border-white/10 bg-white/5 text-white text-lg px-8 hover:bg-white/10 transition-all">
            <SelectValue placeholder="Select Level" />
          </SelectTrigger>
          <SelectContent className='rounded-3xl border-white/10 bg-zinc-900 text-white shadow-2xl p-2'>
            <SelectGroup>
              <SelectItem value="Easy" className='rounded-2xl cursor-pointer py-4 px-6 text-lg focus:bg-white focus:text-black'>Easy</SelectItem>
              <SelectItem value="Medium" className='rounded-2xl cursor-pointer py-4 px-6 text-lg focus:bg-white focus:text-black'>Medium</SelectItem>
              <SelectItem value="Hard" className='rounded-2xl cursor-pointer py-4 px-6 text-lg focus:bg-white focus:text-black'>Hard</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default TopicInput