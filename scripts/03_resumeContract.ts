import { Address, toNano } from '@ton/core';
import { AirdropMaster } from '../wrappers/AirdropMaster';
import { NetworkProvider } from '@ton/blueprint';
import { demoData } from './00_demoData';

export async function run(provider: NetworkProvider) {
    const aidropMaster = provider.open(AirdropMaster.fromAddress(Address.parse(demoData.airdropContract)));

    await aidropMaster.send(provider.sender(), { value: toNano('0.1') }, 'Resume');
}
