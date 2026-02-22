import React, {useEffect, useState} from 'react';
import {remult} from 'remult';
import {Category} from '@/model/Category';
import {
    Button,
    Dialog,
    DialogPanel,
    Flex,
    Icon,
    MultiSelect,
    MultiSelectItem,
    NumberInput,
    Select,
    SelectItem,
    Switch,
    Text,
    TextInput
} from '@tremor/react';
import {RiCloseFill} from '@remixicon/react';
import {District} from "@/model/District";
import {KnowledgeBaseController} from "@/controllers/hierarchyController";
import Link from "next/link";

const categoryRepo = remult.repo(Category);

export function CategoryEditorDialog({category, open, onClose, onSave}: {
    open: boolean,
    onClose: () => void,
    category?: Category,
    onSave: () => void
}) {
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [icon, setIcon] = useState('RiFolderLine');
    const [importance, setImportance] = useState(0);
    const [active, setActive] = useState(true);
    const [defaultOpen, setDefaultOpen] = useState(false);
    const [parentCategoryId, setParentCategoryId] = useState<string | undefined>();
    const [districts, setDistricts] = useState<District[]>([District.General]);

    const [parentOptions, setParentOptions] = useState<{ id: string, path: string }[]>([]);


    useEffect(() => {
        if (open) {
            loadParentOptions();
            if (category) {
                setTitle(category.title || '');
                setIcon(category.icon || 'RiFolderLine');
                setImportance(category.importance || 0);
                setActive(category.active ?? true);
                setDefaultOpen(category.defaultOpen ?? false);
                setParentCategoryId(category.parentCategoryId);
                setDistricts(category.allowedDistricts || [District.General]);
            } else {
                setTitle('');
                setParentCategoryId(undefined);
            }
        }
    }, [category, open]);

    const loadParentOptions = async () => {
        const all = await KnowledgeBaseController.getKnowledgeBaseSnapshot();

        const getPath = (cat: Category, allCats: Category[]): string => {
            if (!cat.parentCategoryId) return cat.title;
            const parent = allCats.find(c => c.id === cat.parentCategoryId);
            return parent ? `${getPath(parent, allCats)} > ${cat.title}` : cat.title;
        };

        const options = all
            .filter(c => c.id !== category?.id)
            .map(c => ({
                id: c.id,
                path: getPath(c, all)
            }))
            .sort((a, b) => a.path.localeCompare(b.path));

        setParentOptions(options);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const data = {
                title,
                icon,
                importance,
                active,
                defaultOpen,
                parentCategoryId: parentCategoryId,
                allowedDistricts: districts
            };

            if (category?.id) {
                await categoryRepo.update(category.id, data);
            } else {
                await categoryRepo.insert(data);
            }

            onSave();
            onClose();
        } catch (e) {
            console.error(e);
            alert("שגיאה בשמירת הקטגוריה");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} static={false}>
            <DialogPanel className="max-w-md">
                <Flex justifyContent="between" alignItems="center">
                    <Text className="text-xl font-bold">
                        {category?.id ? 'עריכת קטגוריה' : 'יצירת קטגוריה חדשה'}
                    </Text>
                    <Icon
                        icon={RiCloseFill}
                        variant="simple"
                        className="cursor-pointer"
                        onClick={onClose}
                    />
                </Flex>

                <div className="space-y-4 mt-4 text-right">
                    <div>
                        <Text className="mb-1">שם הקטגוריה:</Text>
                        <TextInput
                            value={title}
                            onValueChange={setTitle}
                        />
                    </div>

                    <div>
                        <Text className="mb-1">מיקום בעץ (אבא):</Text>
                        <Select className={"tremor-select"}
                                value={parentCategoryId || "root"}
                                onValueChange={(val) => setParentCategoryId(val === "root" ? undefined : val)}
                        >
                            <SelectItem value="root">--- ללא (קטגוריה ראשית) ---</SelectItem>
                            {parentOptions.map(opt => (
                                <SelectItem key={opt.id} value={opt.id}>
                                    {opt.path}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Text className="mb-1">מוקדים מורשים:</Text>
                        <MultiSelect
                            value={districts}
                            // @ts-expect-error Tremor select typing
                            onValueChange={setDistricts}
                        >
                            {Object.values(District).map(d => (
                                <MultiSelectItem key={d} value={d}>{d}</MultiSelectItem>
                            ))}
                        </MultiSelect>
                    </div>

                    <Flex className="gap-2">
                        <div className="w-2/3">
                            <Link href={"/admin/icons"}>
                                <Text className="mb-1 underline text-blue-800">אייקון (Remix Name):</Text>
                            </Link>
                            <TextInput
                                value={icon}
                                onValueChange={setIcon}
                                placeholder="לדוגמה: RiFolderLine"
                            />
                        </div>
                        <div className="">
                            <Text className="mb-1">עדיפות:</Text>
                            <NumberInput
                                value={importance}
                                onValueChange={setImportance}
                            />
                        </div>
                    </Flex>

                    <Flex justifyContent="start" className="gap-6 mt-2">
                        <Flex justifyContent="start" className="gap-2 w-auto">
                            <Switch checked={active} onChange={setActive}/>
                            <Text>פעיל</Text>
                        </Flex>
                        <Flex justifyContent="start" className="gap-2 w-auto">
                            <Switch checked={defaultOpen} onChange={setDefaultOpen}/>
                            <Text>פתוח תמיד</Text>
                        </Flex>
                    </Flex>

                    <Flex className="gap-3 pt-12">
                        <Button
                            className="grow"
                            loading={loading}
                            onClick={handleSave}
                            disabled={!title}
                        >
                            שמור קטגוריה
                        </Button>
                        <Button
                            variant="secondary"
                            className=""
                            onClick={onClose}
                        >
                            ביטול
                        </Button>
                    </Flex>
                </div>
            </DialogPanel>
        </Dialog>
    );
}
