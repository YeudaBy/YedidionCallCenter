import {ColumnDef, createColumnHelper} from "@tanstack/table-core";
import {User} from "@/model/User";
import {DataTableColumnHeader} from "@/components/useres-table/DataTableColumnHeader";
import {Badge} from "@tremor/react";
import {DataTableRowActions} from "@/components/useres-table/DataTableRowActions";
import {Checkbox} from "@radix-ui/react-checkbox";

const columnHelper = createColumnHelper<User>()

export const columns = [
    columnHelper.display({
        id: "select",
        header: ({table}) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected()
                        ? true
                        : table.getIsSomeRowsSelected()
                            ? "indeterminate"
                            : false
                }
                onCheckedChange={() => table.toggleAllPageRowsSelected()}
                className="translate-y-0.5"
                aria-label="Select all"
            />
        ),
        cell: ({row}) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={() => row.toggleSelected()}
                className="translate-y-0.5"
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
            displayName: "Select",
        },
    }),
    columnHelper.accessor("name", {
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="שם"/>
        ),
        enableSorting: true,
        enableHiding: false,
        filterFn: "includesString",
        meta: {
            className: "text-right",
            displayName: "שם",
        },
    }),
    columnHelper.accessor("roles", {
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="תפקיד"/>
        ),
        enableSorting: true,
        meta: {
            className: "text-right",
            displayName: "תפקיד",
        },
        cell: ({row}) => {
            return (
                <Badge>
                    {row.getValue("roles")}
                </Badge>
            )
        },
    }),
    columnHelper.accessor("email", {
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="אימייל"/>
        ),
        enableSorting: false,
        meta: {
            className: "text-left",
            displayName: "אימייל",
        },
        filterFn: "includesString",
    }),
    columnHelper.accessor("district", {
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="מחוז"/>
        ),
        enableSorting: true,
        meta: {
            className: "text-left",
            displayName: "מחוז",
        }
    }),
    columnHelper.accessor("createdAt", {
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="נוצר בתאריך"/>
        ),
        enableSorting: false,
        meta: {
            className: "tabular-nums",
            displayName: "נוצר בתאריך",
        },
    }),
    columnHelper.display({
        id: "edit",
        header: "אפשרויות",
        enableSorting: false,
        enableHiding: false,
        meta: {
            className: "text-right",
            displayName: "אפשרויות",
        },
        cell: ({row}) => <DataTableRowActions row={row}/>,
    }),
] as ColumnDef<User>[]
