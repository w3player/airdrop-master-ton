import { Address } from '@ton/core';
import { AirdropMaster } from '../wrappers/AirdropMaster';
import { NetworkProvider } from '@ton/blueprint';
import { demoData } from './00_demoData';

export async function run(provider: NetworkProvider) {
    const aidropMaster = provider.open(AirdropMaster.fromAddress(Address.parse(demoData.airdropContract)));

    const result = {
        '1': await aidropMaster.getClaimed(1n),
        '2': await aidropMaster.getClaimed(2n),
    };

    console.log('result:', result);
}
