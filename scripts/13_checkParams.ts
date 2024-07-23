import { Address } from '@ton/core';
import { TransferContract } from '../wrappers/TransferContract';
import { NetworkProvider } from '@ton/blueprint';
import { demoData } from './00_demoData';

export async function run(provider: NetworkProvider) {
    const instance = provider.open(TransferContract.fromAddress(Address.parse(demoData.simpleContractAddress)));

    const jettonWalletAddress = await instance.getGetJettonWalletAddress();
    const owner = await instance.getOwner();

    console.log({ jettonWalletAddress, owner });
}
