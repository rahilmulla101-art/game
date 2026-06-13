import { Device } from '@capacitor/device';

export async function getUUID(){

    let uuid=
        localStorage.getItem(
            'device_uuid'
        );

    if(uuid){

        return uuid;
    }

    const id=
        await Device.getId();

    uuid=id.identifier;

    localStorage.setItem(
        'device_uuid',
        uuid
    );

    return uuid;

}