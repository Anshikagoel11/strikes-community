"use client"
import { Plus } from 'lucide-react'
import ActionTooltip from '../action-tooltip'
import { useModal } from '@/hooks/use-mode-store'

const NavigationAction = () => {
    const { onOpen } = useModal()

    return (
        <ActionTooltip label='Add a server' side='right' align='center'>
            <button
                onClick={() => onOpen("createServer")}
                className='group flex items-center'
                aria-label="Add a server"
            >
                <div className='flex h-12 w-12 rounded-[24px] group-hover:rounded-xl transition-all overflow-hidden items-center justify-center bg-neutral-600 group-hover:bg-emerald-500 active:scale-95'>
                    <Plus className='group-hover:text-white transition text-emerald-500' size={25} />
                </div>
            </button>
        </ActionTooltip>
    )
}

export default NavigationAction