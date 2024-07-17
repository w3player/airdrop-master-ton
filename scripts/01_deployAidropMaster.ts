import { toNano } from '@ton/core';
import { AirdropMaster } from '../wrappers/AirdropMaster';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const aidropMaster = provider.open(await AirdropMaster.fromInit());

    await aidropMaster.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );

    await provider.waitForDeploy(aidropMaster.address);

    console.log('Address', aidropMaster.address);
}
