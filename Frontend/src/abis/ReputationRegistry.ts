export const ReputationRegistryABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "_username", "type": "string" },
            { "internalType": "string", "name": "_bio", "type": "string" },
            { "internalType": "string", "name": "_avatarUrl", "type": "string" }
        ],
        "name": "registerUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "_bio", "type": "string" },
            { "internalType": "string", "name": "_avatarUrl", "type": "string" }
        ],
        "name": "updateProfile",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
        "name": "isRegistered",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;
