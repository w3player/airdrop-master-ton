import { Address, toNano } from '@ton/core';
import { AirdropMaster } from '../wrappers/AirdropMaster';
import { NetworkProvider } from '@ton/blueprint';
import { buildMerkleTreeWithItems } from '../tests/helper';
import { demoData } from './00_demoData';

export async function run(provider: NetworkProvider) {
    const aidropMaster = provider.open(AirdropMaster.fromAddress(Address.parse(demoData.airdropContract)));

    const owner = await aidropMaster.getOwner();
    console.log(owner);

    const settings = await aidropMaster.getAirdropSettings();
    console.log(settings);

    const balance = await aidropMaster.getBalance();
    console.log(balance);

    const merkleResult = buildMerkleTreeWithItems([
        {
            index: 0,
            address: Address.parse(demoData.claimerAddress),
            claimableAmount: 1000n,
            claimableTimestamp: 1720074084,
        },
    ]);

    await aidropMaster.send(
        provider.sender(),
        { value: toNano('0.1') },
        {
            $$type: 'SetBaseParams',
            args: {
                $$type: 'AirdropSettings',
                startTime: 1720165203n,
                endTime: 1730165203n,
                tokenAddress: Address.parse(demoData.jetton),
                merkleRoot: merkleResult.merkleRoot,
            },
        },
    );
    await aidropMaster.send(provider.sender(), { value: toNano('0.1') }, 'Resume');
}
