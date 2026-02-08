import {remult, repo} from "remult";
import {Procedure} from "@/model/Procedure";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {User, UserRole} from "@/model/User";
import {RoleGuard} from "@/components/auth/RoleGuard";
import {
    Badge,
    Button,
    Card,
    Flex,
    Select,
    SelectItem,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
    Text,
    TextInput,
    Title
} from "@tremor/react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    RowSelectionState,
    SortingState,
    useReactTable
} from "@tanstack/react-table";
import {ColumnDef} from "@tanstack/table-core";
import {CheckIcon, PencilIcon, XIcon} from "@heroicons/react/solid";
import {useAutoAnimate} from "@formkit/auto-animate/react";
import {cx} from "@/utils/ui";
import {RiArrowDownSLine, RiArrowUpSLine} from "@remixicon/react";


const procedureRepo = repo(Procedure);

interface Filters {
    title: string;
    active: boolean | null;
    createdAt: string;
    keywords: string[];
}

export default function ManageProcedures() {
    const [procedures, setProcedures] = useState<Procedure[]>([])

    useEffect(() => {
        if (!User.isSuperAdmin(remult)) {
            return;
        }
        loadProcedures();
    }, []);

    const loadProcedures = async () => {
        const loaded = await procedureRepo.find();
        setProcedures(loaded);
    };

    const handleUpdate = async (updated: Procedure) => {
        await procedureRepo.save(updated);
        await loadProcedures();
    };

    const handleDeleteMany = async (deleted: Procedure[]) => {
        for (const procedure of deleted) {
            await procedureRepo.delete(procedure.id);
        }
        await loadProcedures();
    }

    return (
        <RoleGuard allowedRoles={[UserRole.SuperAdmin]}>
            <Title className="text-center">
                נהלים במערכת ({procedures.length})
            </Title>
            <div className="mt-4 sm:mt-6 lg:mt-10">
                <ProcedureManagementTable
                    procedures={procedures}
                    onUpdate={handleUpdate}
                    onDeleteMany={handleDeleteMany}
                />
            </div>
        </RoleGuard>
    );
}


interface ProcedureManagementTableProps {
    procedures: Procedure[];
    onDeleteMany: (procedures: Procedure[]) => Promise<void>;
    onUpdate: (procedures: Procedure) => Promise<void>;
}

const columnHelper = createColumnHelper<Procedure>();

