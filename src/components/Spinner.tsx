import {Flex, Text} from "@tremor/react";

export function LoadingSpinner({className}: { className?: string }) {
    return <div className={"lds-ring " + className}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
    </div>
}

export function Loading() {
    return  <Flex justifyContent={"center"} alignItems={"center"} flexDirection={"col"} className={"h-screen"}>
        <LoadingSpinner className={"ml-4"}/>
        <Text className={"text-3xl font-bold"}>טוען...</Text>
    </Flex>
}
