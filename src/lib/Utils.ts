export function convertMapToJSON(map: Map<string, any>): string {
    let data = Object.fromEntries(map)
    return JSON.stringify(data, null, 2);
}


export function encodeData(data: string): Uint8Array {
    return new TextEncoder().encode(data);
}

export function decodeData(data: Uint8Array): string {
    return new TextDecoder().decode(data);
}
