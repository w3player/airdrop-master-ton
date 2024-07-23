import { Address, Cell, toNano } from '@ton/core';
import { TransferContract } from '../wrappers/TransferContract';
import { NetworkProvider } from '@ton/blueprint';
import { getJettonWalletAddress } from '../tests/helper';
import { demoData } from './00_demoData';

export async function run(provider: NetworkProvider) {
    const instance = provider.open(TransferContract.fromAddress(Address.parse(demoData.simpleContractAddress)));

    const jettonWalletAddress = await getJettonWalletAddress(
        provider.network() as 'mainnet' | 'testnet',
        demoData.jetton,
        demoData.simpleContractAddress,
    );

    const current = await instance.getGetJettonWalletAddress();

    console.log('current:', current, 'new Jetton wallet address', jettonWalletAddress);

    const result = await instance.send(
        provider.sender(),
        { value: toNano('0.2') },
        {
            $$type: 'SetJettonWalletAddress',
            jettonWalletAddress: jettonWalletAddress,
        },
    );
    console.log('Result', result);
}
