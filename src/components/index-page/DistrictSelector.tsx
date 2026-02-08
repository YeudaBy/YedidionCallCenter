import * as Tremor from "@tremor/react";
import {Flex,} from "@tremor/react";
import {District} from "@/model/District";

export function DistrictSelector({
    allowedDistricts, selectedDistrict, setDistrict
                                 }: {
    allowedDistricts: Array<District>,
    selectedDistrict: District | "All",
    setDistrict: (d: District | "All") => void,
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
    </Flex>;
}
