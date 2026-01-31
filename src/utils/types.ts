import {FieldOptions, Fields} from "remult";
import {nanoid} from "nanoid";

export enum Order {
    Recent = 'חדשים',
    Alphabetical = 'א-ב',
}



export function NanoIdField<entityType = any>(
    length: number,
    ...options: FieldOptions<entityType, string>[]
) {
    return Fields.string<entityType>(
        {
            allowApiUpdate: false, // Disallow updating the ID through the API
            defaultValue: () => nanoid(length), // Generate a new NanoID as the default value
            saving: (_, record) => {
                if (!record.value) {
                    record.value = nanoid(length) // Generate a new NanoID if the value is not set
                }
            },
        },
        ...options,
    )
}
