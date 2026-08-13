import React, {useEffect, useState} from "react";
import {ImageUploader} from "@/components/UploadImage";

export default function Test() {

    const [url, setUrl] = useState<string>()

    useEffect(() => {

    }, []);

    return (
        <div className="kb-container">
            <ImageUploader onUploadSuccess={setUrl}/>

            <p>{url}</p>
        </div>
    );
}
