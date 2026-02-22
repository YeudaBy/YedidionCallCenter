import {CategoryNode, cx} from "@/utils/ui";
import {Category} from "@/model/Category";
import React, {useState} from "react";
import {RiAddLine, RiArrowDownSLine, RiDeleteBinLine, RiPencilLine} from "@remixicon/react";
import {Icon, Text} from "@tremor/react";
import {getIconByName} from "@/components/node/CategoryItem";

export const CategoryAdminItem = ({node, onEdit, onRefresh, onDelete}: {
    node: CategoryNode,
    onEdit: (cat: Category) => void,
    onDelete: (cat: Category) => void,
    onRefresh: () => void
}) => {
    const [isOpen, setIsOpen] = useState(node.defaultOpen);

    return (
        <div className="border-b last:border-0 border-gray-100">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    <Icon
                        icon={RiArrowDownSLine}
                        className={cx("transition-transform", !isOpen && "-rotate-90")}
                    />
                    <Icon icon={getIconByName(node.icon)} size="sm" variant="simple"/>
                    <div>
                        <Text className="font-bold text-gray-800">{node.title}</Text>
                        <Text className="text-xs text-gray-400">עדיפות: {node.importance}</Text>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Icon
                        variant="shadow"
                        icon={RiAddLine}
                        className={"cursor-pointer"}
                        onClick={() => onEdit({parentCategoryId: node.id} as Category)}
                    />

                    <Icon icon={RiDeleteBinLine}
                          className={"cursor-pointer"}
                          variant={"light"}
                          color={"red"}
                          onClick={() => onDelete(node)}/>

                    <Icon
                        variant={"light"}
                        icon={RiPencilLine}
                        onClick={() => onEdit(node)}
                        className={"cursor-pointer"}
                    />
                </div>
            </div>

            {isOpen && (
                <div className="mr-8 border-r-2 border-blue-50">
                    {node.children.map(child => (
                        <CategoryAdminItem
                            onDelete={onDelete}
                            key={child.id}
                            node={child}
                            onEdit={onEdit}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
