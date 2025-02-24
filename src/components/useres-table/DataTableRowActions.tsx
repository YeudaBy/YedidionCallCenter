"use client"

import {RiMoreFill} from "@remixicon/react"
import {Row} from "@tanstack/react-table"
import {Button, ListItem} from "@tremor/react"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/Popover";


interface DataTableRowActionsProps<TData> {
    row: Row<TData>
}

export function DataTableRowActions<
    TData,
>({}: DataTableRowActionsProps<TData>) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="light"
                    className="group aspect-square p-1.5 hover:border hover:border-gray-300 data-[state=open]:border-gray-300 data-[state=open]:bg-gray-50 hover:dark:border-gray-700 data-[state=open]:dark:border-gray-700 data-[state=open]:dark:bg-gray-900"
                >
                    <RiMoreFill
                        className="size-4 shrink-0 text-gray-500 group-hover:text-gray-700 group-data-[state=open]:text-gray-700 group-hover:dark:text-gray-300 group-data-[state=open]:dark:text-gray-300"
                        aria-hidden="true"
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="min-w-40">
                <ListItem>Add</ListItem>
                <ListItem>Edit</ListItem>
                <ListItem className="text-red-600 dark:text-red-500">
                    Delete
                </ListItem>
            </PopoverContent>
        </Popover>
    )
}
