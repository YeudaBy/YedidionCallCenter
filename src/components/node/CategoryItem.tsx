import {useState} from 'react';
import {CategoryNode, cx} from "@/utils/ui";
import * as RemixIcon from "@remixicon/react";
import {RiArrowDownSLine, RiFolderLine} from "@remixicon/react";
import {Icon, List, ListItem, Text} from "@tremor/react";
import {User} from "@/model/User";
import {remult} from "remult";
import {Box} from "@radix-ui/themes";


export function getIconByName(iconName?: string) {
    if (!iconName) return RiFolderLine;

    const IconComponent = (RemixIcon as never)[iconName];
    return IconComponent || RiFolderLine;
}


export const CategoryItem = ({node, onProcedureSelect}: {
    node: CategoryNode,
    onProcedureSelect: (procId: string) => void
}) => {
    const [isOpen, setIsOpen] = useState(node.defaultOpen);

    const hasChildren = node.children.length > 0;
    const hasProcedures = node.cleanProcedures.length > 0;
    const isEmpty = !hasChildren && !hasProcedures;
    const showEmpty = (User.isSomeAdmin(remult) || false)


    return (
        <List className="overflow-x-hidden">
            <ListItem
                onClick={() => !isEmpty && setIsOpen(!isOpen)}
                style={{cursor: isEmpty ? 'default' : 'pointer'}}
                className={cx("items-center justify-start border-0 gap-0",
                    (!showEmpty && isEmpty) ? "hidden" : "",
                    (showEmpty && isEmpty ? " opacity-50" : ""))}
            >
                {<Icon icon={isEmpty ? Box : RiArrowDownSLine} size={"sm"}
                       style={{transform: !isOpen ? 'rotate(90deg)' : 'rotate(0)'}}
                       className={"transition-transform duration-200"}
                />}

                <Icon size={"sm"} icon={getIconByName(node.icon)}/>
                <Text className={"font-semibold"}>{node.title}</Text>

                <span className={"text-xs text-gray-600 mr-2"}>
                    ({node.children.length + node.cleanProcedures.length})
                </span>
            </ListItem>

            {isOpen && (
                <List className={"mr-4"}>
                    {node.children.map(childNode => (
                        <CategoryItem
                            key={childNode.id}
                            node={childNode}
                            onProcedureSelect={onProcedureSelect}/>
                    ))}

                    {node.cleanProcedures.map(proc => (
                        proc && <ListItem
                            key={proc.id}
                            onClick={() => {
                                console.log(proc, "selected");
                                onProcedureSelect(proc.id)
                            }}
                            className={"items-center justify-start cursor-pointer gap-2 mr-4"}>
                            {/*<Icon icon={RiArticleLine}/>*/}
                            {proc.title}
                        </ListItem>
                    ))}

                </List>
            )}
        </List>
    );
};
