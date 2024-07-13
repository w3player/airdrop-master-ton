import { Address, toNano } from '@ton/core';
import { AirdropMaster } from '../wrappers/AirdropMaster';
import { NetworkProvider } from '@ton/blueprint';
import { buildMerkleTreeWithItems, getJettonWalletAddress } from '../tests/helper';
import { demoData } from './00_demoData';

export async function run(provider: NetworkProvider) {
    const aidropMaster = provider.open(AirdropMaster.fromAddress(Address.parse(demoData.airdropContract)));

    const settings = await aidropMaster.getAirdropSettings();
    console.log('current settings', settings);

    const merkleResult = buildMerkleTreeWithItems(
        demoData.recipients.map((x, idx) => {
            return {
                index: idx,
                address: Address.parse(x),
                claimableAmount: toNano('1'),
                claimableTimestamp: 1720074084,
            };
        }),
    );

    const airdropJettonWalletAddress = await getJettonWalletAddress(
        provider.network() as 'mainnet' | 'testnet',
        demoData.jetton,
        demoData.airdropContract,
    );

    await aidropMaster.send(
        provider.sender(),
        { value: toNano('0.1') },
        {
            $$type: 'SetBaseParams',
            args: {
                $$type: 'AirdropSettings',
                startTime: 1720165203n,
                endTime: 1730165203n,
                tokenWallatAddress: airdropJettonWalletAddress,
                merkleRoot: merkleResult.merkleRoot,
            },
        },
    );
}
