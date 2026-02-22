import React, {useEffect, useState} from "react";
import {buildTree, CategoryNode} from "@/utils/ui";
import {Category} from "@/model/Category";
import {remult} from "remult";
import {Icon} from "@tremor/react";
import {RoleGuard} from "@/components/auth/RoleGuard";
import {UserRole} from "@/model/SuperAdmin";
import {CategoryEditorDialog} from "@/components/dialogs/CategoryEditDialog";
import {RiAddLine, RiExpandUpDownLine} from "@remixicon/react";
import {CategoryAdminItem} from "@/components/node/CategoryAdminItem";
import {Header, Headers} from "@/components/Header";
import {Loading} from "@/components/Spinner";

export default function CategoryAdminPage() {
    const [treeData, setTreeData] = useState<CategoryNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandKey, setExpandKey] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();

    const fetchData = async () => {
        setLoading(true);
        const flatList = await remult.repo(Category).find({
            orderBy: {importance: "desc"}
        });
        setTreeData(buildTree(flatList));
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExpandAll = () => {
        setExpandKey(prev => prev + 1);
    };

    const onDelete = async (cat: Category) => {
        if (window.confirm("האם אתה בטוח שברצונך למחוק קטגוריה זו?")) {
            await remult.repo(Category).delete(cat.id);
            fetchData();
        }
    }

    return (
        <RoleGuard allowedRoles={[UserRole.SuperAdmin]}>
            <Header headerText={Headers.CATEGORIES} buttons={[
                <Icon icon={RiAddLine} onClick={() => {
                    setSelectedCategory(undefined);
                    setIsDialogOpen(true);
                }} className={"cursor-pointer"} variant={"light"}/>,
                <Icon icon={RiExpandUpDownLine}
                      onClick={handleExpandAll}
                      className={"cursor-pointer"}
                      variant={"shadow"}
                />
            ]}/>
            <div className="p-6 max-w-4xl mx-auto" dir="rtl">
                {loading ? <Loading/> : (
                    <div className="bg-white shadow rounded-xl p-4">
                        {treeData.map(node => (
                            <CategoryAdminItem
                                key={`${node.id}-${expandKey}`}
                                node={node}
                                onEdit={(cat) => {
                                    setSelectedCategory(cat);
                                    setIsDialogOpen(true);
                                }}
                                onDelete={onDelete}
                                onRefresh={fetchData}
                            />
                        ))}
                    </div>
                )}

                <CategoryEditorDialog
                    open={isDialogOpen}
                    category={selectedCategory}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={fetchData}
                />
            </div>
        </RoleGuard>
    );
}
