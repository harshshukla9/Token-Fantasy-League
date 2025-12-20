export async function sendRawTransactionSync(rpcUrl: string, signedTx: string): Promise<string> {
    const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_sendRawTransactionSync',
            params: [signedTx],
        }),
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.result;
}
