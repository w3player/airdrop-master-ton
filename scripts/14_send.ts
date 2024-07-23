import { Address, toNano } from '@ton/core';
import { TransferContract } from '../wrappers/TransferContract';
import { NetworkProvider } from '@ton/blueprint';
import { demoData } from './00_demoData';

export async function run(provider: NetworkProvider) {
    const instance = provider.open(TransferContract.fromAddress(Address.parse(demoData.simpleContractAddress)));

    const result = await instance.send(
        provider.sender(),
        { value: toNano('0.1') },
        {
            $$type: 'Send2',
            queryId: 0n,
            amount: toNano('0.1'),
            to: provider.sender().address!,
            message: 'send2',
        },
    );
    console.log('Result', result);
}