const ProcedureManagementTable: React.FC<ProcedureManagementTableProps> = ({procedures, onUpdate, onDeleteMany}) => {
        const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
        const [sorting, setSorting] = useState<SortingState>([]);
        const [editingId, setEditingId] = useState<string | null>(null);
        const [editingValues, setEditingValues] = useState<Partial<Procedure>>({});
        const [filters, setFilters] = useState<Filters>({
            title: '',
            active: true,
            createdAt: '',
            keywords: [],
        });


        const handleEdit = (procedure: Procedure) => {
            setEditingId(procedure.id);
            setEditingValues(procedure);
        };

        const handleSave = useCallback((async (procedure: Procedure) => {
            await onUpdate({...procedure, ...editingValues} as Procedure);
            setEditingId(null);
            setEditingValues({});
        }), [editingValues, onUpdate])

        const filtered = useMemo(() => {
            return procedures.filter(proc => {
                return (
                    proc.title.toLowerCase().includes(filters.title.toLowerCase()) &&
                    (filters.active === null || proc.active === filters.active) &&
                    (filters.createdAt === '' || proc.createdAt.toISOString().startsWith(filters.createdAt)) &&
                    (filters.keywords.length === 0 || filters.keywords.every(k => proc.keywords.includes(k)))
                );
            });
        }, [procedures, filters]);

        const columns = useMemo<ColumnDef<Procedure, any>[]>(
                () => [
                    columnHelper.display({
                        id: 'select',
                        header: ({table}) => (
                            <input
                                type="checkbox"
                                checked={table.getIsAllRowsSelected()}
                                onChange={table.getToggleAllRowsSelectedHandler()}
                                className="w-4 h-4 cursor-pointer"
                            />
                        ),
                        cell: ({row}) => (
                            <input
                                type="checkbox"
                                checked={row.getIsSelected()}
                                onChange={row.getToggleSelectedHandler()}
                                className="w-4 h-4 cursor-pointer"
                            />
                        ),
                        size: 40,
                    }),
                    columnHelper.accessor('title', {
                        header: 'כותרת',
                        cell: ({row}) => {
                            const proc = row.original;
                            return editingId === proc.id ? (
                                <TextInput
                                    value={editingValues.title || proc.title}
                                    onChange={(e) => setEditingValues({...editingValues, title: e.target.value})}
                                />
                            ) : <Text className={"text-right"}>{proc.title}</Text>;
                        },
                    }),
                    columnHelper.accessor('active', {
                        header: 'פעיל',
                        cell: ({row}) => {
                            const user = row.original;
                            return editingId === user.id ? (
                                <Switch
                                    checked={editingValues.active}
                                    onChange={(value) => setEditingValues({...editingValues, active: value})}
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    {user.active ? (
                                        <CheckIcon className="w-5 h-5 text-green-500"/>
                                    ) : (
                                        <XIcon className="w-5 h-5 text-red-500"/>
                                    )}
                                </div>
                            );
                        },
                    }),
                    columnHelper.accessor('createdAt', {
                        header: 'נוצר ב',
                        cell: ({row}) => {
                            const proc = row.original;
                            return new Date(proc.createdAt).toLocaleDateString();
                        },
                    }),
                    columnHelper.accessor('keywords', {
                        header: 'מילות מפתח',
                        cell: ({row}) => {
                            const proc = row.original;
                            return editingId === proc.id ? (
                                <TextInput
                                    value={editingValues.keywords?.join(', ') || proc.keywords.join(', ')}
                                    onChange={(e) => setEditingValues({
                                        ...editingValues,
                                        keywords: e.target.value.split(',').map(k => k.trim())
                                    })}
                                />
                            ) : (
                                <Flex flexDirection={"col"} className={"gap-1"}>
                                    {proc.keywords.map((kw, idx) => (
                                        <Badge key={idx} size="xs">
                                            {kw}
                                        </Badge>
                                    ))}
                                </Flex>
                            );
                        },
                    }),
                    columnHelper.display({
                        id: 'actions',
                        cell: ({row}) => {
                            const user = row.original;
                            return editingId === user.id ? (
                                <Button
                                    size="xs"
                                    variant="secondary"
                                    onClick={() => handleSave(user)}
                                    icon={CheckIcon}
                                />
                            ) : (
                                <Button
                                    size="xs"
                                    variant="light"
                                    onClick={() => handleEdit(user)}
                                    icon={PencilIcon}
                                />
                            );
                        },
                    }),
                ],
                [editingId, editingValues, handleSave]
            )
        ;

        const table = useReactTable({
            data: filtered,
            columns,
            state: {
                rowSelection,
                sorting,
            },
            enableRowSelection: true,
            onRowSelectionChange: setRowSelection,
            onSortingChange: setSorting,
            getCoreRowModel: getCoreRowModel(),
            getSortedRowModel: getSortedRowModel(),
            getFilteredRowModel: getFilteredRowModel(),
        });

        const [fRef] = useAutoAnimate()
        const [showFilters, setShowFilters] = useState(false)

        return (
            <>
                {/* Filters */}
                <Card ref={fRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 w-[95%] mx-auto">
                    <Button className={"h-fit"} size={"xs"}
                            variant={"secondary"} onClick={() => setShowFilters(prevState => !prevState)}>
                        הצג מסננים
                    </Button>
                    {showFilters && <>
                        <TextInput
                            placeholder="חיפוש לפי כותרת"
                            value={filters.title}
                            onChange={(e) => setFilters({...filters, title: e.target.value})}
                        />
                        <Select
                            placeholder="סינון לפי סטטוס"
                            value={filters.active === null ? "" : filters.active ? "פעיל" : "לא פעיל"}
                            onValueChange={(value) => setFilters({
                                ...filters,
                                active: value === "" ? null : value === "פעיל"
                            })}
                        >
                            <SelectItem value="">הכל</SelectItem>
                            <SelectItem value="true">פעיל</SelectItem>
                            <SelectItem value="false">לא פעיל</SelectItem>
                        </Select>
                    </>}
                </Card>

                <div className={"grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1 p-1"}>
                    <TextInput
                        placeholder=" כותרת"
                        value={filters.title}
                        // className={'w-fit'}
                        onChange={(e) => setFilters({...filters, title: e.target.value})}
                    />
                </div>

                {/* Table */}
                <Table className={"mx-1.5 bg-tremor-background rounded-tremor-default"}>
                    <TableHead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-y border-gray-200 dark:border-gray-800">
                                {headerGroup.headers.map((header) => (
                                    <TableHeaderCell
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}
                                        className={cx(
                                            "whitespace-nowrap py-1 text-sm sm:text-xs border border-tremor-border cursor-pointer",
                                            // header.column.columnDef.meta?.className,
                                        )}
                                    >
                                        <div className="flex items-center gap-2 justify-center">
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            {header.column.getCanFilter() && (
                                                <Flex flexDirection={"col"} className={"items-start"}>
                                                    <RiArrowUpSLine size={"14px"}
                                                                    color={header.column.getIsSorted() == "asc" ? "black" : "grey"}/>
                                                    <RiArrowDownSLine size={"14px"}
                                                                      color={header.column.getIsSorted() == "desc" ? "black" : "grey"}/>
                                                </Flex>
                                            )}
                                        </div>
                                    </TableHeaderCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableHead>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}
                                      onClick={() => row.toggleSelected(!row.getIsSelected())}
                                      className="group select-none hover:bg-gray-50 hover:dark:bg-gray-900">
                                {row.getVisibleCells().map((cell, index) => (
                                    <TableCell key={cell.id}
                                               className={cx(
                                                   row.getIsSelected()
                                                       ? "bg-gray-50 dark:bg-gray-900"
                                                       : "",
                                                   "relative whitespace-nowrap py-1 text-gray-600 first:w-10",
                                                   // cell.column.columnDef.meta?.className,
                                               )}>
                                        {index === 0 && row.getIsSelected() && (
                                            <div
                                                className="absolute inset-y-0 left-0 w-0.5 bg-tremor-brand"/>
                                        )}
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext(),
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Actions */}
                <div className="flex hidden justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            disabled={Object.keys(rowSelection).length === 0}
                            onClick={() => {
                                const selectedUsers = Object.keys(rowSelection).map(
                                    (idx) => filtered[parseInt(idx)]
                                );
                                onDeleteMany(selectedUsers);
                                setRowSelection({});
                            }}
                        >
                            מחק נבחרים
                        </Button>
                    </div>
                </div>
            </>
        );
    }
;

