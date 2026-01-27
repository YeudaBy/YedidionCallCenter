import React, {useCallback, useEffect, useMemo, useState} from "react";
import {remult, repo} from "remult";
import {User, UserRole} from "@/model/User";
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
    Title,
} from "@tremor/react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    RowSelectionState,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import {ColumnDef} from "@tanstack/table-core";
import {CheckIcon, PencilIcon, XIcon} from "@heroicons/react/solid";
import {District} from "@/model/District";
import {useAutoAnimate} from "@formkit/auto-animate/react";
import {RiArrowDownSLine, RiArrowUpSLine} from "@remixicon/react";
import {cx} from "@/utils/ui";

interface Filters {
    name: string;
    email: string;
    phone: string;
    role: UserRole | '';
    active: boolean | null;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const loadedUsers = await repo(User).find();
        setUsers(loadedUsers);
    };

    const handleUpdateUser = async (updatedUser: User) => {
        await repo(User).save(updatedUser);
        await loadUsers();
    };

    return (
        <>
            <Title className="text-center">
                משתמשים במערכת ({users.length})
            </Title>
            <div className="mt-4 sm:mt-6 lg:mt-10">
                <UserManagementTable
                    users={users}
                    onDeleteUsers={async (users) => {
                        for (const user of users) {
                            await repo(User).delete(user.id);
                        }
                        await loadUsers();
                    }}
                    onUpdateUser={handleUpdateUser}
                />
            </div>
        </>
    );
}

interface UserManagementTableProps {
    users: User[];
    onDeleteUsers: (users: User[]) => Promise<void>;
    onUpdateUser: (user: User) => Promise<void>;
}

const columnHelper = createColumnHelper<User>();

