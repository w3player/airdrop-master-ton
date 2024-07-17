import { Address, Cell, toNano } from '@ton/core';
import { AirdropMaster } from '../wrappers/AirdropMaster';
import { NetworkProvider } from '@ton/blueprint';
import { buildMerkleTreeWithItems, getClaimProof } from '../tests/helper';
import { demoData } from './00_demoData';

export async function run(provider: NetworkProvider) {
    const aidropMaster = provider.open(AirdropMaster.fromAddress(Address.parse(demoData.airdropContract)));

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

    const claimInfo = getClaimProof(merkleResult.dictCellBoc, 1);

    const result = await aidropMaster.send(
        provider.sender(),
        { value: toNano('0.1') },
        {
            $$type: 'Claim',
            queryId: 0n,
            proof: Cell.fromBase64(claimInfo.proofBoc),
            index: 1n,
        },
    );
}
