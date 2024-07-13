import { Address, Builder, Cell, Dictionary, Slice, beginCell } from '@ton/core';
import { JettonMaster, TonClient4 } from '@ton/ton';

type TokenDistributorEntry = {
    index: number; // index in dict
    address: Address; // who can claim
    claimableAmount: bigint; // how much can claim
    claimableTimestamp: number; // when can claim
};

export const tokenDistributorEntryValue = {
    serialize: (src: TokenDistributorEntry, buidler: Builder) => {
        return buidler
            .storeUint(src.index, 8)
            .storeAddress(src.address)
            .storeCoins(src.claimableAmount)
            .storeUint(src.claimableTimestamp, 32);
    },
    parse: (src: Slice) => {
        return {
            index: src.loadUint(8),
            address: src.loadAddress(),
            claimableAmount: src.loadCoins(),
            claimableTimestamp: src.loadUint(32),
        };
    },
};

export function buildMerkleTreeWithItems(items: TokenDistributorEntry[]) {
    // 1. 构建字典
    const dict: Dictionary<bigint, TokenDistributorEntry> = Dictionary.empty(
        Dictionary.Keys.BigUint(256),
        tokenDistributorEntryValue,
    );

    // 2. 添加内容
    items.forEach((item, idx) => {
        dict.set(BigInt(idx), item);
    });

    const dictCell = beginCell().storeDictDirect(dict).endCell();
    const dictCellBoc = dictCell.toBoc().toString('base64');
    const merkleRoot = BigInt('0x' + dictCell.hash().toString('hex'));

    return { dictCellBoc, merkleRoot, size: dict.size };
}

export function buildMerkleTree() {
    // 1. 构建字典
    const dict: Dictionary<bigint, TokenDistributorEntry> = Dictionary.empty(
        Dictionary.Keys.BigUint(256),
        tokenDistributorEntryValue,
    );
    // 2. 添加内容
    dict.set(0n, {
        index: 0,
        address: Address.parse('EQD4eA1SdQOivBbTczzElFmfiKu4SXNL4S29TReQwzzr_70k'),
        claimableAmount: 1000n,
        claimableTimestamp: 1720074084,
    });

    dict.set(1n, {
        index: 1,
        address: Address.parse('EQD4eA1SdQOivBbTczzElFmfiKu4SXNL4S29TReQwzzr_70k'),
        claimableAmount: 2000n,
        claimableTimestamp: 1720074084,
    });

    const dictCell = beginCell().storeDictDirect(dict).endCell();
    const dictCellBoc = dictCell.toBoc().toString('base64');
    const merkleRoot = BigInt('0x' + dictCell.hash().toString('hex'));

    return { dictCellBoc, merkleRoot };
}

export function getClaimProof(dictCellBoc: string, index: number) {
    const dictCell = Cell.fromBase64(dictCellBoc);
    const dict = dictCell.beginParse().loadDictDirect(Dictionary.Keys.BigUint(256), tokenDistributorEntryValue);

    const proof = dict.generateMerkleProof(BigInt(index));

    return {
        index: index,
        proofHash: proof.hash().toString('hex'),
        proofBoc: proof.toBoc().toString('base64'),
    };
}

export function printAddress(address: Address) {
    const result = {
        testnet: {
            bounceable: address.toString({ bounceable: true, testOnly: true }),
            uq: address.toString({ bounceable: false, testOnly: true }),
        },
        mainnet: {
            bounceable: address.toString({ bounceable: true }),
            uq: address.toString({ bounceable: false }),
        },
    };
    console.log(result);
}

export async function getJettonWalletAddress(env: 'testnet' | 'mainnet', tokenAddress: string, userAddress: string) {
    const clientMap = {
        testnet: new TonClient4({ endpoint: 'https://testnet-v4.tonhubapi.com', timeout: 5000 }),
        mainnet: new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com', timeout: 5000 }),
    };

    const client = clientMap[env];

    const masterAddress = Address.parse(tokenAddress);
    const masterContract = JettonMaster.create(masterAddress);
    const jettonWalletAddress = await masterContract.getWalletAddress(
        client.provider(masterAddress),
        Address.parse(userAddress),
    );
    return jettonWalletAddress;
}
