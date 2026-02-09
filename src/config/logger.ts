import FileStreamRotator from "file-stream-rotator";

const stream = FileStreamRotator.getStream({
    filename: "logs/critical-%DATE%.log",
    date_format: "YYYY-MM-DD",
    frequency: "daily",
    verbose: false
});

export const criticalLog = (obj: object) => {
    stream.write(JSON.stringify({
        ts: new Date().toISOString(),
        ...obj
    }) + "\n");
};
