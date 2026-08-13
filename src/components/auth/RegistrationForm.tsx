import {useEffect, useState} from "react";
import {User} from "@/model/User";
import {District} from "@/model/District";
import {remult} from "remult";
import {Button, Card, Select, SelectItem, Text, TextInput} from "@tremor/react";
import {toast} from "sonner";

export function RegistrationForm({
                                     initialName,
                                     email,
                                     onComplete
                                 }: {
    initialName: string,
    email: string,
    onComplete: (user: User) => void
}) {
    const [name, setName] = useState(initialName);
    const [selectedDistrict, setSelectedDistrict] = useState<District>();
    const [districts, setDistricts] = useState<District[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setDistricts(Object.values(District).filter(d => d !== District.General));
    }, []);

    const handleSubmit = async () => {
        if (!name || !selectedDistrict) return toast.error("אנא מלא את כל השדות כדי להמשיך.");
        setLoading(true);
        try {
            const updatedUser = await User.finishRegistration(remult, email, name, selectedDistrict);
            toast.success("הבקשה נשלחה בהצלחה. מנהל המוקד יאשר אותך בהקדם.")
            onComplete(updatedUser);
        } catch (e) {
            console.error(e);
            toast.error("אירעה שגיאה במהלך השלמת ההרשמה. אנא נסה שוב.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-md mx-auto my-12 text-right">
            <Text className="text-xl font-bold mb-4 text-center">השלמת הרשמה</Text>
            <Text className="mb-6">ברוך הבא! כדי להמשיך, אנא אמת את שמך ובחר את המוקד אליו אתה שייך.</Text>
            <Text className="mb-6 text-sm text-gray-600">
                בסיוום התהליך, בקשתך תישלח למנהל המוקד שלך לאישור. לאחר האישור, תוכל להתחיל להשתמש במערכת.
            </Text>

            <div className="space-y-4">
                <div>
                    <label className="text-sm">שם מלא</label>
                    <TextInput
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="הכנס שם מלא"
                    />
                </div>

                <div>
                    <label className="text-sm">בחר מוקד</label>
                    {/* @ts-expect-error -- Select component expects string values, but District is an enum */}
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict}
                            placeholder="בחר מוקד..." className={"tremor-select"}>
                        {districts.map(d => (
                            <SelectItem key={d} value={d}>
                                {d}
                            </SelectItem>
                        ))}
                    </Select>
                </div>

                <Button
                    className="w-full mt-4 gap-2"
                    loading={loading}
                    onClick={handleSubmit}
                >
                    סיום הרשמה
                </Button>
            </div>
        </Card>
    );
}
