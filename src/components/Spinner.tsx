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
    return <Flex justifyContent={"center"} alignItems={"center"} flexDirection={"col"} className={"h-screen"}>
        <LoadingSpinner className={"ml-4"}/>
        <Text className={"text-3xl font-bold text-inherit"}>טוען...</Text>
    </Flex>
}

export function LoadingBackdrop() {
    return <div className={"fixed text-gray-400 backdrop-blur-sm inset-0 bg-black bg-opacity-10 z-50"}>
        <Loading/>
    </div>
}
