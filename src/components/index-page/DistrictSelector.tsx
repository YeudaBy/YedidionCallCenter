import * as Tremor from "@tremor/react";
import {Flex, Icon} from "@tremor/react";
import {Order} from "@/utils/types";
import {RiSortAlphabetAsc, RiSortAsc} from "@remixicon/react";
import {District} from "@/model/District";

export function DistrictSelector({
    allowedDistricts, selectedDistrict, setDistrict, order, setOrder
                                 }: {
    allowedDistricts: Array<District>,
    selectedDistrict: District | "All",
    setDistrict: (d: District | "All") => void,
    order: Order,
    setOrder: (o: Order) => void,
}) {
    return <Flex className={"justify-start gap-1.5 my-4"}>
        {
            allowedDistricts.map(d => {
                return <Tremor.Badge
                    className={"cursor-pointer"}
                    color={d === selectedDistrict ? "green" : "amber"}
                    onClick={() => {
                        setDistrict(d === selectedDistrict ? "All" : d)
                    }}
                    key={d}>{d}</Tremor.Badge>
            })
        }
        <Icon
            icon={order === Order.Recent ? RiSortAlphabetAsc : RiSortAsc}
            className={"cursor-pointer"} variant={"light"}
            onClick={() => {
                setOrder(order === Order.Recent ? Order.Alphabetical : Order.Recent)
            }}
        />
    </Flex>;
}