const UserManagementTable: React.FC<UserManagementTableProps> = ({users, onDeleteUsers, onUpdateUser}) => {
        const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
        const [sorting, setSorting] = useState<SortingState>([]);
        const [editingId, setEditingId] = useState<string | null>(null);
        const [editingValues, setEditingValues] = useState<Partial<User>>({});
        const [filters, setFilters] = useState<Filters>({
            name: '',
            email: '',
            phone: '',
            role: '',
            active: null
        });

        const userNotRegistered = (user: User): boolean => {
            return !user.isAdmin && !user.district;
        };

        const handleEdit = (user: User) => {
            setEditingId(user.id);
            setEditingValues(user);
        };

        const handleSave = useCallback((async (user: User) => {
            // @ts-ignore
            await onUpdateUser({...user, ...editingValues});
            setEditingId(null);
            setEditingValues({});
        }), [editingValues, onUpdateUser])

        const filteredUsers = useMemo(() => {
            return users.filter(user => {
                return (
                    (!filters.name || user.name.toLowerCase().includes(filters.name.toLowerCase())) &&
                    (!filters.email || user.email.toLowerCase().includes(filters.email.toLowerCase())) &&
                    (!filters.phone || user.phoneFormatted?.includes(filters.phone)) &&
                    (!filters.role || user.roles === filters.role) &&
                    (filters.active === null || user.active === filters.active)
                );
            });
        }, [users, filters]);

        const columns = useMemo<ColumnDef<User, any>[]>(
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
                    columnHelper.accessor('name', {
                        header: 'שם',
                        cell: ({row}) => {
                            const user = row.original;
                            return editingId === user.id ? (
                                <TextInput
                                    value={editingValues.name || user.name}
                                    onChange={(e) => setEditingValues({...editingValues, name: e.target.value})}
                                />
                            ) : <Text className={"text-right"}>{user.name}</Text>;
                        },
                    }),
                    columnHelper.accessor('email', {
                        header: 'אימייל',
                        cell: ({row}) => {
                            const user = row.original;
                            return editingId === user.id ? (
                                <TextInput
                                    value={editingValues.email || user.email}
                                    onChange={(e) => setEditingValues({...editingValues, email: e.target.value})}
                                />
                            ) : <Text className={"text-blue-900"}><a href={`mailto:${user.email}`}>{user.email}</a></Text>;
                        },
                    }),
                    columnHelper.accessor('phone', {
                        header: 'טלפון',
                        cell: ({row}) => {
                            const user = row.original;
                            return editingId === user.id ? (
                                <TextInput
                                    value={editingValues.phone?.toString() || user.phone?.toString() || ''}
                                    onChange={(e) => setEditingValues({
                                        ...editingValues,
                                        phone: parseInt(e.target.value) || undefined
                                    })}
                                />
                            ) : user.phoneFormatted ?
                                <Text className={"text-green-900"}>
                                    <a href={`https://wa.me/972${user.phone}`} target={"_blank"}>
                                        {user.phoneFormatted}
                                    </a>
                                </Text> : '-';
                        },
                    }),
                    columnHelper.accessor('roles', {
                        header: 'סטטוס',
                        cell: ({row}) => {
                            const user = row.original;
                            return (editingId === user.id && User.isSuperAdmin(remult)) ? (
                                <Select
                                    value={editingValues.roles || user.roles}
                                    onValueChange={(value) => setEditingValues({...editingValues, roles: value as UserRole})}
                                >
                                    {Object.values(UserRole).map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {role}
                                        </SelectItem>
                                    ))}
                                </Select>
                            ) : (
                                <Badge color={
                                    user.isSuperAdmin ? 'lime' :
                                        user.isRegularAdmin ? 'yellow' :
                                            !user.active ? "red" :
                                                userNotRegistered(user) ? "purple" :
                                                    'blue'
                                }>
                                    {userNotRegistered(user) ? "לא רשום" : user.roles}
                                </Badge>
                            );
                        },
                    }),
                    columnHelper.accessor('district', {
                        header: 'מחוז',
                        cell: ({row}) => {
                            const user = row.original;
                            return (editingId === user.id && User.isSuperAdmin(remult)) ? (
                                <Select
                                    value={editingValues.district || user.district}
                                    onValueChange={(value) => setEditingValues({...editingValues, district: value as District})}
                                >
                                    {Object.values(District).map((d) => (
                                        <SelectItem key={d} value={d}>
                                            {d}
                                        </SelectItem>
                                    ))}
                                </Select>
                            ) : user.district || '-'
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
            data: filteredUsers, // השתמש בנתונים המסוננים במקום users
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
                <Card ref={fRef} className="grid hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 w-[95%] mx-auto">
                    <Button className={"h-fit"} size={"xs"}
                            variant={"secondary"} onClick={() => setShowFilters(prevState => !prevState)}>
                        הצג מסננים
                    </Button>
                    {showFilters && <>
                        <TextInput
                            placeholder="חיפוש לפי שם"
                            value={filters.name}
                            onChange={(e) => setFilters({...filters, name: e.target.value})}
                        />
                        <TextInput
                            placeholder="חיפוש לפי אימייל"
                            value={filters.email}
                            onChange={(e) => setFilters({...filters, email: e.target.value})}
                        />
                        <TextInput
                            placeholder="חיפוש לפי טלפון"
                            value={filters.phone}
                            onChange={(e) => setFilters({...filters, phone: e.target.value})}
                        />
                        <Select
                            placeholder="סינון לפי תפקיד"
                            value={filters.role}
                            onValueChange={(value) => setFilters({...filters, role: value as UserRole})}
                        >
                            <SelectItem value="">הכל</SelectItem>
                            {Object.values(UserRole).map((role) => (
                                <SelectItem key={role} value={role}>
                                    {role}
                                </SelectItem>
                            ))}
                        </Select>
                        <Select
                            placeholder="סינון לפי סטטוס"
                            value={filters.active?.toString() || ''}
                            onValueChange={(value) => setFilters({
                                ...filters,
                                active: value === '' ? null : value === 'true'
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
                        placeholder=" שם"
                        value={filters.name}
                        // className={'w-fit'}
                        onChange={(e) => setFilters({...filters, name: e.target.value})}
                    />
                    <TextInput
                        placeholder=" אימייל"
                        value={filters.email}
                        // className={'w-fit'}
                        onChange={(e) => setFilters({...filters, email: e.target.value})}
                    />
                    <TextInput
                        placeholder=" טלפון"
                        value={filters.phone}
                        // className={'w-fit'}
                        onChange={(e) => setFilters({...filters, phone: e.target.value})}
                    />
                    <Select
                        placeholder=" תפקיד"
                        // className={"w-fit"}
                        value={filters.role}
                        onValueChange={(value) => setFilters({...filters, role: value as UserRole})}
                    >
                        <SelectItem value="">הכל</SelectItem>
                        {Object.values(UserRole).map((role) => (
                            <SelectItem key={role} value={role}>
                                {role}
                            </SelectItem>
                        ))}
                    </Select>
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
                                    (idx) => filteredUsers[parseInt(idx)]
                                );
                                onDeleteUsers(selectedUsers);
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
